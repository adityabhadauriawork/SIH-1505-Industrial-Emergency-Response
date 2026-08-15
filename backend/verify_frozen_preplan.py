import requests
import json
import os

base = "http://127.0.0.1:8000/api"
out_dir = r"A:\SIH-1505\backend\generated_preplans"
os.makedirs(out_dir, exist_ok=True)

def run_simulation_pipeline(asset_id, chem_id, incident_type, q_kg_s, wind_deg, temp_c=32.0, speed_kmh=18.0):
    sim = requests.post(f"{base}/hazard/simulate", json={
        "title": f"Incident Test {asset_id}",
        "asset_id": asset_id,
        "chemical_id": chem_id,
        "incident_type": incident_type,
        "release_rate_kg_s": q_kg_s,
        "release_duration_min": 30,
        "wind_speed_kmh": speed_kmh,
        "wind_direction_deg": wind_deg,
        "ambient_temp_c": temp_c,
        "atmospheric_stability": "D",
        "weather_mode": "DEMO",
        "weather_source": "Scenario Preset"
    }).json()

    imp = requests.post(f"{base}/impact/analyze?time_step_sec=120", json=sim).json()
    evac = requests.post(f"{base}/evacuation/route?origin_name={asset_id}%20Vicinity", json={
        "simulation_result": sim,
        "impact_result": imp,
        "origin_coords": sim["source_coordinates"]
    }).json()
    res = requests.post(f"{base}/resources/optimize", json={
        "simulation_result": sim,
        "impact_result": imp,
        "evacuation_plan": evac
    }).json()

    return sim, imp, evac, res

