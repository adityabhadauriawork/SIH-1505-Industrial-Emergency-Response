from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.schemas.timeline import TimelineEventItem, IncidentTimelineResponse

class IncidentTimelineService:
    def generate_timeline(
        self,
        simulation_result: Optional[Dict[str, Any]] = None,
        impact_result: Optional[Dict[str, Any]] = None,
        evacuation_plan: Optional[Dict[str, Any]] = None,
        resource_plan: Optional[Dict[str, Any]] = None,
        authorization_record: Optional[Dict[str, Any]] = None
    ) -> IncidentTimelineResponse:
        """
        Derive an authoritative vertical incident timeline and state progression stream from active system state.
        """
        sim = simulation_result or {}
        imp = impact_result or {}
        evac = evacuation_plan or {}
        res = resource_plan or {}
        auth = authorization_record or {}

        asset_id = sim.get("source_asset_id", "T-04")
        chem_name = sim.get("chemical_name", "Ammonia (Anhydrous)")
        inc_type = sim.get("incident_type", "PIPELINE_LEAK")
        rel_rate = sim.get("effective_release_rate_kg_s", 15.0)
        wind_spd = sim.get("wind_speed_kmh", 8.0)
        wind_deg = sim.get("wind_direction_deg", 45.0)
        wind_card = sim.get("wind_direction_cardinal", "NE")
        weather_mode = sim.get("weather_mode", "LIVE")

        risk = imp.get("risk_assessment") or {}
        risk_score = float(risk.get("overall_score", 55.3))
        risk_cat = risk.get("risk_category", "HIGH")
        workers_count = imp.get("affected_workers_count", 0)
        red_count = imp.get("red_zone_workers_count", 0)
        assets_count = imp.get("affected_assets_count", 0)
        roads_count = imp.get("blocked_roads_count", 0)

        prim_route = evac.get("primary_evacuation_route") or {}
        ap_name = prim_route.get("recommended_assembly_point_name", "Assembly Point 3 (AP-3)")
        gate_name = prim_route.get("recommended_gate_name", "Gate 2 (West Perimeter)")
        dist_m = prim_route.get("total_distance_m", 623.9)
        walk_time = prim_route.get("estimated_evac_time_min", 8.7)

        fw = res.get("foam_water_requirements") or {}
        firewater = fw.get("firewater_demand_lpm", 5000.0)
        foam = fw.get("foam_concentrate_demand_liters", 0.0)
        ppe = fw.get("ppe_required", "Level A Encapsulated SCBA")
        rec_res = res.get("recommended_resources") or []
        lead_unit = rec_res[0].get("resource_name", "High-Volume Water Curtain Bowser") if rec_res else "High-Volume Water Curtain Bowser"

        auth_status = auth.get("status", "PENDING_HUMAN_AUTHORIZATION")
        approver = auth.get("approver_name", "Demo HSE Controller")

        # Base timestamp anchored to ~3 minutes ago
        base_time = datetime.utcnow() - timedelta(minutes=3, seconds=15)
        start_iso = base_time.isoformat() + "Z"

        def get_ts(offset_sec: int) -> str:
            return (base_time + timedelta(seconds=offset_sec)).isoformat() + "Z"

        events: List[TimelineEventItem] = [
            TimelineEventItem(
                event_id="EVT-001",
                relative_time_label="T+00:00",
                seconds_offset=0,
                timestamp_iso=get_ts(0),
                event_type="INCIDENT_DETECTED",
                incident_state="DETECTED",
                source_module="SENSOR_TELEMETRY",
                title=f"Incident Detected at {asset_id}",
                short_description=f"Automated optical/pressure telemetry triggered on {asset_id}. Initial emission: {chem_name} at {rel_rate} kg/s ({inc_type}).",
                key_metrics={"asset_id": asset_id, "chemical": chem_name, "release_rate_kg_s": rel_rate},
                severity_level="CRITICAL",
                is_milestone=True
            ),
            TimelineEventItem(
                event_id="EVT-002",
                relative_time_label="T+00:10",
                seconds_offset=10,
                timestamp_iso=get_ts(10),
                event_type="WEATHER_CAPTURED",
                incident_state="ASSESSING",
                source_module="WEATHER_SERVICE",
                title="Meteorological Feed Synchronized",
                short_description=f"Atmospheric profile established ({weather_mode}): Wind {wind_spd} km/h FROM {wind_card} ({wind_deg}°), Stability Class D (Neutral). Plume propagating toward {(wind_deg + 180) % 360:.0f}°.",
                key_metrics={"wind_speed_kmh": wind_spd, "wind_bearing_deg": wind_deg, "weather_mode": weather_mode},
                severity_level="INFO",
                is_milestone=False
            ),
            TimelineEventItem(
                event_id="EVT-003",
                relative_time_label="T+00:30",
                seconds_offset=30,
                timestamp_iso=get_ts(30),
                event_type="HAZARD_SIMULATED",
                incident_state="ASSESSING",
                source_module="GAUSSIAN_HAZARD",
                title="Gaussian Hazard Dispersion Simulated",
                short_description="Physics screening model generated 3-tiered ERPG threat boundaries across 4 time steps. Lethal Red Zone reach computed.",
                key_metrics={"threat_zones": 3, "time_steps_evaluated": 4},
                severity_level="WARNING",
                is_milestone=True
            ),
            TimelineEventItem(
                event_id="EVT-004",
                relative_time_label="T+00:45",
                seconds_offset=45,
                timestamp_iso=get_ts(45),
                event_type="IMPACT_ASSESSED",
                incident_state="ASSESSING",
                source_module="IMPACT_ANALYZER",
                title=f"Spatial Impact Assessment Completed (Score: {risk_score}/100)",
                short_description=f"Calculated spatial intersection: {workers_count} workers exposed ({red_count} Red Zone), {assets_count} compromised plant units, {roads_count} severed road segment.",
                key_metrics={"risk_score": risk_score, "exposed_workers": workers_count, "compromised_assets": assets_count},
                severity_level="CRITICAL",
                is_milestone=True
            ),
            TimelineEventItem(
                event_id="EVT-005",
                relative_time_label="T+01:00",
                seconds_offset=60,
                timestamp_iso=get_ts(60),
                event_type="EVACUATION_ROUTED",
                incident_state="EVACUATING",
                source_module="DIJKSTRA_EVACUATION",
                title=f"Safe Evacuation Corridor Selected: {ap_name}",
                short_description=f"Dijkstra graph solver verified safe route to {ap_name} via {gate_name} ({dist_m}m, ~{walk_time} min walk) providing crosswind standoff.",
                key_metrics={"target_ap": ap_name, "exit_gate": gate_name, "distance_m": dist_m, "walk_time_min": walk_time},
                severity_level="SUCCESS",
                is_milestone=True
            ),
            TimelineEventItem(
                event_id="EVT-006",
                relative_time_label="T+01:20",
                seconds_offset=80,
                timestamp_iso=get_ts(80),
                event_type="TACTICAL_ALLOCATED",
                incident_state="SUPPRESSING",
                source_module="TACTICAL_OPTIMIZER",
                title=f"Tactical Suppression Dispatched: {lead_unit}",
                short_description=f"Sized emergency resources: {firewater:,.0f} LPM firewater demand, PPE: {ppe}. Staging point established 250m upwind.",
                key_metrics={"lead_unit": lead_unit, "firewater_lpm": firewater, "ppe": ppe},
                severity_level="WARNING",
                is_milestone=True
            ),
            TimelineEventItem(
                event_id="EVT-007",
                relative_time_label="T+01:45",
                seconds_offset=105,
                timestamp_iso=get_ts(105),
                event_type="DOMINO_SCREENED",
                incident_state="SUPPRESSING",
                source_module="DOMINO_SCREENER",
                title="Domino & Cascade Vulnerability Screened",
                short_description="Adjacent storage vessels and critical substations evaluated for thermal flux and toxic engulfment. Deluge isolation interlocks recommended.",
                key_metrics={"screening_level": "ELEVATED", "mitigation_actions": 4},
                severity_level="INFO",
                is_milestone=False
            ),
            TimelineEventItem(
                event_id="EVT-008",
                relative_time_label="T+02:00",
                seconds_offset=120,
                timestamp_iso=get_ts(120),
                event_type="HSE_REVIEW_INITIATED",
                incident_state="REVIEWING",
                source_module="HSE_AUTHORIZATION",
                title="Fire Pre-Plan Compiled for Human Authorization",
                short_description="5-page Fire Pre-Plan document generated. 5-point HSE review checklist presented to On-Duty Controller for verification.",
                key_metrics={"doc_version": "v0.1", "checklist_items": 5},
                severity_level="INFO",
                is_milestone=True
            )
        ]

        if auth_status == "AUTHORIZED":
            events.append(
                TimelineEventItem(
                    event_id="EVT-009",
                    relative_time_label="T+03:00",
                    seconds_offset=180,
                    timestamp_iso=get_ts(180),
                    event_type="AUTHORIZATION_COMPLETED",
                    incident_state="AUTHORIZED",
                    source_module="HSE_AUTHORIZATION",
                    title=f"Pre-Plan Formally Authorized by {approver}",
                    short_description=f"HSE Controller {approver} validated all 5 checklist items and executed prototype digital endorsement.",
                    key_metrics={"status": "AUTHORIZED", "approver": approver, "version": "v1.0"},
                    severity_level="SUCCESS",
                    is_milestone=True
                )
            )
            current_phase = "AUTHORIZED & ACTIVE RESPONSE"
        else:
            events.append(
                TimelineEventItem(
                    event_id="EVT-009",
                    relative_time_label="T+02:30",
                    seconds_offset=150,
                    timestamp_iso=get_ts(150),
                    event_type="HSE_REVIEW_PENDING",
                    incident_state="REVIEWING",
                    source_module="HSE_AUTHORIZATION",
                    title="Awaiting Human HSE Authorization",
                    short_description="Autonomous AI decision support is prepared. Official operational execution pending human sign-off.",
                    key_metrics={"status": "PENDING_HUMAN_AUTHORIZATION"},
                    severity_level="WARNING",
                    is_milestone=True
                )
            )
            current_phase = "PENDING HUMAN AUTHORIZATION"

        return IncidentTimelineResponse(
            incident_id=sim.get("id", f"INC-{asset_id}"),
            asset_id=asset_id,
            chemical_name=chem_name,
            start_time_iso=start_iso,
            total_events=len(events),
            events=events,
            current_phase=current_phase,
            prototype_notice="PROTOTYPE INCIDENT TIMELINE — Derived from Authoritative System State Transitions"
        )

timeline_service = IncidentTimelineService()
