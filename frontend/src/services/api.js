const API_BASE = 'http://127.0.0.1:8000/api';

export const api = {
  // 1. Plant Site
  async getSiteData() {
    const res = await fetch(`${API_BASE}/site`);
    if (!res.ok) throw new Error(`Failed to load plant site data: ${res.statusText}`);
    return res.json();
  },

  async getSiteGeoJSON() {
    const res = await fetch(`${API_BASE}/site/geojson`);
    if (!res.ok) throw new Error(`Failed to load site GeoJSON: ${res.statusText}`);
    return res.json();
  },

  // 2. Chemicals
  async getChemicals() {
    const res = await fetch(`${API_BASE}/chemicals`);
    if (!res.ok) throw new Error(`Failed to load chemicals: ${res.statusText}`);
    return res.json();
  },

  async getChemicalById(id) {
    const res = await fetch(`${API_BASE}/chemicals/${id}`);
    if (!res.ok) throw new Error(`Failed to load chemical ${id}: ${res.statusText}`);
    return res.json();
  },

  // 3. Scenario Presets
  async getPresets() {
    const res = await fetch(`${API_BASE}/scenarios/presets`);
    if (!res.ok) throw new Error(`Failed to load presets: ${res.statusText}`);
    return res.json();
  },

  // 3.1 Live Weather Service
  async getCurrentWeather(latitude = 21.6850, longitude = 72.5750) {
    const res = await fetch(`${API_BASE}/weather/current?latitude=${latitude}&longitude=${longitude}`);
    if (!res.ok) throw new Error(`Failed to load current weather: ${res.statusText}`);
    return res.json();
  },

  // 4. Hazard Simulation
  async runSimulation(scenarioParams) {
    const res = await fetch(`${API_BASE}/hazard/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scenarioParams)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Hazard simulation failed');
    }
    return res.json();
  },

  // 5. Impact Analysis
  async analyzeImpact(simulationResult, timeStepSec = 120) {
    const res = await fetch(`${API_BASE}/impact/analyze?time_step_sec=${timeStepSec}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(simulationResult)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Impact analysis failed');
    }
    return res.json();
  },

  // 6. Evacuation Routing
  async calculateEvacuationRoute(simulationResult, impactResult, originCoords = null, originName = null) {
    let url = `${API_BASE}/evacuation/route`;
    const params = [];
    if (originName) params.push(`origin_name=${encodeURIComponent(originName)}`);
    if (params.length) url += `?${params.join('&')}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        simulation_result: simulationResult,
        impact_result: impactResult,
        origin_coords: originCoords
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Evacuation routing failed');
    }
    return res.json();
  },

  // 7. Resource Optimization
  async optimizeResources(simulationResult, impactResult, evacuationPlan = null) {
    const res = await fetch(`${API_BASE}/resources/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        simulation_result: simulationResult,
        impact_result: impactResult,
        evacuation_plan: evacuationPlan
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Resource optimization failed');
    }
    return res.json();
  },

  // 8. Fire Pre-Plan Authorization Governance
  async getAuthorizationStatus(incidentId, assetId = 'T-04', chemicalId = 'CHEM-NH3', chemicalName = 'Ammonia', scenarioHash = null) {
    let url = `${API_BASE}/preplan/authorization/${encodeURIComponent(incidentId)}?asset_id=${encodeURIComponent(assetId)}&chemical_id=${encodeURIComponent(chemicalId)}&chemical_name=${encodeURIComponent(chemicalName)}`;
    if (scenarioHash) url += `&scenario_hash=${encodeURIComponent(scenarioHash)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch authorization status');
    return res.json();
  },

  async authorizePrePlan(authPayload) {
    const res = await fetch(`${API_BASE}/preplan/authorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authPayload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Authorization failed');
    }
    return res.json();
  },

  async rejectPrePlan(rejectPayload) {
    const res = await fetch(`${API_BASE}/preplan/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rejectPayload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Rejection failed');
    }
    return res.json();
  },

  // 9. Fire Pre-Plan PDF Download
  async downloadPrePlanPDF(payload) {
    const res = await fetch(`${API_BASE}/preplan/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to generate Fire Pre-Plan PDF');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Fire_PrePlan_${payload.simulation_result?.source_asset_id || 'Incident'}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // 10. Intelligence Hub & Final Capabilities
  async compareWhatIfScenarios(payload) {
    const res = await fetch(`${API_BASE}/intelligence/whatif/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'What-If scenario comparison failed');
    }
    return res.json();
  },

  async getHistoricalAnalyticsSummary() {
    const res = await fetch(`${API_BASE}/intelligence/analytics/summary`);
    if (!res.ok) throw new Error(`Failed to load historical analytics: ${res.statusText}`);
    return res.json();
  },

  async getPredictiveAssetHealth() {
    const res = await fetch(`${API_BASE}/intelligence/predictive/assets`);
    if (!res.ok) throw new Error(`Failed to load predictive asset health: ${res.statusText}`);
    return res.json();
  },

  async getVisionCameraPresets() {
    const res = await fetch(`${API_BASE}/intelligence/vision/presets`);
    if (!res.ok) throw new Error(`Failed to load vision presets: ${res.statusText}`);
    return res.json();
  },

  async analyzeVisionFrame(formData) {
    const res = await fetch(`${API_BASE}/intelligence/vision/detect`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Computer vision analysis failed');
    }
    return res.json();
  },

  async chatWithCopilot(payload) {
    const res = await fetch(`${API_BASE}/intelligence/copilot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Copilot query failed');
    }
    return res.json();
  },

  // 11. Domino / Cascade Screening Risk
  async getDominoRisk(simulationResult, impactResult = null) {
    const res = await fetch(`${API_BASE}/intelligence/domino-risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        simulation_result: simulationResult,
        impact_result: impactResult
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Domino risk screening failed');
    }
    return res.json();
  },

  // 12. Incident Timeline
  async getIncidentTimeline(simulationResult, impactResult = null, evacuationPlan = null, resourcePlan = null, authStatus = null) {
    const res = await fetch(`${API_BASE}/intelligence/timeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        simulation_result: simulationResult,
        impact_result: impactResult,
        evacuation_plan: evacuationPlan,
        resource_plan: resourcePlan,
        authorization_status: authStatus
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Timeline generation failed');
    }
    return res.json();
  },

  // 13. Decision Audit Trail
  async getDecisionAuditTrail(incidentId = null, module = null, limit = 50) {
    const params = [];
    if (incidentId) params.push(`incident_id=${encodeURIComponent(incidentId)}`);
    if (module) params.push(`module=${encodeURIComponent(module)}`);
    if (limit) params.push(`limit=${limit}`);
    const queryStr = params.length ? `?${params.join('&')}` : '';

    const res = await fetch(`${API_BASE}/intelligence/audit-trail${queryStr}`);
    if (!res.ok) throw new Error(`Failed to load decision audit trail: ${res.statusText}`);
    return res.json();
  },

  async recordDecisionAudit(payload) {
    const res = await fetch(`${API_BASE}/intelligence/audit-trail/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to record audit entry');
    }
    return res.json();
  },

  // 14. Executive Situation Brief
  async getExecutiveSituationBrief(simulationResult, impactResult = null, evacuationPlan = null, resourcePlan = null, authRecord = null) {
    const res = await fetch(`${API_BASE}/intelligence/executive-brief`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        simulation_result: simulationResult,
        impact_result: impactResult,
        evacuation_plan: evacuationPlan,
        resource_plan: resourcePlan,
        authorization_record: authRecord
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Executive situation brief generation failed');
    }
    return res.json();
  }
};
