import React, { useState } from 'react';
import { 
  ShieldAlert, Navigation, Wind, Compass, AlertTriangle, 
  CheckCircle2, Siren, User, MapPin, Radio, Shield, ChevronRight, Phone 
} from 'lucide-react';
import PlantMap from '../map/PlantMap';

export default function FieldResponderView({
  canonicalState,
  simulationResult,
  evacuationPlan,
  siteData,
  currentTimeStep,
  selectedAssetId,
  onSelectAsset
}) {
  const [tasksChecked, setTasksChecked] = useState({
    ppe: true,
    radio: true,
    muster: false,
    isolation: false
  });

  const toggleTask = (key) => {
    setTasksChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const assetId = canonicalState?.source_asset || 'T-04';
  const chemName = canonicalState?.chemical || 'Ammonia (Anhydrous)';
  const windDeg = canonicalState?.wind_from_deg ?? 45;
  const windCard = canonicalState?.wind_from_cardinal || 'NE';
  const plumeDeg = canonicalState?.plume_toward_deg ?? 225;
  const plumeCard = canonicalState?.plume_toward_cardinal || 'SW';
  const standoff = canonicalState?.standoff_m ?? 250;

  return (
    <div className="space-y-4 font-mono text-xs text-slate-200">
      
      {/* 1. Immediate Task Action Hero Card */}
      <div className="bg-gradient-to-r from-red-950/90 via-slate-900/90 to-amber-950/90 border-2 border-red-500/70 rounded-2xl p-4 md:p-5 shadow-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-500/30 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-red-600/30 border border-red-400 text-red-400 animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] bg-red-500/30 text-red-300 font-extrabold px-2.5 py-0.5 rounded border border-red-400">
                  PRIORITY: IMMEDIATE FIELD ACTION
                </span>
                <span className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-bold">
                  {canonicalState?.canonical_severity} RISK
                </span>
              </div>
              <h2 className="text-base md:text-lg font-black text-white uppercase tracking-tight mt-0.5">
                {assetId} — {chemName} ({canonicalState?.release_rate_kg_s} kg/s)
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-red-500/40">
            <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span className="text-[11px] text-slate-300">
              Assigned: <b className="text-white">Hazmat Response Team Alpha</b>
            </span>
          </div>
        </div>

        {/* 4 Critical Field Directives Derived from Canonical State */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Mandatory PPE */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-1">
            <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              MANDATORY PPE
            </div>
            <div className="text-sm font-black text-white">
              {canonicalState?.mandatory_ppe?.split('(')[0] || 'Level A SCBA'}
            </div>
            <div className="text-[10px] text-slate-400">
              Encapsulated vapor-tight suit + positive pressure air
            </div>
          </div>

          {/* Card 2: Evacuation Muster */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-1">
            <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5" />
              SAFE MUSTER TARGET
            </div>
            <div className="text-sm font-black text-white">
              {canonicalState?.recommended_assembly_point}
            </div>
            <div className="text-[10px] text-slate-400">
              Via {canonicalState?.recommended_exit_gate} ({Math.round(canonicalState?.evacuation_distance_m)}m, ~{Math.round(canonicalState?.evacuation_time_min)} min)
            </div>
          </div>

          {/* Card 3: Upwind Staging Post */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-1">
            <div className="text-[10px] font-bold text-cyan-400 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              UPWIND STAGING POST
            </div>
            <div className="text-sm font-black text-white">
              {standoff}m Upwind (Staging Bearing {windDeg.toFixed(0)}°)
            </div>
            <div className="text-[10px] text-slate-400">
              Wind FROM {windCard} ({windDeg.toFixed(0)}°) • Plume TOWARD {plumeCard} ({plumeDeg.toFixed(0)}°)
            </div>
          </div>

          {/* Card 4: Assigned Tactical Resource */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-1">
            <div className="text-[10px] font-bold text-indigo-400 flex items-center gap-1">
              <Siren className="w-3.5 h-3.5" />
              SUPPORT UNIT
            </div>
            <div className="text-sm font-black text-white truncate">
              {canonicalState?.lead_unit_name}
            </div>
            <div className="text-[10px] text-slate-400">
              ETA: {canonicalState?.lead_unit_eta_min} min • {canonicalState?.firewater_demand_lpm ? `${(canonicalState.firewater_demand_lpm).toLocaleString()} LPM` : '5,000 LPM'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Field Layout: Simplified Tactical Map (Left) + Immediate Action Checklist (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        
        {/* Left 8 Cols: Large Interactive Tactical Map showing Safe Route & Hazard Zone */}
        <div className="lg:col-span-8 space-y-2 flex flex-col">
          <div className="bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              TACTICAL FIELD MAP — DANGER PERIMETER & SAFE EGRESS
            </span>
            <span className="text-[10px] text-slate-400">
              Follow green highlighted crosswind route
            </span>
          </div>

          <div className="flex-1 min-h-[500px] h-[calc(100vh-340px)] rounded-xl overflow-hidden border border-slate-800 shadow-xl">
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

        {/* Right 4 Cols: Tactical Field Checklist & Contacts */}
        <div className="lg:col-span-4 space-y-3 flex flex-col">
          
          {/* Checklist Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="font-bold text-xs text-white flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                MANDATORY FIELD SAFETY CHECKLIST
              </span>
              <span className="text-[10px] text-slate-400">Step-by-Step</span>
            </div>

            <div className="space-y-2">
              {[
                { key: 'ppe', title: '1. Don Mandatory PPE Suit & SCBA', desc: 'Verify air cylinder pressure > 250 bar.' },
                { key: 'radio', title: '2. Check Radio Comm on Channel 4', desc: 'Maintain live contact with HSE Command.' },
                { key: 'muster', title: '3. Guide Sector Workforce Crosswind', desc: `Direct workers toward ${canonicalState?.recommended_assembly_point} via ${canonicalState?.recommended_exit_gate}.` },
                { key: 'isolation', title: '4. Standby at Upwind Staging Post', desc: `Maintain ${standoff}m standoff upwind of ${assetId}.` }
              ].map((item) => (
                <div
                  key={item.key}
                  onClick={() => toggleTask(item.key)}
                  className={`p-2.5 rounded-lg border cursor-pointer select-none transition-all flex items-start gap-2.5 ${
                    tasksChecked[item.key]
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-slate-200'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={tasksChecked[item.key]}
                    onChange={() => {}}
                    className="mt-0.5 accent-emerald-500 rounded"
                  />
                  <div>
                    <div className={`font-bold text-xs ${tasksChecked[item.key] ? 'text-emerald-300' : 'text-white'}`}>
                      {item.title}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Channel & Contacts */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="font-bold text-xs text-white flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-cyan-400" />
              EMERGENCY FIELD COMMS
            </div>
            
            <div className="space-y-1.5 text-[11px]">
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex justify-between">
                <span className="text-slate-400">Incident Command Radio:</span>
                <b className="text-cyan-300">VHF Channel 4 (156.2 MHz)</b>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex justify-between">
                <span className="text-slate-400">Emergency Medical Hot:</span>
                <b className="text-rose-400">Ext. 9911 / Speed Dial 1</b>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex justify-between">
                <span className="text-slate-400">Main Control Center:</span>
                <b className="text-white">Ext. 2400 (Building CC-1)</b>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
