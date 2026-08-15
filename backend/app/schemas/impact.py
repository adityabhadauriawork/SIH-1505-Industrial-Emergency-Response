from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class AffectedWorkerDetail(BaseModel):
    id: str
    name: str
    role: str
    sector: str
    coordinates: List[float]
    exposure_zone: str  # RED_ZONE_LETHAL, ORANGE_ZONE_INJURY, YELLOW_ZONE_CAUTION
    exposure_severity: str  # Critical/Lethal, Severe, Moderate
    contact: Optional[str] = None
    action_required: str

class AffectedAssetDetail(BaseModel):
    id: str
    name: str
    type: str
    sector: str
    criticality: str
    exposure_zone: str
    domino_hazard: str
    mitigation_action: str

class BlockedRoadDetail(BaseModel):
    id: str
    name: str
    reason: str
    impacted_zone: str

class AssemblyPointStatus(BaseModel):
    id: str
    name: str
    status: str  # SAFE, COMPROMISED
    coordinates: List[float]
    capacity: int
    current_occupancy: int
    distance_to_hazard_m: float
    recommendation: str

class RiskFactor(BaseModel):
    name: str
    score: float
    max_score: float
    description: str

class RiskScoreBreakdown(BaseModel):
    overall_score: float  # 0 to 100
    risk_category: str   # LOW, MODERATE, HIGH, CRITICAL
    color: str
    factors: List[RiskFactor]
    summary_verdict: str

class ImpactAnalysisResult(BaseModel):
    total_workers_at_site: int
    affected_workers_count: int
    red_zone_workers_count: int
    orange_zone_workers_count: int
    yellow_zone_workers_count: int
    affected_workers: List[AffectedWorkerDetail]
    
    total_assets_at_site: int
    affected_assets_count: int
    affected_assets: List[AffectedAssetDetail]
    
    total_roads_count: int
    blocked_roads_count: int
    blocked_roads: List[BlockedRoadDetail]
    
    assembly_points: List[AssemblyPointStatus]
    safe_assembly_points_count: int
    compromised_assembly_points_count: int
    
    risk_assessment: RiskScoreBreakdown
