import math
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.services.site.site_service import site_service
from app.services.chemicals.chemical_service import chemical_service
from app.services.whatif.whatif_service import whatif_service
from app.schemas.whatif import WhatIfScenarioInput, WhatIfComparisonRequest

def test_whatif_wind_direction_consistency():
    print("==================================================")
    print("RUNNING WHAT-IF WIND DIRECTION BEARING REGRESSION TEST")
    print("==================================================")

    # 1. Setup in-memory db
    engine = create_engine("sqlite:///:memory:")
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    site_service.load_seed_data_if_empty(db)

    # 2. Configure Scenario A (Wind 45 deg)
    scenario_a = WhatIfScenarioInput(
        label="Scenario A (Wind 45 deg)",
        asset_id="T-04",
        chemical_id="CHEM-NH3",
        incident_type="PIPELINE_LEAK",
        release_rate_kg_s=15.0,
        release_duration_min=30,
        wind_speed_kmh=12.0,
        wind_direction_deg=45.0,
        ambient_temp_c=32.0,
        atmospheric_stability="D"
    )

    # 3. Configure Scenario B (Wind 225 deg)
    scenario_b = WhatIfScenarioInput(
        label="Scenario B (Wind 225 deg)",
        asset_id="T-04",
        chemical_id="CHEM-NH3",
        incident_type="PIPELINE_LEAK",
        release_rate_kg_s=15.0,
        release_duration_min=30,
        wind_speed_kmh=12.0,
        wind_direction_deg=225.0,
        ambient_temp_c=32.0,
        atmospheric_stability="D"
    )

    req = WhatIfComparisonRequest(scenario_a=scenario_a, scenario_b=scenario_b)
    comparison = whatif_service.compare_scenarios(db, req)

    sim_a = comparison.scenario_a_simulation
    sim_b = comparison.scenario_b_simulation

    print(f"\n[Scenario A]: Wind FROM {sim_a.wind_direction_deg}° ({sim_a.wind_direction_cardinal})")
    print(f"  Plume travel direction: {(sim_a.wind_direction_deg + 180) % 360}°")
    print(f"  Red Zone max reach: {comparison.scenario_a.red_reach_m}m")
    print(f"  Exposed workers: {comparison.scenario_a.exposed_workers}")
    print(f"  Recommended muster: {comparison.scenario_a.muster_point} via {comparison.scenario_a.exit_gate}")

    print(f"\n[Scenario B]: Wind FROM {sim_b.wind_direction_deg}° ({sim_b.wind_direction_cardinal})")
    print(f"  Plume travel direction: {(sim_b.wind_direction_deg + 180) % 360}°")
    print(f"  Red Zone max reach: {comparison.scenario_b.red_reach_m}m")
    print(f"  Exposed workers: {comparison.scenario_b.exposed_workers}")
    print(f"  Recommended muster: {comparison.scenario_b.muster_point} via {comparison.scenario_b.exit_gate}")

    # Assertions proving spatial differences
    assert sim_a.wind_direction_deg == 45.0
    assert sim_b.wind_direction_deg == 225.0
    assert sim_a.wind_direction_deg != sim_b.wind_direction_deg

    # Check that GeoJSON polygons for Scenario A vs Scenario B point in opposite directions
    poly_a_coords = sim_a.time_steps[-1].geojson["features"][0]["geometry"]["coordinates"][0]
    poly_b_coords = sim_b.time_steps[-1].geojson["features"][0]["geometry"]["coordinates"][0]

    # Calculate centroid / mean latitude and longitude for zone 0
    mean_lat_a = sum(p[1] for p in poly_a_coords) / len(poly_a_coords)
    mean_lon_a = sum(p[0] for p in poly_a_coords) / len(poly_a_coords)
    mean_lat_b = sum(p[1] for p in poly_b_coords) / len(poly_b_coords)
    mean_lon_b = sum(p[0] for p in poly_b_coords) / len(poly_b_coords)

    src_lat, src_lon = sim_a.source_coordinates

    print(f"\nSpatial Coordinates Verification:")
    print(f"  Epicenter: Lat {src_lat:.5f}, Lon {src_lon:.5f}")
    print(f"  Scenario A (Wind 45°): Plume centroid Lat {mean_lat_a:.5f} (> src), Lon {mean_lon_a:.5f} (> src)")
    print(f"  Scenario B (Wind 225°): Plume centroid Lat {mean_lat_b:.5f} (< src), Lon {mean_lon_b:.5f} (< src)")

    # When wind bearing is 45°, plume orientation vectors into (+Lat, +Lon) quadrant
    assert mean_lat_a > src_lat
    assert mean_lon_a > src_lon

    # When wind bearing is 225°, plume orientation vectors into (-Lat, -Lon) quadrant
    assert mean_lat_b < src_lat
    assert mean_lon_b < src_lon

    # Verify downstream consequences: different assembly points selected based on plume direction
    assert comparison.scenario_a.muster_point != comparison.scenario_b.muster_point
    assert comparison.scenario_a.exit_gate != comparison.scenario_b.exit_gate

    print("\nSUCCESS: What-If Wind Direction independently shifted plume orientation, coordinates, and safe evacuation corridors!")
    db.close()

if __name__ == "__main__":
    test_whatif_wind_direction_consistency()
