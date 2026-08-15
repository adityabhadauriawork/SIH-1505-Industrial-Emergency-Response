from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.chemical import ChemicalModel
from app.schemas.chemical import ChemicalResponse

class ChemicalService:
    def get_all_chemicals(self, db: Session) -> List[ChemicalResponse]:
        chems = db.query(ChemicalModel).all()
        return [ChemicalResponse.model_validate(c) for c in chems]

    def get_chemical_by_id(self, db: Session, chemical_id: str) -> Optional[ChemicalResponse]:
        chem = db.query(ChemicalModel).filter(ChemicalModel.id == chemical_id).first()
        if not chem:
            return None
        return ChemicalResponse.model_validate(chem)

chemical_service = ChemicalService()
