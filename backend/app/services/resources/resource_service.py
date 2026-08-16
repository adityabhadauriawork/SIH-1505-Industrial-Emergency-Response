import math
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.plant import AssetModel, AssemblyPointModel, GateModel
from app.models.resource import EmergencyResourceModel
from app.models.chemical import ChemicalModel
from app.schemas.resource import (
    ResourceOptimizationPlan, ResourceAllocationItem, TacticalActionChecklist
)
from app.schemas.hazard import HazardSimulationResult
from app.schemas.impact import ImpactAnalysisResult
from app.schemas.evacuation import EvacuationPlanResponse

class ResourceService:
    @staticmethod
    def _haversine_distance_m(coord1: List[float], coord2: List[float]) -> float:
        """Calculate real ground distance between two (lat, lon) pairs in meters."""
        lat1, lon1 = coord1
        lat2, lon2 = coord2
        R = 6371000.0  # Earth radius in meters
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2.0) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return R * c

    def optimize_resources(
        self,
        db: Session,
        simulation_result: HazardSimulationResult,
        impact_result: ImpactAnalysisResult,
        evacuation_plan: Optional[EvacuationPlanResponse] = None
    ) -> ResourceOptimizationPlan:
        """
        Dynamically determine tactical emergency resource allocation, derive realistic ETAs
        from vehicle stationed coordinates to calculated upwind/muster staging areas,
        and generate chemical-specific SOP checklists and foam/water demand.
        """
        all_resources = db.query(EmergencyResourceModel).all()
        chemical = db.query(ChemicalModel).filter(ChemicalModel.id == simulation_result.chemical_id).first()
        chem_name = chemical.name if chemical else simulation_result.chemical_name
        src_lat, src_lon = simulation_result.source_coordinates
        incident_type = simulation_result.incident_type

        # 1. Incident Classification
        is_fire_or_explosion = incident_type in ["FIRE_EXPLOSION", "BLEVE"]
        is_hydrocarbon_flammable = bool(chemical and chemical.id in ["CHEM-LPG", "CHEM-C6H6"])
        is_toxic_gas = bool(chemical and chemical.erpg_3_ppm and chemical.erpg_3_ppm <= 1000.0)
        is_water_soluble_toxic = bool(chemical and chemical.id in ["CHEM-NH3", "CHEM-CL2", "CHEM-H2S"])
        
        exposed_workers = impact_result.affected_workers_count
        lethal_workers = impact_result.red_zone_workers_count
        vulnerable_assets = impact_result.affected_assets_count
        release_q = simulation_result.effective_release_rate_kg_s
        red_reach_m = simulation_result.summary_zones[0].max_downwind_distance_m
        crosswind_w_m = simulation_result.summary_zones[0].max_crosswind_width_m

        # 2. Dynamic Geolocation Staging Points
        wind_from_deg = simulation_result.wind_direction_deg
        # Upwind angle is (wind_from_deg + 180) % 360
        upwind_deg = (wind_from_deg + 180.0) % 360.0
        upwind_rad = math.radians(upwind_deg)
        
        # Standoff radius: 250m minimum, or 30% of red zone reach
        dist_staging_m = max(250.0, red_reach_m * 0.30)

        lat_scale = 111132.0
        lon_scale = 111132.0 * math.cos(math.radians(src_lat))

        # Upwind Incident Control Staging Post
        stage_upwind_lat = src_lat + (dist_staging_m * math.cos(upwind_rad) / lat_scale)
        stage_upwind_lon = src_lon + (dist_staging_m * math.sin(upwind_rad) / lon_scale)
        stage_upwind_coords = [round(stage_upwind_lat, 6), round(stage_upwind_lon, 6)]

        # Crosswind Sector Boundary Staging (for fog cannons)
        crosswind_rad = math.radians((upwind_deg + 90.0) % 360.0)
        stage_crosswind_lat = src_lat + (150.0 * math.cos(crosswind_rad) / lat_scale)
        stage_crosswind_lon = src_lon + (150.0 * math.sin(crosswind_rad) / lon_scale)
        stage_crosswind_coords = [round(stage_crosswind_lat, 6), round(stage_crosswind_lon, 6)]

        # Medical Staging tied to Designated Safe Assembly Point / Gate
        if evacuation_plan and evacuation_plan.primary_evacuation_route:
            prim_route = evacuation_plan.primary_evacuation_route
            med_staging_name = f"Medical Triage at {prim_route.recommended_assembly_point_name}"
            med_staging_coords = prim_route.assembly_point_coords
        else:
            # Fallback to safest assembly point in impact result
            safe_aps = [ap for ap in impact_result.assembly_points if ap.status == "SAFE"]
            chosen_ap = safe_aps[0] if safe_aps else impact_result.assembly_points[0]
            med_staging_name = f"Medical Triage at {chosen_ap.name}"
            med_staging_coords = [21.6850, 72.5690]

        # ERT Staging Point (Nearest Outer Perimeter Security Gate)
        gate_coords = [21.6805, 72.5730]
        gate_staging_name = "Main Outer Access Gate & Security Command"

        # 3. Resource Availability Check & Dynamic Dispatch
        allocated_items: List[ResourceAllocationItem] = []
        unavailable_items: List[Dict[str, Any]] = []

        # Vehicle Speed on Industrial Complex Roads ~ 22 km/h = 366 m/min
        VEHICLE_SPEED_M_MIN = 366.0
        TURNOUT_TIME_MIN = 0.5

        for r in all_resources:
            r_coords = [r.lat, r.lon]

            # Check Resource Status
            if r.status != "AVAILABLE":
                unavailable_items.append({
                    "resource_id": r.id,
                    "resource_name": r.name,
                    "type": r.type,
                    "status": r.status,
                    "reason": f"Resource unavailable due to {r.status.lower()} status"
                })
                continue

            if r.type == "FIRE_TENDER":
                target_coords = stage_upwind_coords
                target_name = f"Upwind Incident Staging Post (Bearing {int(upwind_deg)}°, {int(dist_staging_m)}m Standoff)"
                dist_transit = self._haversine_distance_m(r_coords, target_coords)
                eta = round(TURNOUT_TIME_MIN + (dist_transit / VEHICLE_SPEED_M_MIN), 1)

                if is_fire_or_explosion:
                    prio = "IMMEDIATE"
                    role = "Primary Fire Suppression, Vessel Cooling & Foam Blanketing"
                    rationale = f"Deploy 4000 LPM roof monitor for active thermal suppression on {simulation_result.source_asset_id} and continuous deluge spray on {vulnerable_assets} adjacent tanks to prevent domino BLEVE."
                    equip = "Charge twin 63mm lines with 3% AFFF foam concentrate; connect to high-capacity hydrant HYD-01/05."
                elif is_hydrocarbon_flammable:
                    prio = "IMMEDIATE"
                    role = "Vapor Cloud Inerting & Preemptive Foam Blanket"
                    rationale = f"Establish proactive AFFF foam blanket over {chem_name} pool and prepare deluge water spray to prevent thermal ignition."
                    equip = "Medium expansion foam generator, grounding straps, non-sparking couplings."
                else:
                    prio = "HIGH"
                    role = "Exposure Protection & Boundary Water Curtain Backup"
                    rationale = f"Provide boundary cooling for adjacent infrastructure and water support to vapor knockdown units during {chem_name} release."
                    equip = "Connect to nearest uncompromised hydrant and stand by with wide-angle fog nozzles."

                allocated_items.append(
                    ResourceAllocationItem(
                        resource_id=r.id,
                        resource_name=r.name,
                        resource_type=r.type,
                        current_station=r.stationed_at,
                        current_status=r.status,
                        assigned_role=role,
                        staging_area_name=target_name,
                        staging_coordinates=target_coords,
                        distance_to_staging_m=round(dist_transit, 1),
                        estimated_arrival_min=eta,
                        tactical_rationale=rationale,
                        priority=prio,
                        equipment_instructions=equip
                    )
                )

            elif r.type == "WATER_BOWSER":
                target_coords = stage_crosswind_coords
                target_name = f"Crosswind Knockdown Sector ({int((upwind_deg + 90) % 360)}° Vector)"
                dist_transit = self._haversine_distance_m(r_coords, target_coords)
                eta = round(TURNOUT_TIME_MIN + (dist_transit / VEHICLE_SPEED_M_MIN), 1)

                if is_water_soluble_toxic:
                    prio = "IMMEDIATE"
                    role = "High-Volume Vapor Cloud Knockdown & Gas Absorption"
                    rationale = f"{chem_name} is highly water-soluble. Deploy continuous fog curtains across the plume dispersion axis to rapidly absorb airborne toxic vapors."
                    equip = "Position 4x unmanned portable fog cannons at 45-degree angle to plume centerline; maintain 15,000L water shuttle."
                elif is_fire_or_explosion:
                    prio = "IMMEDIATE"
                    role = "Bulk Firewater Supply Shuttle & Exposure Cooling"
                    rationale = "Maintain continuous water relay to Fire Tender Alpha to ensure uninterrupted monitor cooling on ruptured unit."
                    equip = "Connect 100mm heavy delivery hose to Fire Tender intake; establish water shuttle with off-site reservoir."
                else:
                    prio = "SUPPORT"
                    role = "Secondary Water Supply & Runoff Dilution"
                    rationale = f"Stand by for secondary water relay and environmental runoff dilution of {chem_name} spill."
                    equip = "Connect to water supply manifold and stand by on tactical command channel."

                allocated_items.append(
                    ResourceAllocationItem(
                        resource_id=r.id,
                        resource_name=r.name,
                        resource_type=r.type,
                        current_station=r.stationed_at,
                        current_status=r.status,
                        assigned_role=role,
                        staging_area_name=target_name,
                        staging_coordinates=target_coords,
                        distance_to_staging_m=round(dist_transit, 1),
                        estimated_arrival_min=eta,
                        tactical_rationale=rationale,
                        priority=prio,
                        equipment_instructions=equip
                    )
                )

            elif r.type == "HAZMAT_SQUAD":
                target_coords = stage_upwind_coords
                target_name = f"Incident Hot-Zone Control Post ({int(upwind_deg)}° Upwind)"
                dist_transit = self._haversine_distance_m(r_coords, target_coords)
                eta = round(TURNOUT_TIME_MIN + (dist_transit / VEHICLE_SPEED_M_MIN), 1)

                if is_toxic_gas or not is_fire_or_explosion:
                    prio = "IMMEDIATE"
                    role = "Hot Zone Isolation & Emergency Valve Clamping"
                    rationale = f"Entry into Red Zone for leak source capping and emergency isolation valve actuation on {simulation_result.source_asset_id} under Level A gas-tight suits."
                    equip = "Don Trellchem Level A fully-encapsulated gas-tight suits, dual-stage positive pressure SCBA, non-sparking pneumatic pipe patch kits."
                else:
                    prio = "HIGH"
                    role = "Secondary Hazardous Substance Containment & Gas Recon"
                    rationale = "Perform perimeter gas detection and thermal imaging recon while fire suppression is underway."
                    equip = "Level B chemical splash suits with positive pressure SCBA, multi-gas photoionization detectors, thermal imaging camera."

                allocated_items.append(
                    ResourceAllocationItem(
                        resource_id=r.id,
                        resource_name=r.name,
                        resource_type=r.type,
                        current_station=r.stationed_at,
                        current_status=r.status,
                        assigned_role=role,
                        staging_area_name=target_name,
                        staging_coordinates=target_coords,
                        distance_to_staging_m=round(dist_transit, 1),
                        estimated_arrival_min=eta,
                        tactical_rationale=rationale,
                        priority=prio,
                        equipment_instructions=equip
                    )
                )

            elif r.type == "AMBULANCE":
                target_coords = med_staging_coords
                target_name = med_staging_name
                dist_transit = self._haversine_distance_m(r_coords, target_coords)
                eta = round(TURNOUT_TIME_MIN + (dist_transit / VEHICLE_SPEED_M_MIN), 1)

                if exposed_workers > 0 or lethal_workers > 0:
                    prio = "IMMEDIATE"
                    role = "Casualty Triage, Respiratory Resuscitation & Decontamination"
                    rationale = f"Establish casualty decontamination and emergency triage at {med_staging_name} for {exposed_workers} potentially exposed personnel."
                    equip = f"Prepare humidified O2 therapy, bronchodilators (for {chem_name} inhalation), eye-wash stations, portable ventilators, and burn dressings."
                else:
                    prio = "STANDBY"
                    role = "Precautionary Medical Standby at Muster Point"
                    rationale = f"Stand by at {med_staging_name} for emergency responder medical monitoring and potential delayed symptoms."
                    equip = "Vital signs monitoring station, hydration electrolytes, basic trauma dressings, heat-stress monitoring kit."

                allocated_items.append(
                    ResourceAllocationItem(
                        resource_id=r.id,
                        resource_name=r.name,
                        resource_type=r.type,
                        current_station=r.stationed_at,
                        current_status=r.status,
                        assigned_role=role,
                        staging_area_name=target_name,
                        staging_coordinates=target_coords,
                        distance_to_staging_m=round(dist_transit, 1),
                        estimated_arrival_min=eta,
                        tactical_rationale=rationale,
                        priority=prio,
                        equipment_instructions=equip
                    )
                )

            elif r.type == "ERT_TEAM":
                target_coords = gate_coords
                target_name = gate_staging_name
                dist_transit = self._haversine_distance_m(r_coords, target_coords)
                eta = round(TURNOUT_TIME_MIN + (dist_transit / VEHICLE_SPEED_M_MIN), 1)

                prio = "SUPPORT"
                role = "Cordon Enforcement, Road Junction Barricading & Headcount Control"
                rationale = f"Barricade {len(impact_result.blocked_roads)} severed road junctions, guide evacuating personnel towards safe muster, and coordinate with mutual-aid responders."
                equip = "Intrinsically safe VHF handheld radios, flashing perimeter barrier beacons, road hazard tape, emergency muster roll clipboards."

                allocated_items.append(
                    ResourceAllocationItem(
                        resource_id=r.id,
                        resource_name=r.name,
                        resource_type=r.type,
                        current_station=r.stationed_at,
                        current_status=r.status,
                        assigned_role=role,
                        staging_area_name=target_name,
                        staging_coordinates=target_coords,
                        distance_to_staging_m=round(dist_transit, 1),
                        estimated_arrival_min=eta,
                        tactical_rationale=rationale,
                        priority=prio,
                        equipment_instructions=equip
                    )
                )

        # Sort allocated resources by Priority: IMMEDIATE -> HIGH -> SUPPORT -> STANDBY
        prio_order = {"IMMEDIATE": 1, "HIGH": 2, "SUPPORT": 3, "STANDBY": 4}
        allocated_items.sort(key=lambda x: (prio_order.get(x.priority, 5), x.estimated_arrival_min))

        # 4. Dynamic Firewater, Foam & Isolation Calculations
        # Firewater demand formula: Baseline + (release_q * 120) + (vulnerable_assets * 800)
        base_water = 9000.0 if is_fire_or_explosion else 3500.0
        dynamic_water_lpm = round(base_water + (release_q * 120.0) + (vulnerable_assets * 800.0), 0)

        # Foam concentrate demand (liters of 3% AFFF concentrate):
        # Applied to flammable hydrocarbons (LPG, Benzene) or active fire/explosion incidents; 0L for pure toxic gas leaks
        requires_foam = is_fire_or_explosion or (chemical and chemical.id in ["CHEM-LPG", "CHEM-C6H6"])
        if requires_foam:
            foam_l = round(1500.0 + (release_q * 50.0), 0)
        else:
            foam_l = 0.0

        # PPE Recommendation (Safer Prototype Decision-Support Wording)
        if is_toxic_gas and not is_fire_or_explosion:
            ppe_str = "Level A fully encapsulated gas-tight suit with positive-pressure SCBA — verify against site PPE requirements"
        elif is_fire_or_explosion:
            ppe_str = "NFPA structural firefighting turnout bunker gear with aluminized proximity entry hood & positive-pressure SCBA"
        elif is_hydrocarbon_flammable:
            ppe_str = "Flash-fire resistant Nomex III A coveralls, chemical splash shield, Level B SCBA"
        else:
            ppe_str = "Level B chemical resistant splash suit with positive-pressure SCBA"

        # Isolation Perimeter (1.25x Red Threat Zone reach or minimum 300m)
        isolation_perimeter_m = round(max(300.0, red_reach_m * 1.25), 1)

        # 5. Dynamic 3-Phase SOP Action Checklists
        assigned_muster = evacuation_plan.primary_evacuation_route.recommended_assembly_point_name if (evacuation_plan and evacuation_plan.primary_evacuation_route) else "designated safe assembly points"

        tactical_checklist = [
            TacticalActionChecklist(
                phase="IMMEDIATE_0_5MIN",
                title="Phase 1: Initial Alarm, Isolation & Personnel Evacuation (0 - 5 Minutes)",
                actions=[
                    f"Sound Plant Emergency Siren (Continuous Alarm for {chem_name} {incident_type.replace('_', ' ').title()}).",
                    f"Actuate Emergency Shutdown (ESD) for {simulation_result.source_asset_id} and isolate upstream pipeline valves.",
                    f"Enforce mandatory crosswind evacuation of all Sector personnel towards {assigned_muster}.",
                    f"ERT Team establishes {isolation_perimeter_m}m initial cordon perimeter around {simulation_result.source_asset_id}."
                ]
            ),
            TacticalActionChecklist(
                phase="MITIGATION_5_15MIN",
                title="Phase 2: Source Mitigation & Tactical Exposure Protection (5 - 15 Minutes)",
                actions=[
                    f"Position Fire Tender & Bowser at Upwind Staging Post ({int(dist_staging_m)}m standoff, bearing {int(upwind_deg)}°).",
                    f"Establish {dynamic_water_lpm:,.0f} LPM water curtain coverage to suppress {chem_name} vapors and cool {vulnerable_assets} adjacent assets.",
                    f"Deploy Hazmat Entry Squad in {ppe_str.split('(')[0].strip()} for hot-zone valve isolation and clamp seal.",
                    "Verify automated fixed water deluge systems on neighboring storage vessels."
                ]
            ),
            TacticalActionChecklist(
                phase="CONTAINMENT_15_30MIN",
                title="Phase 3: Containment, Medical Triage & Incident De-escalation (15 - 30 Minutes)",
                actions=[
                    f"Complete headcount verification at {assigned_muster} (Reconcile against {exposed_workers} exposed workers).",
                    f"Ambulance team initiates emergency triage and decontamination for exposed operators.",
                    "Contain all contaminated firefighting water in industrial effluent retention sump; prevent municipal drain escape.",
                    "HSE Lead Commander compiles situation briefing for District Disaster Management Authority (DDMA)."
                ]
            )
        ]

        return ResourceOptimizationPlan(
            incident_id=f"INC-{simulation_result.source_asset_id}-{int(simulation_result.wind_speed_kmh)}K",
            incident_type=incident_type,
            incident_severity=impact_result.risk_assessment.risk_category,
            chemical_name=chem_name,
            decision_support_disclaimer="⚠️ PROTOTYPE DECISION SUPPORT ONLY — Non-Certified Computational Output. Validate against site ERDMP standard operating procedures and statutory OISD/PESO regulations.",
            recommended_resources=allocated_items,
            unavailable_resources=unavailable_items,
            tactical_checklist=tactical_checklist,
            isolation_perimeter_m=isolation_perimeter_m,
            standoff_upwind_m=round(dist_staging_m, 1),
            foam_water_requirements={
                "firewater_demand_lpm": dynamic_water_lpm,
                "foam_concentrate_demand_liters": foam_l,
                "minimum_water_curtain_coverage_m": round(crosswind_w_m * 1.5, 1),
                "ppe_required": ppe_str,
                "formula_basis": f"Calculated from release rate {release_q} kg/s, {vulnerable_assets} vulnerable assets, and {chem_name} SDS toxicity/flammability"
            }
        )

resource_service = ResourceService()
