import React, { useState } from 'react';
import { 
  ShieldAlert, FileText, CheckCircle2, AlertTriangle, 
  Users, Navigation, Siren, Clock, Building2, Download, 
  Copy, Check, RefreshCw, ChevronRight, Shield 
} from 'lucide-react';
import ExecutiveBriefModal from '../intelligence/ExecutiveBriefModal';
import PlantMap from '../map/PlantMap';

export default function ExecutiveAuthorityView({
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
  onExportPDF
}) {
  const [showBriefModal, setShowBriefModal] = useState(false);

  const score = canonicalState?.canonical_risk_score ?? 55.3;
  const category = canonicalState?.canonical_severity ?? 'HIGH';
  const assetId = canonicalState?.source_asset || 'T-04';
  const chemName = canonicalState?.chemical || 'Ammonia';
  const incType = canonicalState?.incident_type || 'PIPELINE_LEAK';
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
      
      {/* 1. Executive Situational Hero Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/80 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-xl bg-indigo-950/80 border border-indigo-500/50 text-indigo-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-extrabold px-2.5 py-0.5 rounded border border-indigo-500/30">
                  EXECUTIVE SITUATIONAL AWARENESS
                </span>
                <span className="text-[11px] text-slate-400">{canonicalState?.facility_name || 'PetroChem Alpha'} • Senior Leadership View</span>
              </div>
              <h1 className="text-lg md:text-xl font-black text-white uppercase tracking-tight mt-0.5">
                {assetId} — {chemName} Emergency Briefing ({rate} kg/s)
              </h1>
            </div>
          </div>

          {/* Key Executive Action: One-Click Situation Brief */}
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={() => setShowBriefModal(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>GENERATE EXECUTIVE SITUATION BRIEF</span>
            </button>
          </div>
        </div>

        {/* 6 Core Executive Questions Answer Cards (Clean, Non-Technical, Zero Clutter) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          
          {/* 1. What happened? */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1.5 shadow-md">
            <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
              1. WHAT HAPPENED?
            </div>
            <div className="text-sm font-black text-white">
              {assetId} • {chemName}
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {incType.replace(/_/g, ' ')} detected at {canonicalState?.facility_sector}. Atmospheric plume propagating downwind toward {canonicalState?.plume_toward_cardinal} ({canonicalState?.plume_toward_deg?.toFixed(0)}°).
            </p>
          </div>

          {/* 2. How serious is it? */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1.5 shadow-md">
            <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
              2. HOW SERIOUS IS IT?
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black text-white">{score}/100</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRiskBadge(category)}`}>
                {category} SEVERITY
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Lethal Red Zone reach is {Math.round(canonicalState?.max_red_reach_m || 0)}m. Threat envelope contained within facility outer perimeter.
            </p>
          </div>

          {/* 3. Who/what is affected? */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1.5 shadow-md">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              3. WHO & WHAT IS AFFECTED?
            </div>
            <div className="text-sm font-black text-white">
              {canonicalState?.exposed_personnel || 0} Exposed • {canonicalState?.threatened_assets_count || 0} Assets
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              All {canonicalState?.total_personnel_at_site || 28} site personnel accounted for. {canonicalState?.blocked_roads_count || 0} road segment(s) blocked. {canonicalState?.recommended_exit_gate} open.
            </p>
          </div>

          {/* 4. Is it under control? */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1.5 shadow-md">
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              4. IS IT UNDER CONTROL?
            </div>
            <div className="text-sm font-black text-emerald-300">
              {canonicalState?.containment_state?.replace(/_/g, ' ')}
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {canonicalState?.lead_unit_name} staged {canonicalState?.standoff_m}m upwind. Deluge cooling engaged on adjacent units.
            </p>
          </div>

          {/* 5. What is being done? */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1.5 shadow-md">
            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
              5. WHAT IS BEING DONE?
            </div>
            <div className="text-sm font-black text-white truncate">
              Evacuation to {canonicalState?.recommended_assembly_point}
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {Math.round(canonicalState?.evacuation_distance_m || 0)}m safe corridor via {canonicalState?.recommended_exit_gate} (~{Math.round(canonicalState?.evacuation_time_min || 0)} min walk). Emergency PPE {canonicalState?.mandatory_ppe?.split('(')[0]} enforced.
            </p>
          </div>

          {/* 6. What requires attention? */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1.5 shadow-md">
            <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">
              6. WHAT REQUIRES MY ATTENTION?
            </div>
            <div className="text-sm font-black text-teal-300">
              {canonicalState?.human_authorization_state?.replace(/_/g, ' ')}
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              HSE Controller review in progress. District DDMA notification prepared. No offsite escalation required.
            </p>
          </div>

        </div>
      </div>

      {/* 2. Clean Executive Map Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        <div className="lg:col-span-8 space-y-2 flex flex-col">
          <div className="bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <span className="font-bold text-white">EXECUTIVE SITUATION MAP</span>
            <span className="text-[10px] text-slate-400">Simplified overview of threat envelope & evacuation corridor</span>
          </div>
          <div className="flex-1 min-h-[480px] h-[calc(100vh-420px)] rounded-xl overflow-hidden border border-slate-800 shadow-xl">
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

        {/* Right 4 Cols: Executive Quick Action Panel */}
        <div className="lg:col-span-4 space-y-3 flex flex-col">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="font-bold text-xs text-white border-b border-slate-800 pb-2">
              SENIOR DECISION ACTIONS
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowBriefModal(true)}
                className="w-full py-2.5 px-3 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center justify-between transition-all"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Open Executive Brief</span>
                </span>
                <ChevronRight className="w-4 h-4 text-cyan-400" />
              </button>

              <button
                type="button"
                onClick={onExportPDF}
                className="w-full py-2.5 px-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 font-bold text-xs flex items-center justify-between transition-all"
              >
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <span>Download Fire Pre-Plan PDF</span>
                </span>
                <ChevronRight className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="font-bold text-xs text-white">
              INCIDENT COMMAND CHAIN
            </div>
            <div className="space-y-1 text-[11px] text-slate-300">
              <div><b>Incident Commander:</b> Demo HSE Controller</div>
              <div><b>Plant General Manager:</b> On-Site (Operations Room)</div>
              <div><b>District Magistrate:</b> Notified (Standby Level 2)</div>
              <div><b>State Disaster Authority:</b> Informational Feed Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Dialog */}
      <ExecutiveBriefModal
        isOpen={showBriefModal}
        onClose={() => setShowBriefModal(false)}
        simulationResult={simulationResult}
        impactResult={impactResult}
        evacuationPlan={evacuationPlan}
        resourcePlan={resourcePlan}
        authorizationRecord={null}
        onExportPDF={onExportPDF}
      />

    </div>
  );
}
