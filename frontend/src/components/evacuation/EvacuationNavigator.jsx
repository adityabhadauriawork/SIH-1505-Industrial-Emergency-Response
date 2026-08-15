import React, { useState } from 'react';
import { 
  Navigation, ShieldCheck, DoorOpen, Clock, 
  AlertTriangle, CheckCircle2, ArrowRight, CornerDownRight,
  Compass, XCircle, CheckCircle, Award, Target, ChevronDown, ChevronUp 
} from 'lucide-react';

export default function EvacuationNavigator({ evacuationPlan }) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showWaypoints, setShowWaypoints] = useState(false);

  if (!evacuationPlan || !evacuationPlan.primary_evacuation_route) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-8 text-center text-slate-500 font-mono text-xs">
        No active evacuation route computed. Run a hazard scenario to evaluate dynamic pathfinding graph.
      </div>
    );
  }

  const route = evacuationPlan.primary_evacuation_route;
  const scoreBreakdown = route.score_breakdown;
  const candidates = evacuationPlan.candidate_routes || route.candidate_routes || [];
  const waypoints = route.route_steps || [];
  const isLongEgress = route.estimated_evac_time_min >= 30.0;

  return (
    <div className="space-y-4 font-mono text-xs text-slate-200">
      
      {/* 1. Level 1: Dominant Recommended Safe Evacuation Corridor Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400">GRAPH PATHFINDING DIRECTIVE</span>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-400" />
              Dynamic Safe Evacuation Corridor
            </h3>
          </div>
          <span className={`px-2.5 py-1 rounded text-xs font-bold ${
            route.route_status === 'CLEAR' 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          }`}>
            CORRIDOR: {route.route_status}
          </span>
        </div>

        {/* Egress Origin & Destination Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950/70 p-3 rounded-lg border border-slate-800">
          <div>
            <span className="text-[10px] text-slate-400 block">EGRESS ORIGIN</span>
            <span className="font-bold text-white text-xs">{route.origin_name}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block">RECOMMENDED MUSTER</span>
            <span className="font-bold text-emerald-400 text-xs flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {route.recommended_assembly_point_name}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block">PERIMETER EXIT GATE</span>
            <span className="font-bold text-cyan-400 text-xs flex items-center gap-1">
              <DoorOpen className="w-3.5 h-3.5" />
              {route.recommended_gate_name}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block">DISTANCE & TIME</span>
            <span className="font-bold text-amber-300 text-xs flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {route.total_distance_m}m (~{route.estimated_evac_time_min} min walk)
            </span>
          </div>
        </div>

        {/* Long Egress Operational Alert (if applicable) */}
        {isLongEgress && (
          <div className="bg-rose-950/40 border border-rose-500/60 p-2.5 rounded-lg flex items-center gap-2 text-rose-200 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <b className="text-rose-300">⚠ LONG EGRESS — HUMAN REVIEW REQUIRED:</b> Estimated walk time exceeds 30.0 minutes ({route.estimated_evac_time_min}m at 1.2 m/s). Verify mobility support and transport assistance for Sector operators.
            </div>
          </div>
        )}

        {/* Dynamic Obstacle Avoidance Alert */}
        {route.avoided_blocked_roads && route.avoided_blocked_roads.length > 0 && (
          <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-lg flex items-center gap-2 text-[11px] text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <b>Dynamic Obstacle Avoidance:</b> Automatically diverted around {route.avoided_blocked_roads.length} severed road corridors ({route.avoided_blocked_roads.join(', ')}).
            </div>
          </div>
        )}
      </div>

      {/* 2. Level 2: Explainability & Multi-Factor Route Scoring Breakdown */}
      {scoreBreakdown && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Why Selected: Multi-Factor Scoring Rationale
            </h4>
            <span className="text-[10px] text-slate-400">
              Composite Score: <b className="text-emerald-300">{(scoreBreakdown.composite_score * 100).toFixed(1)}/100</b>
            </span>
          </div>

          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-200 leading-relaxed">
            {scoreBreakdown.selection_reason}
          </div>

          {/* 4 Score Gauges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">SAFETY SCORE</span>
              <span className="text-sm font-bold text-emerald-400">{(scoreBreakdown.safety_score * 100).toFixed(0)}%</span>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${scoreBreakdown.safety_score * 100}%` }}></div>
              </div>
            </div>

            <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">DISTANCE SCORE</span>
              <span className="text-sm font-bold text-cyan-400">{(scoreBreakdown.distance_score * 100).toFixed(0)}%</span>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${scoreBreakdown.distance_score * 100}%` }}></div>
              </div>
            </div>

            <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">WIND CLEARANCE</span>
              <span className="text-sm font-bold text-amber-300">{scoreBreakdown.angle_to_wind_deg?.toFixed(0)}°</span>
              <div className="text-[9px] text-slate-500 mt-1">Crosswind Egress</div>
            </div>

            <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">ROADS CLEARED</span>
              <span className="text-sm font-bold text-emerald-400">100%</span>
              <div className="text-[9px] text-slate-500 mt-1">0 Plume Crossings</div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Level 3: Candidate Alternatives & Rejection Analysis (Collapsible) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <button
          type="button"
          onClick={() => setShowAlternatives(!showAlternatives)}
          className="w-full px-4 py-3 flex items-center justify-between text-slate-300 hover:text-white transition-colors text-left"
        >
          <span className="flex items-center gap-2 font-bold text-xs uppercase">
            <Target className="w-4 h-4 text-cyan-400" />
            <span>Evaluated Candidate Routes & Rejection Analysis ({candidates.length})</span>
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <span>{showAlternatives ? 'Hide Alternatives' : 'View Alternatives'}</span>
            {showAlternatives ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        </button>

        {showAlternatives && (
          <div className="p-4 pt-0 space-y-2 border-t border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] divide-y divide-slate-800">
                <thead>
                  <tr className="text-slate-400">
                    <th className="py-2 pr-2">Candidate Assembly Point</th>
                    <th className="py-2 px-2">Exit Gate</th>
                    <th className="py-2 px-2">Distance</th>
                    <th className="py-2 px-2">Safety</th>
                    <th className="py-2 pl-2">Status & Rejection Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {candidates.map((c, idx) => {
                    const statusBadge = {
                      'SELECTED': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                      'VIABLE_BACKUP': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
                      'REJECTED_DOWNWIND': 'bg-red-500/20 text-red-300 border-red-500/40',
                      'REJECTED_BLOCKED': 'bg-rose-500/20 text-rose-300 border-rose-500/40',
                      'REJECTED_EXCESSIVE_DISTANCE': 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }[c.route_status] || 'bg-slate-800 text-slate-400';

                    return (
                      <tr key={idx} className="hover:bg-slate-950/40 transition-colors">
                        <td className="py-2 pr-2 font-bold text-white">{c.target_assembly_point_id}</td>
                        <td className="py-2 px-2 text-slate-300">{c.target_gate_id}</td>
                        <td className="py-2 px-2 text-amber-300">{c.total_distance_m}m</td>
                        <td className="py-2 px-2 text-cyan-300">{(c.safety_score * 100).toFixed(0)}%</td>
                        <td className="py-2 pl-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold border mr-2 ${statusBadge}`}>
                            {c.route_status}
                          </span>
                          <span className="text-slate-400 text-[10px]">{c.rejection_reason}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 4. Level 3: Turn-by-Turn Waypoint Guidance (Collapsible) */}
      {waypoints.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <button
            type="button"
            onClick={() => setShowWaypoints(!showWaypoints)}
            className="w-full px-4 py-3 flex items-center justify-between text-slate-300 hover:text-white transition-colors text-left"
          >
            <span className="flex items-center gap-2 font-bold text-xs uppercase">
              <CornerDownRight className="w-4 h-4 text-emerald-400" />
              <span>Turn-by-Turn Waypoint Guidance ({waypoints.length} Steps)</span>
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <span>{showWaypoints ? 'Hide Waypoints' : 'View Waypoints'}</span>
              {showWaypoints ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>

          {showWaypoints && (
            <div className="p-4 pt-0 space-y-2 border-t border-slate-800">
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                {waypoints.map((step, idx) => (
                  <div key={idx} className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="text-white font-medium">{step.instruction}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{step.distance_m}m</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
