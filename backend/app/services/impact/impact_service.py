from typing import Dict, Any, List
from shapely.geometry import shape, Point, LineString
from sqlalchemy.orm import Session
from app.models.plant import WorkerModel, AssetModel, RoadModel, AssemblyPointModel
from app.models.chemical import ChemicalModel
from app.schemas.impact import (
    ImpactAnalysisResult, AffectedWorkerDetail, AffectedAssetDetail,
    BlockedRoadDetail, AssemblyPointStatus, RiskScoreBreakdown, RiskFactor
)
from app.schemas.hazard import HazardSimulationResult

class ImpactService:
    def evaluate_impact(
        self,
        db: Session,
        simulation_result: HazardSimulationResult,
        time_step_sec: int = 120
    ) -> ImpactAnalysisResult:
        """
        Perform spatial intersection between hazard threat polygons and plant entities.
        Computes affected workers, compromised assets, blocked roads, safe assembly points, and risk score.
        """
        # 1. Retrieve the appropriate time-step GeoJSON
        target_step = next(
            (ts for ts in simulation_result.time_steps if ts.time_step_sec == time_step_sec),
            simulation_result.time_steps[-1]
        )

        red_poly = None
        orange_poly = None
        yellow_poly = None

        for feat in target_step.geojson.get("features", []):
            geom = shape(feat["geometry"])
            zid = feat["properties"].get("zone_id")
            if zid == "RED_ZONE_LETHAL":
                red_poly = geom
            elif zid == "ORANGE_ZONE_INJURY":
                orange_poly = geom
            elif zid == "YELLOW_ZONE_CAUTION":
                yellow_poly = geom

        # Ensure fallback empty polygons if any missing
        dummy_poly = Point(0, 0).buffer(0.000001)
        red_poly = red_poly if red_poly and not red_poly.is_empty else dummy_poly
        orange_poly = orange_poly if orange_poly and not orange_poly.is_empty else dummy_poly
        yellow_poly = yellow_poly if yellow_poly and not yellow_poly.is_empty else dummy_poly

        # 2. Evaluate Workers
        workers = db.query(WorkerModel).filter(WorkerModel.active == True).all()
        affected_workers = []
        red_count = 0
        orange_count = 0
        yellow_count = 0

        for w in workers:
            pt = Point(w.lon, w.lat)  # GeoJSON / Shapely uses (x=lon, y=lat)
            if red_poly.contains(pt):
                red_count += 1
                affected_workers.append(
                    AffectedWorkerDetail(
                        id=w.id,
                        name=w.name,
                        role=w.role,
                        sector=w.sector,
                        coordinates=[w.lat, w.lon],
                        exposure_zone="RED_ZONE_LETHAL",
                        exposure_severity="Critical / Lethal Risk",
                        contact=w.contact,
                        action_required="Deploy Hazmat Team with SCBA / Level A suit for emergency extraction"
                    )
                )
            elif orange_poly.contains(pt):
                orange_count += 1
                affected_workers.append(
                    AffectedWorkerDetail(
                        id=w.id,
                        name=w.name,
                        role=w.role,
                        sector=w.sector,
                        coordinates=[w.lat, w.lon],
                        exposure_zone="ORANGE_ZONE_INJURY",
                        exposure_severity="Severe Impairment / Toxic Dose",
                        contact=w.contact,
                        action_required="Evacuate crosswind immediately towards designated safe perimeter gate"
                    )
                )
            elif yellow_poly.contains(pt):
                yellow_count += 1
                affected_workers.append(
                    AffectedWorkerDetail(
                        id=w.id,
                        name=w.name,
                        role=w.role,
                        sector=w.sector,
                        coordinates=[w.lat, w.lon],
                        exposure_zone="YELLOW_ZONE_CAUTION",
                        exposure_severity="Moderate Exposure / Eye & Respiratory Irritation",
                        contact=w.contact,
                        action_required="Don escape hood / respirator and move upwind to Assembly Point"
                    )
                )

        # 3. Evaluate Assets & Domino Cascades
        assets = db.query(AssetModel).all()
        affected_assets = []
        source_id = simulation_result.source_asset_id

        for a in assets:
            if a.id == source_id:
                affected_assets.append(
                    AffectedAssetDetail(
                        id=a.id,
                        name=a.name,
                        type=a.type,
                        sector=a.sector,
                        criticality=a.criticality,
                        exposure_zone="INCIDENT_SOURCE",
                        domino_hazard="Active Release Epicenter",
                        mitigation_action="Emergency ESD shutdown and remote isolation valve closure"
                    )
                )
                continue

            pt = Point(a.lon, a.lat)
            if red_poly.contains(pt):
                affected_assets.append(
                    AffectedAssetDetail(
                        id=a.id,
                        name=a.name,
                        type=a.type,
                        sector=a.sector,
                        criticality=a.criticality,
                        exposure_zone="RED_ZONE_LETHAL",
                        domino_hazard="Severe Secondary Failure / Thermal BLEVE Risk / Toxic Infiltration",
                        mitigation_action="Activate water deluge spray and initiate unit depressurization"
                    )
                )
            elif orange_poly.contains(pt):
                affected_assets.append(
                    AffectedAssetDetail(
                        id=a.id,
                        name=a.name,
                        type=a.type,
                        sector=a.sector,
                        criticality=a.criticality,
                        exposure_zone="ORANGE_ZONE_INJURY",
                        domino_hazard="Moderate Process Disturbance / Exposure Risk",
                        mitigation_action="Switch HVAC to recirculate mode / monitor boundary gas sniffers"
                    )
                )

        # 4. Evaluate Roads & Blockages
        roads = db.query(RoadModel).all()
        blocked_roads = []

        for r in roads:
            coords = r.coordinates_json
            line_pts = [(p[1], p[0]) for p in coords]
            line = LineString(line_pts)

            if red_poly.intersects(line):
                blocked_roads.append(
                    BlockedRoadDetail(
                        id=r.id,
                        name=r.name,
                        reason="Direct intersection with Lethal Threat Envelope (Red Zone)",
                        impacted_zone="RED_ZONE_LETHAL"
                    )
                )
            elif orange_poly.intersects(line):
                blocked_roads.append(
                    BlockedRoadDetail(
                        id=r.id,
                        name=r.name,
                        reason="Traversed by Severe Toxic Vapor Dispersion (Orange Zone)",
                        impacted_zone="ORANGE_ZONE_INJURY"
                    )
                )

        # 5. Evaluate Assembly Points
        assembly_points = db.query(AssemblyPointModel).all()
        ap_statuses = []
        safe_count = 0
        compromised_count = 0

        for ap in assembly_points:
            pt = Point(ap.lon, ap.lat)
            dist_to_source = pt.distance(Point(simulation_result.source_coordinates[1], simulation_result.source_coordinates[0])) * 111132.0

            if red_poly.contains(pt) or orange_poly.contains(pt) or yellow_poly.contains(pt):
                compromised_count += 1
                ap_statuses.append(
                    AssemblyPointStatus(
                        id=ap.id,
                        name=ap.name,
                        status="COMPROMISED",
                        coordinates=[ap.lat, ap.lon],
                        capacity=ap.capacity,
                        current_occupancy=0,
                        distance_to_hazard_m=round(dist_to_source, 1),
                        recommendation="UNSAFE: In path of toxic cloud. Divert evacuees to opposite perimeter gate."
                    )
                )
            else:
                safe_count += 1
                ap_statuses.append(
                    AssemblyPointStatus(
                        id=ap.id,
                        name=ap.name,
                        status="SAFE",
                        coordinates=[ap.lat, ap.lon],
                        capacity=ap.capacity,
                        current_occupancy=0,
                        distance_to_hazard_m=round(dist_to_source, 1),
                        recommendation="SAFE: Suitable for primary worker muster and medical staging."
                    )
                )

        # 6. Calculate Transparent Prototype Risk Score (0-100)
        risk_breakdown = self._calculate_risk_score(
            chemical_id=simulation_result.chemical_id,
            release_rate=simulation_result.effective_release_rate_kg_s,
            incident_type=simulation_result.incident_type,
            workers_red=red_count,
            workers_orange=orange_count,
            workers_yellow=yellow_count,
            total_workers=len(workers),
            affected_assets_count=len(affected_assets),
            blocked_roads_count=len(blocked_roads),
            total_roads=len(roads),
            compromised_ap_count=compromised_count
        )

        return ImpactAnalysisResult(
            total_workers_at_site=len(workers),
            affected_workers_count=len(affected_workers),
            red_zone_workers_count=red_count,
            orange_zone_workers_count=orange_count,
            yellow_zone_workers_count=yellow_count,
            affected_workers=affected_workers,
            
            total_assets_at_site=len(assets),
            affected_assets_count=len(affected_assets),
            affected_assets=affected_assets,
            
            total_roads_count=len(roads),
            blocked_roads_count=len(blocked_roads),
            blocked_roads=blocked_roads,
            
            assembly_points=ap_statuses,
            safe_assembly_points_count=safe_count,
            compromised_assembly_points_count=compromised_count,
            
            risk_assessment=risk_breakdown
        )

    def _calculate_risk_score(
        self,
        chemical_id: str,
        release_rate: float,
        incident_type: str,
        workers_red: int,
        workers_orange: int,
        workers_yellow: int,
        total_workers: int,
        affected_assets_count: int,
        blocked_roads_count: int,
        total_roads: int,
        compromised_ap_count: int
    ) -> RiskScoreBreakdown:
        """
        Explainable Multi-Factor Deterministic Risk Score:
        Factor 1: Chemical Hazard Rating (max 25)
        Factor 2: Release Dynamics & Severity (max 25)
        Factor 3: Population Exposure (max 25)
        Factor 4: Critical Asset Vulnerability (max 15)
        Factor 5: Evacuation Grid Impairment (max 10)
        """
        # Factor 1: Chemical (Ammonia/Chlorine/H2S high, LPG moderate-high flammability)
        chem_scores = {
            "CHEM-CL2": 24.0,
            "CHEM-H2S": 23.0,
            "CHEM-NH3": 21.0,
            "CHEM-LPG": 20.0,
            "CHEM-C6H6": 16.0
        }
        f1_score = chem_scores.get(chemical_id, 18.0)
        f1_desc = f"Hazard toxicity & volatility rating based on IDLH / ERPG thresholds ({f1_score:.1f}/25)"

        # Factor 2: Release Severity
        rate_ratio = min(1.0, release_rate / 30.0)
        type_bonus = 5.0 if incident_type in ["FIRE_EXPLOSION", "TOXIC_RELEASE"] else 3.0
        f2_score = min(25.0, round(rate_ratio * 20.0 + type_bonus, 1))
        f2_desc = f"Mass emission rate ({release_rate} kg/s) under active plant pressure ({f2_score:.1f}/25)"

        # Factor 3: Population Exposure
        pop_score = (workers_red * 10.0) + (workers_orange * 5.0) + (workers_yellow * 2.0)
        f3_score = min(25.0, round(pop_score, 1))
        f3_desc = f"{workers_red} workers in Lethal Zone, {workers_orange} in Severe Zone, {workers_yellow} in Caution Zone ({f3_score:.1f}/25)"

        # Factor 4: Asset Vulnerability
        f4_score = min(15.0, round(affected_assets_count * 3.5, 1))
        f4_desc = f"{affected_assets_count} critical production assets engulfed in threat envelope ({f4_score:.1f}/15)"

        # Factor 5: Evacuation Road Impairment
        road_pct = (blocked_roads_count / max(1, total_roads))
        f5_score = min(10.0, round((road_pct * 7.0) + (compromised_ap_count * 1.5), 1))
        f5_desc = f"{blocked_roads_count}/{total_roads} access roads severed; {compromised_ap_count} muster points compromised ({f5_score:.1f}/10)"

        total_score = min(100.0, round(f1_score + f2_score + f3_score + f4_score + f5_score, 1))

        if total_score >= 80.0:
            cat = "CRITICAL"
            color = "#ef4444"
            verdict = "LEVEL 3 MAJOR ACCIDENT: Immediate site-wide evacuation, mutual aid activation, and emergency command takeover."
        elif total_score >= 60.0:
            cat = "HIGH"
            color = "#f97316"
            verdict = "LEVEL 2 HAZARD: Active containment required. Evacuate downwind sectors and deploy rapid hazmat squads."
        elif total_score >= 35.0:
            cat = "MODERATE"
            color = "#eab308"
            verdict = "LEVEL 1 ISOLATED EVENT: Sectional isolation and boundary fog suppression in progress."
        else:
            cat = "LOW"
            color = "#22c55e"
            verdict = "LOW THREAT: Localized emission within standard control thresholds."

        factors = [
            RiskFactor(name="Chemical Toxicity & Reactivity", score=f1_score, max_score=25.0, description=f1_desc),
            RiskFactor(name="Release Dynamics & Rate", score=f2_score, max_score=25.0, description=f2_desc),
            RiskFactor(name="Personnel Exposure Matrix", score=f3_score, max_score=25.0, description=f3_desc),
            RiskFactor(name="Critical Asset & Domino Risk", score=f4_score, max_score=15.0, description=f4_desc),
            RiskFactor(name="Road Grid & Muster Impairment", score=f5_score, max_score=10.0, description=f5_desc)
        ]

        return RiskScoreBreakdown(
            overall_score=total_score,
            risk_category=cat,
            color=color,
            factors=factors,
            summary_verdict=verdict
        )

impact_service = ImpactService()
