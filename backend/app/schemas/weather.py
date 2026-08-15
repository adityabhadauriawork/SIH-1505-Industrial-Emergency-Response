from pydantic import BaseModel
from typing import Optional

class CurrentWeatherResponse(BaseModel):
    temperature_c: float
    wind_speed_kmh: float
    wind_speed_m_s: float
    wind_direction_deg: float
    wind_direction_cardinal: str
    atmospheric_stability: str
    source: str
    timestamp: str
    is_live: bool
    latitude: float
    longitude: float
    error: Optional[str] = None
