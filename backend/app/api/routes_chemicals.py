from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.chemicals.chemical_service import chemical_service
from app.schemas.chemical import ChemicalResponse

router = APIRouter(prefix="/chemicals", tags=["Chemical Intelligence"])

@router.get("", response_model=List[ChemicalResponse])
def list_chemicals(db: Session = Depends(get_db)):
    """Retrieve all hazardous chemicals in the plant database."""
    return chemical_service.get_all_chemicals(db)

@router.get("/{chemical_id}", response_model=ChemicalResponse)
def get_chemical(chemical_id: str, db: Session = Depends(get_db)):
    """Retrieve chemical intelligence and SDS parameters by ID."""
    chem = chemical_service.get_chemical_by_id(db, chemical_id)
    if not chem:
        raise HTTPException(status_code=404, detail="Chemical not found")
    return chem
