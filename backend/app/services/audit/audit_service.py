import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.audit import DecisionAuditModel
from app.schemas.audit import DecisionAuditEntry, DecisionAuditCreateRequest, DecisionAuditListResponse

class DecisionAuditService:
    def record_decision(
        self,
        db: Session,
        incident_id: str,
        module: str,
        input_summary: str,
        recommendation: str,
        reason: str,
        human_action: str = "REVIEWED",
        actor_role: str = "HSE_COMMANDER",
        actor_name: str = "Demo HSE Controller",
        result: Optional[str] = None,
        status: str = "RECORDED"
    ) -> DecisionAuditModel:
        """
        Record a structured decision audit entry into the SQLite database.
        """
        rec_id = f"AUD-{datetime.utcnow().strftime('%Y%m%d%H%M')}-{uuid.uuid4().hex[:6].upper()}"
        entry = DecisionAuditModel(
            id=rec_id,
            incident_id=incident_id,
            timestamp=datetime.utcnow(),
            module=module,
            input_summary=input_summary,
            recommendation=recommendation,
            reason=reason,
            human_action=human_action,
            actor_role=actor_role,
            actor_name=actor_name,
            result=result,
            status=status,
            data_classification="PROTOTYPE_AUDIT_LOG",
            created_at=datetime.utcnow()
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

    def get_audit_trail(
        self,
        db: Session,
        incident_id: Optional[str] = None,
        module: Optional[str] = None,
        limit: int = 50
    ) -> DecisionAuditListResponse:
        """
        Query decision audit records, seeding standard baseline records if the audit trail is empty.
        """
        q = db.query(DecisionAuditModel)
        if incident_id:
            q = q.filter(DecisionAuditModel.incident_id == incident_id)
        if module and module != "ALL":
            q = q.filter(DecisionAuditModel.module == module)
        
        records = q.order_by(DecisionAuditModel.timestamp.desc()).limit(limit).all()

        # Seed baseline demo audit records if empty to ensure rich audit trail out-of-the-box
        if not records and not incident_id:
            self._seed_default_audit_records(db)
            records = db.query(DecisionAuditModel).order_by(DecisionAuditModel.timestamp.desc()).limit(limit).all()

        entries = [
            DecisionAuditEntry(
                id=r.id,
                incident_id=r.incident_id,
                timestamp=r.timestamp,
                module=r.module,
                input_summary=r.input_summary,
                recommendation=r.recommendation,
                reason=r.reason,
                human_action=r.human_action,
                actor_role=r.actor_role,
                actor_name=r.actor_name,
                result=r.result,
                status=r.status,
                data_classification=r.data_classification
            )
            for r in records
        ]

        return DecisionAuditListResponse(
            total_records=len(entries),
            incident_id=incident_id,
            records=entries,
            prototype_notice="PROTOTYPE AUDIT TRAIL — Non-Tamper-Evident Demo Log"
        )

    def _seed_default_audit_records(self, db: Session):
        sample_records = [
            {
                "incident_id": "INC-PRIMARY-T04",
                "module": "EVACUATION",
                "input_summary": "T-04 Ammonia Leak (15 kg/s), Wind 8.0 km/h FROM NE (45°)",
                "recommendation": "Muster at AP-3 via Gate 2 (Distance: 623.9m, Standoff: 250m)",
                "reason": "Optimal crosswind safety margin; avoids plume intersection along northern perimeter corridor",
                "human_action": "REVIEWED",
                "actor_role": "HSE_COMMANDER",
                "actor_name": "Demo HSE Controller",
                "result": "Evacuation corridor broadcasted to Sector B & C field teams"
            },
            {
                "incident_id": "INC-PRIMARY-T04",
                "module": "TACTICAL_RESPONSE",
                "input_summary": "Toxic Ammonia Plume expanding downwind; ERPG-3 Red Zone reaching 285m",
                "recommendation": "Dispatch High-Volume Water Curtain Bowser (IMMEDIATE, ETA: 2.5 min)",
                "reason": "Water spray curtain absorbs water-soluble NH3 vapors and prevents boundary breach into Substation 2",
                "human_action": "DISPATCHED",
                "actor_role": "HSE_COMMANDER",
                "actor_name": "Demo Tactical Officer",
                "result": "Bowser WB-01 deployed to upwind staging point (Bearing 225°)"
            },
            {
                "incident_id": "INC-PRIMARY-T04",
                "module": "PREPLAN_AUTHORIZATION",
                "input_summary": "Fire Pre-Plan v0.1 compiled with Gaussian screening plume and Dijkstra evacuation",
                "recommendation": "Endorse Emergency Response Pre-Plan for immediate operational deployment",
                "reason": "All 5 mandatory safety review checklist items confirmed by on-duty HSE controller",
                "human_action": "APPROVED",
                "actor_role": "HSE_COMMANDER",
                "actor_name": "Demo HSE Controller",
                "result": "Authorized Pre-Plan v1.0 issued with digital demo signature block"
            },
            {
                "incident_id": "INC-PRIMARY-T04",
                "module": "DOMINO_SCREENING",
                "input_summary": "Storage Tank V-102 & Unit 4 Compressor adjacent to T-04 epicenter",
                "recommendation": "Prioritize exposure protection deluge on V-102 and trigger ESD-4 header isolation",
                "reason": "Secondary vapor cloud ignition or pressurization hazard threatens adjacent critical hydrocarbons",
                "human_action": "REVIEWED",
                "actor_role": "PLANT_MANAGER",
                "actor_name": "Site Safety Superintendent",
                "result": "Water deluge cooling activated for Unit 4 tank farm"
            }
        ]

        for s in sample_records:
            self.record_decision(
                db=db,
                incident_id=s["incident_id"],
                module=s["module"],
                input_summary=s["input_summary"],
                recommendation=s["recommendation"],
                reason=s["reason"],
                human_action=s["human_action"],
                actor_role=s["actor_role"],
                actor_name=s["actor_name"],
                result=s["result"]
            )

audit_service = DecisionAuditService()
