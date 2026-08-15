from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class RouteStep(BaseModel):
    step_number: int
    instruction: str
    road_name: str
    distance_m: float
    coordinates: List[List[float]]

class RouteScoreBreakdown(BaseModel):
    safety_score: float  # 0.0 to 1.0
    distance_score: float  # 0.0 to 1.0
    exposure_penalty: float  # 0.0 to 1.0
    composite_score: float  # 0.0 to 1.0
    selection_reason: str

class CandidateRouteSummary(BaseModel):
    candidate_id: str
    target_assembly_point_id: str
    target_assembly_point_name: str
    target_gate_id: str
    target_gate_name: str
    total_distance_m: float
    estimated_evac_time_min: float
    route_status: str  # SELECTED, VIABLE_BACKUP, REJECTED, IMPASSABLE
    safety_score: float
    distance_score: float
    exposure_penalty: float
    composite_score: float
    is_upwind: bool
    angular_clearance_deg: float
    rejection_reason: Optional[str] = None

class EvacuationRouteResult(BaseModel):
    origin_name: str
    origin_coords: List[float]
    recommended_assembly_point_id: str
    recommended_assembly_point_name: str
    assembly_point_coords: List[float]
    recommended_gate_id: str
    recommended_gate_name: str
    gate_coords: List[float]
    total_distance_m: float
    estimated_evac_time_min: float
    route_status: str  # CLEAR, CAUTION, DIVERTED
    route_coordinates: List[List[float]]
    route_geojson: Dict[str, Any]
    steps: List[RouteStep]
    avoided_blocked_roads: List[str]
    caution_notes: List[str]
    score_breakdown: Optional[RouteScoreBreakdown] = None
    candidate_routes: Optional[List[CandidateRouteSummary]] = None
    rejected_alternatives: Optional[List[CandidateRouteSummary]] = None

class EvacuationPlanResponse(BaseModel):
    primary_evacuation_route: EvacuationRouteResult
    secondary_evacuation_route: Optional[EvacuationRouteResult] = None
    candidate_routes: List[CandidateRouteSummary] = []
    rejected_alternatives: List[CandidateRouteSummary] = []
    all_worker_evacuation_summary: Dict[str, Any]
