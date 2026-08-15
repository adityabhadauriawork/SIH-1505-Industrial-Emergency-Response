from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from app.schemas.hazard import HazardSimulationResult
from app.schemas.scenario import ScenarioCreateRequest
from app.schemas.impact import ImpactAnalysisResult
from app.schemas.evacuation import EvacuationPlanResponse
from app.schemas.resource import ResourceOptimizationPlan

class WhatIfScenarioInput(BaseModel):
    label: str = "Scenario A"
    asset_id: str = "T-04"
    chemical_id: str = "CHEM-NH3"
    incident_type: str = "PIPELINE_LEAK"
    release_rate_kg_s: float = 15.0
    release_duration_min: int = 30
    wind_speed_kmh: float = 8.0
    wind_direction_deg: float = 45.0
    ambient_temp_c: float = 32.0
    atmospheric_stability: str = "D"
    humidity_pct: float = 65.0
    weather_mode: str = "DEMO"
    weather_source: str = "What-If Modeler"

class WhatIfMetrics(BaseModel):
    label: str
    risk_score: float
    risk_category: str
    red_reach_m: float
    orange_reach_m: float
    yellow_reach_m: float
    total_threat_area_sq_m: float
    exposed_workers: int
    vulnerable_assets: int
    blocked_roads: int
    muster_point: str
    exit_gate: str
    evacuation_dist_m: float
    evacuation_time_min: float
    firewater_lpm: float
    foam_liters: float
    lead_resource: str
    lead_eta_min: float

class WhatIfDeltas(BaseModel):
    risk_score_delta: float
    red_reach_delta_m: float
    red_reach_delta_pct: float
    threat_area_delta_sq_m: float
    threat_area_delta_pct: float
    exposed_workers_delta: int
    vulnerable_assets_delta: int
    blocked_roads_delta: int
    evacuation_dist_delta_m: float
    evacuation_time_delta_min: float
    firewater_delta_lpm: float
    higher_risk_scenario: str
    comparative_summary: str

class WhatIfComparisonResponse(BaseModel):
    scenario_a: WhatIfMetrics
    scenario_b: WhatIfMetrics
    deltas: WhatIfDeltas
    scenario_a_simulation: HazardSimulationResult
    scenario_b_simulation: HazardSimulationResult
    scenario_a_evacuation: EvacuationPlanResponse
    scenario_b_evacuation: EvacuationPlanResponse
    scenario_a_resources: ResourceOptimizationPlan
    scenario_b_resources: ResourceOptimizationPlan

class WhatIfComparisonRequest(BaseModel):
    scenario_a: WhatIfScenarioInput
    scenario_b: WhatIfScenarioInput
