from sqlalchemy import Column, String, Float, Integer, Text, DateTime, Boolean
from datetime import datetime
from app.core.database import Base

class AuthorizationRecordModel(Base):
    __tablename__ = "authorization_records"

    id = Column(String(60), primary_key=True, index=True)
    incident_id = Column(String(80), nullable=False, index=True)
    asset_id = Column(String(50), nullable=False)
    chemical_id = Column(String(50), nullable=False)
    chemical_name = Column(String(100), nullable=False)
    document_version = Column(String(20), default="v0.1")
    status = Column(String(40), default="PENDING_HUMAN_AUTHORIZATION")  # DRAFT, PENDING_HUMAN_AUTHORIZATION, AUTHORIZED, REJECTED, SUPERSEDED
    approver_name = Column(String(150), nullable=True)
    approver_role = Column(String(100), nullable=True)
    checklist_completed = Column(Boolean, default=False)
    approval_notes = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    scenario_hash = Column(String(64), nullable=True)
    approval_timestamp = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
