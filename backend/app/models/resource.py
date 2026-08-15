from sqlalchemy import Column, String, Float, Integer
from app.core.database import Base

class EmergencyResourceModel(Base):
    __tablename__ = "emergency_resources"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    type = Column(String(50), nullable=False)  # FIRE_TENDER, WATER_BOWSER, HAZMAT_SQUAD, AMBULANCE, ERT_TEAM
    stationed_at = Column(String(50), nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    status = Column(String(30), default="AVAILABLE")  # AVAILABLE, DISPATCHED, ON_SCENE, MAINTENANCE
    capacity_details = Column(String(250), nullable=True)
    crew_count = Column(Integer, default=4)
