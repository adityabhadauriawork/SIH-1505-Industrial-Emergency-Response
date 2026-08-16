from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class TimelineEventItem(BaseModel):
    event_id: str
    relative_time_label: str  # e.g., T+00:00, T+00:10, T+00:30, T+00:45, T+01:00, T+01:20, T+02:00, T+03:00
    seconds_offset: int
    timestamp_iso: str
    event_type: str  # INCIDENT_DETECTED, WEATHER_CAPTURED, HAZARD_SIMULATED, IMPACT_ASSESSED, EVACUATION_ROUTED, TACTICAL_ALLOCATED, DOMINO_SCREENED, HSE_REVIEW_INITIATED, AUTHORIZATION_COMPLETED
    incident_state: str  # DETECTED, ASSESSING, EVACUATING, SUPPRESSING, REVIEWING, AUTHORIZED, CONTAINED
    source_module: str  # SENSOR_TELEMETRY, WEATHER_SERVICE, GAUSSIAN_HAZARD, IMPACT_ANALYZER, DIJKSTRA_EVACUATION, TACTICAL_OPTIMIZER, DOMINO_SCREENER, HSE_AUTHORIZATION
    title: str
    short_description: str
    key_metrics: Dict[str, Any] = Field(default_factory=dict)
    severity_level: str = "INFO"  # CRITICAL, WARNING, INFO, SUCCESS
    is_milestone: bool = True

class IncidentTimelineResponse(BaseModel):
    incident_id: str
    asset_id: str
    chemical_name: str
    start_time_iso: str
    total_events: int
    events: List[TimelineEventItem]
    current_phase: str
    prototype_notice: str = "PROTOTYPE INCIDENT TIMELINE — Derived from Authoritative System State Transitions"

class IncidentTimelineRequest(BaseModel):
    simulation_result: Optional[Dict[str, Any]] = None
    impact_result: Optional[Dict[str, Any]] = None
    evacuation_plan: Optional[Dict[str, Any]] = None
    resource_plan: Optional[Dict[str, Any]] = None
    authorization_status: Optional[str] = None
