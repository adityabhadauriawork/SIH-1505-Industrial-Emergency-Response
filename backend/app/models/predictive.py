from sqlalchemy import Column, String, Float, Integer, DateTime
from datetime import datetime
from app.core.database import Base

class AssetHealthModel(Base):
    __tablename__ = "asset_health_observations"

    id = Column(String, primary_key=True, index=True)
    asset_id = Column(String, index=True, unique=True)
    asset_name = Column(String)
    chemical_id = Column(String)
    sector = Column(String)
    operating_hours = Column(Float)
    maintenance_age_days = Column(Integer)
    vibration_mm_s = Column(Float)
    temperature_c = Column(Float)
    pressure_bar = Column(Float)
    acoustic_leak_db = Column(Float)
    anomaly_count_30d = Column(Integer, default=0)
    last_inspection_date = Column(DateTime, default=datetime.utcnow)
    failure_risk_score = Column(Float)
    risk_category = Column(String)
    top_risk_driver = Column(String)
    recommended_action = Column(String)
    updated_at = Column(DateTime, default=datetime.utcnow)
