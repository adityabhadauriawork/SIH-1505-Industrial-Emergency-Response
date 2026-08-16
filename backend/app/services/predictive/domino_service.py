import math
from typing import Dict, Any, List, Optional
from shapely.geometry import shape, Point
from sqlalchemy.orm import Session
from app.models.plant import AssetModel
from app.schemas.domino import (
    DominoThreatDetail, DominoRiskAnalysisResponse, DominoRiskAnalysisRequest
)

class DominoService:
    def analyze_cascade_risk(
        self,
        db: Session,
        simulation_result: Dict[str, Any],
        impact_result: Optional[Dict[str, Any]] = None
    ) -> DominoRiskAnalysisResponse:
        """
        Evaluate spatial and process cascade risks to adjacent industrial assets.
        Outputs heuristic screening cascade risk classifications and prioritized deluge/isolation directives.
        """
        source_id = simulation_result.get("source_asset_id", "T-04")
        chem_name = simulation_result.get("chemical_name", "Ammonia")
        src_coords = simulation_result.get("source_coordinates", [21.6855, 72.5745])
        time_steps = simulation_result.get("time_steps", [])

        # Extract latest polygon features
        target_step = time_steps[-1] if time_steps else {}
        features = target_step.get("geojson", {}).get("features", [])

        red_poly = None
        orange_poly = None
        yellow_poly = None

        for feat in features:
            geom = shape(feat["geometry"])
            zid = feat.get("properties", {}).get("zone_id", "")
            if zid == "RED_ZONE_LETHAL":
                red_poly = geom
            elif zid == "ORANGE_ZONE_INJURY":
                orange_poly = geom
            elif zid == "YELLOW_ZONE_CAUTION":
                yellow_poly = geom

        dummy = Point(0, 0).buffer(0.00001)
        red_poly = red_poly if red_poly and not red_poly.is_empty else dummy
        orange_poly = orange_poly if orange_poly and not orange_poly.is_empty else dummy
        yellow_poly = yellow_poly if yellow_poly and not yellow_poly.is_empty else dummy

        all_assets = db.query(AssetModel).all()
        domino_chain: List[DominoThreatDetail] = []
        threatened_critical = 0
        threatened_high = 0

        for a in all_assets:
            if a.id == source_id:
                continue

            # Calculate geodesic distance
            dx = (a.lon - src_coords[1]) * 111320.0 * math.cos(math.radians(src_coords[0]))
            dy = (a.lat - src_coords[0]) * 110540.0
            dist_m = round(math.sqrt(dx * dx + dy * dy), 1)

            pt = Point(a.lon, a.lat)
            overlap = "STANDOFF"
            if red_poly.contains(pt):
                overlap = "RED_ZONE_LETHAL"
            elif orange_poly.contains(pt):
                overlap = "ORANGE_ZONE_INJURY"
            elif yellow_poly.contains(pt):
                overlap = "YELLOW_ZONE_CAUTION"

            crit = (a.criticality or "MEDIUM").upper()

            # Screening Risk Classification
            if overlap == "RED_ZONE_LETHAL":
                if crit in ["CRITICAL", "HIGH"]:
                    screening_risk = "CRITICAL"
                else:
                    screening_risk = "HIGH"
            elif overlap == "ORANGE_ZONE_INJURY":
                if crit == "CRITICAL":
                    screening_risk = "HIGH"
                elif crit == "HIGH":
                    screening_risk = "HIGH"
                else:
                    screening_risk = "ELEVATED"
            elif overlap == "YELLOW_ZONE_CAUTION":
                if crit in ["CRITICAL", "HIGH"]:
                    screening_risk = "ELEVATED"
                else:
                    screening_risk = "LOW"
            else:
                if dist_m < 150.0 and crit in ["CRITICAL", "HIGH"]:
                    screening_risk = "ELEVATED"
                elif dist_m < 250.0:
                    screening_risk = "LOW"
                else:
                    screening_risk = "NEGLIGIBLE"

            if screening_risk in ["CRITICAL", "HIGH"]:
                if crit == "CRITICAL":
                    threatened_critical += 1
                elif crit == "HIGH":
                    threatened_high += 1

            # Determine specific cascade mechanism & description
            atype = (a.type or "VESSEL").upper()
            if "TANK" in atype or "STORAGE" in atype or "SPHERE" in atype:
                mechanism = "Thermal Radiation Exposure / BLEVE & Boilover Threat"
                fail_desc = f"Direct thermal flux or toxic engulfment could breach tank relief valves, escalating to secondary hydrocarbon release."
                recom = f"Activate water deluge cooling rings on {a.name}; engage ESD isolation on feeder manifolds."
                valve_id = f"ESD-VALVE-{a.id[-2:] if len(a.id) >= 2 else '01'}"
            elif "COMPRESSOR" in atype or "PUMP" in atype or "TURBINE" in atype:
                mechanism = "Toxic Vapor Ingestion / Mechanical Seal Failure"
                fail_desc = f"Heavy toxic vapor ingestion into air intakes may cause compressor surge and catastrophic seal destruction."
                recom = f"Trigger emergency shutdown trip for {a.name} and seal air intake dampers."
                valve_id = f"TRIP-RELAY-{a.id}"
            elif "SUBSTATION" in atype or "CONTROL" in atype or "ELECTRICAL" in atype:
                mechanism = "Vapor Cloud Ingress / Electrical Arc Ignition / Grid Trip"
                fail_desc = f"Flammable/corrosive vapor ingress into transformer switchgear risks arc flash and total plant power disruption."
                recom = f"Switch Substation HVAC to positive pressure recirculation mode; isolate non-critical busbars."
                valve_id = f"HVAC-ISO-{a.id}"
            elif "REACTOR" in atype or "COLUMN" in atype or "FURNACE" in atype:
                mechanism = "Process Upset / Exothermic Runaway / Emergency Blowdown"
                fail_desc = f"Loss of cooling or emergency interlock activation may force emergency flaring and overpressure."
                recom = f"Initiate automated inert nitrogen purge on {a.name}; divert hot streams to quench column."
                valve_id = f"BLOWDOWN-{a.id}"
            else:
                mechanism = "Structural Impingement / Secondary Piping Rupture"
                fail_desc = f"Corrosive gas cloud or blast wave could breach adjacent utility lines and instrument air headers."
                recom = f"Monitor boundary LEL/toxic sensors; prepare water spray curtain standoff."
                valve_id = f"MANIFOLD-ISO-{a.id}"

            # Only include assets with notable screening risk
            if screening_risk in ["CRITICAL", "HIGH", "ELEVATED", "LOW"]:
                domino_chain.append(
                    DominoThreatDetail(
                        asset_id=a.id,
                        asset_name=a.name,
                        asset_type=a.type or "Process Unit",
                        sector=a.sector or "Sector A",
                        criticality=crit,
                        distance_to_epicenter_m=dist_m,
                        threat_zone_overlap=overlap,
                        screening_cascade_risk=screening_risk,
                        cascade_mechanism=mechanism,
                        failure_mode_description=fail_desc,
                        recommended_prevention=recom,
                        isolation_valve_id=valve_id,
                        deluge_system_status="ACTIVE" if screening_risk in ["CRITICAL", "HIGH"] else "STANDBY"
                    )
                )

        # Sort domino chain by risk priority then distance
        risk_weights = {"CRITICAL": 4, "HIGH": 3, "ELEVATED": 2, "LOW": 1, "NEGLIGIBLE": 0}
        domino_chain.sort(key=lambda x: (-risk_weights.get(x.screening_cascade_risk, 0), x.distance_to_epicenter_m))

        # Overall Screening Level
        if threatened_critical > 0 or any(d.screening_cascade_risk == "CRITICAL" for d in domino_chain):
            overall_level = "CRITICAL"
        elif threatened_high > 0 or any(d.screening_cascade_risk == "HIGH" for d in domino_chain):
            overall_level = "HIGH"
        elif any(d.screening_cascade_risk == "ELEVATED" for d in domino_chain):
            overall_level = "ELEVATED"
        else:
            overall_level = "LOW"

        # Prioritized actions
        prioritized_actions = [
            f"1. Emergency Isolation: Remote closure of master ESD valves on Sector {simulation_result.get('source_sector', 'A')} pipeline manifold.",
            f"2. Deluge Boundary Protection: Deploy high-capacity water monitors between {source_id} and top threatened unit ({domino_chain[0].asset_name if domino_chain else 'Adjacent Storage'}).",
            "3. Atmospheric Standoff: Enforce 250m upwind exclusion perimeter for all non-essential response personnel.",
            "4. Electrical Safety: Secure Substation switchgear and initiate positive-pressure air locks on plant control buildings."
        ]

        return DominoRiskAnalysisResponse(
            primary_incident_id=simulation_result.get("id", f"INC-{source_id}"),
            source_asset_id=source_id,
            source_chemical_name=chem_name,
            overall_screening_cascade_level=overall_level,
            total_assets_evaluated=len(all_assets),
            threatened_critical_assets_count=threatened_critical,
            threatened_high_assets_count=threatened_high,
            domino_chain=domino_chain,
            prioritized_mitigation_actions=prioritized_actions,
            screening_disclaimer="SCREENING CASCADE RISK — Prototype Decision Support Heuristic (Non-Statutory Evaluation; Requires Certified Engineering Site Validation)"
        )

domino_service = DominoService()
