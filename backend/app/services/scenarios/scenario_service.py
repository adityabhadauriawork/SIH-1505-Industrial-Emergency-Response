from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.scenario import ScenarioPresetModel
from app.schemas.scenario import ScenarioPresetResponse

class ScenarioService:
    def get_presets(self, db: Session) -> List[ScenarioPresetResponse]:
        presets = db.query(ScenarioPresetModel).all()
        return [
            ScenarioPresetResponse(
                id=p.id,
                title=p.title,
                asset_id=p.asset_id,
                chemical_id=p.chemical_id,
                incident_type=p.incident_type,
                release_rate_kg_s=p.release_rate_kg_s,
                release_duration_min=p.release_duration_min,
                operating_temp_c=p.operating_temp_c,
                operating_pressure_bar=p.operating_pressure_bar,
                wind_speed_kmh=p.wind_speed_kmh,
                wind_direction_deg=p.wind_direction_deg,
                wind_direction_cardinal=p.wind_direction_cardinal,
                ambient_temp_c=p.ambient_temp_c,
                atmospheric_stability=p.atmospheric_stability,
                humidity_pct=p.humidity_pct,
                description=p.description
            )
            for p in presets
        ]

    def get_preset_by_id(self, db: Session, preset_id: str) -> Optional[ScenarioPresetResponse]:
        p = db.query(ScenarioPresetModel).filter(ScenarioPresetModel.id == preset_id).first()
        if not p:
            return None
        return ScenarioPresetResponse(
            id=p.id,
            title=p.title,
            asset_id=p.asset_id,
            chemical_id=p.chemical_id,
            incident_type=p.incident_type,
            release_rate_kg_s=p.release_rate_kg_s,
            release_duration_min=p.release_duration_min,
            operating_temp_c=p.operating_temp_c,
            operating_pressure_bar=p.operating_pressure_bar,
            wind_speed_kmh=p.wind_speed_kmh,
            wind_direction_deg=p.wind_direction_deg,
            wind_direction_cardinal=p.wind_direction_cardinal,
            ambient_temp_c=p.ambient_temp_c,
            atmospheric_stability=p.atmospheric_stability,
            humidity_pct=p.humidity_pct,
            description=p.description
        )

scenario_service = ScenarioService()
