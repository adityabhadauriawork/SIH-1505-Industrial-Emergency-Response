from sqlalchemy import Column, String, Float, Integer, Text, DateTime, Boolean
from datetime import datetime
from app.core.database import Base

class DecisionAuditModel(Base):
    __tablename__ = "decision_audit_trail"

    id = Column(String(60), primary_key=True, index=True)
    incident_id = Column(String(80), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    module = Column(String(60), nullable=False, index=True)  # EVACUATION, TACTICAL_RESPONSE, PREPLAN_AUTHORIZATION, HAZARD_SIMULATION, WEATHER_CONTROL, DOMINO_SCREENING
    input_summary = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=False)
    reason = Column(Text, nullable=False)
    human_action = Column(String(60), default="REVIEWED")  # REVIEWED, APPROVED, REJECTED, OVERRIDDEN, DISPATCHED, COMPUTED
    actor_role = Column(String(60), default="HSE_COMMANDER")  # FIELD_RESPONDER, HSE_COMMANDER, PLANT_MANAGER, DISTRICT_AUTHORITY, EXECUTIVE_AUTHORITY, SYSTEM_ENGINE
    actor_name = Column(String(120), default="System Engine / HSE Controller")
    result = Column(Text, nullable=True)
    status = Column(String(40), default="RECORDED")  # RECORDED, EXECUTED, SUPERSEDED
    data_classification = Column(String(50), default="PROTOTYPE_AUDIT_LOG")
    created_at = Column(DateTime, default=datetime.utcnow)
