from pydantic import BaseModel
from typing import List, Optional, Any

class PlantInfo(BaseModel):
    id: str
    name: str
    industry_type: str
    location: str
    center: List[float]
    bounds: List[List[float]]
    risk_level: str
    erdmp_license: Optional[str] = None

class AssetSchema(BaseModel):
    id: str
    name: str
    type: str
    sector: str
    coordinates: List[float]
    chemical_id: Optional[str] = None
    capacity_m3: Optional[float] = None
    current_fill_pct: Optional[float] = None
    operating_pressure_bar: Optional[float] = None
    operating_temp_c: Optional[float] = None
    criticality: str
    status: str
    fire_protection: Optional[str] = None

class PipelineSchema(BaseModel):
    id: str
    name: str
    chemical_id: Optional[str] = None
    operating_pressure_bar: Optional[float] = None
    diameter_mm: Optional[float] = None
    coordinates: List[List[float]]
    status: str

class AssemblyPointSchema(BaseModel):
    id: str
    name: str
    coordinates: List[float]
    capacity: int
    current_occupancy: int
    status: str
    equipment: Optional[str] = None

class GateSchema(BaseModel):
    id: str
    name: str
    coordinates: List[float]
    status: str
    type: str

class RoadSchema(BaseModel):
    id: str
    name: str
    from_node: str
    to_node: str
    coordinates: List[List[float]]
    width_m: float
    surface: str
    accessibility: bool
    status: str

class WorkerSchema(BaseModel):
    id: str
    name: str
    role: str
    sector: str
    coordinates: List[float]
    active: bool
    contact: Optional[str] = None

class HydrantSchema(BaseModel):
    id: str
    coordinates: List[float]
    flow_lpm: float
    pressure_bar: float
    status: str

class EmergencyResourceSchema(BaseModel):
    id: str
    name: str
    type: str
    stationed_at: str
    coordinates: List[float]
    status: str
    capacity_details: Optional[str] = None
    crew_count: int

class SiteDataResponse(BaseModel):
    plant: PlantInfo
    assets: List[AssetSchema]
    pipelines: List[PipelineSchema]
    assembly_points: List[AssemblyPointSchema]
    gates: List[GateSchema]
    roads: List[RoadSchema]
    workers: List[WorkerSchema]
    hydrants: List[HydrantSchema]
    emergency_resources: List[EmergencyResourceSchema]

class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    id: Optional[str] = None
    geometry: dict
    properties: dict

class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]
