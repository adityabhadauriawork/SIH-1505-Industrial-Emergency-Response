from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ThreatZoneMetric(BaseModel):
    zone_type: str  # RED_ZONE_LETHAL, ORANGE_ZONE_INJURY, YELLOW_ZONE_CAUTION
    name: str
    threshold_label: str
    concentration_threshold_ppm: Optional[float] = None
    flammability_pct_lfl: Optional[float] = None
    thermal_radiation_kw_m2: Optional[float] = None
    overpressure_psi: Optional[float] = None
    max_downwind_distance_m: float
    max_crosswind_width_m: float
    area_sq_m: float
    color: str
    opacity: float

class ThreatZoneFeature(BaseModel):
    type: str = "Feature"
    properties: Dict[str, Any]
    geometry: Dict[str, Any]

class TimeSliceHazard(BaseModel):
    time_step_sec: int
    time_label: str  # e.g., "T+0s", "T+30s", "T+60s", "T+120s"
    plume_front_distance_m: float
    geojson: Dict[str, Any]
    active_threat_zones: List[ThreatZoneMetric]

class HazardSimulationResult(BaseModel):
    scenario_id: Optional[str] = None
    incident_type: str
    chemical_id: str
    chemical_name: str
    source_asset_id: str
    source_coordinates: List[float]
    wind_speed_kmh: float
    wind_direction_deg: float
    wind_direction_cardinal: str
    atmospheric_stability: str
    ambient_temp_c: float = 32.0
    weather_mode: Optional[str] = "LIVE"
    weather_source: Optional[str] = "Open-Meteo"
    effective_release_rate_kg_s: float
    time_steps: List[TimeSliceHazard]
    current_time_step_sec: int
    current_geojson: Dict[str, Any]
    summary_zones: List[ThreatZoneMetric]
    model_metadata: Dict[str, Any]
