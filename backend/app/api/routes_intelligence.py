from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any

from app.core.database import get_db
from app.schemas.whatif import WhatIfComparisonRequest, WhatIfComparisonResponse
from app.schemas.analytics import AnalyticsSummaryResponse
from app.schemas.predictive import AssetHealthSummaryResponse
from app.schemas.vision import VisionAnalysisResponse, VisionCameraPreset
from app.schemas.copilot import CopilotChatRequest, CopilotChatResponse
from app.schemas.domino import DominoRiskAnalysisRequest, DominoRiskAnalysisResponse
from app.schemas.timeline import IncidentTimelineRequest, IncidentTimelineResponse
from app.schemas.audit import DecisionAuditCreateRequest, DecisionAuditEntry, DecisionAuditListResponse
from app.schemas.executive_brief import ExecutiveBriefRequest, ExecutiveSituationBriefResponse

from app.services.whatif.whatif_service import whatif_service
from app.services.analytics.analytics_service import analytics_service
from app.services.predictive.predictive_service import predictive_service
from app.services.vision.vision_service import vision_service
from app.services.copilot.copilot_service import copilot_service
from app.services.predictive.domino_service import domino_service
from app.services.analytics.timeline_service import timeline_service
from app.services.audit.audit_service import audit_service
from app.services.copilot.executive_brief_service import executive_brief_service

router = APIRouter(prefix="/intelligence", tags=["Phase-2 & Final Intelligence Hub"])

# 1. WHAT-IF COMPARISON
@router.post("/whatif/compare", response_model=WhatIfComparisonResponse)
def compare_whatif_scenarios(
    req: WhatIfComparisonRequest,
    db: Session = Depends(get_db)
):
    """
    Run independent authoritative hazard, impact, and evacuation simulations
    for Scenario A and Scenario B and compute exact mathematical deltas.
    """
    try:
        return whatif_service.compare_scenarios(db, req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"What-If scenario comparison failed: {str(e)}")

# 2. HISTORICAL INCIDENT ANALYTICS
@router.get("/analytics/summary", response_model=AnalyticsSummaryResponse)
def get_historical_analytics_summary(db: Session = Depends(get_db)):
    """
    Retrieve historical incident metrics, frequency distributions, and high-risk equipment rankings.
    """
    try:
        return analytics_service.get_analytics_summary(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch historical incident analytics: {str(e)}")

# 3. PREDICTIVE ASSET HEALTH & EARLY WARNING
@router.get("/predictive/assets", response_model=AssetHealthSummaryResponse)
def get_predictive_asset_health(db: Session = Depends(get_db)):
    """
    Retrieve multi-parameter predictive failure risk scores, top failure drivers, and inspection recommendations.
    """
    try:
        return predictive_service.get_asset_health_summary(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch predictive asset health: {str(e)}")

# 4. COMPUTER VISION HAZARD DETECTION
@router.get("/vision/presets", response_model=List[VisionCameraPreset])
def get_vision_camera_presets():
    """
    Retrieve CCTV camera streaming presets.
    """
    return vision_service.get_camera_presets()

@router.post("/vision/detect", response_model=VisionAnalysisResponse)
async def analyze_vision_frame(
    camera_id: str = Form("CAM-01"),
    simulate_hazard_type: Optional[str] = Form(None),
    image_file: Optional[UploadFile] = File(None)
):
    """
    Analyze an uploaded image or camera frame for fire, smoke, and personnel with bounding box coordinates.
    """
    try:
        img_bytes = None
        if image_file:
            img_bytes = await image_file.read()
        return vision_service.analyze_camera_frame(
            image_bytes=img_bytes,
            camera_id=camera_id,
            simulate_hazard_type=simulate_hazard_type
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computer vision analysis failed: {str(e)}")

# 5. AI EMERGENCY COPILOT
@router.post("/copilot/chat", response_model=CopilotChatResponse)
def chat_with_copilot(
    req: CopilotChatRequest,
    db: Session = Depends(get_db)
):
    """
    Natural language query interface grounded in active incident simulation context.
    """
    try:
        return copilot_service.process_query(db, req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Copilot query processing failed: {str(e)}")

# 6. DOMINO / CASCADE RISK ANALYSIS
@router.post("/domino-risk", response_model=DominoRiskAnalysisResponse)
def evaluate_domino_cascade_risk(
    req: DominoRiskAnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Screen spatial cascade risks against plant assets, generating prioritized deluge/isolation directives.
    """
    try:
        return domino_service.analyze_cascade_risk(
            db=db,
            simulation_result=req.simulation_result,
            impact_result=req.impact_result
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Domino risk analysis failed: {str(e)}")

# 7. INCIDENT TIMELINE / EVENT STREAM
@router.post("/timeline", response_model=IncidentTimelineResponse)
def get_incident_timeline(
    req: IncidentTimelineRequest
):
    """
    Construct authoritative vertical timeline and milestone events from active system state transitions.
    """
    try:
        return timeline_service.generate_timeline(
            simulation_result=req.simulation_result,
            impact_result=req.impact_result,
            evacuation_plan=req.evacuation_plan,
            resource_plan=req.resource_plan,
            authorization_record={"status": req.authorization_status} if req.authorization_status else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Timeline generation failed: {str(e)}")

# 8. DECISION AUDIT TRAIL
@router.get("/audit-trail", response_model=DecisionAuditListResponse)
def get_decision_audit_trail(
    incident_id: Optional[str] = Query(None),
    module: Optional[str] = Query(None),
    limit: int = Query(50),
    db: Session = Depends(get_db)
):
    """
    Fetch structured decision-support audit logs.
    """
    try:
        return audit_service.get_audit_trail(
            db=db,
            incident_id=incident_id,
            module=module,
            limit=limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch audit trail: {str(e)}")

@router.post("/audit-trail/record", response_model=DecisionAuditEntry)
def record_decision_audit(
    req: DecisionAuditCreateRequest,
    db: Session = Depends(get_db)
):
    """
    Record an operational decision into the prototype decision audit trail.
    """
    try:
        rec = audit_service.record_decision(
            db=db,
            incident_id=req.incident_id,
            module=req.module,
            input_summary=req.input_summary,
            recommendation=req.recommendation,
            reason=req.reason,
            human_action=req.human_action,
            actor_role=req.actor_role,
            actor_name=req.actor_name,
            result=req.result
        )
        return DecisionAuditEntry(
            id=rec.id,
            incident_id=rec.incident_id,
            timestamp=rec.timestamp,
            module=rec.module,
            input_summary=rec.input_summary,
            recommendation=rec.recommendation,
            reason=rec.reason,
            human_action=rec.human_action,
            actor_role=rec.actor_role,
            actor_name=rec.actor_name,
            result=rec.result,
            status=rec.status,
            data_classification=rec.data_classification
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record audit entry: {str(e)}")

# 9. EXECUTIVE SITUATION BRIEF
@router.post("/executive-brief", response_model=ExecutiveSituationBriefResponse)
def generate_executive_situation_brief(
    req: ExecutiveBriefRequest
):
    """
    Synthesize one-click 12-point executive situation brief answering the 6 core executive questions.
    """
    try:
        return executive_brief_service.generate_brief(
            simulation_result=req.simulation_result,
            impact_result=req.impact_result,
            evacuation_plan=req.evacuation_plan,
            resource_plan=req.resource_plan,
            authorization_record=req.authorization_record
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Executive brief generation failed: {str(e)}")
