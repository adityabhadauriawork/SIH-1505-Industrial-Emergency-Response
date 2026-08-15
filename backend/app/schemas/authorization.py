from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class ChecklistSubmission(BaseModel):
    reviewed_hazard: bool = False
    reviewed_evacuation: bool = False
    reviewed_tactical_resources: bool = False
    reviewed_limitations: bool = False
    acknowledged_prototype_status: bool = False

    def is_complete(self) -> bool:
        return (
            self.reviewed_hazard and
            self.reviewed_evacuation and
            self.reviewed_tactical_resources and
            self.reviewed_limitations and
            self.acknowledged_prototype_status
        )

class AuthorizationRequest(BaseModel):
    incident_id: str
    asset_id: str
    chemical_id: str
    chemical_name: str
    document_version: str = "v0.1"
    approver_name: str
    approver_role: str
    checklist: ChecklistSubmission
    notes: Optional[str] = None
    scenario_hash: Optional[str] = None

class RejectionRequest(BaseModel):
    incident_id: str
    reviewer_name: str
    rejection_reason: str
    document_version: str = "v0.1"

class AuthorizationRecordResponse(BaseModel):
    authorization_id: str
    incident_id: str
    asset_id: str
    chemical_id: str
    chemical_name: str
    document_version: str
    status: str  # DRAFT, PENDING_HUMAN_AUTHORIZATION, AUTHORIZED, REJECTED, SUPERSEDED
    approver_name: Optional[str] = None
    approver_role: Optional[str] = None
    checklist_completed: bool = False
    approval_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    approval_timestamp: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
