import React, { useState, useEffect } from 'react';
import { 
  Activity, AlertTriangle, ShieldCheck, Wrench, 
  ArrowRight, RefreshCw, Zap, Gauge, Flame, Sparkles 
} from 'lucide-react';
import { api } from '../../services/api';

export default function PredictiveMaintenance({ onSimulateAssetConsequence }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterRisk, setFilterRisk] = useState('ALL');

  const fetchAssetHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getPredictiveAssetHealth();
      setData(res);
    } catch (err) {
      console.error('Failed to load asset health:', err);
      setError(err.message || 'Failed to fetch asset telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssetHealth();
  }, []);

  if (loading && !data) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-12 text-center text-slate-400 font-mono text-xs space-y-2">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-cyan-400" />
        <div>Evaluating vibration spectra, thermal telemetry, and ultrasonic acoustic leak indicators...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-950/40 border border-rose-500/60 p-4 rounded-xl text-xs font-mono text-rose-200">
        <b>Predictive Health Error:</b> {error || 'Unable to load asset telemetry.'}
      </div>
    );
  }

  const filteredAssets = (data.assets || []).filter(a => {
    return filterRisk === 'ALL' || a.risk_category === filterRisk;
  });

  return (
    <div className="space-y-4 font-mono text-xs text-slate-200">
      
      {/* 1. Header & Non-Certified Prototype Disclaimer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Predictive Maintenance & Equipment Failure Early Warning
            </h3>
            <p className="text-[11px] text-slate-400">
              Multi-sensor degradation modeling evaluating mechanical vibration, thermal excursions, acoustic micro-leaks, and turnaround aging.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[10px]">
            SYNTHETIC SENSOR DATA — PROTOTYPE (Non-Certified Decision Support)
          </span>
        </div>
      </div>

      {/* 2. Top Summary KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md space-y-1">
          <span className="text-[10px] text-slate-400 uppercase block">Monitored Assets</span>
          <span className="text-xl font-black text-white">{data.total_monitored_assets} Units</span>
          <span className="text-[9px] text-slate-500 block">Active Telemetry Stream</span>
        </div>

        <div className="bg-slate-900/90 border border-red-500/40 rounded-xl p-3 shadow-md space-y-1">
          <span className="text-[10px] text-red-400 uppercase block font-bold">Critical Risk Tier</span>
          <span className="text-xl font-black text-red-400">{data.critical_risk_count} Assets</span>
          <span className="text-[9px] text-red-400/70 block">Immediate Shutdown Review</span>
        </div>

        <div className="bg-slate-900/90 border border-orange-500/40 rounded-xl p-3 shadow-md space-y-1">
          <span className="text-[10px] text-orange-400 uppercase block font-bold">High Risk Tier</span>
          <span className="text-xl font-black text-orange-400">{data.high_risk_count} Assets</span>
          <span className="text-[9px] text-orange-400/70 block">Turnaround Inspection Due</span>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-3 shadow-md space-y-1">
          <span className="text-[10px] text-emerald-400 uppercase block font-bold">Nominal / Healthy</span>
          <span className="text-xl font-black text-emerald-400">{data.healthy_asset_count} Assets</span>
          <span className="text-[9px] text-emerald-400/70 block">Operating Within Baseline</span>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
        <span className="text-xs font-bold text-white">Facility Asset Health Telemetry & Failure Probability</span>
        <div className="flex gap-1.5">
          {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setFilterRisk(r)}
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold border transition-all ${
                filterRisk === r
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Asset Health Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredAssets.map(asset => {
          const isCritical = asset.risk_category === 'CRITICAL';
          const isHigh = asset.risk_category === 'HIGH';
          const borderClass = isCritical 
            ? 'border-red-500/60 bg-red-950/20' 
            : isHigh 
            ? 'border-orange-500/50 bg-orange-950/10' 
            : 'border-slate-800 bg-slate-950/70';

          const badgeClass = isCritical
            ? 'bg-red-500/20 text-red-300 border-red-500/50'
            : isHigh
            ? 'bg-orange-500/20 text-orange-300 border-orange-500/50'
            : 'bg-slate-800 text-slate-300 border-slate-700';

          return (
            <div key={asset.id} className={`p-4 rounded-xl border space-y-3 shadow-lg transition-all ${borderClass}`}>
              
              {/* Card Header */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{asset.asset_id} — {asset.asset_name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Sector: {asset.sector} • Substance: <span className="text-rose-300 font-bold">{asset.chemical_id}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeClass}`}>
                    {asset.risk_category} ({asset.failure_risk_score}/100)
                  </span>
                </div>
              </div>

              {/* Multi-Parameter Sensor Telemetry */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-[10px]">
                <div>
                  <span className="text-slate-500 block">VIBRATION</span>
                  <span className={`font-bold ${asset.vibration_mm_s > 5.0 ? 'text-red-400' : 'text-slate-200'}`}>
                    {asset.vibration_mm_s} mm/s
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block">TEMPERATURE</span>
                  <span className={`font-bold ${asset.temperature_c > 60 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {asset.temperature_c}°C
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block">PRESSURE</span>
                  <span className="font-bold text-slate-200">{asset.pressure_bar} bar</span>
                </div>

                <div>
                  <span className="text-slate-500 block">ACOUSTIC LEAK</span>
                  <span className={`font-bold ${asset.acoustic_leak_db > 35 ? 'text-rose-400' : 'text-slate-200'}`}>
                    {asset.acoustic_leak_db} dB
                  </span>
                </div>
              </div>

              {/* Dominant Risk Driver & Recommendation */}
              <div className="space-y-1 text-[11px]">
                <div className="text-slate-400">
                  Dominant Failure Driver: <b className="text-amber-300">{asset.top_risk_driver}</b>
                </div>
                <div className="text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800/80">
                  <b>Recommended Maintenance Action:</b> {asset.recommended_action}
                </div>
              </div>

              {/* Seamless Action: Simulate Consequence in Scenario Modeler */}
              <button
                type="button"
                onClick={() => onSimulateAssetConsequence && onSimulateAssetConsequence(asset.asset_id, asset.chemical_id)}
                className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.99]"
              >
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                <span>SIMULATE CONSEQUENCE (PASS TO SCENARIO MODELER)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

            </div>
          );
        })}
      </div>

    </div>
  );
}
