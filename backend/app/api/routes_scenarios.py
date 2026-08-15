from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.scenarios.scenario_service import scenario_service
from app.schemas.scenario import ScenarioPresetResponse

router = APIRouter(prefix="/scenarios", tags=["Accident Scenarios"])

@router.get("/presets", response_model=List[ScenarioPresetResponse])
def get_scenario_presets(db: Session = Depends(get_db)):
    """Retrieve pre-configured industrial incident scenario presets."""
    return scenario_service.get_presets(db)

@router.get("/presets/{preset_id}", response_model=ScenarioPresetResponse)
def get_scenario_preset_by_id(preset_id: str, db: Session = Depends(get_db)):
    """Retrieve a specific scenario preset."""
    preset = scenario_service.get_preset_by_id(db, preset_id)
    if not preset:
        raise HTTPException(status_code=404, detail="Scenario preset not found")
    return preset
