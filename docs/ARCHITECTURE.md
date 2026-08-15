# SIH 1505 — Architecture & Design Document
**Industrial Hazard Simulation & Emergency Response Command Center**

---

## 1. Executive System Overview
SIH 1505 is a modular, extensible digital twin and real-time emergency response platform engineered for industrial chemical manufacturing complexes, refineries, and hazardous storage terminals. It bridges physical process safety parameters with live meteorological data, computational screening dispersion models, dynamic road network graph algorithms, and automated incident pre-plan generation.

---

## 2. High-Level Architectural Diagram

```
+-----------------------------------------------------------------------------------+
|                           FRONTEND (React + Vite + Leaflet)                      |
|                                                                                   |
|  [Command Header + Weather]   [HUD Metric Gauges]     [Time Scrubber T+0..120s]   |
|         |                            |                              |             |
|  [Scenario Builder (Live/Demo)] <--> [2D GIS Digital Twin Map] <--> [Impact Roster] |
|         |                            |                              |             |
|  [Dynamic Evacuation]         [Tactical Resource Matrix] [Fire Pre-Plan Exporter] |
+------------------------------------------+----------------------------------------+
                                           | HTTP REST / JSON API (Port 8000)
+------------------------------------------v----------------------------------------+
|                          FASTAPI BACKEND API LAYER (Python 3.12)                 |
|                                                                                   |
|  /api/site        /api/chemicals    /api/scenarios   /api/hazard/simulate         |
|  /api/impact      /api/evacuation   /api/resources   /api/weather/current         |
|  /api/preplan/generate-pdf                                                        |
+------------------------------------------+----------------------------------------+
                                           |
+------------------------------------------v----------------------------------------+
|                                CORE SERVICES LAYER                                |
|                                                                                   |
|  +---------------------+   +---------------------+   +--------------------------+ |
|  |     SiteService     |   |   ChemicalService   |   |   WeatherService (Live)  | |
|  | - Spatial entities  |   | - Physical constants|   | - Open-Meteo Integration | |
|  | - GeoJSON serializer|   | - Toxicity ERPG/IDLH|   | - Pasquill-Gifford Class | |
|  |                     |   |                     |   | - Offline Fail-Safe Fall | |
|  +---------------------+   +---------------------+   +--------------------------+ |
|                                                                                   |
|  +-----------------------------------------------+   +--------------------------+ |
|  |             HazardService (Physics)           |   |      ImpactService       | |
|  | - Gaussian Screening Plume Dispersion         |   | - Point-in-polygon check | |
|  | - Pasquill-Gifford dispersion curves (cy, cz)|   | - Domino asset analysis  | |
|  | - Time-series slicing (T+0s, 30s, 60s, 120s)  |   | - Explainable Risk Score | |
|  | - Shapely Geographic Projection & GeoJSON    |   | - Road blockage flags    | |
|  +-----------------------------------------------+   +--------------------------+ |
|                                                                                   |
|  +-----------------------------------------------+   +--------------------------+ |
|  |           EvacuationService (Graph)           |   |     ResourceService      | |
|  | - NetworkX Road Topology                      |   | - Tactical allocation    | |
|  | - Dynamic Hazard Edge Severing / Obstacle     |   | - Upwind standoff staging| |
|  | - Dijkstra Safe Path to Muster Point & Gate   |   | - 3-Phase SOP Checklists | |
|  +-----------------------------------------------+   +--------------------------+ |
|                                                                                   |
|  +------------------------------------------------------------------------------+ |
|  |                           PrePlanService (ReportLab)                         | |
|  | - Industrial Emergency Response PDF Briefing                                 | |
|  | - Multi-section ERDMP / OISD compliant document                              | |
|  +------------------------------------------------------------------------------+ |
+------------------------------------------+----------------------------------------+
                                           |
+------------------------------------------v----------------------------------------+
|                                DATABASE & STORAGE                                 |
|                                                                                   |
|     SQLite (sih1505.db) via SQLAlchemy ORM Models + Seed Data (seed_data.json)    |
+-----------------------------------------------------------------------------------+
```

