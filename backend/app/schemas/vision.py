from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class VisionDetectionItem(BaseModel):
    id: str
    label: str  # FIRE, SMOKE, PERSON, VEHICLE
    confidence_pct: float
    bbox_xywh: List[float]  # [x_pct, y_pct, width_pct, height_pct] (normalized 0.0 - 1.0)
    color_hex: str

class VisionAnalysisResponse(BaseModel):
    image_id: str
    camera_id: str
    camera_location: str
    sector: str
    timestamp: str
    alert_level: str  # CRITICAL, WARNING, NORMAL
    detections: List[VisionDetectionItem]
    incident_suggested: bool
    suggested_asset_id: Optional[str] = None
    suggested_chemical_id: Optional[str] = None
    suggested_incident_type: Optional[str] = None
    suggested_release_rate_kg_s: Optional[float] = None
    suggestion_summary: str
    disclaimer: str = "PROTOTYPE COMPUTER VISION DETECTION — Non-Certified Prototype. Requires Human Triage."

class VisionCameraPreset(BaseModel):
    camera_id: str
    camera_name: str
    sector: str
    associated_asset_id: str
    chemical_id: str
    feed_status: str
    default_scenario: str
