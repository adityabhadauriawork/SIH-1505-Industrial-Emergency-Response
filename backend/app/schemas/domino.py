from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class DominoThreatDetail(BaseModel):
    asset_id: str
    asset_name: str
    asset_type: str
    sector: str
    criticality: str
    distance_to_epicenter_m: float
    threat_zone_overlap: str  # RED_ZONE_LETHAL, ORANGE_ZONE_INJURY, YELLOW_ZONE_CAUTION, STANDOFF
    screening_cascade_risk: str  # CRITICAL, HIGH, ELEVATED, LOW, NEGLIGIBLE
    cascade_mechanism: str
    failure_mode_description: str
    recommended_prevention: str
    isolation_valve_id: Optional[str] = None
    deluge_system_status: str = "AVAILABLE"

class DominoRiskAnalysisResponse(BaseModel):
    primary_incident_id: str
    source_asset_id: str
    source_chemical_name: str
    overall_screening_cascade_level: str  # CRITICAL, HIGH, ELEVATED, LOW, NEGLIGIBLE
    total_assets_evaluated: int
    threatened_critical_assets_count: int
    threatened_high_assets_count: int
    domino_chain: List[DominoThreatDetail]
    prioritized_mitigation_actions: List[str]
    screening_disclaimer: str = "SCREENING CASCADE RISK — Prototype Decision Support Heuristic (Non-Statutory Evaluation; Requires Certified Engineering Site Validation)"

class DominoRiskAnalysisRequest(BaseModel):
    simulation_result: Dict[str, Any]
    impact_result: Optional[Dict[str, Any]] = None
