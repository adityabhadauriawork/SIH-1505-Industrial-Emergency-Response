from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class AssetHealthItem(BaseModel):
    id: str
    asset_id: str
    asset_name: str
    chemical_id: str
    sector: str
    operating_hours: float
    maintenance_age_days: int
    vibration_mm_s: float
    temperature_c: float
    pressure_bar: float
    acoustic_leak_db: float
    anomaly_count_30d: int
    last_inspection_date: str
    failure_risk_score: float
    risk_category: str
    top_risk_driver: str
    recommended_action: str

class AssetHealthSummaryResponse(BaseModel):
    total_monitored_assets: int
    critical_risk_count: int
    high_risk_count: int
    moderate_risk_count: int
    healthy_asset_count: int
    highest_risk_asset_id: str
    assets: List[AssetHealthItem]
    model_metadata: Dict[str, Any]
