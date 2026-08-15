from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.site.site_service import site_service
from app.schemas.plant import SiteDataResponse, GeoJSONFeatureCollection

router = APIRouter(prefix="/site", tags=["Industrial Plant Site"])

@router.get("", response_model=SiteDataResponse)
def get_site_information(db: Session = Depends(get_db)):
    """Retrieve full structured plant digital twin data."""
    return site_service.get_full_site_data(db)

@router.get("/geojson", response_model=GeoJSONFeatureCollection)
def get_site_geojson(db: Session = Depends(get_db)):
    """Retrieve static plant features as a GeoJSON FeatureCollection."""
    return site_service.get_plant_geojson(db)
