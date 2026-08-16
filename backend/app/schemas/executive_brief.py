from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ExecutiveSituationBriefResponse(BaseModel):
    incident_id: str
    incident_title: str
    facility_name: str
    location: str
    sector: str
    source_asset: str
    chemical: str
    incident_type: str
    detected_time_iso: str
    
    # Severity & Risk
    severity_score: float
    severity_category: str
    escalation_trend: str
    
    # People
    workforce_site_total: int
    exposed_workers_count: int
    red_zone_lethal_count: int
    orange_zone_severe_count: int
    yellow_zone_caution_count: int
    evacuation_status: str
    casualty_triage_summary: str
    
    # Infrastructure & Sectors
    compromised_assets_count: int
    critical_units_threatened: int
    blocked_road_segments_count: int
    compromised_sectors: List[str]
    site_accessibility_status: str
    
    # Hazard Extent
    max_red_reach_m: float
    max_orange_reach_m: float
    wind_vector_summary: str
    plume_bearing_summary: str
    
    # Evacuation Directive
    primary_assembly_point: str
    primary_exit_gate: str
    evacuation_distance_m: float
    estimated_walk_time_min: float
    
    # Tactical Response
    lead_tactical_unit: str
    lead_unit_eta_min: float
    firewater_demand_lpm: float
    foam_demand_liters: float
    mandatory_ppe: str
    staging_standoff_m: float
    containment_status: str
    
    # Governance & Authorization
    human_authorization_status: str
    approver_name: Optional[str] = None
    approver_role: Optional[str] = None
    authorization_id: Optional[str] = None
    authorization_timestamp: Optional[str] = None
    
    # Decisions Required
    pending_decisions: List[str]
    timeline_highlights: List[str]
    formatted_brief_markdown: str
    prototype_disclaimer: str = "PROTOTYPE EXECUTIVE SITUATION BRIEF — Operational Decision Support"

class ExecutiveBriefRequest(BaseModel):
    simulation_result: Optional[Dict[str, Any]] = None
    impact_result: Optional[Dict[str, Any]] = None
    evacuation_plan: Optional[Dict[str, Any]] = None
    resource_plan: Optional[Dict[str, Any]] = None
    authorization_record: Optional[Dict[str, Any]] = None
