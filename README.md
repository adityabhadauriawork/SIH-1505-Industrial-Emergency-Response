# 🚨 SIH-1505 — Industrial Emergency Response & Decision Support System

> Smart India Hackathon 2026 Project

An AI-powered industrial emergency decision-support platform that helps teams understand an incident, estimate its impact, plan evacuation, allocate emergency resources, and generate an emergency response plan.

---

## 🎯 Problem

Industrial emergencies such as chemical leaks, fires, toxic releases and equipment failures require decisions to be made very quickly.

Our system brings important information into one platform:

**Incident → Weather → Hazard → Impact → Evacuation → Response → Human Approval**

---

# ✅ Features Currently Available

### 1. Command Center
- Central industrial emergency dashboard
- Live incident status
- Risk level
- Personnel impact
- Asset impact
- Road blockage
- Weather information
- Interactive plant map

### 2. Scenario Simulator
- Select industrial asset
- Select chemical
- Select incident type
- Change release rate
- Change release duration
- Change weather conditions
- Change wind speed and direction

### 3. Weather Integration
- Open-Meteo weather data
- Temperature
- Wind speed
- Wind direction
- Atmospheric stability
- Demo / scenario weather override

### 4. Hazard Dispersion
- Gaussian plume screening model
- Red / Orange / Yellow threat zones
- Plume direction
- Hazard reach
- Threat area
- Map visualization

### 5. Risk Assessment
- Overall incident risk score
- Personnel exposure
- Asset exposure
- Road impact
- Hazard severity

### 6. Personnel Impact
- Exposed workers
- Exposure severity
- Worker location
- Evacuation relevance

### 7. Asset Impact
- Threatened industrial assets
- Asset criticality
- Hazard exposure
- Protection requirements

### 8. Dynamic Evacuation
- Safe assembly point
- Exit gate
- Route distance
- Estimated walking time
- Blocked-road handling
- Alternative routes
- Route safety scoring
- Route explanation

### 9. Tactical Response
- Hazmat response units
- Fire tenders
- Water curtain bowser
- Ambulance
- Emergency response teams
- ETA
- Staging location
- Tactical purpose
- PPE recommendations

### 10. Firewater Planning
- Firewater demand
- Water curtain requirement
- Standoff distance
- Isolation cordon
- Cooling requirements

---

# 🧠 Advanced Intelligence Features

### 11. What-If Scenario Comparison
Compare two different emergency situations.

Example:

**Scenario A**
- T-04 Ammonia
- 15 kg/s
- Wind from NE

**Scenario B**
- T-04 Ammonia
- Higher release rate
- Different wind direction

Comparison includes:
- Risk
- Hazard reach
- Plume area
- Exposed workers
- Threatened assets
- Blocked roads
- Firewater demand
- Evacuation changes

---

### 12. Historical Incident Analytics
Uses a synthetic demonstration dataset.

Includes:
- Incident trends
- Severity distribution
- Response time
- Evacuation time
- High-risk assets
- Root causes
- Corrective actions
- Historical incident archive

---

### 13. Asset Health & Early Warning
Prototype predictive-maintenance module.

Monitors:
- Vibration
- Temperature
- Pressure
- Acoustic leak indicators

Provides:
- Asset health score
- Risk category
- Failure driver
- Maintenance recommendation

---

### 14. Computer Vision Surveillance
Prototype computer-vision module for:
- Smoke detection
- Person detection
- Visual hazard alerts
- Camera-based incident suggestion

Supports:
- Camera stations
- Simulated camera feeds
- Local image upload
- Hazard simulation

---

### 15. AI Emergency Copilot
AI assistant connected to the current incident state.

Example questions:
- What is happening right now?
- How many workers are affected?
- Why was this evacuation route selected?
- Why is this assembly point safer?
- What resources are required?

The Copilot is designed to answer using the current system state.

---

### 16. Role-Based Views / Information Abstraction

Different users see different levels of information.

#### Field Responder
Focuses on:
- Immediate action
- PPE
- Safe route
- Staging
- Muster point
- Field checklist

#### HSE Commander
Focuses on:
- Full incident picture
- Risk
- Personnel
- Assets
- Evacuation
- Tactical response
- Authorization

#### Plant Manager
Focuses on:
- Facility impact
- Critical sectors
- Assets
- Personnel
- Road/access status
- Resource deployment

#### District Authority
Focuses on:
- Regional impact
- Mutual aid
- District notifications
- Public warning
- Evacuation status

#### Executive Authority
Focuses on:
- What happened?
- How serious is it?
- Who is affected?
- Is it under control?
- What is being done?
- What requires attention?

### Main idea

All roles use the **same canonical incident state**.

Only the **level of information shown** changes.

---

### 17. Incident Timeline & Replay
Tracks the incident from:

**Detection → Assessment → Evacuation → Tactical Response → Domino Analysis → Pre-Plan → Human Authorization**

Includes:
- Timeline events
- Timestamps
- State transitions
- Replay
- Incident snapshots

---

### 18. Decision Audit Trail
Stores important decisions and recommendations.

Includes:
- Incident ID
- Recommendation
- Reason
- Review status
- Approver
- Time
- Audit history

Prototype storage uses **SQLite**.

---