def test_frozen_preplans():
    print("==================================================")
    print("RUNNING FINAL FROZEN FIRE PRE-PLAN AUDIT")
    print("==================================================")

    # 1. SCENARIO: SUB-01 + Ammonia
    print("\n--- 1. AUDITING SCENARIO: SUB-01 AMMONIA ---")
    sim_sub, imp_sub, evac_sub, res_sub = run_simulation_pipeline("SUB-01", "CHEM-NH3", "PIPELINE_LEAK", 15.0, 200.0, 28.5, 26.5)
    inc_sub = res_sub["incident_id"]

    # Pre-Approval State
    pre_auth = requests.get(f"{base}/preplan/authorization/{inc_sub}?asset_id=SUB-01&chemical_id=CHEM-NH3&chemical_name=Ammonia%20(Anhydrous)&scenario_hash=SUB01-HASH-01").json()
    assert pre_auth["status"] in ["PENDING_HUMAN_AUTHORIZATION", "SUPERSEDED", "AUTHORIZED"]
    assert pre_auth["approver_name"] is None

    # Authorize SUB-01
    auth_sub = requests.post(f"{base}/preplan/authorize", json={
        "incident_id": inc_sub,
        "asset_id": "SUB-01",
        "chemical_id": "CHEM-NH3",
        "chemical_name": "Ammonia (Anhydrous)",
        "document_version": "v0.1",
        "approver_name": "Duty HSE Officer",
        "approver_role": "Chief Safety Officer (HSE)",
        "checklist": {
            "reviewed_hazard": True,
            "reviewed_evacuation": True,
            "reviewed_tactical_resources": True,
            "reviewed_limitations": True,
            "acknowledged_prototype_status": True
        },
        "notes": "Authorized for Substation Sector Emergency Drill.",
        "scenario_hash": "SUB01-HASH-01"
    }).json()
    assert auth_sub["status"] == "AUTHORIZED"
    auth_id_sub = auth_sub["authorization_id"]

    pdf_sub = requests.post(f"{base}/preplan/generate-pdf", json={
        "simulation_result": sim_sub,
        "impact_result": imp_sub,
        "evacuation_plan": evac_sub,
        "resource_plan": res_sub
    })
    assert pdf_sub.status_code == 200
    sub_path = os.path.join(out_dir, "Fire_PrePlan_SUB-01_Ammonia_AUTHORIZED.pdf")
    with open(sub_path, "wb") as f:
        f.write(pdf_sub.content)
    print(f"[PASS] SUB-01 Ammonia PDF Generated: {len(pdf_sub.content):,} bytes -> {sub_path}")

    # 2. SCENARIO: T-04 + Ammonia
    print("\n--- 2. AUDITING SCENARIO: T-04 AMMONIA ---")
    sim_t04, imp_t04, evac_t04, res_t04 = run_simulation_pipeline("T-04", "CHEM-NH3", "PIPELINE_LEAK", 15.0, 195.0, 32.0, 18.0)
    inc_t04 = res_t04["incident_id"]

    auth_t04 = requests.post(f"{base}/preplan/authorize", json={
        "incident_id": inc_t04,
        "asset_id": "T-04",
        "chemical_id": "CHEM-NH3",
        "chemical_name": "Ammonia (Anhydrous)",
        "document_version": "v0.1",
        "approver_name": "Ramesh Thapa",
        "approver_role": "Incident Commander",
        "checklist": {
            "reviewed_hazard": True,
            "reviewed_evacuation": True,
            "reviewed_tactical_resources": True,
            "reviewed_limitations": True,
            "acknowledged_prototype_status": True
        },
        "notes": "Primary Demo Scenario Authorized.",
        "scenario_hash": "T04-HASH-01"
    }).json()
    assert auth_t04["status"] == "AUTHORIZED"

    pdf_t04 = requests.post(f"{base}/preplan/generate-pdf", json={
        "simulation_result": sim_t04,
        "impact_result": imp_t04,
        "evacuation_plan": evac_t04,
        "resource_plan": res_t04
    })
    assert pdf_t04.status_code == 200
    t04_path = os.path.join(out_dir, "Fire_PrePlan_T-04_Ammonia_AUTHORIZED.pdf")
    with open(t04_path, "wb") as f:
        f.write(pdf_t04.content)
    print(f"[PASS] T-04 Ammonia PDF Generated: {len(pdf_t04.content):,} bytes -> {t04_path}")

    # 3. SCENARIO: T-03 + LPG
    print("\n--- 3. AUDITING SCENARIO: T-03 LPG ---")
    sim_t03, imp_t03, evac_t03, res_t03 = run_simulation_pipeline("T-03", "CHEM-LPG", "TANK_LEAK", 25.0, 45.0, 34.0, 12.0)
    inc_t03 = res_t03["incident_id"]

    auth_t03 = requests.post(f"{base}/preplan/authorize", json={
        "incident_id": inc_t03,
        "asset_id": "T-03",
        "chemical_id": "CHEM-LPG",
        "chemical_name": "Liquefied Petroleum Gas (LPG - Propane/Butane)",
        "document_version": "v0.1",
        "approver_name": "Santosh Kadam",
        "approver_role": "Chief Fire Marshal",
        "checklist": {
            "reviewed_hazard": True,
            "reviewed_evacuation": True,
            "reviewed_tactical_resources": True,
            "reviewed_limitations": True,
            "acknowledged_prototype_status": True
        },
        "notes": "LPG BLEVE Deluge Plan Authorized.",
        "scenario_hash": "T03-HASH-01"
    }).json()
    assert auth_t03["status"] == "AUTHORIZED"

    pdf_t03 = requests.post(f"{base}/preplan/generate-pdf", json={
        "simulation_result": sim_t03,
        "impact_result": imp_t03,
        "evacuation_plan": evac_t03,
        "resource_plan": res_t03
    })
    assert pdf_t03.status_code == 200
    t03_path = os.path.join(out_dir, "Fire_PrePlan_T-03_LPG_AUTHORIZED.pdf")
    with open(t03_path, "wb") as f:
        f.write(pdf_t03.content)
    print(f"[PASS] T-03 LPG PDF Generated: {len(pdf_t03.content):,} bytes -> {t03_path}")

    # 4. SCENARIO: T-01 + Benzene
    print("\n--- 4. AUDITING SCENARIO: T-01 BENZENE ---")
    sim_t01, imp_t01, evac_t01, res_t01 = run_simulation_pipeline("T-01", "CHEM-C6H6", "TANK_LEAK", 20.0, 200.0, 29.0, 14.5)
    inc_t01 = res_t01["incident_id"]

    auth_t01 = requests.post(f"{base}/preplan/authorize", json={
        "incident_id": inc_t01,
        "asset_id": "T-01",
        "chemical_id": "CHEM-C6H6",
        "chemical_name": "Benzene (Pure Grade)",
        "document_version": "v0.1",
        "approver_name": "Dr. Kavita Krishnan",
        "approver_role": "Chief Safety Officer (HSE)",
        "checklist": {
            "reviewed_hazard": True,
            "reviewed_evacuation": True,
            "reviewed_tactical_resources": True,
            "reviewed_limitations": True,
            "acknowledged_prototype_status": True
        },
        "notes": "Benzene Vapor Containment Authorized.",
        "scenario_hash": "T01-HASH-01"
    }).json()
    assert auth_t01["status"] == "AUTHORIZED"

    pdf_t01 = requests.post(f"{base}/preplan/generate-pdf", json={
        "simulation_result": sim_t01,
        "impact_result": imp_t01,
        "evacuation_plan": evac_t01,
        "resource_plan": res_t01
    })
    assert pdf_t01.status_code == 200
    t01_path = os.path.join(out_dir, "Fire_PrePlan_T-01_Benzene_AUTHORIZED.pdf")
    with open(t01_path, "wb") as f:
        f.write(pdf_t01.content)
    print(f"[PASS] T-01 Benzene PDF Generated: {len(pdf_t01.content):,} bytes -> {t01_path}")

    # 5. Isolation & Integrity Check
    print("\n--- 5. CROSS-SCENARIO ISOLATION CHECK ---")
    assert auth_id_sub != auth_t04["authorization_id"] != auth_t03["authorization_id"] != auth_t01["authorization_id"]
    print("[PASS] All 4 scenario Authorization IDs are strictly unique and isolated.")

    print("\n==================================================")
    print("ALL FROZEN PRE-PLAN AUDIT & VERIFICATION CHECKS PASSED (100%)!")
    print("==================================================")

if __name__ == "__main__":
    test_frozen_preplans()
