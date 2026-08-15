import React, { useState, useEffect } from 'react';
import { 
  Flame, Droplet, Wind, Play, Layers, Compass, 
  ChevronDown, ChevronUp, RefreshCw, Sliders, AlertCircle, Info 
} from 'lucide-react';

export default function ScenarioBuilder({
  assets = [],
  chemicals = [],
  presets = [],
  weatherMode = 'LIVE',
  onWeatherModeChange,
  liveTelemetry,
  demoWeather,
  onDemoWeatherChange,
  onRefreshWeather,
  isRefreshingWeather,
  onRunSimulation,
  loading,
  selectedAssetId,
  onSelectAsset
}) {
  const [formData, setFormData] = useState({
    title: 'Custom Incident Scenario',
    asset_id: 'T-04',
    chemical_id: 'CHEM-NH3',
    incident_type: 'PIPELINE_LEAK',
    release_rate_kg_s: 15.0,
    release_duration_min: 30,
    operating_temp_c: 25.0,
    operating_pressure_bar: 4.5,
    humidity_pct: 65.0
  });

  const [activeStep, setActiveStep] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSDSDetails, setShowSDSDetails] = useState(false);

  // Sync selected asset changes
  useEffect(() => {
    if (selectedAssetId) {
      const asset = assets.find(a => a.id === selectedAssetId);
      if (asset) {
        setFormData(prev => ({
          ...prev,
          asset_id: asset.id,
          chemical_id: asset.chemical_id || prev.chemical_id,
          operating_pressure_bar: asset.operating_pressure_bar || prev.operating_pressure_bar,
          operating_temp_c: asset.operating_temp_c || prev.operating_temp_c
        }));
      }
    }
  }, [selectedAssetId, assets]);

  const handlePresetSelect = (presetId) => {
    const p = presets.find(item => item.id === presetId);
    if (p) {
      setFormData(prev => ({
        ...prev,
        title: p.title,
        asset_id: p.asset_id,
        chemical_id: p.chemical_id,
        incident_type: p.incident_type,
        release_rate_kg_s: p.release_rate_kg_s,
        release_duration_min: p.release_duration_min,
        operating_temp_c: p.operating_temp_c,
        operating_pressure_bar: p.operating_pressure_bar,
        humidity_pct: p.humidity_pct
      }));

      if (onDemoWeatherChange) {
        onDemoWeatherChange({
          wind_speed_kmh: p.wind_speed_kmh,
          wind_direction_deg: p.wind_direction_deg,
          wind_direction_cardinal: p.wind_direction_cardinal,
          ambient_temp_c: p.ambient_temp_c,
          atmospheric_stability: p.atmospheric_stability
        });
      }

      if (onSelectAsset) onSelectAsset(p.asset_id);
    }
  };

  const selectedChemical = chemicals.find(c => c.id === formData.chemical_id) || chemicals[0];
  const selectedAsset = assets.find(a => a.id === formData.asset_id);

  const compassPoints = [
    { label: 'N', deg: 0, cardinal: 'N' },
    { label: 'NE', deg: 45, cardinal: 'NE' },
    { label: 'E', deg: 90, cardinal: 'E' },
    { label: 'SE', deg: 135, cardinal: 'SE' },
    { label: 'S', deg: 180, cardinal: 'S' },
    { label: 'SW', deg: 225, cardinal: 'SW' },
    { label: 'W', deg: 270, cardinal: 'W' },
    { label: 'NW', deg: 315, cardinal: 'NW' },
  ];

  const activeWindSpeed = weatherMode === 'LIVE' 
    ? (liveTelemetry?.wind_speed_kmh ?? 18.1)
    : (demoWeather?.wind_speed_kmh ?? 8.0);

  const activeWindDeg = weatherMode === 'LIVE'
    ? (liveTelemetry?.wind_direction_deg ?? 195.0)
    : (demoWeather?.wind_direction_deg ?? 45.0);

  const activeWindCardinal = weatherMode === 'LIVE'
    ? (liveTelemetry?.wind_direction_cardinal ?? 'SSW')
    : (demoWeather?.wind_direction_cardinal ?? 'NE');

  const activeTemp = weatherMode === 'LIVE'
    ? (liveTelemetry?.temperature_c ?? 28.9)
    : (demoWeather?.ambient_temp_c ?? 32.0);

  const activeStability = weatherMode === 'LIVE'
    ? (liveTelemetry?.atmospheric_stability ?? 'D')
    : (demoWeather?.atmospheric_stability ?? 'D');

  const activeSource = weatherMode === 'LIVE'
    ? (liveTelemetry?.is_live ? 'Open-Meteo' : 'Local Scenario Data (Offline Fallback)')
    : 'Scenario Override / Preset';

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullPayload = {
      ...formData,
      wind_speed_kmh: activeWindSpeed,
      wind_direction_deg: activeWindDeg,
      ambient_temp_c: activeTemp,
      atmospheric_stability: activeStability,
      weather_mode: weatherMode,
      weather_source: activeSource
    };
    onRunSimulation(fullPayload);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl text-slate-200 font-mono text-xs space-y-4">
      
      {/* Header & Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-cyan-400" />
            Accident Scenario Modeler
          </h2>
          <p className="text-[11px] text-slate-400">Configure chemical release dynamics, source asset, and active meteorological vector.</p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] text-slate-400 font-bold">PRESETS:</span>
          <div className="flex gap-1.5">
            {presets.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetSelect(p.id)}
                className={`text-[10px] px-2 py-1 rounded font-bold transition-all border ${
                  formData.title === p.title
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
                }`}
              >
                {p.asset_id} ({p.chemical_id.replace('CHEM-', '')})
              </button>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* 4-Step Progressive Disclosure Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* STEP 1: Source Asset & Incident Type */}
          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-3">
            <div className="text-xs font-bold uppercase text-slate-200 flex items-center justify-between border-b border-slate-800/80 pb-1.5">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                1. Source Asset
              </span>
              <span className="text-[10px] text-cyan-400 font-bold">{formData.asset_id}</span>
            </div>

            {/* Asset Select */}
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">SELECT SOURCE FACILITY ASSET</label>
              <select
                value={formData.asset_id}
                onChange={(e) => {
                  const aid = e.target.value;
                  const found = assets.find(a => a.id === aid);
                  setFormData(prev => ({
                    ...prev,
                    asset_id: aid,
                    chemical_id: found?.chemical_id || prev.chemical_id
                  }));
                  if (onSelectAsset) onSelectAsset(aid);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {assets.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.id} — {a.name} ({a.sector?.split('-')[0]?.trim()})
                  </option>
                ))}
              </select>
            </div>

            {/* Incident Type */}
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">INCIDENT FAILURE MODE</label>
              <select
                value={formData.incident_type}
                onChange={(e) => setFormData({ ...formData, incident_type: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="PIPELINE_LEAK">Major Pipeline Flange Leak</option>
                <option value="TANK_LEAK">Storage Tank Shell Puncture</option>
                <option value="TOXIC_RELEASE">Uncontrolled Vapor Venting</option>
                <option value="FIRE_EXPLOSION">BLEVE / Vapor Cloud Explosion</option>
              </select>
            </div>

            {selectedAsset && (
              <div className="text-[10px] text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800 space-y-0.5">
                <div>Criticality: <b className="text-amber-400">{selectedAsset.criticality}</b></div>
                <div>Coords: {selectedAsset.coordinates?.[0]?.toFixed(4)}°N, {selectedAsset.coordinates?.[1]?.toFixed(4)}°E</div>
              </div>
            )}
          </div>

          {/* STEP 2: Chemical & Release Dynamics */}
          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-3">
            <div className="text-xs font-bold uppercase text-slate-200 flex items-center justify-between border-b border-slate-800/80 pb-1.5">
              <span className="flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-rose-400" />
                2. Substance & Release
              </span>
              <span className="text-[10px] text-rose-400 font-bold">{selectedChemical?.name?.split('(')[0]}</span>
            </div>

            {/* Chemical Select */}
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">HAZARDOUS CHEMICAL (SDS)</label>
              <select
                value={formData.chemical_id}
                onChange={(e) => setFormData({ ...formData, chemical_id: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {chemicals.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.formula})
                  </option>
                ))}
              </select>
            </div>

            {/* Release Rate Slider */}
            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>MASS RELEASE RATE</span>
                <span className="text-cyan-400 font-bold">{formData.release_rate_kg_s} kg/s</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="50.0"
                step="0.5"
                value={formData.release_rate_kg_s}
                onChange={(e) => setFormData({ ...formData, release_rate_kg_s: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[8.5px] text-slate-500 mt-0.5">
                <span>0.5 kg/s</span>
                <span>25 kg/s</span>
                <span>50 kg/s</span>
              </div>
            </div>

            {/* Release Duration Slider */}
            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>RELEASE DURATION</span>
                <span className="text-cyan-400 font-bold">{formData.release_duration_min} min</span>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={formData.release_duration_min}
                onChange={(e) => setFormData({ ...formData, release_duration_min: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Expandable SDS Card */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setShowSDSDetails(!showSDSDetails)}
                className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center justify-between w-full bg-slate-900/60 p-1.5 rounded border border-slate-800"
              >
                <span>View ERPG / IDLH Thresholds</span>
                {showSDSDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showSDSDetails && selectedChemical && (
                <div className="mt-1.5 p-2 rounded bg-slate-900 border border-slate-800 space-y-1 text-[9.5px]">
                  <div className="grid grid-cols-2 gap-1 text-slate-400">
                    <div>ERPG-3: <b className="text-red-400">{selectedChemical.erpg_3_ppm || 'N/A'} ppm</b></div>
                    <div>ERPG-2: <b className="text-orange-400">{selectedChemical.erpg_2_ppm || 'N/A'} ppm</b></div>
                    <div>ERPG-1: <b className="text-yellow-400">{selectedChemical.erpg_1_ppm || 'N/A'} ppm</b></div>
                    <div>IDLH: <b className="text-rose-400">{selectedChemical.idlh_ppm || 'N/A'} ppm</b></div>
                  </div>
                  <div className="text-slate-400 italic pt-0.5 border-t border-slate-800/60">
                    {selectedChemical.tactical_guidance}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* STEP 3: Meteorological Intelligence */}
          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-3">
            <div className="text-xs font-bold uppercase text-slate-200 flex items-center justify-between border-b border-slate-800/80 pb-1.5">
              <span className="flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                3. Weather Vector
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${
                weatherMode === 'LIVE' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {weatherMode}
              </span>
            </div>

            {/* LIVE / DEMO Switch */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => onWeatherModeChange && onWeatherModeChange('LIVE')}
                className={`py-1 rounded text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                  weatherMode === 'LIVE'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>LIVE TELEMETRY</span>
              </button>

              <button
                type="button"
                onClick={() => onWeatherModeChange && onWeatherModeChange('DEMO')}
                className={`py-1 rounded text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                  weatherMode === 'DEMO'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>DEMO OVERRIDE</span>
              </button>
            </div>

            {/* Current Weather Display / Controls */}
            {weatherMode === 'LIVE' ? (
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-1.5 text-[10.5px]">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Open-Meteo Wind:</span>
                  <b className="text-cyan-300">{activeWindSpeed} km/h FROM {activeWindCardinal} ({activeWindDeg}°)</b>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Ambient Temperature:</span>
                  <b className="text-amber-300">{activeTemp}°C</b>
                </div>
                <div className="flex justify-between items-center text-slate-400 text-[10px]">
                  <span>Pasquill Stability:</span>
                  <span>Class {activeStability}</span>
                </div>
              </div>
            ) : (
              /* DEMO Controls */
              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>DEMO WIND SPEED</span>
                    <span className="text-cyan-400 font-bold">{demoWeather?.wind_speed_kmh ?? 8.0} km/h</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="50.0"
                    step="0.5"
                    value={demoWeather?.wind_speed_kmh ?? 8.0}
                    onChange={(e) => onDemoWeatherChange && onDemoWeatherChange({ wind_speed_kmh: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>DEMO WIND DIRECTION</span>
                    <span className="text-cyan-400 font-bold">{demoWeather?.wind_direction_cardinal || 'NE'} ({demoWeather?.wind_direction_deg ?? 45}°)</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {compassPoints.map(cp => (
                      <button
                        key={cp.label}
                        type="button"
                        onClick={() => onDemoWeatherChange && onDemoWeatherChange({
                          wind_direction_deg: cp.deg,
                          wind_direction_cardinal: cp.cardinal
                        })}
                        className={`py-1 rounded text-[9.5px] font-bold border transition-all ${
                          demoWeather?.wind_direction_cardinal === cp.cardinal
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-black'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {cp.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Plume Vector Preview */}
            <div className="text-[10px] text-slate-400 italic bg-slate-900/60 p-1.5 rounded border border-slate-800">
              Downwind Plume Propagation Vector: <b>{((activeWindDeg + 180) % 360).toFixed(0)}°</b>
            </div>
          </div>

        </div>

        {/* STEP 4: Advanced Dispersion Parameters (Collapsible Accordion) */}
        <div className="bg-slate-950/40 rounded-lg border border-slate-800/80 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-slate-400 hover:text-slate-200 transition-colors text-left"
          >
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              4. Advanced Dispersion & Environmental Parameters
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <span>{showAdvanced ? 'Collapse' : 'Expand Advanced'}</span>
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>

          {showAdvanced && (
            <div className="p-3.5 pt-1 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px] text-slate-400">
              <div>
                <label className="block mb-1">OPERATING PRESSURE</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.operating_pressure_bar}
                    onChange={(e) => setFormData({ ...formData, operating_pressure_bar: parseFloat(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                  />
                  <span>bar</span>
                </div>
              </div>

              <div>
                <label className="block mb-1">OPERATING TEMPERATURE</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    value={formData.operating_temp_c}
                    onChange={(e) => setFormData({ ...formData, operating_temp_c: parseFloat(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                  />
                  <span>°C</span>
                </div>
              </div>

              <div>
                <label className="block mb-1">RELATIVE HUMIDITY</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={formData.humidity_pct}
                    onChange={(e) => setFormData({ ...formData, humidity_pct: parseFloat(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                  />
                  <span>%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dominant Sticky Execution CTA Button */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-mono font-bold text-xs uppercase tracking-wider border border-cyan-400/50 shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>COMPUTING DISPERSION PHYSICS & IMPACT GRAPHS...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>RUN HAZARD DISPERSION SIMULATION (GAUSSIAN PLUME)</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
}
