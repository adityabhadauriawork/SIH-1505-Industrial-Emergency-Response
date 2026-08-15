from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any

from app.core.database import get_db
from app.schemas.whatif import WhatIfComparisonRequest, WhatIfComparisonResponse
from app.schemas.analytics import AnalyticsSummaryResponse
from app.schemas.predictive import AssetHealthSummaryResponse
from app.schemas.vision import VisionAnalysisResponse, VisionCameraPreset
from app.schemas.copilot import CopilotChatRequest, CopilotChatResponse

from app.services.whatif.whatif_service import whatif_service
from app.services.analytics.analytics_service import analytics_service
from app.services.predictive.predictive_service import predictive_service
from app.services.vision.vision_service import vision_service
from app.services.copilot.copilot_service import copilot_service

router = APIRouter(prefix="/intelligence", tags=["Phase-2 Intelligence Hub"])

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
