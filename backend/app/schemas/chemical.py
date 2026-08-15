from pydantic import BaseModel
from typing import Optional

class ChemicalBase(BaseModel):
    id: str
    name: str
    formula: Optional[str] = None
    cas_number: Optional[str] = None
    molecular_weight: float
    boiling_point_c: Optional[float] = None
    flash_point_c: Optional[float] = None
    lfl_percent: Optional[float] = None
    ufl_percent: Optional[float] = None
    vapor_density_rel_air: Optional[float] = None
    liquid_density_kg_m3: Optional[float] = None
    hazard_category: str
    erpg_1_ppm: Optional[float] = None
    erpg_2_ppm: Optional[float] = None
    erpg_3_ppm: Optional[float] = None
    idlh_ppm: Optional[float] = None
    color_code: Optional[str] = "#ef4444"
    description: Optional[str] = None
    tactical_guidance: Optional[str] = None

class ChemicalResponse(ChemicalBase):
    class Config:
        from_attributes = True
