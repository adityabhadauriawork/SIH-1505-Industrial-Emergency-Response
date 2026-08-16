import React, { useState, useEffect } from 'react';
import { 
  Cpu, AlertTriangle, ShieldAlert, Zap, Droplet, 
  Flame, RefreshCw, Layers, CheckCircle2, Shield, Lock 
} from 'lucide-react';
import { api } from '../../services/api';

export default function DominoRiskAnalysis({
  simulationResult,
  impactResult,
  onNavigateTab
}) {
  const [dominoData, setDominoData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [interlockActions, setInterlockActions] = useState({});

  const fetchDominoAnalysis = async () => {
    if (!simulationResult) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDominoRisk(simulationResult, impactResult);
      setDominoData(res);
    } catch (err) {
      console.error('Failed to evaluate domino cascade risk:', err);
      setError(err.message || 'Domino analysis failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDominoAnalysis();
  }, [simulationResult, impactResult]);

  const handleToggleInterlock = (valveId) => {
    setInterlockActions((prev) => ({
      ...prev,
      [valveId]: !prev[valveId]
    }));
  };

  const getRiskBadge = (level) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/50 shadow-red-500/20';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-orange-500/20';
      case 'ELEVATED':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-amber-500/20';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
    }
  };

  const getZoneBadge = (zone) => {
    switch (zone) {
      case 'RED_ZONE_LETHAL':
        return 'bg-red-500/30 text-red-300 border-red-500/50';
      case 'ORANGE_ZONE_INJURY':
        return 'bg-orange-500/30 text-orange-300 border-orange-500/50';
      case 'YELLOW_ZONE_CAUTION':
        return 'bg-amber-500/30 text-amber-300 border-amber-500/50';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs text-slate-200">
      
      {/* 1. Hero Domino Screening Status Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-2">
                Domino / Cascade Screening Risk Analysis
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Evaluates secondary thermal radiation, toxic ingress, and BLEVE vulnerabilities against adjacent critical infrastructure.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchDominoAnalysis}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-lg border border-slate-700 font-bold transition-all text-[11px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            <span>Recalculate Domino Risk</span>
          </button>
        </div>

        {/* Screening Risk Level Callout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400">SCREENING CASCADE LEVEL</span>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-lg text-xs font-black border ${getRiskBadge(dominoData?.overall_screening_cascade_level || 'LOW')}`}>
                {dominoData?.overall_screening_cascade_level || 'EVALUATING'} CASCADE RISK
              </span>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400">PRIMARY EPICENTER</span>
            <div className="text-xs font-bold text-white">
              {dominoData?.source_asset_id || 'T-04'} • <span className="text-cyan-300">{dominoData?.source_chemical_name || 'Ammonia'}</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Evaluated {dominoData?.total_assets_evaluated || 16} site units
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400">THREATENED CRITICAL UNITS</span>
            <div className="text-xs font-bold text-amber-300">
              {dominoData?.threatened_critical_assets_count || 0} Critical • {dominoData?.threatened_high_assets_count || 0} High Priority
            </div>
            <div className="text-[10px] text-slate-400">
              Requiring exposure protection deluge
            </div>
          </div>
        </div>

        {/* Prototype Disclaimer Banner */}
        <div className="bg-purple-950/40 border border-purple-500/40 p-2.5 rounded-lg flex items-center justify-between text-[11px] text-purple-200">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-purple-400 shrink-0" />
            <span><b>SCREENING CASCADE RISK:</b> Prototype decision-support heuristic based on hazard envelope intersection and asset criticality. Not a certified physical damage probability calculation.</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/60 border border-red-500/80 p-3 rounded-lg text-red-200 text-xs">
          <b>Error:</b> {error}
        </div>
      )}

      {/* 2. Threatened Assets Cascade Chain */}
      <div className="space-y-3">
        <div className="font-bold text-xs text-white flex items-center justify-between">
          <span>THREATENED ADJACENT ASSETS & CASCADE VULNERABILITY CHAIN ({dominoData?.domino_chain?.length || 0})</span>
          <span className="text-[10px] text-slate-400">Sorted by Screening Risk Priority</span>
        </div>

        {dominoData?.domino_chain?.map((item) => {
          const isInterlocked = interlockActions[item.isolation_valve_id];
          return (
            <div
              key={item.asset_id}
              className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-3 transition-all shadow-md"
            >
              {/* Top Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white text-xs">
                    {item.asset_id} — {item.asset_name}
                  </span>
                  <span className="text-[10px] text-slate-400">({item.sector})</span>
                  <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[9px] font-bold border border-slate-700">
                    {item.criticality} CRITICALITY
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-[10px]">
                  <span className="text-slate-400">Distance: <b className="text-white">{item.distance_to_epicenter_m}m</b></span>
                  <span className={`px-2 py-0.5 rounded font-bold border ${getZoneBadge(item.threat_zone_overlap)}`}>
                    {item.threat_zone_overlap.replace(/_/g, ' ')}
                  </span>
                  <span className={`px-2 py-0.5 rounded font-black border ${getRiskBadge(item.screening_cascade_risk)}`}>
                    {item.screening_cascade_risk} CASCADE
                  </span>
                </div>
              </div>

              {/* Cascade Mechanism & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                  <div className="text-[9px] font-bold text-purple-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    CASCADE MECHANISM & FAILURE MODE
                  </div>
                  <div className="font-bold text-slate-200">
                    {item.cascade_mechanism}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {item.failure_mode_description}
                  </p>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 space-y-1.5">
                  <div className="text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    RECOMMENDED EXPOSURE MITIGATION & PREVENTION
                  </div>
                  <p className="text-[11px] text-slate-200 leading-relaxed">
                    {item.recommended_prevention}
                  </p>
                  
                  {/* Remote ESD Isolation Interlock Button */}
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Valve Tag: <b className="text-cyan-300">{item.isolation_valve_id}</b>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleInterlock(item.isolation_valve_id)}
                      className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-[10px] font-bold border transition-all ${
                        isInterlocked
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/40'
                      }`}
                    >
                      {isInterlocked ? <CheckCircle2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      <span>{isInterlocked ? 'SIMULATED ESD ISOLATION ACTIVE' : 'PROPOSE ESD ISOLATION'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Prioritized Mitigation Directives */}
      {dominoData?.prioritized_mitigation_actions && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="font-bold text-xs text-white flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-purple-400" />
            PRIORITIZED DOMINO MITIGATION & INTERLOCK ACTIONS
          </div>
          <div className="space-y-1.5 text-[11px] text-slate-300">
            {dominoData.prioritized_mitigation_actions.map((act, i) => (
              <div key={i} className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                <span>{act}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
