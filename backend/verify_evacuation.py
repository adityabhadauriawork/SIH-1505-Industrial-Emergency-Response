import requests
import json

base = "http://127.0.0.1:8000/api"

def run_scenario(name, wind_deg, wind_speed):
    print(f"\n=======================================================")
    print(f"EVALUATING: {name}")
    print(f"Wind: {wind_speed} km/h from {wind_deg} deg (Plume travels towards {(wind_deg + 180)%360} deg)")
    print(f"=======================================================")
    
    sim = requests.post(f"{base}/hazard/simulate", json={
        "title": name,
        "asset_id": "T-04",
        "chemical_id": "CHEM-NH3",
        "incident_type": "PIPELINE_LEAK",
        "release_rate_kg_s": 15.0,
        "release_duration_min": 30,
        "wind_speed_kmh": wind_speed,
        "wind_direction_deg": wind_deg,
        "ambient_temp_c": 30.0,
        "atmospheric_stability": "D"
    }).json()

    imp = requests.post(f"{base}/impact/analyze?time_step_sec=120", json=sim).json()
    
    evac = requests.post(f"{base}/evacuation/route?origin_name=T-04%20Vicinity", json={
        "simulation_result": sim,
        "impact_result": imp,
        "origin_coords": sim["source_coordinates"]
    }).json()

    route = evac["primary_evacuation_route"]
    print(f"RECOMMENDED ROUTE: {route['recommended_assembly_point_name']} via {route['recommended_gate_name']}")
    print(f"Total Distance: {route['total_distance_m']}m, Est Time: {route['estimated_evac_time_min']} min, Status: {route['route_status']}")
    
    if route.get("score_breakdown"):
        sb = route["score_breakdown"]
        print(f"Score Breakdown: Safety={sb['safety_score']}, Distance={sb['distance_score']}, ExposurePenalty={sb['exposure_penalty']}, CompositeScore={sb['composite_score']}")
        print(f"Reason: {sb['selection_reason']}")

    print("\nCANDIDATE COMPARISON & ALTERNATIVES:")
    for cand in evac.get("candidate_routes", []):
        print(f" - [{cand['route_status']}] {cand['target_assembly_point_name']} ({cand['total_distance_m']}m, {cand['estimated_evac_time_min']} min) | Composite: {cand['composite_score']} | Upwind: {cand['is_upwind']} ({cand['angular_clearance_deg']} deg) | Reason: {cand['rejection_reason'] or 'WINNER'}")

if __name__ == "__main__":
    # Scenario A: Live Weather (SSW 195 deg -> Plume travels towards 15 deg NNE)
    run_scenario("Scenario A: Live SSW Wind (195 deg)", 195.0, 18.0)

    # Scenario B: Demo Weather (NE 45 deg -> Plume travels towards 225 deg SW)
    run_scenario("Scenario B: Demo NE Wind (45 deg)", 45.0, 8.0)

    # Scenario C: East Wind (90 deg -> Plume travels towards 270 deg West)
    run_scenario("Scenario C: East Wind (90 deg)", 90.0, 12.0)
