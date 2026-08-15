from typing import Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.analytics import HistoricalIncidentModel
from app.schemas.analytics import (
    AnalyticsSummaryResponse, HistoricalIncidentItem, 
    AssetRiskRankingItem, ChemicalBreakdownItem, 
    SeverityDistributionItem, TrendDataPoint
)

class AnalyticsService:
    def seed_historical_incidents_if_empty(self, db: Session):
        """Seed 21 synthetic historical plant incidents across the past 3 years for realistic analytics."""
        existing = db.query(HistoricalIncidentModel).first()
        if existing and existing.id.startswith("HIST-INC-"):
            return

        # If table is empty or has legacy ID schema, re-seed with standardized neutral IDs
        db.query(HistoricalIncidentModel).delete()

        seed_data = [
            # 2023 Incidents
            ("HIST-INC-001", 36, "T-04", "CHEM-NH3", "Ammonia (Anhydrous)", "PIPELINE_LEAK", 14.5, 78.5, "HIGH", 3, 2, 2, 4.2, 11.5, "GASKET_FAILURE", "Cryogenic flange gasket embrittlement during cold startup.", "Upgraded to Spiral Wound Gaskets with Inconel outer ring."),
            ("HIST-INC-002", 34, "T-03", "CHEM-LPG", "Liquefied Petroleum Gas (LPG)", "TANK_LEAK", 22.0, 84.0, "CRITICAL", 2, 3, 3, 3.5, 9.8, "VALVE_SEAL", "Bottom valve packing degradation under cyclic loading.", "Installed double isolation ball valves with thermal relief."),
            ("HIST-INC-003", 32, "T-01", "CHEM-C6H6", "Benzene (Pure Grade)", "TANK_LEAK", 18.0, 71.0, "HIGH", 1, 1, 1, 4.8, 10.2, "CORROSION", "Localized pitting corrosion near bottom weld seam.", "Applied epoxy phenolic tank lining and cathodic protection."),
            ("HIST-INC-004", 30, "T-02", "CHEM-CL2", "Chlorine (Liquefied)", "TOXIC_RELEASE", 8.5, 62.0, "MODERATE", 0, 1, 1, 5.1, 8.4, "HUMAN_ERROR", "Operator misaligned manifold valve during cylinder transfer.", "Implemented interlocked pneumatic valves with dual-key bypass."),
            ("HIST-INC-005", 28, "SUB-01", "CHEM-NH3", "Ammonia (Anhydrous)", "PIPELINE_LEAK", 12.0, 74.0, "HIGH", 2, 2, 2, 4.0, 12.1, "VIBRATION_FATIGUE", "Compressor piping resonance induced fatigue crack.", "Installed tuned mass dampers and flexible bellows."),
            ("HIST-INC-006", 26, "T-04", "CHEM-NH3", "Ammonia (Anhydrous)", "PIPELINE_LEAK", 16.0, 81.0, "CRITICAL", 4, 2, 3, 3.8, 14.0, "OVERPRESSURE", "Blocked discharge valve during pump changeover.", "Added high-integrity pressure protection system (HIPPS)."),
            ("HIST-INC-007", 24, "T-03", "CHEM-LPG", "Liquefied Petroleum Gas (LPG)", "BLEVE", 28.0, 92.0, "CRITICAL", 5, 4, 4, 3.2, 15.2, "THERMAL_FAILURE", "Relief valve stuck shut during heat exchanger tube leak.", "Upgraded dual safety relief valves with staggered setpoints."),
            ("HIST-INC-008", 22, "T-01", "CHEM-C6H6", "Benzene (Pure Grade)", "TANK_LEAK", 15.0, 68.0, "MODERATE", 1, 1, 1, 5.0, 9.5, "SEAL_WEAR", "Floating roof wiper seal mechanical tear.", "Replaced primary wiper with double-wiper vapor containment."),
            
            # 2024 Incidents
            ("HIST-INC-009", 20, "T-04", "CHEM-NH3", "Ammonia (Anhydrous)", "PIPELINE_LEAK", 13.0, 75.0, "HIGH", 2, 2, 2, 4.1, 11.0, "GASKET_FAILURE", "Bolt torque relaxation post-maintenance turnaround.", "Mandated ultrasonic bolt tension verification on cryo joints."),
            ("HIST-INC-010", 18, "T-02", "CHEM-CL2", "Chlorine (Liquefied)", "TOXIC_RELEASE", 10.0, 69.0, "MODERATE", 1, 1, 1, 4.5, 8.9, "CORROSION", "Moisture ingress into dry chlorine delivery line.", "Installed automated dew-point interlock and desiccant dryer."),
            ("HIST-INC-011", 16, "T-03", "CHEM-LPG", "Liquefied Petroleum Gas (LPG)", "TANK_LEAK", 20.0, 80.0, "HIGH", 2, 3, 3, 3.6, 9.4, "VALVE_SEAL", "Debris in valve seat preventing full closure.", "Added upstream 50-mesh strainer and valve seat flushing line."),
            ("HIST-INC-012", 14, "T-04", "CHEM-NH3", "Ammonia (Anhydrous)", "PIPELINE_LEAK", 15.0, 79.0, "HIGH", 3, 2, 2, 3.9, 12.4, "GASKET_FAILURE", "Thermal transient during emergency compressor trip.", "Modified automated ESD ramp-down rate to minimize thermal shock."),
            ("HIST-INC-013", 12, "T-01", "CHEM-C6H6", "Benzene (Pure Grade)", "TANK_LEAK", 19.0, 73.0, "HIGH", 2, 2, 1, 4.6, 10.0, "CORROSION", "Under-deposit corrosion beneath settled water pocket.", "Added automated water draining system with oil-in-water sensor."),
            ("HIST-INC-014", 10, "SUB-01", "CHEM-NH3", "Ammonia (Anhydrous)", "PIPELINE_LEAK", 11.0, 70.0, "MODERATE", 1, 1, 2, 4.3, 11.5, "VIBRATION_FATIGUE", "Loosened pipe clamp bracket on overhead piperack.", "Standardized heavy-duty vibration dampening spring hangers."),
            ("HIST-INC-015", 8, "T-03", "CHEM-LPG", "Liquefied Petroleum Gas (LPG)", "TANK_LEAK", 24.0, 86.0, "CRITICAL", 3, 3, 4, 3.4, 10.8, "OVERPRESSURE", "Overfilling during tanker decanting.", "Implemented independent SIL-3 high-high level alarm trips."),
            ("HIST-INC-016", 6, "T-02", "CHEM-CL2", "Chlorine (Liquefied)", "TOXIC_RELEASE", 7.0, 58.0, "MODERATE", 0, 1, 1, 5.2, 7.8, "HUMAN_ERROR", "Operator bypassed pressure check during filter change.", "Enforced digital permit-to-work QR verification."),

            # 2025 - 2026 Incidents
            ("HIST-INC-017", 5, "T-04", "CHEM-NH3", "Ammonia (Anhydrous)", "PIPELINE_LEAK", 15.5, 82.0, "CRITICAL", 4, 2, 3, 3.7, 13.0, "GASKET_FAILURE", "Freeze-thaw cycling on cryogenic header flange.", "Installed thermal insulation jacket with vapor barrier."),
            ("HIST-INC-018", 4, "T-01", "CHEM-C6H6", "Benzene (Pure Grade)", "TANK_LEAK", 16.0, 67.0, "MODERATE", 1, 1, 1, 4.7, 9.1, "SEAL_WEAR", "Mechanical seal dry running due to low suction head.", "Added seal pot pressure transmitter and low-flow auto trip."),
            ("HIST-INC-019", 3, "T-03", "CHEM-LPG", "Liquefied Petroleum Gas (LPG)", "TANK_LEAK", 21.0, 82.0, "CRITICAL", 2, 3, 3, 3.5, 9.6, "VALVE_SEAL", "Actuator stem packing seal micro-leak.", "Switched to bellows-sealed zero-emission isolation valves."),
            ("HIST-INC-020", 2, "T-04", "CHEM-NH3", "Ammonia (Anhydrous)", "PIPELINE_LEAK", 14.0, 77.0, "HIGH", 2, 2, 2, 4.0, 11.8, "GASKET_FAILURE", "Minor cryogenic header seepage.", "Routine bolt retorquing scheduled."),
            ("HIST-INC-021", 1, "T-02", "CHEM-CL2", "Chlorine (Liquefied)", "TOXIC_RELEASE", 6.5, 55.0, "LOW", 0, 0, 0, 5.5, 7.2, "HUMAN_ERROR", "Sampling valve packing leak during routine analysis.", "Installed automated closed-loop sampling manifold.")
        ]

        now = datetime.utcnow()
        for item in seed_data:
            rec_id, months_ago, asset_id, chem_id, chem_name, inc_type, rate, score, cat, workers, assets, roads, resp, evac, cause, root_cause, lessons = item
            dt = now - timedelta(days=months_ago * 30)
            rec = HistoricalIncidentModel(
                id=rec_id,
                incident_date=dt,
                facility_name="PetroChem Complex Alpha",
                asset_id=asset_id,
                chemical_id=chem_id,
                chemical_name=chem_name,
                incident_type=inc_type,
                release_rate_kg_s=rate,
                severity_score=score,
                severity_category=cat,
                people_affected=workers,
                assets_affected=assets,
                blocked_roads_count=roads,
                response_time_min=resp,
                evacuation_time_min=evac,
                cause_category=cause,
                root_cause_summary=root_cause,
                lessons_learned=lessons,
                data_classification="SYNTHETIC_DEMO_DATA"
            )
            db.add(rec)
        db.commit()

    def get_analytics_summary(self, db: Session) -> AnalyticsSummaryResponse:
        """Compute full statistical rollups and distribution matrices for historical incident analytics."""
        self.seed_historical_incidents_if_empty(db)
        
        incidents = db.query(HistoricalIncidentModel).order_by(HistoricalIncidentModel.incident_date.desc()).all()
        total_count = len(incidents)

        if total_count == 0:
            return AnalyticsSummaryResponse(
                total_historical_incidents=0,
                avg_response_time_min=0.0,
                avg_evacuation_time_min=0.0,
                avg_severity_score=0.0,
                high_critical_incident_count=0,
                top_vulnerable_asset="N/A",
                primary_incident_chemical="N/A",
                trend_over_time=[],
                asset_risk_rankings=[],
                chemical_breakdowns=[],
                severity_distributions=[],
                cause_distribution={},
                recent_incidents=[]
            )

        avg_resp = round(sum(i.response_time_min for i in incidents) / total_count, 1)
        avg_evac = round(sum(i.evacuation_time_min for i in incidents) / total_count, 1)
        avg_sev = round(sum(i.severity_score for i in incidents) / total_count, 1)
        high_crit = sum(1 for i in incidents if i.severity_category in ["HIGH", "CRITICAL"])

        # 1. Asset Failure Frequency & Risk Ranking
        asset_map: Dict[str, List[HistoricalIncidentModel]] = {}
        for i in incidents:
            if i.asset_id not in asset_map:
                asset_map[i.asset_id] = []
            asset_map[i.asset_id].append(i)

        asset_rankings = []
        for asset_id, inc_list in asset_map.items():
            avg_s = round(sum(x.severity_score for x in inc_list) / len(inc_list), 1)
            max_s = max(x.severity_score for x in inc_list)
            # Find dominant chemical
            chem_counts = {}
            for x in inc_list:
                chem_counts[x.chemical_name] = chem_counts.get(x.chemical_name, 0) + 1
            top_chem = max(chem_counts.items(), key=lambda kv: kv[1])[0]

            highest_cat = "LOW"
            if any(x.severity_category == "CRITICAL" for x in inc_list):
                highest_cat = "CRITICAL"
            elif any(x.severity_category == "HIGH" for x in inc_list):
                highest_cat = "HIGH"
            elif any(x.severity_category == "MODERATE" for x in inc_list):
                highest_cat = "MODERATE"

            asset_rankings.append(AssetRiskRankingItem(
                asset_id=asset_id,
                incident_count=len(inc_list),
                avg_severity=avg_s,
                max_severity=max_s,
                primary_chemical=top_chem,
                highest_severity_category=highest_cat
            ))
        asset_rankings.sort(key=lambda x: (x.incident_count, x.avg_severity), reverse=True)
        top_asset = asset_rankings[0].asset_id if asset_rankings else "N/A"

        # 2. Chemical Breakdown
        chem_map: Dict[str, List[HistoricalIncidentModel]] = {}
        for i in incidents:
            if i.chemical_name not in chem_map:
                chem_map[i.chemical_name] = []
            chem_map[i.chemical_name].append(i)

        chem_breakdowns = []
        for chem_name, inc_list in chem_map.items():
            chem_breakdowns.append(ChemicalBreakdownItem(
                chemical_name=chem_name,
                incident_count=len(inc_list),
                percentage_of_total=round((len(inc_list) / total_count) * 100, 1),
                avg_release_rate_kg_s=round(sum(x.release_rate_kg_s for x in inc_list) / len(inc_list), 1)
            ))
        chem_breakdowns.sort(key=lambda x: x.incident_count, reverse=True)
        top_chem_name = chem_breakdowns[0].chemical_name if chem_breakdowns else "N/A"

        # 3. Severity Distribution
        sev_counts = {"CRITICAL": 0, "HIGH": 0, "MODERATE": 0, "LOW": 0}
        for i in incidents:
            if i.severity_category in sev_counts:
                sev_counts[i.severity_category] += 1
            else:
                sev_counts["LOW"] += 1

        sev_distributions = [
            SeverityDistributionItem(
                category=cat,
                count=cnt,
                percentage=round((cnt / total_count) * 100, 1)
            )
            for cat, cnt in sev_counts.items()
        ]

        # 4. Root Cause Category Distribution
        cause_dist: Dict[str, int] = {}
        for i in incidents:
            cause_dist[i.cause_category] = cause_dist.get(i.cause_category, 0) + 1

        # 5. Trend Over Time (grouped by half-year)
        trend_groups: Dict[str, List[HistoricalIncidentModel]] = {}
        for i in incidents:
            period_label = f"{i.incident_date.year} H{'1' if i.incident_date.month <= 6 else '2'}"
            if period_label not in trend_groups:
                trend_groups[period_label] = []
            trend_groups[period_label].append(i)

        sorted_periods = sorted(trend_groups.keys())
        trend_data = []
        for p in sorted_periods:
            group = trend_groups[p]
            trend_data.append(TrendDataPoint(
                period=p,
                incident_count=len(group),
                avg_response_time_min=round(sum(x.response_time_min for x in group) / len(group), 1),
                avg_evacuation_time_min=round(sum(x.evacuation_time_min for x in group) / len(group), 1),
                avg_severity=round(sum(x.severity_score for x in group) / len(group), 1)
            ))

        # Return all historical records so the entire dataset is searchable in the archive
        recent_items = [
            HistoricalIncidentItem(
                id=i.id,
                incident_date=i.incident_date.strftime("%Y-%m-%d"),
                facility_name=i.facility_name,
                asset_id=i.asset_id,
                chemical_id=i.chemical_id,
                chemical_name=i.chemical_name,
                incident_type=i.incident_type,
                release_rate_kg_s=i.release_rate_kg_s,
                severity_score=i.severity_score,
                severity_category=i.severity_category,
                people_affected=i.people_affected,
                assets_affected=i.assets_affected,
                blocked_roads_count=i.blocked_roads_count,
                response_time_min=i.response_time_min,
                evacuation_time_min=i.evacuation_time_min,
                cause_category=i.cause_category,
                root_cause_summary=i.root_cause_summary or "",
                lessons_learned=i.lessons_learned or ""
            )
            for i in incidents
        ]

        return AnalyticsSummaryResponse(
            total_historical_incidents=total_count,
            avg_response_time_min=avg_resp,
            avg_evacuation_time_min=avg_evac,
            avg_severity_score=avg_sev,
            high_critical_incident_count=high_crit,
            top_vulnerable_asset=top_asset,
            primary_incident_chemical=top_chem_name,
            trend_over_time=trend_data,
            asset_risk_rankings=asset_rankings,
            chemical_breakdowns=chem_breakdowns,
            severity_distributions=sev_distributions,
            cause_distribution=cause_dist,
            recent_incidents=recent_items
        )

analytics_service = AnalyticsService()
