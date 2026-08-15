import requests
import json

base = "http://127.0.0.1:8000/api"

def audit_resource_scenario(title, asset_id, chem_id, incident_type, q_kg_s, wind_deg):
    print(f"\n=======================================================")
    print(f"AUDITING TACTICAL RESOURCES: {title}")
    print(f"Asset: {asset_id}, Chemical: {chem_id}, Incident: {incident_type}, Release: {q_kg_s} kg/s, Wind: {wind_deg} deg")
    print(f"=======================================================")
    
    sim = requests.post(f"{base}/hazard/simulate", json={
        "title": title,
        "asset_id": asset_id,
        "chemical_id": chem_id,
        "incident_type": incident_type,
        "release_rate_kg_s": q_kg_s,
        "release_duration_min": 30,
        "wind_speed_kmh": 12.0,
        "wind_direction_deg": wind_deg,
        "ambient_temp_c": 30.0,
        "atmospheric_stability": "D"
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

    print(f"Incident ID: {res['incident_id']} | Severity: {res['incident_severity']} | Substance: {res['chemical_name']}")
    disclaimer = res.get('decision_support_disclaimer', '').encode('ascii', 'ignore').decode('ascii')
    print(f"Disclaimer: {disclaimer}")
    print(f"Upwind Standoff: {res['standoff_upwind_m']}m | Isolation Cordon: {res['isolation_perimeter_m']}m")
    
    fw = res["foam_water_requirements"]
    print(f"Firewater Demand: {fw['firewater_demand_lpm']} LPM | Foam Concentrate: {fw['foam_concentrate_demand_liters']} L")
    print(f"PPE Requirement: {fw['ppe_required']}")
    print(f"Formula Basis: {fw.get('formula_basis')}")

    print("\nALLOCATED RESOURCES & GEOLOCATION ETAs:")
    for item in res["recommended_resources"]:
        print(f" - [{item['priority']}] {item['resource_name']} ({item['resource_type']})")
        print(f"   Station: {item['current_station']} -> Staging: {item['staging_area_name']}")
        print(f"   Transit Distance: {item['distance_to_staging_m']}m | Calculated ETA: {item['estimated_arrival_min']} min")
        print(f"   Role: {item['assigned_role']}")
        print(f"   Rationale: {item['tactical_rationale']}")
        print(f"   Equipment: {item['equipment_instructions']}\n")

    return res

if __name__ == "__main__":
    # Scenario A: T-04 Ammonia Cryogenic Header Rupture (Major Toxic Gas Release)
    res_a = audit_resource_scenario(
        "Scenario A: T-04 Ammonia Cryogenic Leak",
        "T-04", "CHEM-NH3", "PIPELINE_LEAK", 15.0, 195.0
    )

    # Scenario B: T-03 LPG Horton Sphere (BLEVE / Fire Explosion)
    res_b = audit_resource_scenario(
        "Scenario B: T-03 LPG Sphere BLEVE & Fire",
        "T-03", "CHEM-LPG", "FIRE_EXPLOSION", 35.0, 45.0
    )

    # Assertions proving genuinely dynamic behavior
    assert res_a["foam_water_requirements"]["foam_concentrate_demand_liters"] == 0.0, "Ammonia toxic release does not demand AFFF foam"
    assert res_b["foam_water_requirements"]["foam_concentrate_demand_liters"] > 0.0, "LPG fire requires flammable foam concentrate"
    assert res_a["recommended_resources"][0]["priority"] == "IMMEDIATE"
    assert "Level A" in res_a["foam_water_requirements"]["ppe_required"], "Ammonia requires Level A gas-tight suit"
    assert "Structural Firefighting" in res_b["foam_water_requirements"]["ppe_required"] or "Turnout" in res_b["foam_water_requirements"]["ppe_required"], "LPG fire requires structural bunker turnout gear"

    # Verify ETAs are calculated and different based on station location
    etas_a = [r["estimated_arrival_min"] for r in res_a["recommended_resources"]]
    assert len(set(etas_a)) > 1, "ETAs must be calculated from real transit distances, not fixed constants"
    print("\nALL DYNAMIC RESOURCE ENGINE ASSERTIONS PASSED PERFECTLY!")
