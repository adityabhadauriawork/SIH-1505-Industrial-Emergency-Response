from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ResourceAllocationItem(BaseModel):
    resource_id: str
    resource_name: str
    resource_type: str
    current_station: str
    current_status: str
    assigned_role: str
    staging_area_name: str
    staging_coordinates: List[float]
    distance_to_staging_m: float
    estimated_arrival_min: float
    tactical_rationale: str
    priority: str  # IMMEDIATE, HIGH, SUPPORT, STANDBY
    equipment_instructions: str

class TacticalActionChecklist(BaseModel):
    phase: str  # IMMEDIATE_0_5MIN, MITIGATION_5_15MIN, CONTAINMENT_15_30MIN
    title: str
    actions: List[str]

class ResourceOptimizationPlan(BaseModel):
    incident_id: str
    incident_type: str
    incident_severity: str
    chemical_name: str
    decision_support_disclaimer: str
    recommended_resources: List[ResourceAllocationItem]
    unavailable_resources: List[Dict[str, Any]] = []
    tactical_checklist: List[TacticalActionChecklist]
    isolation_perimeter_m: float
    standoff_upwind_m: float
    foam_water_requirements: Dict[str, Any]
