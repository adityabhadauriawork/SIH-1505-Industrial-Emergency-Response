import React from 'react';
import { 
  Users, Flame, AlertOctagon, Navigation, 
  ShieldCheck, Siren, Activity, ShieldAlert 
} from 'lucide-react';

export default function HUDStats({ impactResult, simulationResult, resourcePlan }) {
  if (!simulationResult || !impactResult) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">System State</div>
            <div className="text-xs font-bold text-slate-200 font-mono">STANDBY / READY</div>
          </div>
        </div>

        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-slate-800 text-slate-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Facility Roster</div>
            <div className="text-xs font-bold text-slate-200 font-mono">28 Workers Active</div>
          </div>
        </div>

        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-slate-800 text-slate-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Monitored Assets</div>
            <div className="text-xs font-bold text-slate-200 font-mono">16 Units Normal</div>
          </div>
        </div>

        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Internal Roadway</div>
            <div className="text-xs font-bold text-emerald-400 font-mono">100% Clear</div>
          </div>
        </div>

        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Siren className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Tactical Readiness</div>
            <div className="text-xs font-bold text-cyan-300 font-mono">5 Units Available</div>
          </div>
        </div>
      </div>
    );
  }

  const { 
    risk_assessment, 
    affected_workers_count, 
    red_zone_workers_count, 
    orange_zone_workers_count, 
    blocked_roads_count, 
    total_roads_count, 
    affected_assets_count,
    total_assets_at_site
  } = impactResult;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
      
      {/* 1. Overall Risk Index */}
      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Overall Risk Index</span>
          <span 
            className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase font-mono"
            style={{ backgroundColor: `${risk_assessment.color}20`, color: risk_assessment.color, border: `1px solid ${risk_assessment.color}50` }}
          >
            {risk_assessment.risk_category}
          </span>
        </div>
        <div className="flex items-baseline space-x-1.5 my-1">
          <span className="text-2xl font-black font-mono" style={{ color: risk_assessment.color }}>
            {risk_assessment.overall_score}
          </span>
          <span className="text-xs text-slate-500 font-mono">/ 100</span>
        </div>
        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500" 
            style={{ width: `${risk_assessment.overall_score}%`, backgroundColor: risk_assessment.color }} 
          />
        </div>
      </div>

      {/* 2. Personnel at Risk */}
      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Personnel Exposure</span>
          <Users className={`w-3.5 h-3.5 ${affected_workers_count > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
        </div>
        <div className="flex items-baseline justify-between my-1">
          <span className={`text-2xl font-black font-mono ${affected_workers_count > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {affected_workers_count}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">of {impactResult.total_workers_at_site} on site</span>
        </div>
        <div className="text-[10px] font-mono flex items-center gap-1.5">
          {affected_workers_count > 0 ? (
            <>
              <span className="text-red-400 font-bold">🔴 {red_zone_workers_count} Lethal</span>
              <span className="text-orange-400 font-bold">🟠 {orange_zone_workers_count} Severe</span>
            </>
          ) : (
            <span className="text-emerald-400 font-bold">✓ 0 Exposed (All Clear)</span>
          )}
        </div>
      </div>

      {/* 3. Compromised Assets */}
      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Threatened Units</span>
          <Flame className={`w-3.5 h-3.5 ${affected_assets_count > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
        </div>
        <div className="flex items-baseline justify-between my-1">
          <span className={`text-2xl font-black font-mono ${affected_assets_count > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {affected_assets_count}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">of {total_assets_at_site} tanks/units</span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 truncate">
          {affected_assets_count > 0 ? 'Domino Cooling Required' : '✓ No Secondary Exposure'}
        </div>
      </div>

      {/* 4. Roadway Severance */}
      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Road Grid Severance</span>
          <AlertOctagon className={`w-3.5 h-3.5 ${blocked_roads_count > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
        </div>
        <div className="flex items-baseline justify-between my-1">
          <span className={`text-2xl font-black font-mono ${blocked_roads_count > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {blocked_roads_count}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">of {total_roads_count} corridors</span>
        </div>
        <div className="text-[10px] font-mono text-slate-400">
          {blocked_roads_count > 0 ? 'Dynamic Reroute Engaged' : '✓ All Segments Open'}
        </div>
      </div>

      {/* 5. Incident & Primary Response Action */}
      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Active Incident</span>
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="my-1">
          <div className="font-bold text-white text-xs font-mono truncate" title={simulationResult.chemical_name}>
            {simulationResult.source_asset_id} • {simulationResult.chemical_name.split('(')[0]}
          </div>
          <div className="text-[10px] text-cyan-300 font-mono truncate mt-0.5">
            {simulationResult.incident_type.replace(/_/g, ' ')}
          </div>
        </div>
        <div className="text-[10px] font-mono text-slate-400 truncate">
          Rate: <b className="text-slate-200">{simulationResult.effective_release_rate_kg_s} kg/s</b> ({simulationResult.model_metadata?.release_duration_min || 30}m)
        </div>
      </div>

    </div>
  );
}
