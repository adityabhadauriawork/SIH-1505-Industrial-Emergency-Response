import requests
import json
import os

base = "http://127.0.0.1:8000/api"

def run_simulation_pipeline(asset_id, chem_id, incident_type, q_kg_s, wind_deg, temp_c=32.0):
    sim = requests.post(f"{base}/hazard/simulate", json={
        "title": f"Incident Test {asset_id}",
        "asset_id": asset_id,
        "chemical_id": chem_id,
        "incident_type": incident_type,
        "release_rate_kg_s": q_kg_s,
        "release_duration_min": 30,
        "wind_speed_kmh": 12.0,
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

def test_authorization_lifecycle():
    print("==================================================")
    print("RUNNING HUMAN-IN-THE-LOOP AUTHORIZATION AUDIT")
    print("==================================================")

    # 1. Pipeline for T-04 Ammonia
    sim_t04, imp_t04, evac_t04, res_t04 = run_simulation_pipeline("T-04", "CHEM-NH3", "PIPELINE_LEAK", 15.0, 195.0)
    inc_t04 = res_t04["incident_id"]

    # 2. Check Initial Authorization Status (Expected: PENDING_HUMAN_AUTHORIZATION v0.1)
    status_res = requests.get(f"{base}/preplan/authorization/{inc_t04}?asset_id=T-04&chemical_id=CHEM-NH3&chemical_name=Ammonia%20(Anhydrous)")
    assert status_res.status_code == 200
    init_auth = status_res.json()
    assert init_auth["status"] == "PENDING_HUMAN_AUTHORIZATION"
    assert init_auth["document_version"] == "v0.1"
    assert init_auth["checklist_completed"] is False
    assert init_auth["approver_name"] is None
    print(f"[PASS] [1/7] Initial Pre-Plan Status is PENDING_HUMAN_AUTHORIZATION (Version: {init_auth['document_version']})")

    # 3. Test Draft PDF Generation before Authorization
    draft_pdf_res = requests.post(f"{base}/preplan/generate-pdf", json={
        "simulation_result": sim_t04,
        "impact_result": imp_t04,
        "evacuation_plan": evac_t04,
        "resource_plan": res_t04
    })
    assert draft_pdf_res.status_code == 200
    assert "DRAFT" in draft_pdf_res.headers.get("content-disposition", "")
    print(f"[PASS] [2/7] Draft PDF generated without approval signature ({len(draft_pdf_res.content):,} bytes)")

    # 4. Test Incomplete Review Checklist Rejection
    incomplete_payload = {
        "incident_id": inc_t04,
        "asset_id": "T-04",
        "chemical_id": "CHEM-NH3",
        "chemical_name": "Ammonia (Anhydrous)",
        "document_version": "v0.1",
        "approver_name": "Commander Ramesh Thapa",
        "approver_role": "Chief Fire Marshal",
        "checklist": {
            "reviewed_hazard": True,
            "reviewed_evacuation": True,
            "reviewed_tactical_resources": True,
            "reviewed_limitations": False,  # Missing checklist item
            "acknowledged_prototype_status": True
        }
    }
    fail_auth_res = requests.post(f"{base}/preplan/authorize", json=incomplete_payload)
    assert fail_auth_res.status_code == 400
    assert "checklist" in fail_auth_res.json()["detail"].lower()
    print("[PASS] [3/7] Incomplete review checklist rejected cleanly with HTTP 400")

    # 5. Submit Valid Human Authorization
    valid_payload = {
        "incident_id": inc_t04,
        "asset_id": "T-04",
        "chemical_id": "CHEM-NH3",
        "chemical_name": "Ammonia (Anhydrous)",
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
        "notes": "Plan approved for Shift Alpha execution. All perimeter cordons active.",
        "scenario_hash": "T-04-CHEM-NH3-HASH-01"
    }
    auth_success_res = requests.post(f"{base}/preplan/authorize", json=valid_payload)
    assert auth_success_res.status_code == 200
    approved_auth = auth_success_res.json()
    assert approved_auth["status"] == "AUTHORIZED"
    assert approved_auth["document_version"] == "v1.0"
    assert approved_auth["approver_name"] == "Commander Ramesh Thapa"
    assert approved_auth["approval_timestamp"] is not None
    auth_id = approved_auth["authorization_id"]
    print(f"[PASS] [4/7] Document Authorized: ID={auth_id}, Version={approved_auth['document_version']}, Approver='{approved_auth['approver_name']}'")

    # 6. Test Authorized PDF Generation
    auth_pdf_res = requests.post(f"{base}/preplan/generate-pdf", json={
        "simulation_result": sim_t04,
        "impact_result": imp_t04,
        "evacuation_plan": evac_t04,
        "resource_plan": res_t04
    })
    assert auth_pdf_res.status_code == 200
    assert "AUTHORIZED" in auth_pdf_res.headers.get("content-disposition", "")
    print(f"[PASS] [5/7] Authorized PDF generated with demonstration signature & governance record ({len(auth_pdf_res.content):,} bytes)")

    # 7. Test Rejection / Revision Flow
    rej_payload = {
        "incident_id": inc_t04,
        "reviewer_name": "Dr. Kavita Krishnan",
        "rejection_reason": "Gate 2 access road blocked by delivery tankers; re-route required.",
        "document_version": "v1.0"
    }
    rej_res = requests.post(f"{base}/preplan/reject", json=rej_payload)
    assert rej_res.status_code == 200
    rej_data = rej_res.json()
    assert rej_data["status"] == "REJECTED"
    assert "blocked" in rej_data["rejection_reason"]
    print(f"[PASS] [6/7] Rejection recorded successfully: Status={rej_data['status']}, Reason='{rej_data['rejection_reason']}'")

    # 8. Test Separate Authorization for Scenario B (T-03 LPG)
    sim_t03, imp_t03, evac_t03, res_t03 = run_simulation_pipeline("T-03", "CHEM-LPG", "TANK_LEAK", 25.0, 45.0)
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
        "scenario_hash": "T-03-CHEM-LPG-HASH-02"
    })
    assert auth_t03_res.status_code == 200
    auth_t03 = auth_t03_res.json()
    assert auth_t03["status"] == "AUTHORIZED"
    assert auth_t03["incident_id"] == inc_t03
    assert auth_t03["authorization_id"] != auth_id, "Authorization IDs must be unique across incidents"
    print(f"[PASS] [7/7] T-03 LPG Authorized independently: ID={auth_t03['authorization_id']}, Approver='{auth_t03['approver_name']}'")

    print("\n==================================================")
    print("ALL HUMAN AUTHORIZATION GOVERNANCE CHECKS PASSED (100%)!")
    print("==================================================")

if __name__ == "__main__":
    test_authorization_lifecycle()
