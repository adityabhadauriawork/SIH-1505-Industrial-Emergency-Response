# SIH 1505 — Long-Term Product Roadmap
**Industrial Hazard Simulation & Emergency Response Command Center**

This document tracks the 30 long-term product areas envisioned for SIH 1505, demarcating current vertical slice implementations versus planned phases for the final Smart India Hackathon solution.

---

## Roadmap Status Matrix (30 Product Areas)

| # | Product Vision Area | Internal Hackathon Slice | Implementation Details & Current Status |
|---|---------------------|:------------------------:|------------------------------------------|
| **1** | **Industrial Site Digital Twin** | ✅ **IMPLEMENTED** | Spatially coherent PetroChem Complex Alpha with tanks, pipelines, process units, blast control room, road grid, gates, assembly points, hydrants, and workers. |
| **2** | **Chemical Intelligence Database** | ✅ **IMPLEMENTED** | Configurable chemical registry with Ammonia, LPG, Chlorine, H₂S, and Benzene (molecular weight, boiling points, LFL/UFL, ERPG-1/2/3, IDLH, SDS guidance). |
| **3** | **Accident Scenario Builder** | ✅ **IMPLEMENTED** | Interactive scenario builder supporting pipeline leaks, tank punctures, toxic gas releases, and fire/explosions with release rates and durations. |
| **4** | **Weather Intelligence** | ✅ **IMPLEMENTED** | Meteorological context handler with wind speed, compass angle & cardinal conversions, temperature, humidity, and Pasquill-Gifford stability classes (A–F). |
| **5** | **Hazard Dispersion Engine** | ✅ **IMPLEMENTED** | Explainable screening-level Gaussian/dense gas dispersion engine using NumPy and Shapely with downwind coordinate rotation. |
| **6** | **Flammability / Toxicity / Threat Zones** | ✅ **IMPLEMENTED** | Multi-tier threat polygons: Red (ERPG-3 / Lethal / 60% LFL), Orange (ERPG-2 / Injury), Yellow (ERPG-1 / Caution) in valid GeoJSON. |
| **7** | **Time-Based Simulation** | ✅ **IMPLEMENTED** | Dynamic time progression ($T+0\text{s}, T+30\text{s}, T+60\text{s}, T+120\text{s}$) with automated play/pause scrubber and plume front expansion tracking. |
| **8** | **Population & Asset Impact** | ✅ **IMPLEMENTED** | Point-in-polygon spatial intersection identifying affected workers by severity tier, exposed critical assets with domino warnings, and compromised muster points. |
| **9** | **Risk Scoring** | ✅ **IMPLEMENTED** | Transparent multi-factor deterministic risk index (0–100) scoring chemical toxicity, release severity, population exposure, asset criticality, and road grid severance. |
| **10** | **What-If Scenario Comparison** | 🔄 *PLANNED (Phase 2)* | Side-by-side comparative simulation diffing for alternate mitigation tactics or weather shifts. |
| **11** | **Dynamic Evacuation Engine** | ✅ **IMPLEMENTED** | Graph-based NetworkX road router that identifies blocked roads and dynamically routes evacuees around hazard zones to safe assembly points and gates. |
| **12** | **Emergency Resource Optimization** | ✅ **IMPLEMENTED** | Tactical unit recommendation (Fire Tenders, Water Bowsers, Hazmat squads with Level A suits, ALS Ambulances, ERT) with upwind staging coords and SOP checklists. |
| **13** | **Responder Dashboard** | 🔄 *PLANNED (Phase 2)* | Dedicated mobile-first interface for on-ground firefighters and hazmat entry teams. |
| **14** | **Worker Dashboard** | 🔄 *PLANNED (Phase 2)* | Wearable / smartphone personal evacuation beacon with localized alarm sirens and directional exit compass. |
| **15** | **Admin / Safety Officer Dashboard** | ✅ **IMPLEMENTED** | Integrated multi-tab command center with live telemetry, asset management, and risk thresholds. |
| **16** | **Historical Incident Analytics** | 🔄 *PLANNED (Phase 3)* | Historical accident database, near-miss logging, and frequency-severity matrix. |
| **17** | **Predictive Maintenance / Early Warning** | 🔄 *PLANNED (Phase 3)* | Sensor drift detection, valve seal degradation, and corrosion heatmaps. |
| **18** | **Computer Vision Detection** | 🔄 *PLANNED (Phase 3)* | Real-time CCTV smoke and vapor cloud detection using YOLO / OpenCV. |
| **19** | **Real-Time Incident Pipeline** | 🔄 *PLANNED (Phase 2)* | WebSocket / MQTT ingestion pipeline for live plant SCADA and perimeter toxic gas sniffer arrays. |
| **20** | **AI Copilot** | 🔄 *PLANNED (Phase 3)* | LLM-powered incident response assistant trained on chemical safety data sheets and industrial SOPs. |
| **21** | **Automatic Fire Pre-Plan Generator** | ✅ **IMPLEMENTED** | Automated ReportLab PDF generator producing official industrial emergency response briefs and tactical checklists. |
| **22** | **ERDMP Integration** | ✅ **IMPLEMENTED** | Seeded PESO license compliance and ERDMP tier classification workflow. |
| **23** | **Training / Drill Mode** | 🔄 *PLANNED (Phase 2)* | Time-accelerated simulation mode for conducting mock safety drills and measuring evacuation compliance times. |
| **24** | **Incident Replay** | 🔄 *PLANNED (Phase 2)* | Post-incident black-box event logging and timeline playback for root cause analysis (RCA). |
| **25** | **Explainable AI** | ✅ **IMPLEMENTED** | Clear factor-by-factor breakdown of risk scores and dispersion parameters without black-box opacity. |
| **26** | **Uncertainty / Confidence Intervals** | 🔄 *PLANNED (Phase 3)* | Monte Carlo weather perturbation envelopes showing 95% confidence plume dispersion boundaries. |
| **27** | **Offline / Fail-Safe Mode** | ✅ **IMPLEMENTED** | Zero cloud dependency; runs completely locally with SQLite, local FastAPI services, and bundled web assets. |
| **28** | **Audit Log** | 🔄 *PLANNED (Phase 2)* | Immutable audit trail of commander decisions, alarm overrides, and tactical unit dispatches. |
| **29** | **Role-Based Security** | 🔄 *PLANNED (Phase 2)* | RBAC authentication separating Safety Officer, Fire Marshal, Plant Manager, and Read-Only Observer. |
| **30** | **Reporting & Analytics** | ✅ **IMPLEMENTED** | Comprehensive PDF reporting and live browser analytics across population and asset vulnerabilities. |

---

## Development Milestones

### Milestone 1: Internal Hackathon Vertical Slice (August 2026) — CURRENT
- End-to-end working pipeline: Plant Site $\rightarrow$ Asset Selection $\rightarrow$ Scenario Simulation $\rightarrow$ Threat Zones $\rightarrow$ GIS Visualization $\rightarrow$ Impact Analysis $\rightarrow$ Dynamic Evacuation Routing $\rightarrow$ Resource Dispatch $\rightarrow$ Fire Pre-Plan PDF.

### Milestone 2: SIH State / Regional Selection Round
- Live MQTT sniffer telemetry integration.
- Worker personal beacon dashboard.
- Drill mode with compliance timers.
- Multi-scenario what-if comparison matrix.

### Milestone 3: SIH Grand Finale
- 3D Digital Twin visualization (Three.js / Cesium).
- Computer Vision plume detection on camera feeds.
- Full AI Safety Copilot with speech-to-text dispatch.
- Multi-plant enterprise command mesh.
