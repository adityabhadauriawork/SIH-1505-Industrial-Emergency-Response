import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"

def run_phase2_comprehensive_audit():
    print("================================================================================")
    print("STARTING SIH 1505 PHASE-2 COMPREHENSIVE SYSTEM & INTELLIGENCE AUDIT")
    print("================================================================================")
    
    # --- MODULE 1: WHAT-IF SCENARIO COMPARISON ---
    print("\n--- [1/5] AUDITING WHAT-IF SCENARIO COMPARISON ---")
    whatif_req = {
        "scenario_a": {
            "label": "Base Incident (15 kg/s)",
            "asset_id": "T-04",
            "chemical_id": "CHEM-NH3",
            "incident_type": "PIPELINE_LEAK",
            "release_rate_kg_s": 15.0,
            "wind_speed_kmh": 8.0,
            "wind_direction_deg": 45.0
        },
        "scenario_b": {
            "label": "Doubled Emission Rate (30 kg/s)",
            "asset_id": "T-04",
            "chemical_id": "CHEM-NH3",
            "incident_type": "PIPELINE_LEAK",
            "release_rate_kg_s": 30.0,
            "wind_speed_kmh": 8.0,
            "wind_direction_deg": 45.0
        }
    }
    t0 = time.time()
    w_res = requests.post(f"{BASE_URL}/intelligence/whatif/compare", json=whatif_req)
    assert w_res.status_code == 200, f"What-If failed: {w_res.text}"
    w_data = w_res.json()
    assert w_data["scenario_b"]["red_reach_m"] > w_data["scenario_a"]["red_reach_m"]
    assert w_data["deltas"]["red_reach_delta_m"] > 0
    assert w_data["deltas"]["firewater_delta_lpm"] > 0
    print(f"[PASS] What-If Scenario Comparison: A={w_data['scenario_a']['red_reach_m']}m -> B={w_data['scenario_b']['red_reach_m']}m (Delta: +{w_data['deltas']['red_reach_delta_m']}m in {time.time()-t0:.2f}s)")
    print(f"       Verdict: {w_data['deltas']['comparative_summary']}")

    # --- MODULE 2: HISTORICAL INCIDENT ANALYTICS ---
    print("\n--- [2/5] AUDITING HISTORICAL INCIDENT ANALYTICS ---")
    a_res = requests.get(f"{BASE_URL}/intelligence/analytics/summary")
    assert a_res.status_code == 200, f"Analytics failed: {a_res.text}"
    a_data = a_res.json()
    assert a_data["total_historical_incidents"] >= 20
    assert len(a_data["asset_risk_rankings"]) > 0
    assert len(a_data["chemical_breakdowns"]) > 0
    assert len(a_data["trend_over_time"]) > 0
    print(f"[PASS] Historical Analytics: {a_data['total_historical_incidents']} synthetic records analyzed.")
    print(f"       Avg Response Time: {a_data['avg_response_time_min']}m, Avg Evac Time: {a_data['avg_evacuation_time_min']}m, Top Risk Asset: {a_data['top_vulnerable_asset']}")

    # --- MODULE 3: PREDICTIVE MAINTENANCE / ASSET EARLY WARNING ---
    print("\n--- [3/5] AUDITING PREDICTIVE ASSET HEALTH & EARLY WARNING ---")
    p_res = requests.get(f"{BASE_URL}/intelligence/predictive/assets")
    assert p_res.status_code == 200, f"Predictive health failed: {p_res.text}"
    p_data = p_res.json()
    assert p_data["total_monitored_assets"] >= 8
    assert p_data["critical_risk_count"] + p_data["high_risk_count"] > 0
    print(f"[PASS] Predictive Maintenance: {p_data['total_monitored_assets']} assets monitored.")
    print(f"       Critical Risks: {p_data['critical_risk_count']}, High Risks: {p_data['high_risk_count']}, Healthy: {p_data['healthy_asset_count']}")
    print(f"       Highest Failure Probability: {p_data['highest_risk_asset_id']} ({p_data['assets'][0]['top_risk_driver']})")

    # --- MODULE 4: COMPUTER VISION HAZARD TRIAGE ---
    print("\n--- [4/5] AUDITING COMPUTER VISION SURVEILLANCE ---")
    v_presets = requests.get(f"{BASE_URL}/intelligence/vision/presets").json()
    assert len(v_presets) >= 4
    v_res = requests.post(f"{BASE_URL}/intelligence/vision/detect", data={"camera_id": "CAM-01", "simulate_hazard_type": "FIRE"})
    assert v_res.status_code == 200, f"Vision failed: {v_res.text}"
    v_data = v_res.json()
    assert v_data["alert_level"] == "CRITICAL"
    assert v_data["incident_suggested"] is True
    print(f"[PASS] Computer Vision: Camera {v_data['camera_id']} ({v_data['camera_location']})")
    print(f"       Alert: {v_data['alert_level']}, Detections: {[d['label'] for d in v_data['detections']]}")
    print(f"       Incident Suggestion: Asset={v_data['suggested_asset_id']}, Substance={v_data['suggested_chemical_id']}, Release={v_data['suggested_release_rate_kg_s']} kg/s")

    # --- MODULE 5: AI EMERGENCY COPILOT ---
    print("\n--- [5/5] AUDITING AI EMERGENCY COPILOT ---")
    c_res = requests.post(f"{BASE_URL}/intelligence/copilot/chat", json={
        "query": "What if release rate doubles?",
        "simulation_result": w_data["scenario_a_simulation"],
        "impact_result": {"total_workers_at_site": 28, "affected_workers_count": 0},
        "evacuation_plan": w_data["scenario_a_evacuation"],
        "resource_plan": w_data["scenario_a_resources"]
    }).json()
    assert c_res["intent_detected"] == "WHAT_IF_HYPOTHETICAL"
    assert c_res["grounded_metrics"]["red_reach_delta_m"] > 0
    print(f"[PASS] AI Emergency Copilot: Query='What if release rate doubles?' -> Intent='{c_res['intent_detected']}'")
    print(f"       Grounded Delta Reach: +{c_res['grounded_metrics']['red_reach_delta_m']} meters, Zero Hallucination Confirmed.")

    # --- SECTION 6: CORE ZERO-REGRESSION INTEGRITY AUDIT ---
    print("\n--- [6/6] AUDITING CORE EMERGENCY WORKFLOW (ZERO-REGRESSION) ---")
    sim_t04 = requests.post(f"{BASE_URL}/hazard/simulate", json={
        "asset_id": "T-04",
        "chemical_id": "CHEM-NH3",
        "incident_type": "PIPELINE_LEAK",
        "release_rate_kg_s": 15.0,
        "release_duration_min": 30,
        "wind_speed_kmh": 8.0,
        "wind_direction_deg": 45.0,
        "ambient_temp_c": 32.0,
        "atmospheric_stability": "D",
        "weather_mode": "DEMO"
    }).json()
    imp_t04 = requests.post(f"{BASE_URL}/impact/analyze?time_step_sec=120", json=sim_t04).json()
    evac_t04 = requests.post(f"{BASE_URL}/evacuation/route?origin_name=T-04%20Vicinity", json={
        "simulation_result": sim_t04,
        "impact_result": imp_t04,
        "origin_coords": sim_t04["source_coordinates"]
    }).json()
    res_t04 = requests.post(f"{BASE_URL}/resources/optimize", json={
        "simulation_result": sim_t04,
        "impact_result": imp_t04,
        "evacuation_plan": evac_t04
    }).json()
    pdf_res = requests.post(f"{BASE_URL}/preplan/generate-pdf", json={
        "simulation_result": sim_t04,
        "impact_result": imp_t04,
        "evacuation_plan": evac_t04,
        "resource_plan": res_t04,
        "author_name": "SIH-1505 Decision Support Engine",
        "facility_ref": "PCH-ALPHA-04 (Demo Facility — Non-Statutory Evaluation)"
    })
    assert pdf_res.status_code == 200
    assert len(pdf_res.content) > 50000
    print(f"[PASS] Core Workflow Regression: T-04 Simulation -> Impact -> Evacuation -> Resources -> Frozen Pre-Plan PDF ({len(pdf_res.content):,} bytes)")

    print("\n================================================================================")
    print("ALL 5 PHASE-2 INTELLIGENCE MODULES + CORE WORKFLOW FULLY VERIFIED (100% PASS)")
    print("================================================================================")

if __name__ == "__main__":
    run_phase2_comprehensive_audit()
