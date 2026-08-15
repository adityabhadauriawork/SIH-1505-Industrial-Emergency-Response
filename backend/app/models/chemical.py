from sqlalchemy import Column, String, Float, Text
from app.core.database import Base

class ChemicalModel(Base):
    __tablename__ = "chemicals"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    formula = Column(String(50), nullable=True)
    cas_number = Column(String(50), nullable=True)
    molecular_weight = Column(Float, nullable=False)
    boiling_point_c = Column(Float, nullable=True)
    flash_point_c = Column(Float, nullable=True)
    lfl_percent = Column(Float, nullable=True)
    ufl_percent = Column(Float, nullable=True)
    vapor_density_rel_air = Column(Float, nullable=True)
    liquid_density_kg_m3 = Column(Float, nullable=True)
    hazard_category = Column(String(150), nullable=False)
    erpg_1_ppm = Column(Float, nullable=True)
    erpg_2_ppm = Column(Float, nullable=True)
    erpg_3_ppm = Column(Float, nullable=True)
    idlh_ppm = Column(Float, nullable=True)
    color_code = Column(String(20), default="#ef4444")
    description = Column(Text, nullable=True)
    tactical_guidance = Column(Text, nullable=True)
