import uuid
from typing import Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.predictive import AssetHealthModel
from app.models.plant import AssetModel
from app.schemas.predictive import AssetHealthItem, AssetHealthSummaryResponse

class PredictiveService:
    def calculate_asset_health_risk(
        self,
        vibration_mm_s: float,
        temperature_c: float,
        pressure_bar: float,
        acoustic_db: float,
        maintenance_age_days: int,
        anomaly_count: int
    ) -> Dict[str, Any]:
        """
        Transparent multi-parameter predictive failure risk scoring model:
        Evaluates mechanical vibration, thermal excursions, acoustic micro-leaks, and maintenance aging.
        """
        # 1. Vibration risk (0 - 30 pts): Baseline < 2.5 mm/s, Alarm > 6.0 mm/s
        vib_score = min(30.0, max(0.0, (vibration_mm_s - 1.5) * 6.0))
        
        # 2. Thermal risk (0 - 25 pts): Baseline < 45C, Alarm > 75C
        temp_score = min(25.0, max(0.0, (temperature_c - 30.0) * 0.55))
        
        # 3. Acoustic ultrasonic leak risk (0 - 20 pts): Baseline < 20 dB, Leak > 45 dB
        ac_score = min(20.0, max(0.0, (acoustic_db - 15.0) * 0.65))
        
        # 4. Maintenance age risk (0 - 15 pts): Baseline < 90 days, Overdue > 360 days
        age_score = min(15.0, (maintenance_age_days / 365.0) * 15.0)
        
        # 5. Anomaly spike risk (0 - 10 pts): 2 pts per anomaly
        anom_score = min(10.0, anomaly_count * 2.5)

        total_risk = round(vib_score + temp_score + ac_score + age_score + anom_score, 1)

        # Identify dominant driver
        driver_map = {
            "High Mechanical Vibration (Bearing/Shaft Misalignment)": vib_score,
            "Thermal Excursion / Overheating": temp_score,
            "Acoustic Ultrasonic Leak Indicator": ac_score,
            "Overdue Turnaround / Seal Aging": age_score,
            "Frequent Pressure Anomaly Spikes": anom_score
        }
        top_driver = max(driver_map.items(), key=lambda x: x[1])[0]

        if total_risk >= 75.0:
            category = "CRITICAL"
            action = "Mandate immediate emergency shutdown inspection; inspect flange seals and vibration dampers within 24h."
        elif total_risk >= 55.0:
            category = "HIGH"
            action = "Schedule preventive turnaround inspection; lubricate mechanical seal bearings and retorque cryogenic bolts."
        elif total_risk >= 35.0:
            category = "MODERATE"
            action = "Increase sensor telemetry polling frequency; monitor thermal trend on next operating shift."
        else:
            category = "LOW"
            action = "Asset operating within normal nominal baseline parameters; routine maintenance on schedule."

        return {
            "score": total_risk,
            "category": category,
            "top_driver": top_driver,
            "action": action
        }

    def seed_asset_health_if_empty(self, db: Session):
        """Seed realistic equipment health telemetry across facility assets."""
        count = db.query(AssetHealthModel).count()
        if count > 0:
            return

        assets = db.query(AssetModel).all()
        now = datetime.utcnow()

        seed_profiles = {
            "T-04": {"vib": 6.8, "temp": 52.0, "press": 5.8, "ac": 42.0, "age": 310, "anom": 4},   # High Risk (Header)
            "T-03": {"vib": 5.9, "temp": 48.0, "press": 12.5, "ac": 38.0, "age": 280, "anom": 3},  # High Risk (LPG Sphere)
            "T-01": {"vib": 3.8, "temp": 34.0, "press": 1.2, "ac": 22.0, "age": 180, "anom": 1},   # Moderate Risk (Benzene)
            "T-02": {"vib": 3.2, "temp": 28.0, "press": 6.0, "ac": 18.0, "age": 140, "anom": 1},   # Moderate Risk (Chlorine)
            "SUB-01": {"vib": 7.2, "temp": 68.0, "press": 4.2, "ac": 46.0, "age": 340, "anom": 5}, # Critical Risk (Substation)
            "PROC-01": {"vib": 2.4, "temp": 42.0, "press": 3.5, "ac": 14.0, "age": 75, "anom": 0},  # Low Risk (Normal)
            "PROC-02": {"vib": 2.1, "temp": 38.0, "press": 3.2, "ac": 12.0, "age": 60, "anom": 0},  # Low Risk (Normal)
            "CTRL-01": {"vib": 0.8, "temp": 24.0, "press": 1.0, "ac": 5.0, "age": 30, "anom": 0},   # Low Risk (Control Room)
        }

        for a in assets:
            prof = seed_profiles.get(a.id, {"vib": 2.2, "temp": 32.0, "press": 2.5, "ac": 14.0, "age": 90, "anom": 0})
            risk_calc = self.calculate_asset_health_risk(
                prof["vib"], prof["temp"], prof["press"], prof["ac"], prof["age"], prof["anom"]
            )
            rec = AssetHealthModel(
                id=f"HLTH-{a.id}",
                asset_id=a.id,
                asset_name=a.name,
                chemical_id=a.chemical_id or "NONE",
                sector=a.sector,
                operating_hours=round(prof["age"] * 24 * 0.85, 1),
                maintenance_age_days=prof["age"],
                vibration_mm_s=prof["vib"],
                temperature_c=prof["temp"],
                pressure_bar=prof["press"],
                acoustic_leak_db=prof["ac"],
                anomaly_count_30d=prof["anom"],
                last_inspection_date=now - timedelta(days=prof["age"]),
                failure_risk_score=risk_calc["score"],
                risk_category=risk_calc["category"],
                top_risk_driver=risk_calc["top_driver"],
                recommended_action=risk_calc["action"],
                updated_at=now
            )
            db.add(rec)
        db.commit()

    def get_asset_health_summary(self, db: Session) -> AssetHealthSummaryResponse:
        """Fetch all asset health predictions and overview metrics."""
        self.seed_asset_health_if_empty(db)
        
        records = db.query(AssetHealthModel).order_by(AssetHealthModel.failure_risk_score.desc()).all()
        total_assets = len(records)
        
        crit_count = sum(1 for r in records if r.risk_category == "CRITICAL")
        high_count = sum(1 for r in records if r.risk_category == "HIGH")
        mod_count = sum(1 for r in records if r.risk_category == "MODERATE")
        healthy_count = sum(1 for r in records if r.risk_category == "LOW")
        highest_asset = records[0].asset_id if records else "T-04"

        items = [
            AssetHealthItem(
                id=r.id,
                asset_id=r.asset_id,
                asset_name=r.asset_name,
                chemical_id=r.chemical_id,
                sector=r.sector,
                operating_hours=r.operating_hours,
                maintenance_age_days=r.maintenance_age_days,
                vibration_mm_s=r.vibration_mm_s,
                temperature_c=r.temperature_c,
                pressure_bar=r.pressure_bar,
                acoustic_leak_db=r.acoustic_leak_db,
                anomaly_count_30d=r.anomaly_count_30d,
                last_inspection_date=r.last_inspection_date.strftime("%Y-%m-%d"),
                failure_risk_score=r.failure_risk_score,
                risk_category=r.risk_category,
                top_risk_driver=r.top_risk_driver,
                recommended_action=r.recommended_action
            )
            for r in records
        ]

        return AssetHealthSummaryResponse(
            total_monitored_assets=total_assets,
            critical_risk_count=crit_count,
            high_risk_count=high_count,
            moderate_risk_count=mod_count,
            healthy_asset_count=healthy_count,
            highest_risk_asset_id=highest_asset,
            assets=items,
            model_metadata={
                "model_type": "Multi-Factor Failure Probability Index (Vibration + Thermal + Acoustic + Aging)",
                "evaluation_scope": "Decision Support Early Warning (Non-Certified Engineering)",
                "data_stream": "Seeded Synthetic Telemetry"
            }
        )

predictive_service = PredictiveService()
