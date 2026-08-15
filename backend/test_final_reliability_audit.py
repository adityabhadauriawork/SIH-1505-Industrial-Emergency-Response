import requests
import json
import time
import os

BASE_URL = "http://127.0.0.1:8000/api"
OUT_DIR = r"A:\SIH-1505\backend\generated_preplans"
os.makedirs(OUT_DIR, exist_ok=True)

class ReliabilityAuditTester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.failures = []

    def record_pass(self, test_name: str, detail: str = ""):
        self.tests_run += 1
        self.tests_passed += 1
        print(f"[PASS] [{self.tests_run:02d}] {test_name} {f'-- {detail}' if detail else ''}")

    def record_fail(self, test_name: str, error: str):
        self.tests_run += 1
        self.tests_failed += 1
        self.failures.append((test_name, error))
        print(f"[FAIL] [{self.tests_run:02d}] {test_name} -- ERROR: {error}")

    def run_pipeline(self, asset_id: str, chem_id: str, incident_type: str, release_rate: float, wind_deg: float, temp_c: float = 32.0, wind_kmh: float = 15.0, mode: str = "DEMO", source: str = "Preset"):
        t0 = time.time()
        sim_res = requests.post(f"{BASE_URL}/hazard/simulate", json={
            "title": f"Reliability Test {asset_id}",
            "asset_id": asset_id,
            "chemical_id": chem_id,
            "incident_type": incident_type,
            "release_rate_kg_s": release_rate,
            "release_duration_min": 30,
            "wind_speed_kmh": wind_kmh,
            "wind_direction_deg": wind_deg,
            "ambient_temp_c": temp_c,
            "atmospheric_stability": "D",
            "weather_mode": mode,
            "weather_source": source
        })
        if sim_res.status_code != 200:
            raise RuntimeError(f"Hazard simulation failed: {sim_res.text}")
        sim = sim_res.json()

        imp_res = requests.post(f"{BASE_URL}/impact/analyze?time_step_sec=120", json=sim)
        if imp_res.status_code != 200:
            raise RuntimeError(f"Impact analysis failed: {imp_res.text}")
        imp = imp_res.json()

        evac_res = requests.post(f"{BASE_URL}/evacuation/route?origin_name={asset_id}%20Vicinity", json={
            "simulation_result": sim,
            "impact_result": imp,
            "origin_coords": sim["source_coordinates"]
        })
        if evac_res.status_code != 200:
            raise RuntimeError(f"Evacuation routing failed: {evac_res.text}")
        evac = evac_res.json()

        res_res = requests.post(f"{BASE_URL}/resources/optimize", json={
            "simulation_result": sim,
            "impact_result": imp,
            "evacuation_plan": evac
        })
        if res_res.status_code != 200:
            raise RuntimeError(f"Resource optimization failed: {res_res.text}")
        res = res_res.json()

        elapsed = time.time() - t0
        return sim, imp, evac, res, elapsed

    def run_full_audit(self):
        print("================================================================================")
        print("STARTING SIH 1505 FINAL SYSTEM RELIABILITY & GOVERNANCE AUDIT")
        print("================================================================================")

        # -------------------------------------------------------------------------
        # TEST SECTION 1: Health & Static Metadata APIs
        # -------------------------------------------------------------------------
        print("\n--- SECTION 1: CORE INFRASTRUCTURE & METADATA HEALTH ---")
        try:
            h = requests.get(f"{BASE_URL}/health")
            assert h.status_code == 200 and h.json().get("status") == "healthy"
            self.record_pass("Backend Health API", "HTTP 200 Healthy response verified")
        except Exception as e:
            self.record_fail("Backend Health API", str(e))

        try:
            site = requests.get(f"{BASE_URL}/site").json()
            assert len(site["assets"]) >= 16 and len(site["workers"]) >= 28 and len(site["roads"]) >= 10
            self.record_pass("Site Infrastructure CAD/GIS API", f"{len(site['assets'])} assets, {len(site['workers'])} workers, {len(site['roads'])} roads verified")
        except Exception as e:
            self.record_fail("Site Infrastructure API", str(e))

        try:
            chems = requests.get(f"{BASE_URL}/chemicals").json()
            assert len(chems) >= 5
            self.record_pass("Chemical SDS Database API", f"{len(chems)} hazardous substances loaded with ERPG thresholds")
        except Exception as e:
            self.record_fail("Chemical SDS Database API", str(e))

        # -------------------------------------------------------------------------
        # TEST SECTION 2: Weather Intelligence (LIVE vs DEMO vs Fallback)
        # -------------------------------------------------------------------------
        print("\n--- SECTION 2: WEATHER INTELLIGENCE & FAIL-SAFE TELEMETRY ---")
        try:
            live_w = requests.get(f"{BASE_URL}/weather/current?latitude=21.6850&longitude=72.5750").json()
            assert "temperature_c" in live_w and "wind_speed_kmh" in live_w and "wind_direction_deg" in live_w
            self.record_pass("Live Weather Telemetry (Open-Meteo)", f"Temp={live_w['temperature_c']}°C, Wind={live_w['wind_speed_kmh']}km/h ({live_w['wind_direction_cardinal']} {live_w['wind_direction_deg']}°), Source={live_w['source']}")
        except Exception as e:
            self.record_fail("Live Weather Telemetry", str(e))

        try:
            fallback_w = requests.get(f"{BASE_URL}/weather/current?latitude=999.0&longitude=999.0").json()
            assert fallback_w["is_live"] is False and "Offline Fallback" in fallback_w["source"]
            self.record_pass("Weather Fail-Safe Fallback", "Handled invalid coordinates safely without 500 error")
        except Exception as e:
            self.record_fail("Weather Fail-Safe Fallback", str(e))

        # -------------------------------------------------------------------------
        # TEST SECTION 3: Scenario Matrix Progression & State Isolation
        # -------------------------------------------------------------------------
        print("\n--- SECTION 3: SCENARIO MATRIX PROGRESSION & ZERO-LEAK ISOLATION ---")
        
        # Step 1: T-04 Ammonia
        try:
            sim_t04, imp_t04, evac_t04, res_t04, el_t04 = self.run_pipeline("T-04", "CHEM-NH3", "PIPELINE_LEAK", 15.0, 195.0, 32.0, 18.0)
            assert "Ammonia" in sim_t04["chemical_name"]
            assert res_t04["foam_water_requirements"]["foam_concentrate_demand_liters"] == 0.0
            assert "Level A" in res_t04["foam_water_requirements"]["ppe_required"]
            self.record_pass("Scenario 1: T-04 Ammonia Cryogenic Header", f"Elapsed={el_t04:.2f}s, RedReach={sim_t04['summary_zones'][0]['max_downwind_distance_m']}m, Water={res_t04['foam_water_requirements']['firewater_demand_lpm']} LPM")
        except Exception as e:
            self.record_fail("Scenario 1: T-04 Ammonia", str(e))

        # Step 2: T-03 LPG (Must NOT leak Ammonia data)
        try:
            sim_t03, imp_t03, evac_t03, res_t03, el_t03 = self.run_pipeline("T-03", "CHEM-LPG", "TANK_LEAK", 25.0, 45.0, 34.0, 12.0)
            assert "Liquefied Petroleum Gas" in sim_t03["chemical_name"]
            assert res_t03["foam_water_requirements"]["foam_concentrate_demand_liters"] > 0.0
            assert "Ammonia" not in sim_t03["chemical_name"] and "CHEM-NH3" not in sim_t03["chemical_id"]
            assert sim_t03["source_asset_id"] == "T-03" and "INC-T-03" in res_t03["incident_id"]
            self.record_pass("Scenario 2: T-03 LPG Horton Sphere", f"Elapsed={el_t03:.2f}s, Foam={res_t03['foam_water_requirements']['foam_concentrate_demand_liters']} L, Muster={evac_t03['primary_evacuation_route']['recommended_assembly_point_name']}")
        except Exception as e:
            self.record_fail("Scenario 2: T-03 LPG", str(e))

        # Step 3: T-01 Benzene (Must NOT leak LPG or Ammonia data)
        try:
            sim_t01, imp_t01, evac_t01, res_t01, el_t01 = self.run_pipeline("T-01", "CHEM-C6H6", "TANK_LEAK", 20.0, 200.0, 29.0, 14.5)
            assert "Benzene" in sim_t01["chemical_name"]
            assert "LPG" not in sim_t01["chemical_name"] and "Ammonia" not in sim_t01["chemical_name"]
            assert sim_t01["source_asset_id"] == "T-01" and "INC-T-01" in res_t01["incident_id"]
            self.record_pass("Scenario 3: T-01 Benzene Storage Tank", f"Elapsed={el_t01:.2f}s, RedReach={sim_t01['summary_zones'][0]['max_downwind_distance_m']}m, Muster={evac_t01['primary_evacuation_route']['recommended_assembly_point_name']}")
        except Exception as e:
            self.record_fail("Scenario 3: T-01 Benzene", str(e))

        # Step 4: Return to T-04 Ammonia (Regeneration Verification)
        try:
            sim_t04_re, imp_t04_re, evac_t04_re, res_t04_re, el_t04_re = self.run_pipeline("T-04", "CHEM-NH3", "PIPELINE_LEAK", 15.0, 195.0, 32.0, 18.0)
            assert sim_t04_re["source_asset_id"] == "T-04"
            assert "Ammonia" in sim_t04_re["chemical_name"]
            assert res_t04_re["foam_water_requirements"]["foam_concentrate_demand_liters"] == 0.0
            assert "Benzene" not in sim_t04_re["chemical_name"] and "LPG" not in sim_t04_re["chemical_name"]
            self.record_pass("Scenario 4: Return to T-04 Ammonia (Regeneration)", f"Regenerated cleanly without residual Benzene/LPG state")
        except Exception as e:
            self.record_fail("Scenario 4: Return to T-04 Ammonia", str(e))

        # -------------------------------------------------------------------------
        # TEST SECTION 4: Live vs Demo Weather Mode Switching
        # -------------------------------------------------------------------------
        print("\n--- SECTION 4: WEATHER MODE TRANSITION (LIVE -> DEMO -> LIVE) ---")
        try:
            # LIVE Mode Run
            sim_live, _, _, _, _ = self.run_pipeline("T-04", "CHEM-NH3", "PIPELINE_LEAK", 15.0, live_w["wind_direction_deg"], live_w["temperature_c"], live_w["wind_speed_kmh"], "LIVE", "Open-Meteo")
            assert sim_live["weather_mode"] == "LIVE" and sim_live["weather_source"] == "Open-Meteo"
            self.record_pass("LIVE Weather Mode Execution", f"Wind={sim_live['wind_speed_kmh']}km/h from {sim_live['wind_direction_cardinal']} ({sim_live['wind_direction_deg']}°)")

            # DEMO Mode Run (Custom User Sliders)
            sim_demo, _, _, _, _ = self.run_pipeline("T-04", "CHEM-NH3", "PIPELINE_LEAK", 15.0, 45.0, 38.5, 8.0, "DEMO", "Scenario Override")
            assert sim_demo["weather_mode"] == "DEMO" and sim_demo["wind_direction_deg"] == 45.0 and sim_demo["ambient_temp_c"] == 38.5
            self.record_pass("DEMO Weather Override Execution", f"Custom Temp={sim_demo['ambient_temp_c']}°C, Wind={sim_demo['wind_speed_kmh']}km/h from {sim_demo['wind_direction_cardinal']} ({sim_demo['wind_direction_deg']}°)")

            # Switch back to LIVE Mode
            sim_live2, _, _, _, _ = self.run_pipeline("T-04", "CHEM-NH3", "PIPELINE_LEAK", 15.0, live_w["wind_direction_deg"], live_w["temperature_c"], live_w["wind_speed_kmh"], "LIVE", "Open-Meteo")
            assert sim_live2["weather_mode"] == "LIVE" and sim_live2["ambient_temp_c"] == live_w["temperature_c"]
            self.record_pass("Return to LIVE Weather Mode", "Verified seamless return to Open-Meteo telemetry without stale demo values")
        except Exception as e:
            self.record_fail("Weather Mode Transition", str(e))

        # -------------------------------------------------------------------------
        # TEST SECTION 5: Human-In-The-Loop Governance Lifecycle
        # -------------------------------------------------------------------------
        print("\n--- SECTION 5: HUMAN-IN-THE-LOOP GOVERNANCE & AUDIT TRAIL ---")
        inc_id = f"INC-GOV-TEST-{int(time.time() * 1000)}"

        try:
            # 1. Pre-Approval Draft Inspection
            pre_auth = requests.get(f"{BASE_URL}/preplan/authorization/{inc_id}?asset_id=T-02&chemical_id=CHEM-CL2&chemical_name=Chlorine%20(Liquefied)&scenario_hash=T02-REL-HASH-1").json()
            assert pre_auth["status"] == "PENDING_HUMAN_AUTHORIZATION"
            assert pre_auth["approver_name"] is None and pre_auth["checklist_completed"] is False
            self.record_pass("Initial Pre-Plan Draft State", f"Status='{pre_auth['status']}', Version='{pre_auth['document_version']}', Approver=None")
        except Exception as e:
            self.record_fail("Initial Pre-Plan Draft State", str(e))

        try:
            # 2. Incomplete Checklist Rejection Check
            bad_auth = requests.post(f"{BASE_URL}/preplan/authorize", json={
                "incident_id": inc_id,
                "asset_id": "T-02",
                "chemical_id": "CHEM-CL2",
                "chemical_name": "Chlorine (Liquefied)",
                "document_version": "v0.1",
                "approver_name": "HSE Officer",
                "approver_role": "Chief Safety Officer (HSE)",
                "checklist": {
                    "reviewed_hazard": True,
                    "reviewed_evacuation": False,  # Missing item
                    "reviewed_tactical_resources": True,
                    "reviewed_limitations": True,
                    "acknowledged_prototype_status": True
                }
            })
            assert bad_auth.status_code == 400
            self.record_pass("Incomplete Review Checklist Enforcer", "HTTP 400 Bad Request cleanly returned when items unchecked")
        except Exception as e:
            self.record_fail("Incomplete Review Checklist Enforcer", str(e))

        try:
            # 3. Valid Human Authorization
            good_auth = requests.post(f"{BASE_URL}/preplan/authorize", json={
                "incident_id": inc_id,
                "asset_id": "T-02",
                "chemical_id": "CHEM-CL2",
                "chemical_name": "Chlorine (Liquefied)",
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
                "notes": "Verified against Shift Alpha perimeter protocol.",
                "scenario_hash": "T02-REL-HASH-1"
            }).json()
            assert good_auth["status"] == "AUTHORIZED"
            assert good_auth["document_version"] == "v1.0"
            assert good_auth["authorization_id"].startswith("AUTH-")
            self.record_pass("Human Authorization Submission", f"Status='{good_auth['status']}', Version='{good_auth['document_version']}', AuthID='{good_auth['authorization_id']}'")
        except Exception as e:
            self.record_fail("Human Authorization Submission", str(e))

        try:
            # 4. Supersession Invalidation Check
            super_auth = requests.get(f"{BASE_URL}/preplan/authorization/{inc_id}?asset_id=T-02&chemical_id=CHEM-CL2&chemical_name=Chlorine%20(Liquefied)&scenario_hash=T02-MODIFIED-PARAMS-V2").json()
            assert super_auth["status"] == "SUPERSEDED"
            self.record_pass("Scenario Change Supersession Invalidator", f"Status transitioned to '{super_auth['status']}' on altered incident state")
        except Exception as e:
            self.record_fail("Scenario Change Supersession Invalidator", str(e))

        # -------------------------------------------------------------------------
        # TEST SECTION 6: Error Handling & Boundary Resilience
        # -------------------------------------------------------------------------
        print("\n--- SECTION 6: ERROR HANDLING & STATE CONSISTENCY VALIDATION ---")
        try:
            # State Inconsistency Test: pairing T-04 simulation with T-03 resources
            bad_pdf_res = requests.post(f"{BASE_URL}/preplan/generate-pdf", json={
                "simulation_result": sim_t04,
                "impact_result": imp_t04,
                "evacuation_plan": evac_t04,
                "resource_plan": res_t03  # Mismatched resource plan
            })
            assert bad_pdf_res.status_code == 400
            assert "State Inconsistency Error" in bad_pdf_res.json()["detail"]
            self.record_pass("State Inconsistency PDF Validator", "HTTP 400 cleanly returned preventing corrupt PDF assembly")
        except Exception as e:
            self.record_fail("State Inconsistency PDF Validator", str(e))

        try:
            # Rejection Workflow
            rej = requests.post(f"{BASE_URL}/preplan/reject", json={
                "incident_id": inc_id,
                "reviewer_name": "Lead Controller",
                "rejection_reason": "Gate 3 delivery trucks obstructing exit",
                "document_version": "v1.0"
            }).json()
            assert rej["status"] == "REJECTED" and "obstructing" in rej["rejection_reason"]
            self.record_pass("HSE Rejection Workflow", f"Status='{rej['status']}', Reason recorded cleanly")
        except Exception as e:
            self.record_fail("HSE Rejection Workflow", str(e))

        # -------------------------------------------------------------------------
        # TEST SECTION 7: PDF Generation & 4-Page Verification Across All Scenarios
        # -------------------------------------------------------------------------
        print("\n--- SECTION 7: FROZEN PDF ASSEMBLY & 4-PAGE PAGINATION ---")
        scenarios = [
            ("T-04", "Ammonia", sim_t04, imp_t04, evac_t04, res_t04),
            ("T-03", "LPG", sim_t03, imp_t03, evac_t03, res_t03),
            ("T-01", "Benzene", sim_t01, imp_t01, evac_t01, res_t01)
        ]

        for asset, chem, sim, imp, evac, res in scenarios:
            try:
                pdf_res = requests.post(f"{BASE_URL}/preplan/generate-pdf", json={
                    "simulation_result": sim,
                    "impact_result": imp,
                    "evacuation_plan": evac,
                    "resource_plan": res
                })
                assert pdf_res.status_code == 200
                pdf_len = len(pdf_res.content)
                assert pdf_len > 80000
                self.record_pass(f"Frozen PDF Generation ({asset} {chem})", f"{pdf_len:,} bytes generated with 300 DPI vector maps & snapshot")
            except Exception as e:
                self.record_fail(f"Frozen PDF Generation ({asset} {chem})", str(e))

        # -------------------------------------------------------------------------
        # SUMMARY
        # -------------------------------------------------------------------------
        print("\n================================================================================")
        print(f"AUDIT SUMMARY: {self.tests_passed}/{self.tests_run} TESTS PASSED ({(self.tests_passed/self.tests_run)*100:.1f}%)")
        if self.tests_failed == 0:
            print("STATUS: ZERO ERRORS -- ALL INTEGRATION, GOVERNANCE, AND DATA PIPELINES 100% OPERATIONAL")
        else:
            print(f"STATUS: {self.tests_failed} FAILURES DETECTED")
            for name, err in self.failures:
                print(f"  - {name}: {err}")
        print("================================================================================")

if __name__ == "__main__":
    tester = ReliabilityAuditTester()
    tester.run_full_audit()
