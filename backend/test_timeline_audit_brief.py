from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.services.site.site_service import site_service
from app.services.chemicals.chemical_service import chemical_service
from app.services.hazard.hazard_service import hazard_service
from app.services.impact.impact_service import impact_service
from app.services.evacuation.evacuation_service import evacuation_service
from app.services.resources.resource_service import resource_service
from app.services.predictive.domino_service import domino_service
from app.services.analytics.timeline_service import timeline_service
from app.services.audit.audit_service import audit_service
from app.services.copilot.executive_brief_service import executive_brief_service
from app.services.copilot.copilot_service import copilot_service
from app.schemas.copilot import CopilotChatRequest

def test_new_capabilities_vertical_slice():
    print("==================================================")
    print("RUNNING TIMELINE, AUDIT, DOMINO & EXECUTIVE BRIEF AUDIT")
    print("==================================================")

    # 1. Setup in-memory db
    engine = create_engine("sqlite:///:memory:")
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    site_service.load_seed_data_if_empty(db)

    # 2. Run standard T-04 simulation pipeline
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
        "id": "CHEM-NH3", "name": "Ammonia (Anhydrous)", "molecular_weight": 17.03,
        "erpg_1_ppm": 25.0, "erpg_2_ppm": 150.0, "erpg_3_ppm": 750.0, "idlh_ppm": 300.0
    }
    source_coords = [21.6855, 72.5745]

    sim_res = hazard_service.simulate_scenario(scenario_dict, chemical_dict, source_coords)
    imp_res = impact_service.evaluate_impact(db, sim_res, time_step_sec=120)
    evac_res = evacuation_service.generate_evacuation_plan(db, sim_res, imp_res, source_coords, "T-04 Vicinity")
    res_plan = resource_service.optimize_resources(db, sim_res, imp_res, evac_res)

    sim_dict = sim_res.model_dump()
    imp_dict = imp_res.model_dump()
    evac_dict = evac_res.model_dump()
    res_dict = res_plan.model_dump()

    # 3. Test Domino / Cascade Risk Analysis
    print("\n--- 1. Testing Domino / Cascade Risk Service ---")
    domino_res = domino_service.analyze_cascade_risk(db, sim_dict, imp_dict)
    assert domino_res.source_asset_id == "T-04"
    assert domino_res.overall_screening_cascade_level in ["CRITICAL", "HIGH", "ELEVATED", "LOW"]
    assert len(domino_res.domino_chain) > 0
    assert len(domino_res.prioritized_mitigation_actions) >= 3
    print(f"[PASS] Domino Risk: Level='{domino_res.overall_screening_cascade_level}', Threatened Units={len(domino_res.domino_chain)}, Top Threatened='{domino_res.domino_chain[0].asset_name}' ({domino_res.domino_chain[0].screening_cascade_risk})")

    # 4. Test Incident Timeline Service
    print("\n--- 2. Testing Incident Timeline Service ---")
    timeline_res = timeline_service.generate_timeline(sim_dict, imp_dict, evac_dict, res_dict, {"status": "AUTHORIZED", "approver_name": "Demo HSE Controller"})
    assert timeline_res.asset_id == "T-04"
    assert timeline_res.total_events >= 8
    assert any(e.event_type == "INCIDENT_DETECTED" for e in timeline_res.events)
    assert any(e.event_type == "EVACUATION_ROUTED" for e in timeline_res.events)
    assert any(e.event_type == "TACTICAL_ALLOCATED" for e in timeline_res.events)
    assert any(e.event_type == "AUTHORIZATION_COMPLETED" for e in timeline_res.events)
    print(f"[PASS] Incident Timeline: Total Events={timeline_res.total_events}, Phase='{timeline_res.current_phase}', First='{timeline_res.events[0].title}', Last='{timeline_res.events[-1].title}'")

    # 5. Test Decision Audit Trail Service
    print("\n--- 3. Testing Decision Audit Trail Service ---")
    audit_service.record_decision(
        db=db,
        incident_id="INC-T04-LIVE",
        module="EVACUATION",
        input_summary="T-04 Ammonia Plume",
        recommendation="Muster at AP-3 via Gate 2",
        reason="Maximum standoff from toxic dispersion envelope",
        human_action="REVIEWED",
        actor_role="HSE_COMMANDER",
        actor_name="Demo Commander"
    )
    audits = audit_service.get_audit_trail(db, incident_id="INC-T04-LIVE")
    assert audits.total_records >= 1
    assert audits.records[0].module == "EVACUATION"
    assert audits.records[0].human_action == "REVIEWED"
    print(f"[PASS] Decision Audit Trail: Stored & Queried {audits.total_records} records successfully")

    # 6. Test Executive Situation Brief Service
    print("\n--- 4. Testing Executive Situation Brief Service ---")
    brief_res = executive_brief_service.generate_brief(
        sim_dict, imp_dict, evac_dict, res_dict,
        {"status": "AUTHORIZED", "approver_name": "Demo HSE Controller", "approver_role": "Chief HSE Officer"}
    )
    assert brief_res.primary_exit_gate == evac_res.primary_evacuation_route.recommended_gate_name
    assert brief_res.primary_assembly_point == evac_res.primary_evacuation_route.recommended_assembly_point_name
    assert len(brief_res.formatted_brief_markdown) > 200
    assert "EXECUTIVE SITUATION BRIEF" in brief_res.formatted_brief_markdown
    print(f"[PASS] Executive Situation Brief generated successfully ({brief_res.severity_category}, {brief_res.severity_score}/100, Markdown chars: {len(brief_res.formatted_brief_markdown)})")

    # 7. Test Role-Aware Copilot
    print("\n--- 5. Testing Role-Aware Copilot Engine ---")
    field_chat = copilot_service.process_query(
        db,
        CopilotChatRequest(
            query="What should I do right now?",
            user_role="FIELD_RESPONDER",
            simulation_result=sim_dict,
            impact_result=imp_dict,
            evacuation_plan=evac_dict,
            resource_plan=res_dict
        )
    )
    assert "FIELD ACTION DIRECTIVE" in field_chat.reply
    assert "PPE" in field_chat.reply

    audit_chat = copilot_service.process_query(
        db,
        CopilotChatRequest(
            query="Who approved this plan?",
            user_role="HSE_COMMANDER",
            simulation_result=sim_dict,
            impact_result=imp_dict,
            evacuation_plan=evac_dict,
            resource_plan=res_dict
        )
    )
    assert "Authorization Status" in audit_chat.reply or "Approved By" in audit_chat.reply or "Pre-Plan" in audit_chat.reply
    print(f"[PASS] Role-Aware Copilot responded appropriately to Field Responder & Audit inquiries")

    print("\n==================================================")
    print("ALL NEW SERVICES PASSED AUDIT (100% SUCCESS)!")
    print("==================================================")
    db.close()

if __name__ == "__main__":
    test_new_capabilities_vertical_slice()
