import math
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session

from app.schemas.whatif import (
    WhatIfScenarioInput, WhatIfMetrics, WhatIfDeltas, 
    WhatIfComparisonResponse, WhatIfComparisonRequest
)
from app.schemas.scenario import ScenarioCreateRequest
from app.schemas.hazard import HazardSimulationResult
from app.schemas.impact import ImpactAnalysisResult
from app.schemas.evacuation import EvacuationPlanResponse
from app.schemas.resource import ResourceOptimizationPlan

from app.models.plant import AssetModel
from app.models.chemical import ChemicalModel

from app.services.hazard.hazard_service import hazard_service
from app.services.impact.impact_service import impact_service
from app.services.evacuation.evacuation_service import evacuation_service
from app.services.resources.resource_service import resource_service

class WhatIfService:
    def _execute_single_scenario(
        self,
        db: Session,
        inp: WhatIfScenarioInput
    ) -> Tuple[HazardSimulationResult, ImpactAnalysisResult, EvacuationPlanResponse, ResourceOptimizationPlan, WhatIfMetrics]:
        """Execute authoritative simulation, impact, evacuation, and tactical pipelines for a scenario."""
        sim_req = ScenarioCreateRequest(
            title=f"What-If {inp.label} ({inp.asset_id})",
            asset_id=inp.asset_id,
            chemical_id=inp.chemical_id,
            incident_type=inp.incident_type,
            release_rate_kg_s=inp.release_rate_kg_s,
            release_duration_min=inp.release_duration_min,
            wind_speed_kmh=inp.wind_speed_kmh,
            wind_direction_deg=inp.wind_direction_deg,
            ambient_temp_c=inp.ambient_temp_c,
            atmospheric_stability=inp.atmospheric_stability,
            humidity_pct=inp.humidity_pct,
            weather_mode=inp.weather_mode,
            weather_source=inp.weather_source
        )

        asset = db.query(AssetModel).filter(AssetModel.id == inp.asset_id).first()
        coords = [asset.lat, asset.lon] if asset else [21.6850, 72.5750]

        chemical = db.query(ChemicalModel).filter(ChemicalModel.id == inp.chemical_id).first()
        chemical_dict = {
            "id": chemical.id,
            "name": chemical.name,
            "molecular_weight": chemical.molecular_weight,
            "erpg_1_ppm": chemical.erpg_1_ppm,
            "erpg_2_ppm": chemical.erpg_2_ppm,
            "erpg_3_ppm": chemical.erpg_3_ppm,
            "idlh_ppm": chemical.idlh_ppm,
            "lfl_percent": chemical.lfl_percent,
            "ufl_percent": chemical.ufl_percent,
            "vapor_density_rel_air": chemical.vapor_density_rel_air
        } if chemical else {
            "id": "CHEM-NH3", "name": "Ammonia", "molecular_weight": 17.03,
            "erpg_1_ppm": 25.0, "erpg_2_ppm": 150.0, "erpg_3_ppm": 750.0, "idlh_ppm": 300.0,
            "lfl_percent": 15.0, "ufl_percent": 28.0, "vapor_density_rel_air": 0.59
        }

        scenario_dict = sim_req.model_dump()
        sim_res = hazard_service.simulate_scenario(scenario_dict, chemical_dict, coords)
        imp_res = impact_service.evaluate_impact(db, sim_res, time_step_sec=120)
        evac_res = evacuation_service.generate_evacuation_plan(
            db, 
            sim_res, 
            imp_res, 
            origin_coords=sim_res.source_coordinates, 
            origin_name=f"{sim_res.source_asset_id} Vicinity"
        )
        res_res = resource_service.optimize_resources(db, sim_res, imp_res, evac_res)

        # Extract structured comparison metrics
        red_reach = sim_res.summary_zones[0].max_downwind_distance_m if len(sim_res.summary_zones) > 0 else 0.0
        orange_reach = sim_res.summary_zones[1].max_downwind_distance_m if len(sim_res.summary_zones) > 1 else 0.0
        yellow_reach = sim_res.summary_zones[2].max_downwind_distance_m if len(sim_res.summary_zones) > 2 else 0.0
        tot_area = sum(z.area_sq_m for z in sim_res.summary_zones)

        prim = evac_res.primary_evacuation_route
        fw = res_res.foam_water_requirements
        lead_r = res_res.recommended_resources[0] if res_res.recommended_resources else None

        metrics = WhatIfMetrics(
            label=inp.label,
            risk_score=imp_res.risk_assessment.overall_score,
            risk_category=imp_res.risk_assessment.risk_category,
            red_reach_m=red_reach,
            orange_reach_m=orange_reach,
            yellow_reach_m=yellow_reach,
            total_threat_area_sq_m=tot_area,
            exposed_workers=imp_res.affected_workers_count,
            vulnerable_assets=imp_res.affected_assets_count,
            blocked_roads=imp_res.blocked_roads_count,
            muster_point=prim.recommended_assembly_point_name,
            exit_gate=prim.recommended_gate_name,
            evacuation_dist_m=prim.total_distance_m,
            evacuation_time_min=prim.estimated_evac_time_min,
            firewater_lpm=fw.get("firewater_demand_lpm", 5000.0),
            foam_liters=fw.get("foam_concentrate_demand_liters", 0.0),
            lead_resource=lead_r.resource_name if lead_r else "None",
            lead_eta_min=lead_r.estimated_arrival_min if lead_r else 0.0
        )

        return sim_res, imp_res, evac_res, res_res, metrics

    def compare_scenarios(
        self,
        db: Session,
        req: WhatIfComparisonRequest
    ) -> WhatIfComparisonResponse:
        """Run authoritative simulations for both Scenario A and Scenario B and compute exact mathematical deltas."""
        sim_a, imp_a, evac_a, res_a, met_a = self._execute_single_scenario(db, req.scenario_a)
        sim_b, imp_b, evac_b, res_b, met_b = self._execute_single_scenario(db, req.scenario_b)

        # Compute Deltas (B - A)
        risk_delta = round(met_b.risk_score - met_a.risk_score, 1)
        red_delta_m = round(met_b.red_reach_m - met_a.red_reach_m, 1)
        red_delta_pct = round(((met_b.red_reach_m - met_a.red_reach_m) / max(1.0, met_a.red_reach_m)) * 100.0, 1)
        area_delta_sq_m = round(met_b.total_threat_area_sq_m - met_a.total_threat_area_sq_m, 1)
        area_delta_pct = round(((met_b.total_threat_area_sq_m - met_a.total_threat_area_sq_m) / max(1.0, met_a.total_threat_area_sq_m)) * 100.0, 1)
        workers_delta = met_b.exposed_workers - met_a.exposed_workers
        assets_delta = met_b.vulnerable_assets - met_a.vulnerable_assets
        roads_delta = met_b.blocked_roads - met_a.blocked_roads
        evac_dist_delta = round(met_b.evacuation_dist_m - met_a.evacuation_dist_m, 1)
        evac_time_delta = round(met_b.evacuation_time_min - met_a.evacuation_time_min, 1)
        fw_delta = round(met_b.firewater_lpm - met_a.firewater_lpm, 1)

        # Higher risk verdict
        if met_b.risk_score > met_a.risk_score:
            higher_risk = req.scenario_b.label
            summary = (
                f"{req.scenario_b.label} demonstrates {abs(risk_delta)} higher risk score, expanding lethal threat envelope by "
                f"{abs(red_delta_m)}m (+{abs(red_delta_pct)}%) and increasing firewater demand by {abs(fw_delta):,.0f} LPM."
            )
        elif met_a.risk_score > met_b.risk_score:
            higher_risk = req.scenario_a.label
            summary = (
                f"{req.scenario_a.label} demonstrates {abs(risk_delta)} higher risk score, with {abs(red_delta_m)}m greater red-zone reach than {req.scenario_b.label}."
            )
        else:
            higher_risk = "EQUAL SEVERITY"
            summary = f"Both scenarios produce equivalent composite risk indices ({met_a.risk_score}/100)."

        deltas = WhatIfDeltas(
            risk_score_delta=risk_delta,
            red_reach_delta_m=red_delta_m,
            red_reach_delta_pct=red_delta_pct,
            threat_area_delta_sq_m=area_delta_sq_m,
            threat_area_delta_pct=area_delta_pct,
            exposed_workers_delta=workers_delta,
            vulnerable_assets_delta=assets_delta,
            blocked_roads_delta=roads_delta,
            evacuation_dist_delta_m=evac_dist_delta,
            evacuation_time_delta_min=evac_time_delta,
            firewater_delta_lpm=fw_delta,
            higher_risk_scenario=higher_risk,
            comparative_summary=summary
        )

        return WhatIfComparisonResponse(
            scenario_a=met_a,
            scenario_b=met_b,
            deltas=deltas,
            scenario_a_simulation=sim_a,
            scenario_b_simulation=sim_b,
            scenario_a_evacuation=evac_a,
            scenario_b_evacuation=evac_b,
            scenario_a_resources=res_a,
            scenario_b_resources=res_b
        )

whatif_service = WhatIfService()
