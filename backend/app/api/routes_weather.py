from fastapi import APIRouter, Query
from app.services.weather.weather_service import weather_service
from app.schemas.weather import CurrentWeatherResponse

router = APIRouter(prefix="/weather", tags=["Weather Intelligence"])

@router.get("/current", response_model=CurrentWeatherResponse)
def get_current_weather(
    latitude: float = Query(21.6850, description="Plant / source latitude"),
    longitude: float = Query(72.5750, description="Plant / source longitude")
):
    """
    Fetch current live weather conditions from Open-Meteo for the plant or incident location.
    Falls back gracefully to local scenario data if offline or unavailable.
    """
    return weather_service.fetch_live_weather(latitude=latitude, longitude=longitude)
