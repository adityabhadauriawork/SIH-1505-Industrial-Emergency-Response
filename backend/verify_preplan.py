import requests
import json
import os

base = "http://127.0.0.1:8000/api"

def generate_and_audit_preplan(title, asset_id, chem_id, incident_type, q_kg_s, wind_deg):
    print(f"\n=======================================================")
    print(f"AUDITING FIRE PRE-PLAN: {title}")
    print(f"Asset: {asset_id}, Chemical: {chem_id}, Incident: {incident_type}")
    print(f"=======================================================")

    # 1. Simulate Hazard
    sim = requests.post(f"{base}/hazard/simulate", json={
        "title": title,
        "asset_id": asset_id,
        "chemical_id": chem_id,
        "incident_type": incident_type,
        "release_rate_kg_s": q_kg_s,
        "release_duration_min": 30,
        "wind_speed_kmh": 14.0,
        "wind_direction_deg": wind_deg,
        "ambient_temp_c": 32.0,
        "atmospheric_stability": "D",
        "weather_mode": "DEMO",
        "weather_source": "Scenario Preset"
    }).json()

    # 2. Analyze Impact
    imp = requests.post(f"{base}/impact/analyze?time_step_sec=120", json=sim).json()

    # 3. Calculate Evacuation Route
    evac = requests.post(f"{base}/evacuation/route?origin_name={asset_id}%20Vicinity", json={
        "simulation_result": sim,
        "impact_result": imp,
        "origin_coords": sim["source_coordinates"]
    }).json()

    # 4. Tactical Resources
    res = requests.post(f"{base}/resources/optimize", json={
        "simulation_result": sim,
        "impact_result": imp,
        "evacuation_plan": evac
    }).json()

    # 5. Generate Fire Pre-Plan PDF
    pdf_req = {
        "simulation_result": sim,
        "impact_result": imp,
        "evacuation_plan": evac,
        "resource_plan": res,
        "author_name": "Chief Safety Marshal Ramesh Thapa",
        "license_no": "PESO/IND/2024/MAH-1505"
    }

    pdf_res = requests.post(f"{base}/preplan/generate-pdf", json=pdf_req)
    assert pdf_res.status_code == 200, f"Failed to generate PDF: {pdf_res.text}"
    assert pdf_res.headers.get("content-type") == "application/pdf"
    
    pdf_bytes = pdf_res.content
    assert pdf_bytes[:4] == b"%PDF", "Response is not a valid PDF file"
    assert len(pdf_bytes) > 20000, f"PDF file too small ({len(pdf_bytes)} bytes), diagrams might be missing"

    disp_header = pdf_res.headers.get("content-disposition", "")
    print(f"[OK] Content-Disposition: {disp_header}")
    print(f"[OK] PDF Successfully Generated: {len(pdf_bytes):,} bytes")

    # Save to disk for inspection
    out_dir = os.path.join(os.path.dirname(__file__), "generated_preplans")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"Fire_PrePlan_{asset_id}_{chem_id}.pdf")
    with open(out_path, "wb") as f:
        f.write(pdf_bytes)
    print(f"[OK] Saved PDF to {out_path}")

    return {
        "sim": sim,
        "imp": imp,
        "evac": evac,
        "res": res,
        "pdf_bytes": pdf_bytes,
        "filename": disp_header
    }

def test_state_consistency_enforcement():
    print(f"\n=======================================================")
    print(f"AUDITING STATE CONSISTENCY VALIDATION & ERROR HANDLING")
    print(f"=======================================================")

    # Create a T-04 simulation
    sim_t04 = requests.post(f"{base}/hazard/simulate", json={
        "title": "T-04 Ammonia Cryogenic Header Rupture",
        "asset_id": "T-04",
        "chemical_id": "CHEM-NH3",
        "incident_type": "PIPELINE_LEAK",
        "release_rate_kg_s": 15.0,
        "release_duration_min": 30,
        "wind_speed_kmh": 8.0,
        "wind_direction_deg": 45.0
    }).json()

    imp_t04 = requests.post(f"{base}/impact/analyze?time_step_sec=120", json=sim_t04).json()
    evac_t04 = requests.post(f"{base}/evacuation/route?origin_name=T-04%20Vicinity", json={
        "simulation_result": sim_t04,
        "impact_result": imp_t04,
        "origin_coords": sim_t04["source_coordinates"]
    }).json()

    # Create a mismatched T-03 resource plan
    sim_t03 = requests.post(f"{base}/hazard/simulate", json={
        "title": "T-03 LPG Sphere Leak",
        "asset_id": "T-03",
        "chemical_id": "CHEM-LPG",
        "incident_type": "TANK_LEAK",
        "release_rate_kg_s": 25.0,
        "release_duration_min": 20,
        "wind_speed_kmh": 12.0,
        "wind_direction_deg": 90.0
    }).json()
    imp_t03 = requests.post(f"{base}/impact/analyze?time_step_sec=120", json=sim_t03).json()
    res_t03 = requests.post(f"{base}/resources/optimize", json={
        "simulation_result": sim_t03,
        "impact_result": imp_t03
    }).json()

    # Attempt to generate PDF with mismatched state (T-04 simulation with T-03 resources)
    mismatched_payload = {
        "simulation_result": sim_t04,
        "impact_result": imp_t04,
        "evacuation_plan": evac_t04,
        "resource_plan": res_t03
    }

    res_fail = requests.post(f"{base}/preplan/generate-pdf", json=mismatched_payload)
    print(f"Mismatched Request Status Code: {res_fail.status_code}")
    print(f"Error Response: {res_fail.text}")
    
    assert res_fail.status_code == 400, f"Expected HTTP 400 Bad Request, got {res_fail.status_code}"
    assert "State Inconsistency Error" in res_fail.json()["detail"]
    print("[PASS] Consistency validator successfully rejected mismatched state with HTTP 400!")

if __name__ == "__main__":
    print("==================================================")
    print("RUNNING FIRE PRE-PLAN GENERATOR AUDIT & VALIDATION")
    print("==================================================")

    # Scenario A: T-04 Ammonia Cryogenic Header Rupture
    doc_a = generate_and_audit_preplan(
        "T-04 Ammonia Cryogenic Header Rupture",
        "T-04", "CHEM-NH3", "PIPELINE_LEAK", 15.0, 195.0
    )
    assert "T-04" in doc_a["filename"]
    assert "Ammonia" in doc_a["filename"]

    # Scenario B: T-03 LPG Horton Sphere Bottom Valve Leak
    doc_b = generate_and_audit_preplan(
        "T-03 LPG Horton Sphere Bottom Valve Leak",
        "T-03", "CHEM-LPG", "TANK_LEAK", 25.0, 45.0
    )
    assert "T-03" in doc_b["filename"]
    assert "Liquefied_Petroleum_Gas" in doc_b["filename"] or "LPG" in doc_b["filename"]

    # Scenario C: State Consistency Enforcement Test
    test_state_consistency_enforcement()

    print("\n==================================================")
    print("ALL FIRE PRE-PLAN AUDIT & CONSISTENCY CHECKS PASSED (100%)!")
    print("==================================================")
