from sqlalchemy import Column, String, Float, Integer, DateTime, Text
from datetime import datetime
from app.core.database import Base

class HistoricalIncidentModel(Base):
    __tablename__ = "historical_incidents"

    id = Column(String, primary_key=True, index=True)
    incident_date = Column(DateTime, default=datetime.utcnow, index=True)
    facility_name = Column(String, default="PetroChem Complex Alpha")
    asset_id = Column(String, index=True)
    chemical_id = Column(String, index=True)
    chemical_name = Column(String)
    incident_type = Column(String)
    release_rate_kg_s = Column(Float)
    severity_score = Column(Float)
    severity_category = Column(String)
    people_affected = Column(Integer)
    assets_affected = Column(Integer)
    blocked_roads_count = Column(Integer, default=0)
    response_time_min = Column(Float)
    evacuation_time_min = Column(Float)
    cause_category = Column(String)  # e.g., CORROSION, GASKET_FAILURE, VALVE_SEAL, HUMAN_ERROR, OVERPRESSURE
    root_cause_summary = Column(Text)
    lessons_learned = Column(Text)
    data_classification = Column(String, default="SYNTHETIC_DEMO_DATA")
