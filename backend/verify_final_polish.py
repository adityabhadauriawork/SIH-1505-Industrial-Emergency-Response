import requests
import json
import os

base = "http://127.0.0.1:8000/api"
out_dir = r"A:\SIH-1505\backend\generated_preplans"
os.makedirs(out_dir, exist_ok=True)

def run_simulation_pipeline(asset_id, chem_id, incident_type, q_kg_s, wind_deg, temp_c=32.0):
    sim = requests.post(f"{base}/hazard/simulate", json={
        "title": f"Incident Test {asset_id}",
        "asset_id": asset_id,
        "chemical_id": chem_id,
        "incident_type": incident_type,
        "release_rate_kg_s": q_kg_s,
        "release_duration_min": 30,
        "wind_speed_kmh": 14.5,
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

def test_final_document_polish():
    print("==================================================")
    print("FINAL FIRE PRE-PLAN POLISH & GOVERNANCE AUDIT")
    print("==================================================")

    # ----------------------------------------------------
    # 1. SCENARIO A: T-01 BENZENE (PRE-APPROVAL & POST-APPROVAL)
    # ----------------------------------------------------
    print("\n--- 1. AUDITING SCENARIO A: T-01 BENZENE ---")
    sim_t01, imp_t01, evac_t01, res_t01 = run_simulation_pipeline("T-01", "CHEM-C6H6", "TANK_LEAK", 20.0, 200.0, 29.0)
    inc_t01 = res_t01["incident_id"]

    # Pre-Approval State Inspection
    pre_auth_res = requests.get(f"{base}/preplan/authorization/{inc_t01}?asset_id=T-01&chemical_id=CHEM-C6H6&chemical_name=Benzene%20(Pure%20Grade)&scenario_hash=T-01-HASH-V1")
    assert pre_auth_res.status_code == 200
    pre_auth = pre_auth_res.json()
    assert pre_auth["status"] == "PENDING_HUMAN_AUTHORIZATION"
    assert pre_auth["document_version"] == "v0.1"
    assert pre_auth["approver_name"] is None
    assert pre_auth["approver_role"] is None
    assert pre_auth["checklist_completed"] is False
    print(f"[PASS] Pre-Approval State: Status='{pre_auth['status']}', Version='{pre_auth['document_version']}', Approver=None")

    # Generate Pre-Approval DRAFT PDF
    draft_pdf = requests.post(f"{base}/preplan/generate-pdf", json={
        "simulation_result": sim_t01,
        "impact_result": imp_t01,
        "evacuation_plan": evac_t01,
        "resource_plan": res_t01
    })
    assert draft_pdf.status_code == 200
    draft_path = os.path.join(out_dir, "Fire_PrePlan_T-01_Benzene_DRAFT.pdf")
    with open(draft_path, "wb") as f:
        f.write(draft_pdf.content)
    print(f"[PASS] Generated Draft PDF: {len(draft_pdf.content):,} bytes -> {draft_path}")

    # Submit Human Approval
    auth_req_payload = {
        "incident_id": inc_t01,
        "asset_id": "T-01",
        "chemical_id": "CHEM-C6H6",
        "chemical_name": "Benzene (Pure Grade)",
        "document_version": "v0.1",
        "approver_name": "Commander Ramesh Thapa",
        "approver_role": "Chief Safety Officer (HSE)",
        "checklist": {
            "reviewed_hazard": True,
            "reviewed_evacuation": True,
            "reviewed_tactical_resources": True,
            "reviewed_limitations": True,
            "acknowledged_prototype_status": True
        },
        "notes": "Pre-plan reviewed and authorized for Demonstration Shift Alpha.",
        "scenario_hash": "T-01-HASH-V1"
    }
    post_auth_res = requests.post(f"{base}/preplan/authorize", json=auth_req_payload)
    assert post_auth_res.status_code == 200
    post_auth = post_auth_res.json()
    assert post_auth["status"] == "AUTHORIZED"
    assert post_auth["document_version"] == "v1.0"
    assert post_auth["approver_name"] == "Commander Ramesh Thapa"
    assert post_auth["approval_timestamp"] is not None
    auth_id_t01 = post_auth["authorization_id"]
    print(f"[PASS] Post-Approval State: Status='{post_auth['status']}', Version='{post_auth['document_version']}', Approver='{post_auth['approver_name']}', AuthID='{auth_id_t01}'")

    # Generate Post-Approval AUTHORIZED PDF
    auth_pdf = requests.post(f"{base}/preplan/generate-pdf", json={
        "simulation_result": sim_t01,
        "impact_result": imp_t01,
        "evacuation_plan": evac_t01,
        "resource_plan": res_t01
    })
    assert auth_pdf.status_code == 200
    auth_path = os.path.join(out_dir, "Fire_PrePlan_T-01_Benzene_AUTHORIZED.pdf")
    with open(auth_path, "wb") as f:
        f.write(auth_pdf.content)
    print(f"[PASS] Generated Authorized PDF: {len(auth_pdf.content):,} bytes -> {auth_path}")

    # ----------------------------------------------------
    # 2. SCENARIO B: T-03 LPG (ISOLATED APPROVAL)
    # ----------------------------------------------------
    print("\n--- 2. AUDITING SCENARIO B: T-03 LPG ---")
    sim_t03, imp_t03, evac_t03, res_t03 = run_simulation_pipeline("T-03", "CHEM-LPG", "TANK_LEAK", 25.0, 45.0, 34.0)
    inc_t03 = res_t03["incident_id"]

    auth_t03_res = requests.post(f"{base}/preplan/authorize", json={
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
        "notes": "LPG BLEVE mitigation plan authorized with 3250L foam concentrate.",
        "scenario_hash": "T-03-HASH-V1"
    })
    assert auth_t03_res.status_code == 200
    auth_t03 = auth_t03_res.json()
    assert auth_t03["status"] == "AUTHORIZED"
    assert auth_t03["incident_id"] == inc_t03
    assert auth_t03["authorization_id"] != auth_id_t01, "Authorization IDs must be isolated per incident"
    
    auth_t03_pdf = requests.post(f"{base}/preplan/generate-pdf", json={
        "simulation_result": sim_t03,
        "impact_result": imp_t03,
        "evacuation_plan": evac_t03,
        "resource_plan": res_t03
    })
    assert auth_t03_pdf.status_code == 200
    t03_pdf_path = os.path.join(out_dir, "Fire_PrePlan_T-03_LPG_AUTHORIZED.pdf")
    with open(t03_pdf_path, "wb") as f:
        f.write(auth_t03_pdf.content)
    print(f"[PASS] T-03 LPG Authorized independently: AuthID='{auth_t03['authorization_id']}', Approver='{auth_t03['approver_name']}', PDF={len(auth_t03_pdf.content):,} bytes")

    # ----------------------------------------------------
    # 3. REJECTION & REVISION FLOW
    # ----------------------------------------------------
    print("\n--- 3. AUDITING REJECTION & REVISION FLOW ---")
    rej_res = requests.post(f"{base}/preplan/reject", json={
        "incident_id": inc_t01,
        "reviewer_name": "Dr. Kavita Krishnan",
        "rejection_reason": "Gate 2 access road blocked by delivery tankers; re-route required.",
        "document_version": "v1.0"
    })
    assert rej_res.status_code == 200
    rej_data = rej_res.json()
    assert rej_data["status"] == "REJECTED"
    print(f"[PASS] Rejection Recorded: Status='{rej_data['status']}', Reason='{rej_data['rejection_reason']}'")

    # ----------------------------------------------------
    # 4. SCENARIO MODIFICATION / SUPERSESSION CHECK
    # ----------------------------------------------------
    print("\n--- 4. AUDITING SCENARIO MODIFICATION SUPERSESSION ---")
    # Re-authorize T-01
    requests.post(f"{base}/preplan/authorize", json=auth_req_payload)
    # Modify scenario hash (e.g. wind changed from 200° to 45°)
    super_check = requests.get(f"{base}/preplan/authorization/{inc_t01}?asset_id=T-01&chemical_id=CHEM-C6H6&chemical_name=Benzene%20(Pure%20Grade)&scenario_hash=T-01-HASH-MODIFIED-V2").json()
    assert super_check["status"] == "SUPERSEDED", f"Expected SUPERSEDED, got {super_check['status']}"
    print(f"[PASS] Changed scenario hash triggered SUPERSEDED status: Status='{super_check['status']}'")

    print("\n==================================================")
    print("ALL FINAL POLISH & GOVERNANCE AUDIT CHECKS PASSED (100%)!")
    print("==================================================")

if __name__ == "__main__":
    test_final_document_polish()
