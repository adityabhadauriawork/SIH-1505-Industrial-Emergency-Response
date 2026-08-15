from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.impact.impact_service import impact_service
from app.schemas.hazard import HazardSimulationResult
from app.schemas.impact import ImpactAnalysisResult

router = APIRouter(prefix="/impact", tags=["Population & Asset Impact Engine"])

@router.post("/analyze", response_model=ImpactAnalysisResult)
def analyze_hazard_impact(
    simulation_result: HazardSimulationResult = Body(...),
    time_step_sec: int = 120,
    db: Session = Depends(get_db)
):
    """
    Perform spatial overlay between hazard threat zones and workers, assets, roads, and muster points.
    Calculates affected workers, compromised infrastructure, and multi-factor risk scores.
    """
    return impact_service.evaluate_impact(
        db=db,
        simulation_result=simulation_result,
        time_step_sec=time_step_sec
    )
