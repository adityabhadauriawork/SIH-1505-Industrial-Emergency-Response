from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class HistoricalIncidentItem(BaseModel):
    id: str
    incident_date: str
    facility_name: str
    asset_id: str
    chemical_id: str
    chemical_name: str
    incident_type: str
    release_rate_kg_s: float
    severity_score: float
    severity_category: str
    people_affected: int
    assets_affected: int
    blocked_roads_count: int
    response_time_min: float
    evacuation_time_min: float
    cause_category: str
    root_cause_summary: str
    lessons_learned: str

class AssetRiskRankingItem(BaseModel):
    asset_id: str
    incident_count: int
    avg_severity: float
    max_severity: float
    highest_severity_category: str
    primary_chemical: str

class ChemicalBreakdownItem(BaseModel):
    chemical_id: str
    chemical_name: str
    incident_count: int
    percentage: float
    avg_release_rate_kg_s: float

class SeverityDistributionItem(BaseModel):
    category: str
    count: int
    percentage: float
    color: str

class TrendDataPoint(BaseModel):
    period: str
    incident_count: int
    avg_response_time_min: float
    avg_evacuation_time_min: float
    avg_severity: float

class AnalyticsSummaryResponse(BaseModel):
    total_historical_incidents: int
    avg_response_time_min: float
    avg_evacuation_time_min: float
    avg_severity_score: float
    high_critical_incident_count: int
    top_vulnerable_asset: str
    primary_incident_chemical: str
    trend_over_time: List[TrendDataPoint]
    asset_risk_rankings: List[AssetRiskRankingItem]
    chemical_breakdowns: List[ChemicalBreakdownItem]
    severity_distributions: List[SeverityDistributionItem]
    cause_distribution: Dict[str, int]
    recent_incidents: List[HistoricalIncidentItem]