---

## 3. Component Deep Dive

### 3.1 Live Weather Intelligence Service (`WeatherService`)
- **Open-Meteo Integration**: Fetches real-time atmospheric readings (`temperature_2m`, `wind_speed_10m`, `wind_direction_10m`) for the plant or incident coordinates (`GET /api/weather/current?latitude=...&longitude=...`).
- **Mathematical Processing**: Calculates 16-point cardinal compass conversions (e.g. `SSW 195°`) and derives Pasquill-Gifford stability classes (A through F).
- **Decoupled Architecture**: `HazardService` does not know or care where weather numbers come from. Weather feeds into `Scenario` which then feeds into `HazardService`.
- **Fail-Safe Fallback**: If Open-Meteo is unreachable (network timeout or offline mode), returns deterministic fallback weather with `is_live: false` and error metadata.

### 3.2 Screening Hazard Dispersion Engine (`HazardService`)
- **Physics Model**: Screening Gaussian dispersion with Pasquill-Gifford atmospheric stability parameters ($\sigma_y = c_y \cdot x^{d_y}$, $\sigma_z = c_z \cdot x^{d_z}$).
- **Coordinate Transformation**: Downwind/crosswind coordinates rotated by wind direction vector $\theta$ and projected into geographic coordinates via Shapely.
- **Threat Zones**:
  - **Red Zone (Lethal)**: Concentration $\ge$ ERPG-3 or IDLH (or thermal overpressure threshold).
  - **Orange Zone (Severe Injury)**: Concentration $\ge$ ERPG-2.
  - **Yellow Zone (Caution)**: Concentration $\ge$ ERPG-1.
- **Time Slice Slicing**: Dynamic cloud front reach $x_{front}(t) = u \cdot t$ sliced at $T+0\text{s}, 30\text{s}, 60\text{s}, 120\text{s}$.

### 3.3 Dynamic Evacuation Engine (`EvacuationService`)
- **Graph Topology**: Road intersections and junctions represented as nodes; road centerlines represented as weighted edges (edge weight = distance in meters).
- **Obstacle Avoidance**: When a hazard envelope expands, road edges that intersect Red/Orange polygons are assigned $\infty$ weight or pruned from the graph. Yellow zone intersections trigger caution speed penalties.
- **Pathfinding**: NetworkX Dijkstra calculates shortest obstacle-free path from worker origin to the closest uncompromised assembly point and primary safe gate.

### 3.4 Spatial Impact & Explainable Risk Scoring (`ImpactService`)
- **Spatial Intersection**: Evaluates point-in-polygon containment for 28+ stationed workers, assets, and assembly points.
- **Deterministic Multi-Factor Risk Score (0-100)**:
  1. *Chemical Toxicity & Volatility* (25 pts)
  2. *Release Mass Emission Rate* (25 pts)
  3. *Population Exposure Matrix* (25 pts)
  4. *Critical Asset & Domino Risk* (15 pts)
  5. *Road Grid & Muster Impairment* (10 pts)

### 3.5 Dynamic Tactical Resource Optimization Engine (`ResourceService`)
- **Geolocation-Derived ETAs**: Calculates actual transit distances $D_{\text{transit}}$ from vehicle home stations (FS-01, MED-01, CR-01) to dynamically computed staging points (e.g. Upwind Staging Post, Crosswind Sector, or Designated Assembly Point) at emergency response vehicle speeds ($22\text{ km/h} = 366\text{ m/min}$).
- **Chemical & Incident Adaptive Priorities**:
  - *Toxic Gas Release (Ammonia, Chlorine, H₂S)*: Prioritizes Water Bowsers for high-volume vapor absorption fog curtains, Hazmat Level A suits for hot-zone valve clamping, and 0L foam demand.
  - *BLEVE / Hydrocarbon Fire (LPG, Benzene)*: Prioritizes Fire Tenders for 4000 LPM roof monitor deluge cooling, 3% AFFF foam concentrate blankets, and NFPA structural turnout gear.
  - *Casualty-Driven Medical Dispatch*: Triage ambulances dynamically stage at the winning evacuation muster point when exposed workers $\ge 1$, or remain on Standby when $0$ casualties are projected.
