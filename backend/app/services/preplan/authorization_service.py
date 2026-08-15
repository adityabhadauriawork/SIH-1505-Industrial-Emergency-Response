import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.models.authorization import AuthorizationRecordModel
from app.schemas.authorization import AuthorizationRequest, RejectionRequest, AuthorizationRecordResponse

class AuthorizationService:
    def get_or_create_record(
        self,
        db: Session,
        incident_id: str,
        asset_id: str,
        chemical_id: str,
        chemical_name: str,
        scenario_hash: Optional[str] = None
    ) -> AuthorizationRecordModel:
        """
        Retrieve existing authorization record or initialize a PENDING_HUMAN_AUTHORIZATION record.
        If the scenario state has changed for an already AUTHORIZED incident, marks it as SUPERSEDED.
        """
        record = db.query(AuthorizationRecordModel).filter(
            AuthorizationRecordModel.incident_id == incident_id
        ).order_by(AuthorizationRecordModel.created_at.desc()).first()

        if not record:
            record_id = f"AUTH-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
            record = AuthorizationRecordModel(
                id=record_id,
                incident_id=incident_id,
                asset_id=asset_id,
                chemical_id=chemical_id,
                chemical_name=chemical_name,
                document_version="v0.1",
                status="PENDING_HUMAN_AUTHORIZATION",
                checklist_completed=False,
                scenario_hash=scenario_hash,
                created_at=datetime.utcnow()
            )
            db.add(record)
            db.commit()
            db.refresh(record)
            return record

        # Check if scenario inputs changed on an authorized document
        if record.status == "AUTHORIZED" and scenario_hash and record.scenario_hash and record.scenario_hash != scenario_hash:
            record.status = "SUPERSEDED"
            db.commit()
            db.refresh(record)

        return record

    def authorize_preplan(
        self,
        db: Session,
        req: AuthorizationRequest
    ) -> AuthorizationRecordModel:
        """
        Validate review checklist and store official human HSE authorization record.
        """
        if not req.checklist.is_complete():
            raise ValueError("All 5 mandatory safety review checklist items must be confirmed before authorization.")

        if not req.approver_name.strip():
            raise ValueError("Approver name is required for document authorization.")

        if not req.approver_role.strip():
            raise ValueError("Approver role/designation is required for document authorization.")

        record = db.query(AuthorizationRecordModel).filter(
            AuthorizationRecordModel.incident_id == req.incident_id
        ).order_by(AuthorizationRecordModel.created_at.desc()).first()

        if not record:
            record_id = f"AUTH-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
            record = AuthorizationRecordModel(
                id=record_id,
                incident_id=req.incident_id,
                asset_id=req.asset_id,
                chemical_id=req.chemical_id,
                chemical_name=req.chemical_name,
                created_at=datetime.utcnow()
            )
            db.add(record)

        # Update to AUTHORIZED v1.0
        record.status = "AUTHORIZED"
        record.document_version = "v1.0"
        record.approver_name = req.approver_name.strip()
        record.approver_role = req.approver_role.strip()
        record.checklist_completed = True
        record.approval_notes = req.notes.strip() if req.notes else None
        record.rejection_reason = None
        record.scenario_hash = req.scenario_hash
        record.approval_timestamp = datetime.utcnow()

        db.commit()
        db.refresh(record)
        return record

    def reject_preplan(
        self,
        db: Session,
        req: RejectionRequest
    ) -> AuthorizationRecordModel:
        """
        Record rejection/revision request from HSE authority.
        """
        if not req.rejection_reason.strip():
            raise ValueError("A clear revision/rejection rationale must be provided.")

        record = db.query(AuthorizationRecordModel).filter(
            AuthorizationRecordModel.incident_id == req.incident_id
        ).order_by(AuthorizationRecordModel.created_at.desc()).first()

        if not record:
            record_id = f"AUTH-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
            record = AuthorizationRecordModel(
                id=record_id,
                incident_id=req.incident_id,
                asset_id="UNKNOWN",
                chemical_id="UNKNOWN",
                chemical_name="UNKNOWN",
                created_at=datetime.utcnow()
            )
            db.add(record)

        record.status = "REJECTED"
        record.approver_name = req.reviewer_name.strip() if req.reviewer_name else "HSE Reviewer"
        record.rejection_reason = req.rejection_reason.strip()
        record.approval_timestamp = datetime.utcnow()

        db.commit()
        db.refresh(record)
        return record

authorization_service = AuthorizationService()
