from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.plant import AssetModel
from app.models.chemical import ChemicalModel
from app.services.hazard.hazard_service import hazard_service
from app.schemas.scenario import ScenarioCreateRequest
from app.schemas.hazard import HazardSimulationResult

router = APIRouter(prefix="/hazard", tags=["Hazard Simulation Engine"])

@router.post("/simulate", response_model=HazardSimulationResult)
def simulate_hazard_dispersion(
    request: ScenarioCreateRequest,
    db: Session = Depends(get_db)
):
    """
    Run screening-level hazard dispersion calculation.
    Returns Red, Orange, Yellow threat zones and time-stepped GeoJSON contours.
    """
    asset = db.query(AssetModel).filter(AssetModel.id == request.asset_id).first()
    if not asset and not request.custom_coords:
        raise HTTPException(status_code=404, detail=f"Source asset {request.asset_id} not found")

    coords = request.custom_coords or [asset.lat, asset.lon]

    chemical = db.query(ChemicalModel).filter(ChemicalModel.id == request.chemical_id).first()
    if not chemical:
        raise HTTPException(status_code=404, detail=f"Chemical {request.chemical_id} not found")

    scenario_dict = request.model_dump()
    chemical_dict = {
        "id": chemical.id,
        "name": chemical.name,
        "molecular_weight": chemical.molecular_weight,
        "erpg_1_ppm": chemical.erpg_1_ppm,
        "erpg_2_ppm": chemical.erpg_2_ppm,
        "erpg_3_ppm": chemical.erpg_3_ppm,
        "idlh_ppm": chemical.idlh_ppm,
        "lfl_percent": chemical.lfl_percent,
        "ufl_percent": chemical.ufl_percent,
        "vapor_density_rel_air": chemical.vapor_density_rel_air
    }

    result = hazard_service.simulate_scenario(
        scenario_data=scenario_dict,
        chemical_data=chemical_dict,
        source_coords=coords
    )
    return result