- **Prototype Safety Label**: Explicitly classified as decision-support modeling subject to site ERDMP validation.

### 3.6 Industrial Fire Pre-Plan Generator (`PrePlanService`)
- **Active State Pipeline Consumption**: Compiles structured data directly from the active incident snapshot:
  $$\text{Scenario} \rightarrow \text{Hazard Zones} \rightarrow \text{Impact Matrix} \rightarrow \text{Evacuation Route} \rightarrow \text{Tactical Resources} \rightarrow \text{Pre-Plan PDF}$$
- **State Consistency Validation**: Validates that all pipeline stages share matching Source Asset IDs, Chemical SDS names, and complete zone geometries before compilation; rejects mismatched state payloads with `HTTP 400 Bad Request`.
- **Dynamic 300 DPI Vector Maps**: Uses Matplotlib headless rendering to embed genuine spatial vector diagrams:
  - *Map A*: Atmospheric Dispersion Plume Envelope with wind direction vector and Red/Orange/Yellow contour zones.
  - *Map B*: Safe Evacuation Corridor & Assembly Point network avoiding severed road segments.
- **Dynamic Numbered Canvas**: Employs two-pass `NumberedCanvas` rendering running top headers with Incident ID and running bottom footers with `Page X of Y` and prototype safety notices.
- **Prototype Safety & Disclaimer**: Contains prominent non-certified decision support notices and standard ERDMP sign-off blocks.

### 3.7 Human-In-The-Loop Authorization & Governance Engine (`AuthorizationService`)
- **Strict Document State Machine**:
  $$\text{DRAFT (v0.1)} \rightarrow \text{PENDING\_HUMAN\_AUTHORIZATION (v0.1)} \xrightarrow{\text{5-Item HSE Checklist + Role}} \text{AUTHORIZED (v1.0)}$$
  $$\text{PENDING\_HUMAN\_AUTHORIZATION} \xrightarrow{\text{Revision Required}} \text{REJECTED}$$
  $$\text{AUTHORIZED} \xrightarrow{\text{Scenario Input Modified}} \text{SUPERSEDED}$$
- **5-Item Mandatory HSE Safety Review Checklist**:
  1. Chemical dispersion physics & downwind threat zones reviewed.
  2. Safe evacuation corridors, severed roads & muster points reviewed.
  3. Tactical vehicle staging, firewater & foam deluge demand reviewed.
  4. Screening Gaussian model assumptions & technical boundaries reviewed.
  5. Prototype decision-support status acknowledged.
- **Demonstration Signature & Audit Record**:
  - Unapproved drafts display `"HUMAN AUTHORIZATION: REQUIRED (Status: PENDING)"` with blank signature lines.
  - Approved documents generate persistent authorization records (`AUTH-YYYYMMDD-XXXXXX`), timestamps, approver designation, and clearly marked `"DEMO SIGNATURE — NOT A REAL SIGNATURE"` blocks ready for production PKI integration.


---

## 4. Extension Strategy & Future Upgrades
The modular service boundaries ensure that:
1. **Weather API**: Other meteorological APIs (IMD, NOAA, local Ultrasonic Anemometer SCADA) can replace Open-Meteo inside `WeatherService` without modifying any simulation or routing logic.
2. **Dispersion Engine**: Advanced CFD or 3D Gaussian puff models can be plugged in by fulfilling the `HazardService.simulate_scenario()` interface.
3. **Computer Vision & Sensor Pipeline**: Video detection or SCADA telemetry endpoints can ingest real-time alarms into `routes_scenarios.py` to trigger simulations autonomously.
