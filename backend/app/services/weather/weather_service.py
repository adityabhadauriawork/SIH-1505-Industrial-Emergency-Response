import requests
from datetime import datetime
from typing import Dict, Any, Optional
from app.schemas.weather import CurrentWeatherResponse

class WeatherService:
    """
    Dedicated Weather Intelligence Service.
    Integrates live meteorological data from Open-Meteo with automatic local fallback.
    Decoupled from the hazard physics dispersion engine.
    """
    OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast"

    @staticmethod
    def deg_to_cardinal(deg: float) -> str:
        """Convert wind direction in degrees (0-360) to 16-point cardinal compass string."""
        deg = (deg % 360 + 360) % 360
        cardinals = [
            "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
            "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
        ]
        idx = int((deg + 11.25) / 22.5) % 16
        return cardinals[idx]

    @staticmethod
    def estimate_stability_class(wind_speed_m_s: float, daytime: bool = True) -> str:
        """
        Estimate Pasquill-Gifford atmospheric stability class (A to F):
        A: Extremely Unstable, B: Moderately Unstable, C: Slightly Unstable,
        D: Neutral (overcast/standard), E: Slightly Stable, F: Moderately Stable.
        """
        if wind_speed_m_s < 2.0:
            return "A" if daytime else "F"
        elif wind_speed_m_s < 3.0:
            return "B" if daytime else "E"
        elif wind_speed_m_s < 5.0:
            return "C" if daytime else "D"
        elif wind_speed_m_s < 6.0:
            return "C" if daytime else "D"
        else:
            return "D"

    def fetch_live_weather(
        self,
        latitude: float = 21.6850,
        longitude: float = 72.5750
    ) -> CurrentWeatherResponse:
        """
        Query Open-Meteo Forecast API for current temperature, wind speed, and wind direction.
        Fails safely if internet/API is unavailable.
        """
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,wind_speed_10m,wind_direction_10m",
            "temperature_unit": "celsius",
            "wind_speed_unit": "kmh"
        }

        try:
            response = requests.get(self.OPEN_METEO_BASE_URL, params=params, timeout=4.0)
            if response.status_code == 200:
                data = response.json()
                current = data.get("current", {})
                
                temp_c = float(current.get("temperature_2m", 32.0))
                wind_kmh = float(current.get("wind_speed_10m", 8.0))
                wind_deg = float(current.get("wind_direction_10m", 45.0))
                wind_u_m_s = max(0.5, wind_kmh / 3.6)
                
                cardinal = self.deg_to_cardinal(wind_deg)
                stability = self.estimate_stability_class(wind_u_m_s)
                time_iso = current.get("time") or datetime.utcnow().isoformat()

                return CurrentWeatherResponse(
                    temperature_c=round(temp_c, 1),
                    wind_speed_kmh=round(wind_kmh, 1),
                    wind_speed_m_s=round(wind_u_m_s, 2),
                    wind_direction_deg=round(wind_deg, 1),
                    wind_direction_cardinal=cardinal,
                    atmospheric_stability=stability,
                    source="Open-Meteo",
                    timestamp=time_iso,
                    is_live=True,
                    latitude=latitude,
                    longitude=longitude,
                    error=None
                )
            else:
                return self._fallback_weather(
                    latitude, longitude, 
                    error_msg=f"Open-Meteo API returned HTTP {response.status_code}"
                )

        except Exception as e:
            # Fallback gracefully without crashing
            return self._fallback_weather(
                latitude, longitude, 
                error_msg=f"Live weather unavailable ({str(e)})"
            )

    def _fallback_weather(
        self,
        latitude: float,
        longitude: float,
        error_msg: Optional[str] = None
    ) -> CurrentWeatherResponse:
        """Deterministic seed fallback when offline or external API fails."""
        default_temp = 32.0
        default_wind_kmh = 8.0
        default_wind_deg = 45.0
        default_wind_m_s = default_wind_kmh / 3.6

        return CurrentWeatherResponse(
            temperature_c=default_temp,
            wind_speed_kmh=default_wind_kmh,
            wind_speed_m_s=round(default_wind_m_s, 2),
            wind_direction_deg=default_wind_deg,
            wind_direction_cardinal=self.deg_to_cardinal(default_wind_deg),
            atmospheric_stability="D",
            source="Local Scenario Data (Offline Fallback)",
            timestamp=datetime.utcnow().isoformat(),
            is_live=False,
            latitude=latitude,
            longitude=longitude,
            error=error_msg
        )

weather_service = WeatherService()
