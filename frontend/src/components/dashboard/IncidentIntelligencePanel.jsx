import React, { useState } from 'react';
import { 
  ShieldAlert, Wind, Thermometer, Flame, Users, 
  Navigation, Siren, FileText, CheckCircle2, AlertTriangle, 
  ArrowRight, ShieldCheck, DoorOpen, Clock, RefreshCw, Zap
} from 'lucide-react';

export default function IncidentIntelligencePanel({
  simulationResult,
  impactResult,
  evacuationPlan,
  resourcePlan,
  activeWeather,
  liveTelemetry,
  weatherMode,
  onWeatherModeChange,
  presets = [],
  onSelectPreset,
  onNavigateTab,
  onRunSimulation,
  loading
}) {
  const [expandedSection, setExpandedSection] = useState('summary');

  const hasSimulation = !!simulationResult;
  const risk = impactResult?.risk_assessment;
  const primRoute = evacuationPlan?.primary_evacuation_route;
  const topResource = resourcePlan?.recommended_resources?.[0];
  const fw = resourcePlan?.foam_water_requirements;
  const isLongEgress = primRoute?.estimated_evac_time_min >= 30.0;

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl font-mono text-xs">
      
      {/* 1. Panel Header */}
      <div className="bg-slate-950 px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="font-bold text-white uppercase tracking-wider text-[11px]">
            Incident Intelligence Feed
          </span>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
          hasSimulation 
            ? 'bg-red-500/20 text-red-300 border-red-500/40' 
            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
        }`}>
          {hasSimulation ? (risk?.risk_category || 'ACTIVE INCIDENT') : 'SYSTEM STANDBY'}
        </span>
      </div>

      {/* 2. Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        
        {/* Quick Scenario Preset Launcher (Level 1 Decision Action) */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
            <span>Scenario Quick Presets</span>
            <span className="text-cyan-400">Click to Triage</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {presets.map(p => {
              const isSelected = simulationResult?.source_asset_id === p.asset_id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectPreset && onSelectPreset(p.id)}
                  className={`px-2 py-1.5 rounded text-[10px] font-bold transition-all border text-center ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/80 shadow-sm shadow-cyan-500/20'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white hover:border-slate-600'
                  }`}
                >
                  <div>{p.asset_id}</div>
                  <div className="text-[8px] opacity-75 truncate">{p.chemical_id.replace('CHEM-', '')}</div>
                </button>
              );
            })}
          </div>
        </div>

        {hasSimulation ? (
          <>
            {/* Active Incident Summary Card */}
            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-2">
              <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                <span className="text-slate-400 font-bold text-[10px] uppercase flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  Active Release Dynamics
                </span>
                <span className="text-rose-400 font-bold text-[10px]">
                  {simulationResult.source_asset_id}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 text-[10px] block">SUBSTANCE</span>
                  <span className="font-bold text-white truncate block" title={simulationResult.chemical_name}>
                    {simulationResult.chemical_name.split('(')[0]}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">EMISSION RATE</span>
                  <span className="font-bold text-cyan-300">
                    {simulationResult.effective_release_rate_kg_s} kg/s
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">WIND VECTOR</span>
                  <span className="font-bold text-slate-200">
                    {activeWeather?.wind_speed_kmh} km/h FROM {activeWeather?.wind_direction_cardinal}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">PLUME TRAVEL</span>
                  <span className="font-bold text-cyan-400">
                    TOWARD {((simulationResult.wind_direction_deg + 180) % 360).toFixed(0)}°
                  </span>
                </div>
              </div>

              {/* Threat Zones Reach Bar */}
              <div className="pt-1 space-y-1">
                <span className="text-[10px] text-slate-500 block">MAX THREAT ENVELOPES</span>
                <div className="flex gap-1.5 text-[9.5px]">
                  <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
                    🔴 Red: {simulationResult.summary_zones?.[0]?.max_downwind_distance_m}m
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40">
                    🟠 Org: {simulationResult.summary_zones?.[1]?.max_downwind_distance_m}m
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Action Directive: Evacuation Egress */}
            {primRoute && (
              <div className="bg-emerald-950/30 p-3 rounded-lg border border-emerald-500/40 space-y-2">
                <div className="flex justify-between items-center border-b border-emerald-500/30 pb-1.5">
                  <span className="text-emerald-300 font-bold text-[10px] uppercase flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                    Recommended Evacuation
                  </span>
                  <span className="text-emerald-400 font-bold text-[10px]">
                    {primRoute.route_status}
                  </span>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div>
                    <span className="text-slate-400 text-[10px] block">SAFE MUSTER POINT:</span>
                    <span className="font-bold text-white text-xs">{primRoute.recommended_assembly_point_name}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300 pt-0.5">
                    <span>Exit: <b className="text-cyan-300">{primRoute.recommended_gate_name}</b></span>
                    <span>Distance: <b className="text-amber-300">{primRoute.total_distance_m}m</b> (~{primRoute.estimated_evac_time_min}m)</span>
                  </div>
                  {isLongEgress && (
                    <div className="bg-rose-950/60 border border-rose-500/60 p-1.5 rounded text-[10px] text-rose-300 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                      <span>⚠ LONG EGRESS — HUMAN REVIEW REQUIRED</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onNavigateTab && onNavigateTab('evacuation')}
                  className="w-full text-center text-[10px] text-emerald-400 hover:text-emerald-300 hover:underline pt-1 flex items-center justify-center gap-1"
                >
                  <span>Inspect Route Scoring & Turn-by-Turn</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Tactical Resource Dispatch Directive */}
            {resourcePlan && (
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-2">
                <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400 font-bold text-[10px] uppercase flex items-center gap-1.5">
                    <Siren className="w-3.5 h-3.5 text-cyan-400" />
                    Tactical Resource Dispatch
                  </span>
                  <span className="text-cyan-400 font-bold text-[10px]">
                    {resourcePlan.recommended_resources?.length} Units
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  {topResource && (
                    <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white">{topResource.resource_name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/40 font-bold">
                          {topResource.priority} • ETA {topResource.estimated_arrival_min}m
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">{topResource.assigned_role}</div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 pt-0.5">
                    <div>Firewater: <b className="text-blue-400">{fw?.firewater_demand_lpm?.toLocaleString()} LPM</b></div>
                    <div>Standoff: <b className="text-cyan-400">{resourcePlan.standoff_upwind_m}m</b></div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateTab && onNavigateTab('resources')}
                  className="w-full text-center text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline pt-1 flex items-center justify-center gap-1"
                >
                  <span>View Full Resource Dispatch & SOP</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </>
        ) : (
          /* Standby Welcome State */
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 text-center space-y-3 text-slate-400">
            <div className="p-3 rounded-full bg-cyan-500/10 text-cyan-400 w-12 h-12 mx-auto flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-white text-xs">Ready for Incident Simulation</div>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                Select an accident scenario preset above or configure source release parameters to generate live dispersion threat envelopes.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* 3. Panel Footer Quick Actions */}
      <div className="bg-slate-950 p-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onNavigateTab && onNavigateTab('simulator')}
          className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded text-[11px] font-bold border border-slate-700 transition-all text-center"
        >
          Configure Scenario
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab && onNavigateTab('preplan')}
          className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white py-1.5 rounded text-[11px] font-bold border border-red-400/50 shadow-sm transition-all text-center flex items-center justify-center gap-1"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Fire Pre-Plan</span>
        </button>
      </div>

    </div>
  );
}
