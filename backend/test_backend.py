import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.services.site.site_service import site_service
from app.services.chemicals.chemical_service import chemical_service
from app.services.scenarios.scenario_service import scenario_service
from app.services.hazard.hazard_service import hazard_service
from app.services.impact.impact_service import impact_service
from app.services.evacuation.evacuation_service import evacuation_service
from app.services.resources.resource_service import resource_service
from app.services.preplan.preplan_service import preplan_service

def test_full_vertical_slice():
    # 1. In-memory test db
    engine = create_engine("sqlite:///:memory:")
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # 2. Seed data
    site_service.load_seed_data_if_empty(db)
    site_data = site_service.get_full_site_data(db)
    assert site_data["plant"]["name"] == "PetroChem Complex Alpha - Unit 04"
    assert len(site_data["assets"]) >= 10
    assert len(site_data["workers"]) >= 20
    assert len(site_data["assembly_points"]) >= 4
    assert len(site_data["roads"]) >= 8

    # 3. Chemicals
    chemicals = chemical_service.get_all_chemicals(db)
    assert len(chemicals) >= 5
    nh3 = chemical_service.get_chemical_by_id(db, "CHEM-NH3")
    assert nh3 is not None
    assert nh3.molecular_weight == 17.03

    # 4. Presets
    presets = scenario_service.get_presets(db)
    assert len(presets) >= 3
    primary = presets[0]
    assert primary.asset_id == "T-04"

    # 5. Hazard Simulation
    scenario_dict = {
        "asset_id": "T-04",
        "chemical_id": "CHEM-NH3",
        "incident_type": "PIPELINE_LEAK",
        "release_rate_kg_s": 15.0,
        "wind_speed_kmh": 8.0,
        "wind_direction_deg": 45.0,
        "atmospheric_stability": "D",
        "ambient_temp_c": 32.0,
        "operating_pressure_bar": 4.5
    }
    chemical_dict = {
        "id": nh3.id,
        "name": nh3.name,
        "molecular_weight": nh3.molecular_weight,
        "erpg_1_ppm": nh3.erpg_1_ppm,
        "erpg_2_ppm": nh3.erpg_2_ppm,
        "erpg_3_ppm": nh3.erpg_3_ppm,
        "idlh_ppm": nh3.idlh_ppm
    }
    source_coords = [21.6855, 72.5745]

    sim_res = hazard_service.simulate_scenario(
        scenario_data=scenario_dict,
        chemical_data=chemical_dict,
        source_coords=source_coords
    )
    assert len(sim_res.time_steps) == 4
    assert len(sim_res.summary_zones) == 3
    assert sim_res.summary_zones[0].max_downwind_distance_m > 50.0

    # 6. Impact Assessment
    impact_res = impact_service.evaluate_impact(db, sim_res, time_step_sec=120)
    assert impact_res.affected_workers_count > 0
    assert impact_res.risk_assessment.overall_score > 50.0
    assert impact_res.safe_assembly_points_count >= 1

    # 7. Evacuation Routing
    evac_res = evacuation_service.generate_evacuation_plan(db, sim_res, impact_res)
    assert evac_res.primary_evacuation_route.total_distance_m > 0
    assert len(evac_res.primary_evacuation_route.steps) >= 2
    assert evac_res.primary_evacuation_route.route_geojson is not None

    # 8. Resource Optimization
    res_plan = resource_service.optimize_resources(db, sim_res, impact_res)
    assert len(res_plan.recommended_resources) >= 4
    assert len(res_plan.tactical_checklist) == 3

    # 9. PDF Fire Pre-Plan Generation
    pdf_bytes = preplan_service.generate_pdf_bytes(
        plant_info=site_data["plant"],
        simulation_result=sim_res,
        impact_result=impact_res,
        evac_plan=evac_res,
        resource_plan=res_plan
    )
    assert len(pdf_bytes) > 2000
    assert pdf_bytes[:4] == b"%PDF"

    print("\nSUCCESS: All vertical slice components passed backend verification tests!")
    db.close()

if __name__ == "__main__":
    test_full_vertical_slice()
