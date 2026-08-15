from pydantic import BaseModel
from typing import Optional, Dict, Any

class PrePlanGenerateRequest(BaseModel):
    scenario_id: Optional[str] = None
    custom_scenario: Optional[Dict[str, Any]] = None
    author_name: Optional[str] = "HSE Incident Commander"
    plant_license_no: Optional[str] = "PESO/IND/2024/MAH-1505"

class PrePlanSummaryResponse(BaseModel):
    plan_id: str
    incident_title: str
    generated_at: str
    pdf_download_url: str
    risk_level: str
    affected_workers_count: int
    primary_assembly_point: str
    recommended_gate: str
