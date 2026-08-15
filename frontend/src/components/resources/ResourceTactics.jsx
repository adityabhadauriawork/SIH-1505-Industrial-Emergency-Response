import React, { useState } from 'react';
import { 
  Siren, ShieldAlert, Droplets, CheckCircle, 
  Clock, MapPin, Zap, Compass, ListChecks, AlertTriangle, 
  Info, Flame, ChevronDown, ChevronUp, ShieldCheck 
} from 'lucide-react';

export default function ResourceTactics({ resourcePlan }) {
  const [expandedResourceId, setExpandedResourceId] = useState(null);
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);

  if (!resourcePlan) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-8 text-center text-slate-500 font-mono text-xs">
        No active tactical response plan computed. Run a hazard scenario to optimize emergency resource dispatch.
      </div>
    );
  }

  const { 
    recommended_resources = [], 
    unavailable_resources = [],
    tactical_checklist = [], 
    foam_water_requirements, 
    isolation_perimeter_m, 
    standoff_upwind_m,
    incident_type,
    chemical_name
  } = resourcePlan;

  const toggleResource = (id) => {
    setExpandedResourceId(expandedResourceId === id ? null : id);
  };

  return (
    <div className="space-y-4 font-mono text-xs text-slate-200">
      
      {/* 1. Level 1: Prototype Decision-Support Disclaimer */}
      <div className="bg-amber-950/40 border border-amber-500/60 p-3 rounded-xl flex items-start gap-2.5 text-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <b className="text-amber-300">PROTOTYPE DECISION SUPPORT:</b> Tactical resource allocations, firewater quantities, and standoff perimeters are computed for decision-support triage. Validate against facility ERDMP and statutory OISD/PESO regulations before operational use.
        </div>
      </div>

      {/* 2. Level 1: Tactical Suppression & Staging Strategy Summary */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400">SUPPRESSION & STAGING DIRECTIVE</span>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Siren className="w-4 h-4 text-cyan-400" />
              Tactical Resource Optimization & Staging Envelopes
            </h3>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Incident: <span className="text-white font-bold">{incident_type?.replace(/_/g, ' ')}</span> • Substance: <span className="text-rose-400 font-bold">{chemical_name}</span>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/40 font-bold">
            SEVERITY: {resourcePlan.incident_severity}
          </span>
        </div>

        {/* 4 Key Suppression Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950/70 p-3 rounded-lg border border-slate-800">
          <div>
            <span className="text-[10px] text-slate-400 block">UPWIND STAGING STANDOFF</span>
            <span className="font-bold text-cyan-400 text-xs">{standoff_upwind_m} meters</span>
            <span className="text-[9px] text-slate-500 block">Plume Red Zone Safe Buffer</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block">ISOLATION CORDON RADIUS</span>
            <span className="font-bold text-amber-400 text-xs">{isolation_perimeter_m} meters</span>
            <span className="text-[9px] text-slate-500 block">1.25x Lethal Threshold</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block">FIREWATER DEMAND</span>
            <span className="font-bold text-blue-400 text-xs">{foam_water_requirements?.firewater_demand_lpm?.toLocaleString()} LPM</span>
            <span className="text-[9px] text-slate-500 block">
              Foam: {foam_water_requirements?.foam_concentrate_demand_liters ? `${foam_water_requirements.foam_concentrate_demand_liters.toLocaleString()} L AFFF` : '0 L (Toxic Inhalation)'}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block">MANDATORY ENTRY PPE</span>
            <span className="font-bold text-rose-400 text-xs truncate block" title={foam_water_requirements?.ppe_required}>
              {foam_water_requirements?.ppe_required?.split('(')[0] || 'Level A Encapsulated SCBA'}
            </span>
            <span className="text-[9px] text-slate-500 block">Prototype PPE guidance — verify against site requirements</span>
          </div>
        </div>
      </div>

      {/* 3. Level 2: Deployed Tactical Resources (Compact Cards with Expandable Specs) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <span className="text-xs font-bold uppercase text-white flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Allocated Tactical Vehicle & Hazmat Units ({recommended_resources.length})
          </span>
          <span className="text-[10px] text-slate-400">Derived from Geolocation & Staging Network</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recommended_resources.map((res) => {
            const isExpanded = expandedResourceId === res.resource_id;
            const prioBadge = {
              'IMMEDIATE': 'bg-red-500/20 text-red-300 border-red-500/50',
              'HIGH': 'bg-orange-500/20 text-orange-300 border-orange-500/50',
              'SUPPORT': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50',
              'STANDBY': 'bg-slate-800 text-slate-400 border-slate-700'
            }[res.priority] || 'bg-slate-800 text-slate-300 border-slate-700';

            return (
              <div 
                key={res.resource_id}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2 hover:border-slate-700 transition-colors shadow-sm"
              >
                {/* Compact Level 2 Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-white text-xs">{res.resource_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Station: {res.current_station}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${prioBadge}`}>
                    {res.priority} • ETA {res.estimated_arrival_min}m
                  </span>
                </div>

                <div className="text-[11px] text-cyan-300/90 font-medium">
                  Staging: {res.staging_area_name} ({res.distance_to_staging_m}m transit)
                </div>

                {/* Level 3 Expandable Specifications Button */}
                <button
                  type="button"
                  onClick={() => toggleResource(res.resource_id)}
                  className="w-full pt-1 text-[10px] text-slate-400 hover:text-cyan-300 flex items-center justify-between border-t border-slate-800/80 transition-colors"
                >
                  <span>{isExpanded ? 'Hide Tactical Specifications' : 'View Tactical Specifications'}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {/* Level 3 Deep Details */}
                {isExpanded && (
                  <div className="mt-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 text-[10.5px]">
                    <div>
                      <span className="text-slate-500 block">ASSIGNED TACTICAL ROLE:</span>
                      <span className="text-slate-200">{res.assigned_role}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">DEPLOYMENT RATIONALE:</span>
                      <span className="text-slate-300">{res.deployment_rationale}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">REQUIRED EQUIPMENT & HOOKUP:</span>
                      <span className="text-amber-300">{res.tactical_equipment_required}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Level 3: Phased Standard Operating Procedure (SOP) Action Accordions */}
      {tactical_checklist.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-cyan-400" />
              Standard Operating Procedure (SOP) Phased Action Directives
            </h4>
            <span className="text-[10px] text-slate-400">{tactical_checklist.length} Phases</span>
          </div>

          <div className="space-y-2">
            {tactical_checklist.map((phase, idx) => {
              const isOpen = activePhaseIndex === idx;
              return (
                <div key={idx} className="bg-slate-950/70 rounded-lg border border-slate-800 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setActivePhaseIndex(isOpen ? -1 : idx)}
                    className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-900/60 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-[10px] border border-cyan-500/40">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-white text-xs">{phase.title}</span>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>

                  {isOpen && (
                    <div className="p-3 pt-0 border-t border-slate-800/80 space-y-1.5">
                      {phase.actions?.map((act, aIdx) => (
                        <div key={aIdx} className="flex items-start gap-2 text-slate-300 text-xs">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
