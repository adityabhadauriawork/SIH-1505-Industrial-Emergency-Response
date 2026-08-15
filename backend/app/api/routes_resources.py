from fastapi import APIRouter, Depends, Body
from typing import Optional
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.resources.resource_service import resource_service
from app.schemas.hazard import HazardSimulationResult
from app.schemas.impact import ImpactAnalysisResult
from app.schemas.evacuation import EvacuationPlanResponse
from app.schemas.resource import ResourceOptimizationPlan

router = APIRouter(prefix="/resources", tags=["Emergency Resource Optimization"])

@router.post("/optimize", response_model=ResourceOptimizationPlan)
def optimize_emergency_resources(
    simulation_result: HazardSimulationResult = Body(...),
    impact_result: ImpactAnalysisResult = Body(...),
    evacuation_plan: Optional[EvacuationPlanResponse] = Body(None),
    db: Session = Depends(get_db)
):
    """
    Recommend emergency response resource allocation, calculate dynamic vehicle ETAs,
    upwind/muster staging coordinates, and incident-specific SOP checklists.
    """
    return resource_service.optimize_resources(
        db=db,
        simulation_result=simulation_result,
        impact_result=impact_result,
        evacuation_plan=evacuation_plan
    )
