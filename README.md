# SIH 1505 — Industrial Hazard Simulation & Emergency Response Command Center

![SIH 1505 Command Center](https://img.shields.io/badge/SIH%201505-Industrial%20Safety-06b6d4?style=for-the-badge)
![Live Weather](https://img.shields.io/badge/Open--Meteo-Live%20Telemetry-10b981?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React%2018-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)
![Python](https://img.shields.io/badge/Python%203.12-3776AB?style=for-the-badge&logo=python&logoColor=white)

An enterprise-grade, digital twin command center and real-time hazard dispersion engine designed for petrochemical plants, chemical manufacturing hubs, and hazardous material storage terminals.

---

## 🌟 Key Capabilities

1. **Live Weather Intelligence (Open-Meteo Integration)**: Dedicated backend `WeatherService` querying current ambient temperature, wind velocity, and wind direction vector for the plant coordinates in real-time. Features on-demand synchronization and automatic graceful offline fail-safe fallback.
2. **Dual Meteorological Simulation Modes**:
   - **`LIVE WEATHER` Mode (Default)**: Automatically pulls live meteorological telemetry and calculates dynamic hazard dispersion plumes reflecting real-world conditions.
   - **`DEMO WEATHER` Mode**: Preserves deterministic, offline-capable manual sliders and the primary SIH demo scenario (Ammonia T-04, 8 km/h, 45° NE, 32°C).
3. **Industrial Site Digital Twin**: Spatially coherent representation of **PetroChem Complex Alpha** (Dahej Petrochemical Industrial Zone, Gujarat) featuring storage tanks, pipelines, process units, blast-resistant control room, road network, assembly points, gates, hydrants, and 28 stationed workers.
4. **Chemical Intelligence Database**: Configurable chemical registry containing **Ammonia ($NH_3$)**, **LPG**, **Chlorine ($Cl_2$)**, **Hydrogen Sulfide ($H_2S$)**, and **Benzene ($C_6H_6$)** with physical properties, boiling points, LFL/UFL, toxicity thresholds (ERPG-1/2/3, IDLH), and tactical guidance.
5. **Hazard Dispersion Engine**: Explainable screening-level Gaussian/dense gas dispersion engine (NumPy + Shapely) generating multi-tier threat zones (Red Lethal, Orange Severe Injury, Yellow Caution) with time-series progression ($T+0\text{s}, 30\text{s}, 60\text{s}, 120\text{s}$).
6. **Spatial Population & Asset Impact**: Real point-in-polygon and LineString intersection detecting exposed workers by injury tier, vulnerable critical assets with domino BLEVE risk, compromised assembly points, and blocked road segments.
7. **Transparent Multi-Factor Risk Score**: Explainable deterministic risk index (0–100) scoring chemical toxicity, release rate, population exposure, critical infrastructure, and road network impairment.
8. **Dynamic Evacuation Engine**: Graph-based road routing using NetworkX Dijkstra that dynamically identifies severed road segments and routes workers safely around hazard zones to verified safe assembly points and gates.
9. **Emergency Resource Optimization**: Recommends tactical deployment of Fire Tenders, High-Volume Water Bowsers, Level A Hazmat Entry Squads, and ALS Ambulances with upwind staging coordinates and 3-Phase SOP checklists.
10. **Automated Fire Pre-Plan Generator**: Compiles and streams official industrial emergency response briefs and tactical checklists formatted as high-grade PDFs using ReportLab.

---

## 🏛️ Monorepo Structure

```
SIH-1505/
├── backend/
│   ├── app/
│   │   ├── api/                # FastAPI REST endpoints (/site, /weather, /hazard, /evacuation, etc.)
│   │   ├── core/               # Configuration and SQLite database engine
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic validation schemas
│   │   ├── services/           # Modular pure business logic services
│   │   │   ├── weather/        # Dedicated Live Open-Meteo & Fallback service
│   │   │   ├── site/           # Plant layout & GeoJSON serializer
│   │   │   ├── chemicals/      # Chemical database & SDS
│   │   │   ├── scenarios/      # Incident scenario manager
│   │   │   ├── hazard/         # Screening dispersion physics engine (NumPy/Shapely)
│   │   │   ├── impact/         # Spatial intersection & risk scoring
│   │   │   ├── evacuation/     # Dynamic road graph router (NetworkX)
│   │   │   ├── resources/      # Emergency resource optimizer
│   │   │   └── preplan/        # ReportLab PDF pre-plan builder
│   │   └── main.py             # FastAPI entry point
│   ├── requirements.txt
│   ├── test_backend.py         # Automated service verification tests
│   └── test_e2e_live.py        # Live end-to-end integration tests
├── frontend/
│   ├── src/
│   │   ├── components/         # Modular React components
│   │   │   ├── common/         # Header, HUDStats, TimeScrubber
│   │   │   ├── map/            # Leaflet GIS plant digital twin
│   │   │   ├── scenario/       # Interactive scenario builder (LIVE / DEMO modes)
│   │   │   ├── impact/         # Worker exposure & risk matrix
│   │   │   ├── evacuation/     # Turn-by-turn navigation guidance
│   │   │   ├── resources/      # Tactical resource allocation
│   │   │   └── preplan/        # Document preview & PDF downloader
│   │   ├── pages/              # CommandCenter master page
│   │   ├── services/           # Centralized API client
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css           # Dark control-room styling & animations
│   ├── package.json
│   └── vite.config.js
├── data/
│   └── seed_data.json          # PetroChem Complex Alpha seed dataset
├── docs/
│   ├── ARCHITECTURE.md         # System architecture & extension points
│   └── ROADMAP.md              # 30 SIH product vision areas
└── README.md
```

---

## ⚡ Quickstart & Local Installation

### Prerequisites
- **Python 3.10+** (Tested on Python 3.12)
- **Node.js 18+** and **npm**

---

### Step 1: Backend Setup
```bash
cd backend
pip install -r requirements.txt
python test_backend.py          # Run unit & calculation tests
python test_e2e_live.py         # Run live integration & weather tests
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend API:* `http://127.0.0.1:8000`  
*Interactive Swagger Documentation:* `http://127.0.0.1:8000/docs`

---

### Step 2: Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*Frontend Command Center:* `http://localhost:5173`

---

## 🎯 Demonstration Workflows

### Workflow A: Real-Time Live Weather Simulation
1. Open [http://localhost:5173](http://localhost:5173).
2. Look at the header bar: verify the green **`● LIVE WEATHER`** indicator showing live temperature, wind speed, and direction from **Open-Meteo**.
3. In the **Scenario Simulator**, ensure **`LIVE`** mode is active.
4. Click **"RUN HAZARD DISPERSION SIMULATION"**:
   - The dispersion engine computes the exact plume orientation and downwind reach driven by real-time atmospheric wind conditions.
5. Cycle through the **Time Scrubber** ($T+0\text{s} \rightarrow T+120\text{s}$) to observe plume travel.

### Workflow B: Deterministic Demo Scenario (T-04 Ammonia Leak)
1. Click **`⚡ Primary Demo (T-04 NH₃)`** in the header.
2. The scenario immediately switches to **`DEMO`** mode with deterministic benchmark parameters ($15.0\text{ kg/s}$, $8\text{ km/h}$, $45^\circ\text{ NE}$, $32^\circ\text{C}$).
3. Review the **Impact & Workers**, **Safe Evacuation**, and **Tactical Resources** tabs.
4. Go to **Fire Pre-Plan PDF** and click **Download Official Pre-Plan PDF** to download the generated ReportLab document.

---

## 🔒 Engineering & Safety Disclaimer
> **IMPORTANT NOTE**: The hazard dispersion model implemented in this vertical slice is an explainable screening-level Gaussian approximation designed for decision-support workflows and demonstration of computational pipelines. It is not presented as an industrial-certified replacement for ALOHA or regulatory safety software.

---

## 📄 License & Team
Developed for **Smart India Hackathon (SIH 1505)**.
All rights reserved.
