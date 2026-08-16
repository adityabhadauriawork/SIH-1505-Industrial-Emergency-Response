from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class DecisionAuditEntry(BaseModel):
    id: str
    incident_id: str
    timestamp: datetime
    module: str
    input_summary: str
    recommendation: str
    reason: str
    human_action: str
    actor_role: str
    actor_name: str
    result: Optional[str] = None
    status: str = "RECORDED"
    data_classification: str = "PROTOTYPE_AUDIT_LOG"

class DecisionAuditCreateRequest(BaseModel):
    incident_id: str
    module: str
    input_summary: str
    recommendation: str
    reason: str
    human_action: str = "REVIEWED"
    actor_role: str = "HSE_COMMANDER"
    actor_name: str = "Demo HSE Controller"
    result: Optional[str] = None

class DecisionAuditListResponse(BaseModel):
    total_records: int
    incident_id: Optional[str] = None
    records: List[DecisionAuditEntry]
    prototype_notice: str = "PROTOTYPE AUDIT TRAIL — Non-Tamper-Evident Demo Log"
