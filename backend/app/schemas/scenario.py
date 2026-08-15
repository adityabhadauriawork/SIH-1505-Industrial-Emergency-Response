from pydantic import BaseModel, Field
from typing import Optional, List

class ScenarioCreateRequest(BaseModel):
    title: Optional[str] = "Custom Incident Scenario"
    asset_id: str = Field(..., description="Source asset ID e.g. T-04")
    chemical_id: str = Field(..., description="Chemical ID e.g. CHEM-NH3")
    incident_type: str = Field("PIPELINE_LEAK", description="PIPELINE_LEAK, TANK_LEAK, TOXIC_RELEASE, FIRE_EXPLOSION")
    release_rate_kg_s: float = Field(15.0, ge=0.1, le=1000.0, description="Release rate in kg/s")
    release_duration_min: int = Field(30, ge=1, le=240, description="Release duration in minutes")
    operating_temp_c: float = Field(25.0, description="Operating/source temperature in C")
    operating_pressure_bar: float = Field(5.0, description="Operating pressure in bar")
    wind_speed_kmh: float = Field(8.0, ge=0.5, le=120.0, description="Wind speed in km/h")
    wind_direction_deg: float = Field(45.0, ge=0.0, le=360.0, description="Wind direction in degrees (0=N, 90=E, 180=S, 270=W)")
    ambient_temp_c: float = Field(32.0, description="Ambient air temperature in C")
    atmospheric_stability: str = Field("D", description="Pasquill stability class A-F")
    humidity_pct: float = Field(65.0, ge=0.0, le=100.0, description="Relative humidity %")
    weather_mode: Optional[str] = Field("LIVE", description="LIVE or DEMO")
    weather_source: Optional[str] = Field("Open-Meteo", description="Open-Meteo or Scenario Override")
    custom_coords: Optional[List[float]] = None

class ScenarioPresetResponse(BaseModel):
    id: str
    title: str
    asset_id: str
    chemical_id: str
    incident_type: str
    release_rate_kg_s: float
    release_duration_min: int
    operating_temp_c: float
    operating_pressure_bar: float
    wind_speed_kmh: float
    wind_direction_deg: float
    wind_direction_cardinal: str
    ambient_temp_c: float
    atmospheric_stability: str
    humidity_pct: float
    description: Optional[str] = None
