import React, { useState } from 'react';
import { 
  Building2, ShieldAlert, AlertTriangle, Users, Navigation, 
  Siren, Clock, CheckCircle2, MapPin, Radio, Shield, 
  Layers, FileText, Lock, ChevronRight 
} from 'lucide-react';
import PlantMap from '../map/PlantMap';
import IncidentTimeline from '../intelligence/IncidentTimeline';
import DominoRiskAnalysis from '../intelligence/DominoRiskAnalysis';
import DecisionAuditTrail from '../intelligence/DecisionAuditTrail';

export default function PlantDistrictAuthorityView({
  canonicalState,
  simulationResult,
  impactResult,
  evacuationPlan,
  resourcePlan,
  siteData,
  activeWeather,
  currentTimeStep,
  selectedAssetId,
  onSelectAsset,
  onOpenExecutiveBrief
}) {
  const [subTab, setSubTab] = useState('overview'); // overview, timeline, domino, audit

  const score = canonicalState?.canonical_risk_score ?? 55.3;
  const category = canonicalState?.canonical_severity ?? 'HIGH';
  const assetId = canonicalState?.source_asset || 'T-04';
  const chemName = canonicalState?.chemical || 'Ammonia';
  const rate = canonicalState?.release_rate_kg_s ?? 15.0;

  const getRiskBadge = (cat) => {
    switch (cat) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'MODERATE':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs text-slate-200">
      
      {/* 1. Regional & Plant Command Macro HUD */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-950/60 border border-blue-500/40 text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded border border-blue-500/30">
                  REGIONAL & PLANT COORDINATION
                </span>
                <span className="text-[10px] text-slate-500">Dahej Industrial Area / DDMA District Feed</span>
              </div>
              <h2 className="text-sm md:text-base font-extrabold text-white uppercase tracking-tight mt-0.5">
                {siteData?.plant?.name || 'PetroChem Complex Alpha'} • {assetId} Emergency ({rate} kg/s {chemName})
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onOpenExecutiveBrief}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate Executive Brief</span>
            </button>
          </div>
        </div>

        {/* 5 Plant-Wide Coordination KPIs (Enforcing 100% Canonical Data Consistency) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Severity */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-bold text-slate-400">INCIDENT SEVERITY</span>
            <div className="flex items-center space-x-2">
              <span className="text-base font-black text-white">{score}/100</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getRiskBadge(category)}`}>
                {category}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">{assetId} • {chemName}</div>
          </div>

          {/* Sectors Impacted */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-bold text-slate-400">SECTORS COMPROMISED</span>
            <div className="text-base font-black text-amber-300">
              {canonicalState?.threatened_assets_count || 0} Units Compromised
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {canonicalState?.facility_sector}
            </div>
          </div>

          {/* Population Evac */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-bold text-slate-400">PEOPLE / EVACUATION</span>
            <div className="text-base font-black text-cyan-300">
              {canonicalState?.exposed_personnel || 0} Exposed / {canonicalState?.total_personnel_at_site || 28} Site
            </div>
            <div className="text-[10px] text-emerald-400 truncate">
              Muster: {canonicalState?.recommended_assembly_point}
            </div>
          </div>

          {/* Perimeter Roadblocks */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-bold text-slate-400">ACCESS & ROADBLOCKS</span>
            <div className="text-base font-black text-rose-400">
              {canonicalState?.blocked_roads_count || 0} Blocked Corridor
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Egress: {canonicalState?.recommended_exit_gate}
            </div>
          </div>

          {/* Mutual Aid Resources */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-bold text-slate-400">MUTUAL AID DEPLOYED</span>
            <div className="text-base font-black text-indigo-300">
              {canonicalState?.units_deployed_count || 0} Units Active
            </div>
            <div className="text-[10px] text-slate-400">
              {canonicalState?.firewater_demand_lpm ? `${(canonicalState.firewater_demand_lpm).toLocaleString()} LPM Demand` : '5,000 LPM'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Authority Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/80 rounded-xl p-1 gap-1">
        {[
          { id: 'overview', label: 'Plant GIS & Sector Access' },
          { id: 'timeline', label: 'Incident Milestone Timeline' },
          { id: 'domino', label: 'Cascade & Domino Risk' },
          { id: 'audit', label: 'Decision Audit Trail' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSubTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              subTab === tab.id
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Sub-Tab Content */}
      {subTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
          {/* Left 8 Cols: GIS Map with Plant Boundaries */}
          <div className="lg:col-span-8 space-y-2 flex flex-col">
            <div className="bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                REGIONAL SITE GIS & PERIMETER ACCESS CORRIDORS
              </span>
              <span className="text-[10px] text-slate-400">
                Live threat zone overlay + road blockages
              </span>
            </div>

            <div className="flex-1 min-h-[520px] h-[calc(100vh-360px)] rounded-xl overflow-hidden border border-slate-800 shadow-xl">
              <PlantMap
                siteData={siteData}
                simulationResult={simulationResult}
                currentTimeStep={currentTimeStep}
                evacuationPlan={evacuationPlan}
                selectedAssetId={selectedAssetId}
                onSelectAsset={onSelectAsset}
              />
            </div>
          </div>

          {/* Right 4 Cols: Regional Coordination Summary & Escalation Checklist */}
          <div className="lg:col-span-4 space-y-3 flex flex-col">
            
            {/* Sector Breakdown Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="font-bold text-xs text-white flex items-center justify-between border-b border-slate-800 pb-2">
                <span>PLANT SECTOR STATUS</span>
                <span className="text-[10px] text-slate-400">Real-Time</span>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-red-500/40 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-red-400">{canonicalState?.facility_sector}</span>
                    <span className="text-red-300">RED ZONE</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Epicenter {assetId}. Emission active at {rate} kg/s. Evacuation mandatory.
                  </p>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-orange-500/40 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-orange-400">Downwind Vector ({canonicalState?.plume_toward_cardinal} {canonicalState?.plume_toward_deg?.toFixed(0)}°)</span>
                    <span className="text-orange-300">ORANGE ZONE</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Severe vapor cloud exposure ({Math.round(canonicalState?.max_orange_reach_m || 0)}m reach). Deluge cooling active.
                  </p>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-emerald-400">Perimeter Egress ({canonicalState?.recommended_exit_gate})</span>
                    <span className="text-emerald-300">CLEAR</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Safe for evacuation egress to {canonicalState?.recommended_assembly_point}.
                  </p>
                </div>
              </div>
            </div>

            {/* DDMA District Coordination Actions */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2.5">
              <div className="font-bold text-xs text-white flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                DDMA / DISTRICT NOTIFICATIONS
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-slate-400">District Collectorate Alert:</span>
                  <b className="text-emerald-400">{score > 60 ? 'Notified (Level 2)' : 'Standby (Level 1)'}</b>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Mutual Aid Fire Brigade:</span>
                  <b className="text-cyan-300">{canonicalState?.units_deployed_count} Units Dispatched</b>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Off-Site Public Warning:</span>
                  <b className="text-slate-300">Standoff OK (Inside Boundary)</b>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {subTab === 'timeline' && (
        <IncidentTimeline
          simulationResult={simulationResult}
          impactResult={impactResult}
          evacuationPlan={evacuationPlan}
          resourcePlan={resourcePlan}
        />
      )}

      {subTab === 'domino' && (
        <DominoRiskAnalysis
          simulationResult={simulationResult}
          impactResult={impactResult}
        />
      )}

      {subTab === 'audit' && (
        <DecisionAuditTrail
          incidentId={canonicalState?.incident_id}
        />
      )}

    </div>
  );
}
