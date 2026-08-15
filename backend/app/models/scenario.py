from sqlalchemy import Column, String, Float, Integer, Text, DateTime
from datetime import datetime
from app.core.database import Base

class ScenarioPresetModel(Base):
    __tablename__ = "preset_scenarios"

    id = Column(String(50), primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    asset_id = Column(String(50), nullable=False)
    chemical_id = Column(String(50), nullable=False)
    incident_type = Column(String(50), nullable=False)  # PIPELINE_LEAK, TANK_LEAK, TOXIC_RELEASE, FIRE_EXPLOSION
    release_rate_kg_s = Column(Float, nullable=False)
    release_duration_min = Column(Integer, default=30)
    operating_temp_c = Column(Float, default=25.0)
    operating_pressure_bar = Column(Float, default=5.0)
    wind_speed_kmh = Column(Float, default=8.0)
    wind_direction_deg = Column(Float, default=45.0)
    wind_direction_cardinal = Column(String(10), default="NE")
    ambient_temp_c = Column(Float, default=30.0)
    atmospheric_stability = Column(String(5), default="D")
    humidity_pct = Column(Float, default=60.0)
    description = Column(Text, nullable=True)

class IncidentLogModel(Base):
    __tablename__ = "incident_logs"

    id = Column(String(50), primary_key=True, index=True)
    scenario_title = Column(String(200), nullable=False)
    asset_id = Column(String(50), nullable=False)
    chemical_id = Column(String(50), nullable=False)
    incident_type = Column(String(50), nullable=False)
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)
    workers_affected_count = Column(Integer, default=0)
    assets_affected_count = Column(Integer, default=0)
    roads_blocked_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
