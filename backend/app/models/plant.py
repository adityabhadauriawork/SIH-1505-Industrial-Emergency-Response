from sqlalchemy import Column, String, Float, Integer, Boolean, Text, JSON
from app.core.database import Base

class PlantModel(Base):
    __tablename__ = "plants"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    industry_type = Column(String(100), nullable=False)
    location = Column(String(200), nullable=False)
    center_lat = Column(Float, nullable=False)
    center_lon = Column(Float, nullable=False)
    bounds_json = Column(JSON, nullable=False)
    risk_level = Column(String(50), default="High")
    erdmp_license = Column(String(100), nullable=True)

class AssetModel(Base):
    __tablename__ = "assets"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    type = Column(String(50), nullable=False)  # STORAGE_TANK, PROCESS_UNIT, CONTROL_ROOM, etc.
    sector = Column(String(100), nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    chemical_id = Column(String(50), nullable=True)
    capacity_m3 = Column(Float, nullable=True)
    current_fill_pct = Column(Float, nullable=True)
    operating_pressure_bar = Column(Float, nullable=True)
    operating_temp_c = Column(Float, nullable=True)
    criticality = Column(String(20), default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(30), default="OPERATIONAL")  # OPERATIONAL, MAINTENANCE, TRIPPED, ISOLATED
    fire_protection = Column(Text, nullable=True)

class PipelineModel(Base):
    __tablename__ = "pipelines"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    chemical_id = Column(String(50), nullable=True)
    operating_pressure_bar = Column(Float, nullable=True)
    diameter_mm = Column(Float, nullable=True)
    coordinates_json = Column(JSON, nullable=False)
    status = Column(String(30), default="OPERATIONAL")

class AssemblyPointModel(Base):
    __tablename__ = "assembly_points"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    capacity = Column(Integer, default=100)
    current_occupancy = Column(Integer, default=0)
    status = Column(String(30), default="SAFE")  # SAFE, COMPROMISED, OVER_CAPACITY
    equipment = Column(Text, nullable=True)

class GateModel(Base):
    __tablename__ = "gates"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    status = Column(String(30), default="OPEN")  # OPEN, CLOSED, RESTRICTED
    type = Column(String(50), default="PRIMARY_GATE")

class RoadModel(Base):
    __tablename__ = "roads"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    from_node = Column(String(50), nullable=False)
    to_node = Column(String(50), nullable=False)
    coordinates_json = Column(JSON, nullable=False)
    width_m = Column(Float, default=8.0)
    surface = Column(String(50), default="Asphalt")
    accessibility = Column(Boolean, default=True)
    status = Column(String(30), default="OPEN")  # OPEN, BLOCKED, RESTRICTED

class WorkerModel(Base):
    __tablename__ = "workers"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    role = Column(String(100), nullable=False)
    sector = Column(String(100), nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    active = Column(Boolean, default=True)
    contact = Column(String(50), nullable=True)

class HydrantModel(Base):
    __tablename__ = "hydrants"

    id = Column(String(50), primary_key=True, index=True)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    flow_lpm = Column(Float, default=2000.0)
    pressure_bar = Column(Float, default=7.0)
    status = Column(String(30), default="OPERATIONAL")
