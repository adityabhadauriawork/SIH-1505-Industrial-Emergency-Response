import React, { useState } from 'react';
import { 
  GitCompare, ArrowRight, ShieldAlert, AlertTriangle, 
  Wind, Droplet, Flame, RefreshCw, Zap, Navigation, 
  ShieldCheck, Layers, ChevronRight, TrendingUp, TrendingDown 
} from 'lucide-react';
import { api } from '../../services/api';

export default function WhatIfComparison({ 
  assets = [], 
  chemicals = [], 
  currentSimulation,
  onApplyScenario 
}) {
  const [scenarioA, setScenarioA] = useState({
    label: 'Scenario A (Baseline)',
    asset_id: currentSimulation?.source_asset_id || 'T-04',
    chemical_id: currentSimulation?.chemical_id || 'CHEM-NH3',
    incident_type: currentSimulation?.incident_type || 'PIPELINE_LEAK',
    release_rate_kg_s: currentSimulation?.effective_release_rate_kg_s || 15.0,
    release_duration_min: 30,
    wind_speed_kmh: currentSimulation?.wind_speed_kmh || 8.0,
    wind_direction_deg: currentSimulation?.wind_direction_deg || 45.0,
    ambient_temp_c: currentSimulation?.ambient_temp_c || 32.0
  });

  const [scenarioB, setScenarioB] = useState({
    label: 'Scenario B (Escalation)',
    asset_id: currentSimulation?.source_asset_id || 'T-04',
    chemical_id: currentSimulation?.chemical_id || 'CHEM-NH3',
    incident_type: currentSimulation?.incident_type || 'PIPELINE_LEAK',
    release_rate_kg_s: (currentSimulation?.effective_release_rate_kg_s || 15.0) * 2.0,
    release_duration_min: 30,
    wind_speed_kmh: currentSimulation?.wind_speed_kmh || 8.0,
    wind_direction_deg: currentSimulation?.wind_direction_deg || 45.0,
    ambient_temp_c: currentSimulation?.ambient_temp_c || 32.0
  });

  const [comparisonResult, setComparisonResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRunComparison = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await api.compareWhatIfScenarios({
        scenario_a: scenarioA,
        scenario_b: scenarioB
      });
      setComparisonResult(res);
    } catch (err) {
      console.error('What-If comparison failed:', err);
      setError(err.message || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  const a = comparisonResult?.scenario_a;
  const b = comparisonResult?.scenario_b;
  const deltas = comparisonResult?.deltas;

  return (
    <div className="space-y-4 font-mono text-xs text-slate-200">
      
      {/* 1. Header & Purpose */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-cyan-400" />
            What-If Multi-Scenario Comparative Simulation
          </h3>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
            Prototype Gaussian Dispersion + Dijkstra Routing
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          Run independent physics-based dispersion simulations simultaneously to compare toxic reach, population exposure, road severance, and suppression demands.
        </p>
      </div>

      {/* 2. Side-by-Side Configuration Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        
        {/* Scenario A Card */}
        <div className="bg-slate-950/70 border border-cyan-500/40 rounded-xl p-3.5 space-y-3 shadow-md">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="font-bold text-cyan-400 text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              SCENARIO A (BASELINE)
            </span>
            <input
              type="text"
              value={scenarioA.label}
              onChange={(e) => setScenarioA({ ...scenarioA, label: e.target.value })}
              className="bg-slate-900 border border-slate-700 text-white text-[10px] rounded px-2 py-0.5 w-40 text-right"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <label className="block text-slate-400 mb-0.5">SOURCE ASSET</label>
              <select
                value={scenarioA.asset_id}
                onChange={(e) => {
                  const aid = e.target.value;
                  const f = assets.find(x => x.id === aid);
                  setScenarioA({ ...scenarioA, asset_id: aid, chemical_id: f?.chemical_id || scenarioA.chemical_id });
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
              >
                {assets.map(x => <option key={x.id} value={x.id}>{x.id} — {x.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-0.5">CHEMICAL</label>
              <select
                value={scenarioA.chemical_id}
                onChange={(e) => setScenarioA({ ...scenarioA, chemical_id: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
              >
                {chemicals.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-0.5">
                <span>RELEASE RATE</span>
                <span className="text-cyan-400 font-bold">{scenarioA.release_rate_kg_s} kg/s</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="50.0"
                step="0.5"
                value={scenarioA.release_rate_kg_s}
                onChange={(e) => setScenarioA({ ...scenarioA, release_rate_kg_s: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-0.5">
                <span>WIND SPEED & BEARING</span>
                <span className="text-cyan-400 font-bold">{scenarioA.wind_speed_kmh} km/h • {scenarioA.wind_direction_deg}°</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="40.0"
                step="0.5"
                value={scenarioA.wind_speed_kmh}
                onChange={(e) => setScenarioA({ ...scenarioA, wind_speed_kmh: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Scenario B Card */}
        <div className="bg-slate-950/70 border border-amber-500/40 rounded-xl p-3.5 space-y-3 shadow-md">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              SCENARIO B (COMPARISON)
            </span>
            <input
              type="text"
              value={scenarioB.label}
              onChange={(e) => setScenarioB({ ...scenarioB, label: e.target.value })}
              className="bg-slate-900 border border-slate-700 text-white text-[10px] rounded px-2 py-0.5 w-40 text-right"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <label className="block text-slate-400 mb-0.5">SOURCE ASSET</label>
              <select
                value={scenarioB.asset_id}
                onChange={(e) => {
                  const aid = e.target.value;
                  const f = assets.find(x => x.id === aid);
                  setScenarioB({ ...scenarioB, asset_id: aid, chemical_id: f?.chemical_id || scenarioB.chemical_id });
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
              >
                {assets.map(x => <option key={x.id} value={x.id}>{x.id} — {x.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-0.5">CHEMICAL</label>
              <select
                value={scenarioB.chemical_id}
                onChange={(e) => setScenarioB({ ...scenarioB, chemical_id: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
              >
                {chemicals.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-0.5">
                <span>RELEASE RATE</span>
                <span className="text-amber-400 font-bold">{scenarioB.release_rate_kg_s} kg/s</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="50.0"
                step="0.5"
                value={scenarioB.release_rate_kg_s}
                onChange={(e) => setScenarioB({ ...scenarioB, release_rate_kg_s: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-0.5">
                <span>WIND SPEED & BEARING</span>
                <span className="text-amber-400 font-bold">{scenarioB.wind_speed_kmh} km/h • {scenarioB.wind_direction_deg}°</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="40.0"
                step="0.5"
                value={scenarioB.wind_speed_kmh}
                onChange={(e) => setScenarioB({ ...scenarioB, wind_speed_kmh: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Run Action CTA */}
      <button
        type="button"
        onClick={handleRunComparison}
        disabled={loading}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-amber-600 hover:from-cyan-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] disabled:opacity-50"
      >
        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <GitCompare className="w-4 h-4" />}
        <span>{loading ? 'SIMULATING BOTH SCENARIO ENVELOPES...' : 'RUN WHAT-IF COMPARATIVE EVALUATION'}</span>
      </button>

      {error && (
        <div className="bg-red-950/60 border border-red-500/80 p-3 rounded-lg text-red-200 text-xs">
          <b>Error:</b> {error}
        </div>
      )}

      {/* 3. Comparison Results Scorecard */}
      {comparisonResult && (
        <div className="space-y-4 pt-1">
          
          {/* Comparative Summary Callout */}
          <div className="bg-slate-900 border border-slate-700 p-3.5 rounded-xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-white text-xs">
                Comparative Consequence Summary • Higher Severity: <span className="text-rose-400 font-black">{deltas.higher_risk_scenario}</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                {deltas.comparative_summary}
              </p>
            </div>
          </div>

          {/* Side-by-Side Metrics Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-3 bg-slate-950/80 border-b border-slate-800 font-bold text-xs text-white">
              Comparative Impact & Operational Delta Matrix
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] divide-y divide-slate-800">
                <thead>
                  <tr className="bg-slate-950/40 text-slate-400">
                    <th className="py-2.5 px-3">Metric Category</th>
                    <th className="py-2.5 px-3 text-cyan-300 font-bold">{a.label}</th>
                    <th className="py-2.5 px-3 text-amber-300 font-bold">{b.label}</th>
                    <th className="py-2.5 px-3 font-bold text-white">Delta Shift (B - A)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {/* Overall Risk Score */}
                  <tr className="hover:bg-slate-950/40">
                    <td className="py-2 px-3 font-medium text-slate-300">Composite Risk Score</td>
                    <td className="py-2 px-3 font-bold text-cyan-300">{a.risk_score}/100 ({a.risk_category})</td>
                    <td className="py-2 px-3 font-bold text-amber-300">{b.risk_score}/100 ({b.risk_category})</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${deltas.risk_score_delta > 0 ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                        {deltas.risk_score_delta > 0 ? `+${deltas.risk_score_delta} pts (Worse)` : `${deltas.risk_score_delta} pts`}
                      </span>
                    </td>
                  </tr>

                  {/* Red Zone Reach */}
                  <tr className="hover:bg-slate-950/40">
                    <td className="py-2 px-3 font-medium text-slate-300">Lethal Red Zone Reach</td>
                    <td className="py-2 px-3 text-cyan-300 font-mono">{a.red_reach_m} m</td>
                    <td className="py-2 px-3 text-amber-300 font-mono">{b.red_reach_m} m</td>
                    <td className="py-2 px-3 font-mono font-bold text-red-400">
                      +{deltas.red_reach_delta_m} m (+{deltas.red_reach_delta_pct}%)
                    </td>
                  </tr>

                  {/* Total Threat Area */}
                  <tr className="hover:bg-slate-950/40">
                    <td className="py-2 px-3 font-medium text-slate-300">Total Plume Envelope Area</td>
                    <td className="py-2 px-3 text-slate-300 font-mono">{a.total_threat_area_sq_m.toLocaleString()} m²</td>
                    <td className="py-2 px-3 text-slate-300 font-mono">{b.total_threat_area_sq_m.toLocaleString()} m²</td>
                    <td className="py-2 px-3 font-mono text-slate-300">
                      +{deltas.threat_area_delta_sq_m.toLocaleString()} m² (+{deltas.threat_area_delta_pct}%)
                    </td>
                  </tr>

                  {/* Exposed Workers */}
                  <tr className="hover:bg-slate-950/40">
                    <td className="py-2 px-3 font-medium text-slate-300">Exposed Workers</td>
                    <td className="py-2 px-3 text-cyan-300 font-bold">{a.exposed_workers} personnel</td>
                    <td className="py-2 px-3 text-amber-300 font-bold">{b.exposed_workers} personnel</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${deltas.exposed_workers_delta > 0 ? 'bg-red-500/20 text-red-300' : 'bg-slate-800 text-slate-400'}`}>
                        {deltas.exposed_workers_delta > 0 ? `+${deltas.exposed_workers_delta} casualties` : '0 change'}
                      </span>
                    </td>
                  </tr>

                  {/* Compromised Assets */}
                  <tr className="hover:bg-slate-950/40">
                    <td className="py-2 px-3 font-medium text-slate-300">Threatened Plant Assets</td>
                    <td className="py-2 px-3 text-slate-300">{a.vulnerable_assets} units</td>
                    <td className="py-2 px-3 text-slate-300">{b.vulnerable_assets} units</td>
                    <td className="py-2 px-3 font-bold text-amber-300">+{deltas.vulnerable_assets_delta} units</td>
                  </tr>

                  {/* Blocked Roads */}
                  <tr className="hover:bg-slate-950/40">
                    <td className="py-2 px-3 font-medium text-slate-300">Severed Internal Roads</td>
                    <td className="py-2 px-3 text-slate-300">{a.blocked_roads} segments</td>
                    <td className="py-2 px-3 text-slate-300">{b.blocked_roads} segments</td>
                    <td className="py-2 px-3 font-bold text-red-400">+{deltas.blocked_roads_delta} roads</td>
                  </tr>

                  {/* Muster Point & Evac Time */}
                  <tr className="hover:bg-slate-950/40">
                    <td className="py-2 px-3 font-medium text-slate-300">Safe Assembly Point & Egress</td>
                    <td className="py-2 px-3 text-cyan-300">
                      {a.muster_point} ({a.evacuation_dist_m}m, ~{a.evacuation_time_min}m)
                    </td>
                    <td className="py-2 px-3 text-amber-300">
                      {b.muster_point} ({b.evacuation_dist_m}m, ~{b.evacuation_time_min}m)
                    </td>
                    <td className="py-2 px-3 text-slate-300">
                      {a.muster_point === b.muster_point ? 'Same Muster Zone' : 'Muster Point Diverted!'}
                    </td>
                  </tr>

                  {/* Firewater Demand */}
                  <tr className="hover:bg-slate-950/40">
                    <td className="py-2 px-3 font-medium text-slate-300">Suppression Firewater Demand</td>
                    <td className="py-2 px-3 text-cyan-300 font-mono font-bold">{a.firewater_lpm.toLocaleString()} LPM</td>
                    <td className="py-2 px-3 text-amber-300 font-mono font-bold">{b.firewater_lpm.toLocaleString()} LPM</td>
                    <td className="py-2 px-3 font-mono font-bold text-blue-400">
                      +{deltas.firewater_delta_lpm.toLocaleString()} LPM
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