### 19. Domino / Cascade Risk
Prototype screening of possible secondary effects.

Evaluates:
- Nearby assets
- Asset criticality
- Hazard exposure
- Distance
- Possible cascade mechanisms
- Mitigation recommendations

> This is a prototype screening heuristic and not a certified physical damage probability model.

---

### 20. Executive Situation Brief
Provides a high-level summary for senior decision-makers.

Includes:
- Incident
- Risk
- Personnel
- Assets
- Evacuation
- Tactical response
- Containment
- Governance
- Authorization status

---

### 21. Fire Pre-Plan PDF
Automatically generates an emergency pre-plan containing:

- Incident information
- Chemical information
- Weather
- Hazard zones
- Personnel impact
- Asset impact
- Evacuation route
- Tactical resources
- PPE
- Firewater requirement
- SOP actions
- Governance disclaimer
- Human authorization

---

### 22. Human-in-the-Loop Authorization

Main principle:

**AI recommends → Human reviews → Human authorizes**

The system supports states such as:

- Pending Human Authorization
- Approved / Authorized
- Review Required

The prototype does not treat AI as the final authority.

---

# 🤖 AI / ML USED

## Is ML used?

**Yes.**

Different parts of the project use different approaches.

| Module | Approach |
|---|---|
| Hazard Dispersion | Gaussian Plume mathematical model |
| Risk Assessment | Rule / scoring based decision support |
| Evacuation | Graph-based pathfinding + route scoring |
| What-If | Consequence simulation |
| Historical Analytics | Data analysis and visualization |
| Asset Health | Predictive ML prototype |
| Computer Vision | Pretrained vision detection |
| AI Copilot | LLM-based assistant |
| Domino Risk | Rule / screening based analysis |

### Important

The core hazard-dispersion engine is **not a deep-learning model**.

It uses mathematical and rule-based decision-support methods.

---

# 🧠 Algorithms / Methods

### Gaussian Plume Model
Used for prototype hazardous-gas dispersion estimation.

### Graph-Based Pathfinding
Used for evacuation route selection while considering:
- Distance
- Safety
- Hazard exposure
- Blocked roads

### Predictive ML
Used in the asset-health / early-warning prototype.

### Computer Vision Detection
Used for prototype smoke and person detection.

### LLM
Used for the AI Emergency Copilot.

### Rule-Based Risk Analysis
Used for:
- Risk scoring
- Tactical recommendations
- Domino screening
- Safety rules

---

# 🛠️ Technology Stack

## Frontend
- React
- Vite
- JavaScript
- Tailwind CSS
- Leaflet
- OpenStreetMap
- Chart / visualization components

## Backend
- Python
- FastAPI
- Pydantic
- REST APIs
- Modular service architecture

## Database
- SQLite

Used for:
- Audit trail
- Authorization records
- Prototype data
- Historical information

## External APIs
- Open-Meteo for weather

## AI / ML
- Gaussian plume model
- Graph/pathfinding
- Predictive ML
- Computer Vision
- LLM / AI Copilot
- Rule-based intelligence

## PDF
- Automated emergency pre-plan generation

---

# 🏗️ Simple Architecture

```text
                 React Frontend
                       │
                       │ REST API
                       ▼
                 FastAPI Backend
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
      Hazard         Impact       Evacuation
        │              │              │
        └──────────────┼──────────────┘
                       ▼
                Tactical Response
                       │
                       ▼
             Intelligence Modules
                       │
                       ▼
              Human Authorization
                       │
                       ▼
                 Fire Pre-Plan

SIH-1505/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   ├── generated_preplans/
│   ├── requirements.txt
│   └── tests/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── vite.config.js
│
├── data/
├── docs/
├── README.md
└── .gitignore

# ✅ Current Features

The current prototype includes:

- Command Center
- Scenario Simulator
- Live Weather
- Hazard Dispersion
- Risk Assessment
- Personnel Impact
- Asset Impact
- Dynamic Evacuation
- Tactical Resource Planning
- Firewater Planning
- What-If Analysis
- Historical Analytics
- Asset Health & Early Warning
- Computer Vision
- AI Emergency Copilot
- Role-Based Views
- Incident Timeline & Replay
- Decision Audit Trail
- Domino / Cascade Risk
- Executive Situation Brief
- Human-in-the-Loop Authorization
- Automated Fire Pre-Plan PDF

---

# 🔮 Future Features

Future production development can include:

### Industrial Integration

- SCADA integration
- Real IoT sensor integration
- Real CCTV feeds
- Real personnel tracking
- Real industrial telemetry
- Real GIS integration

### Advanced AI / ML

- Advanced dispersion models
- Probabilistic risk analysis
- Uncertainty estimation
- Advanced predictive maintenance
- Multi-hazard analysis
- Advanced domino-effect modeling

### Computer Vision

- Real-time CCTV analytics
- Fire detection
- Smoke detection
- PPE compliance
- Crowd monitoring
- Multi-camera correlation

### Security

- Secure authentication
- Role-Based Access Control
- PKI digital signatures
- Tamper-evident audit logs
- Enterprise identity integration

### Digital Twin

- Industrial digital twin
- Real-time facility simulation
- Continuous emergency simulation
- Live sensor-to-model integration