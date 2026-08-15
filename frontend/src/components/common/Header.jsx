import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Radio, Wind, Thermometer, Clock, 
  FileText, Play, RefreshCw, AlertTriangle, CheckCircle2, 
  CloudSun, Info, ChevronDown, ChevronUp 
} from 'lucide-react';

export default function Header({ 
  plantInfo, 
  activeSimulation, 
  impactResult, 
  activeWeather, 
  liveTelemetry,
  onRefreshWeather,
  isRefreshingWeather,
  onLoadPrimaryDemo, 
  onExportPDF, 
  isExporting,
  loading 
}) {
  const [timeStr, setTimeStr] = useState('');
  const [showWeatherDetails, setShowWeatherDetails] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const hasIncident = !!activeSimulation;
  const riskCategory = impactResult?.risk_assessment?.risk_category || (hasIncident ? 'EVALUATING' : 'NORMAL STANDBY');

  const riskBadgeStyles = {
    'CRITICAL': 'bg-red-500/20 text-red-400 border-red-500/50 shadow-red-500/20',
    'HIGH': 'bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-orange-500/20',
    'MODERATE': 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-amber-500/20',
    'LOW': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-emerald-500/20',
    'NORMAL STANDBY': 'bg-slate-800/80 text-slate-300 border-slate-700'
  }[riskCategory] || 'bg-slate-800 text-slate-300 border-slate-700';

  const isLive = activeWeather?.mode === 'LIVE';
  const weatherSource = activeWeather?.source || (isLive ? 'Open-Meteo' : 'Scenario Override');

  return (
    <header className="border-b border-slate-800 bg-[#0a0f1d]/95 backdrop-blur px-4 py-2.5 sticky top-0 z-50">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Application Identity */}
        <div className="flex items-center space-x-3.5">
          <div className="relative">
            <div className={`p-2.5 rounded-lg border ${hasIncident ? 'bg-red-950/60 border-red-500/60 glow-red' : 'bg-cyan-950/40 border-cyan-500/40 glow-cyan'}`}>
              <ShieldAlert className={`w-5 h-5 ${hasIncident ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`} />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hasIncident ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${hasIncident ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/30">
                SIH 1505
              </span>
              <h1 className="text-sm md:text-base font-extrabold tracking-tight text-white uppercase flex items-center gap-1.5">
                Industrial Hazard Command Center
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {plantInfo?.name || 'PetroChem Complex Alpha'} • <span className="text-slate-500">{plantInfo?.location || 'Dahej, Gujarat'}</span>
            </p>
          </div>
        </div>

        {/* Center: Unified Active Simulation Meteorological Feed with Expandable Details */}
        <div className="relative">
          <div className="hidden lg:flex items-center space-x-3.5 bg-slate-900/80 px-3.5 py-1.5 rounded-lg border border-slate-800 font-mono text-xs">
            {/* Status Indicator */}
            <div className="flex items-center space-x-2">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="text-slate-400">STATE:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${riskBadgeStyles}`}>
                {riskCategory}
              </span>
            </div>

            <div className="h-4 w-[1px] bg-slate-800" />

            {/* Active Weather Summary */}
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1.5 ${
                isLive 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/50'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                <span>{isLive ? 'LIVE' : 'DEMO'}</span>
              </span>

              <div className="flex items-center space-x-1.5 text-slate-200 font-bold">
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                <span>{activeWeather?.wind_speed_kmh ?? 8.0} km/h</span>
                <span className="text-cyan-400">
                  FROM {activeWeather?.wind_direction_cardinal || 'NE'} ({activeWeather?.wind_direction_deg ?? 45}°)
                </span>
              </div>

              <div className="flex items-center space-x-1 text-slate-300 pl-1">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                <span>{activeWeather?.temperature_c ?? 32}°C</span>
              </div>

              {/* Expand Details Trigger */}
              <button
                type="button"
                onClick={() => setShowWeatherDetails(!showWeatherDetails)}
                className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors ml-0.5"
                title="Toggle Meteorological Details"
              >
                {showWeatherDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {/* Refresh Live Ambient Weather button */}
              {onRefreshWeather && (
                <button
                  type="button"
                  onClick={onRefreshWeather}
                  disabled={isRefreshingWeather}
                  className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                  title="Refresh Open-Meteo live feed"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshingWeather ? 'animate-spin text-cyan-400' : ''}`} />
                </button>
              )}
            </div>

            <div className="h-4 w-[1px] bg-slate-800" />

            {/* Clock */}
            <div className="flex items-center space-x-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{timeStr}</span>
            </div>
          </div>

          {/* Expandable Meteorological Details Popover (Progressive Disclosure) */}
          {showWeatherDetails && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-slate-950 border border-slate-700 rounded-xl p-3 shadow-2xl z-50 font-mono text-[11px] space-y-2 text-slate-300">
              <div className="flex justify-between items-center border-b border-slate-800 pb-1 font-bold text-white">
                <span className="flex items-center gap-1.5">
                  <CloudSun className="w-3.5 h-3.5 text-cyan-400" />
                  Meteorological Intel Profile
                </span>
                <span className="text-[10px] text-slate-500">{isLive ? 'Open-Meteo REST' : 'Scenario Parameter'}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>Source: <b className="text-white">{weatherSource}</b></div>
                <div>Mode: <b className={isLive ? 'text-emerald-400' : 'text-amber-400'}>{activeWeather?.mode}</b></div>
                <div>Station Coords: <span className="text-slate-400">21.685°N, 72.575°E</span></div>
                <div>Pasquill Stability: <b className="text-cyan-300">Class D (Neutral)</b></div>
                <div>Ambient Humidity: <span className="text-slate-400">65% Standard</span></div>
                <div>Surface Roughness: <span className="text-slate-400">z₀ = 0.5m (Industrial)</span></div>
              </div>

              <div className="text-[10px] text-slate-400 italic bg-slate-900/80 p-1.5 rounded border border-slate-800">
                Plume propagates downwind towards <b>{((activeWeather?.wind_direction_deg + 180) % 360).toFixed(0)}°</b>.
              </div>
            </div>
          )}
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Quick Primary Demo Trigger */}
          <button
            type="button"
            onClick={onLoadPrimaryDemo}
            disabled={loading}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/40 text-xs font-mono font-bold transition-all active:scale-95 disabled:opacity-50"
            title="Load T-04 Ammonia Cryogenic Header Rupture Scenario"
          >
            <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
            <span>Primary Demo (T-04 NH₃)</span>
          </button>

          {/* Quick PDF Trigger */}
          {hasIncident && (
            <button
              type="button"
              onClick={onExportPDF}
              disabled={isExporting}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-mono font-bold border border-red-400/50 shadow-md shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              <span>{isExporting ? 'Compiling...' : 'Export Pre-Plan'}</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
