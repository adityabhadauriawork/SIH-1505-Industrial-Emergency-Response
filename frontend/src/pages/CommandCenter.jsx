import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import Header from '../components/common/Header';
import HUDStats from '../components/common/HUDStats';
import TimeScrubber from '../components/common/TimeScrubber';
import PlantMap from '../components/map/PlantMap';
import IncidentIntelligencePanel from '../components/dashboard/IncidentIntelligencePanel';
import ScenarioBuilder from '../components/scenario/ScenarioBuilder';
import ImpactMatrix from '../components/impact/ImpactMatrix';
import EvacuationNavigator from '../components/evacuation/EvacuationNavigator';
import ResourceTactics from '../components/resources/ResourceTactics';
import PrePlanViewer from '../components/preplan/PrePlanViewer';
import IntelligenceHub from '../components/intelligence/IntelligenceHub';
import EmergencyCopilotDrawer from '../components/copilot/EmergencyCopilotDrawer';

import { 
  LayoutDashboard, Flame, Users, Navigation, 
  Siren, FileText, AlertTriangle, RefreshCw, Map, Cpu 
} from 'lucide-react';

export default function CommandCenter() {
  const [siteData, setSiteData] = useState(null);
  const [chemicals, setChemicals] = useState([]);
  const [presets, setPresets] = useState([]);
  
  // Single Source of Truth for Meteorology:
  const [liveTelemetry, setLiveTelemetry] = useState(null);
  const [weatherMode, setWeatherMode] = useState('LIVE');
  const [demoWeather, setDemoWeather] = useState({
    wind_speed_kmh: 8.0,
    wind_direction_deg: 45.0,
    wind_direction_cardinal: 'NE',
    ambient_temp_c: 32.0,
    atmospheric_stability: 'D'
  });
  const [isRefreshingWeather, setIsRefreshingWeather] = useState(false);
  
  // Active Simulation & Impact states
  const [simulationResult, setSimulationResult] = useState(null);
  const [impactResult, setImpactResult] = useState(null);
  const [evacuationPlan, setEvacuationPlan] = useState(null);
  const [resourcePlan, setResourcePlan] = useState(null);
  
  const [currentTimeStep, setCurrentTimeStep] = useState(120);
  const [selectedAssetId, setSelectedAssetId] = useState('T-04');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  // 1. Initial Data Fetching including Live Weather
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [siteRes, chemsRes, presetsRes, weatherRes] = await Promise.all([
        api.getSiteData(),
        api.getChemicals(),
        api.getPresets(),
        api.getCurrentWeather(21.6850, 72.5750).catch(err => {
          console.warn('Weather fetch failed, fallback active:', err);
          return {
            temperature_c: 32.0,
            wind_speed_kmh: 8.0,
            wind_direction_deg: 45.0,
            wind_direction_cardinal: 'NE',
            atmospheric_stability: 'D',
            source: 'Local Scenario Data (Offline Fallback)',
            is_live: false,
            timestamp: new Date().toISOString(),
            error: 'Network unreachable'
          };
        })
      ]);
      setSiteData(siteRes);
      setChemicals(chemsRes);
      setPresets(presetsRes);
      setLiveTelemetry(weatherRes);
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setError('Could not connect to FastAPI backend at http://127.0.0.1:8000. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // 2. On-demand Weather Refresh
  const handleRefreshWeather = async () => {
    try {
      setIsRefreshingWeather(true);
      const lat = siteData?.plant?.center?.[0] || 21.6850;
      const lon = siteData?.plant?.center?.[1] || 72.5750;
      const weatherRes = await api.getCurrentWeather(lat, lon);
      setLiveTelemetry(weatherRes);
    } catch (err) {
      console.error('Failed to refresh weather:', err);
    } finally {
      setIsRefreshingWeather(false);
    }
  };

  // 3. Demo weather parameter updater
  const handleDemoWeatherChange = (updates) => {
    setDemoWeather(prev => ({ ...prev, ...updates }));
  };

  // 4. Full Simulation Pipeline Execution
  const executeSimulation = async (scenarioParams) => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Run Hazard Simulation
      const simRes = await api.runSimulation(scenarioParams);
      setSimulationResult(simRes);
      setCurrentTimeStep(120);

      // Step 2: Spatial Impact Assessment
      const impRes = await api.analyzeImpact(simRes, 120);
      setImpactResult(impRes);

      // Step 3: Evacuation Routing
      const evacRes = await api.calculateEvacuationRoute(
        simRes, 
        impRes, 
        simRes.source_coordinates, 
        `${simRes.source_asset_id} Vicinity`
      );
      setEvacuationPlan(evacRes);

      // Step 4: Emergency Resource Optimization
      const resRes = await api.optimizeResources(simRes, impRes, evacRes);
      setResourcePlan(resRes);

    } catch (err) {
      console.error('Simulation execution failed:', err);
      setError(err.message || 'Hazard simulation failed');
    } finally {
      setLoading(false);
    }
  };

  // 5. Preset selection trigger
  const handleSelectPreset = (presetId) => {
    const p = presets.find(item => item.id === presetId);
    if (p) {
      setSelectedAssetId(p.asset_id);
      
      const demoParams = {
        wind_speed_kmh: p.wind_speed_kmh || 8.0,
        wind_direction_deg: p.wind_direction_deg || 45.0,
        wind_direction_cardinal: p.wind_direction_cardinal || 'NE',
        ambient_temp_c: p.ambient_temp_c || 32.0,
        atmospheric_stability: p.atmospheric_stability || 'D'
      };
      setDemoWeather(demoParams);

      const activeWind = weatherMode === 'LIVE'
        ? (liveTelemetry?.wind_speed_kmh ?? 18.1)
        : demoParams.wind_speed_kmh;
      const activeDeg = weatherMode === 'LIVE'
        ? (liveTelemetry?.wind_direction_deg ?? 195.0)
        : demoParams.wind_direction_deg;
      const activeTemp = weatherMode === 'LIVE'
        ? (liveTelemetry?.temperature_c ?? 28.9)
        : demoParams.ambient_temp_c;

      executeSimulation({
        asset_id: p.asset_id,
        chemical_id: p.chemical_id,
        incident_type: p.incident_type,
        release_rate_kg_s: p.release_rate_kg_s,
        release_duration_min: p.release_duration_min,
        humidity_pct: p.humidity_pct || 65.0,
        wind_speed_kmh: activeWind,
        wind_direction_deg: activeDeg,
        ambient_temp_c: activeTemp,
        atmospheric_stability: p.atmospheric_stability || 'D',
        weather_mode: weatherMode,
        weather_source: weatherMode === 'LIVE' ? 'Open-Meteo' : 'Preset Quick Launch'
      });
    }
  };

  // 6. Time Step Change Handler
  const handleSelectTimeStep = async (timeSec) => {
    setCurrentTimeStep(timeSec);
    if (simulationResult) {
      try {
        const impRes = await api.analyzeImpact(simulationResult, timeSec);
        setImpactResult(impRes);
      } catch (err) {
        console.error('Failed to recalculate impact at time step:', err);
      }
    }
  };

  // 7. Primary Demo Launcher (T-04 Ammonia Cryogenic Header Rupture with Demo Weather)
  const handleLoadPrimaryDemo = () => {
    const demoParams = {
      wind_speed_kmh: 8.0,
      wind_direction_deg: 45.0,
      wind_direction_cardinal: 'NE',
      ambient_temp_c: 32.0,
      atmospheric_stability: 'D'
    };
    
    setWeatherMode('DEMO');
    setDemoWeather(demoParams);
    setSelectedAssetId('T-04');

    const primaryPreset = presets.find(p => p.asset_id === 'T-04') || {
      asset_id: 'T-04',
      chemical_id: 'CHEM-NH3',
      incident_type: 'PIPELINE_LEAK',
      release_rate_kg_s: 15.0,
      release_duration_min: 30,
      humidity_pct: 65.0
    };

    executeSimulation({
      ...primaryPreset,
      ...demoParams,
      weather_mode: 'DEMO',
      weather_source: 'Scenario Override (Primary Demo)'
    });
  };

  // 8. Fire Pre-Plan PDF Exporter
  const handleExportPDF = async () => {
    if (!simulationResult || !impactResult || !evacuationPlan || !resourcePlan) {
      setError('Please run a simulation before exporting the Fire Pre-Plan.');
      return;
    }
    try {
      setIsExporting(true);
      await api.downloadPrePlanPDF({
        simulation_result: simulationResult,
        impact_result: impactResult,
        evacuation_plan: evacuationPlan,
        resource_plan: resourcePlan,
        author_name: 'SIH-1505 Decision Support Engine',
        facility_ref: 'PCH-ALPHA-04 (Demo Facility — Non-Statutory Evaluation)'
      });
    } catch (err) {
      console.error('PDF export failed:', err);
      setError('Failed to generate Fire Pre-Plan PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // 9. Intelligence Hub Actions
  const handleSimulateAssetConsequence = (assetId, chemicalId) => {
    setSelectedAssetId(assetId);
    setActiveTab('simulator');
  };

  const handleCreateIncidentFromVision = (visionParams) => {
    if (visionParams.asset_id) setSelectedAssetId(visionParams.asset_id);
    setActiveTab('simulator');
  };

  // Active simulation weather context
  const activeWeather = simulationResult ? {
    wind_speed_kmh: simulationResult.wind_speed_kmh,
    wind_direction_deg: simulationResult.wind_direction_deg,
    wind_direction_cardinal: simulationResult.wind_direction_cardinal || 'NE',
    temperature_c: simulationResult.weather_mode === 'LIVE' ? (liveTelemetry?.temperature_c || 28.9) : demoWeather.ambient_temp_c,
    mode: simulationResult.weather_mode || weatherMode,
    source: simulationResult.weather_source || (weatherMode === 'LIVE' ? 'Open-Meteo' : 'Scenario Override'),
    is_live: (simulationResult.weather_mode || weatherMode) === 'LIVE'
  } : (weatherMode === 'LIVE' ? {
    wind_speed_kmh: liveTelemetry?.wind_speed_kmh ?? 18.1,
    wind_direction_deg: liveTelemetry?.wind_direction_deg ?? 195.0,
    wind_direction_cardinal: liveTelemetry?.wind_direction_cardinal ?? 'SSW',
    temperature_c: liveTelemetry?.temperature_c ?? 28.9,
    mode: 'LIVE',
    source: liveTelemetry?.is_live ? 'Open-Meteo' : 'Local Scenario Data',
    is_live: liveTelemetry?.is_live ?? true
  } : {
    wind_speed_kmh: demoWeather.wind_speed_kmh,
    wind_direction_deg: demoWeather.wind_direction_deg,
    wind_direction_cardinal: demoWeather.wind_direction_cardinal || 'NE',
    temperature_c: demoWeather.ambient_temp_c,
    mode: 'DEMO',
    source: 'Scenario Override / Preset',
    is_live: false
  });

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      
      {/* 1. Global Command Header */}
      <Header
        plantInfo={siteData?.plant}
        activeSimulation={simulationResult}
        impactResult={impactResult}
        activeWeather={activeWeather}
        liveTelemetry={liveTelemetry}
        onRefreshWeather={handleRefreshWeather}
        isRefreshingWeather={isRefreshingWeather}
        onLoadPrimaryDemo={handleLoadPrimaryDemo}
        onExportPDF={handleExportPDF}
        isExporting={isExporting}
        loading={loading}
      />

      {/* Main Layout Container */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-3 md:p-4 space-y-3">
        
        {/* Error Alert Banner */}
        {error && (
          <div className="bg-red-950/80 border border-red-500/80 p-3 rounded-xl flex items-center justify-between text-xs text-red-200 font-mono shadow-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span><b>ALERT:</b> {error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-slate-400 hover:text-white font-bold px-2 py-0.5"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* 2. Top Metric HUD (5 Compact KPIs) */}
        <HUDStats
          impactResult={impactResult}
          simulationResult={simulationResult}
          resourcePlan={resourcePlan}
        />

        {/* 3. Navigation Bar */}
        <div className="flex border-b border-slate-800 bg-slate-950/80 rounded-xl p-1 gap-1 overflow-x-auto shadow-md">
          {[
            { id: 'dashboard', label: 'Command Map & Triage', icon: Map },
            { id: 'simulator', label: 'Scenario Simulator', icon: Flame },
            { id: 'impact', label: 'Impact & Personnel', icon: Users, badge: impactResult?.affected_workers_count },
            { id: 'evacuation', label: 'Safe Evacuation', icon: Navigation },
            { id: 'resources', label: 'Tactical Response', icon: Siren, badge: resourcePlan?.recommended_resources?.length },
            { id: 'preplan', label: 'Fire Pre-Plan PDF', icon: FileText },
            { id: 'intelligence', label: 'Advanced Intelligence Hub', icon: Cpu, badge: 'Phase 2' }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold border ${
                    tab.badge === 'Phase 2'
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-red-500/30 text-red-300 border-red-500/50'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 4. Tab Content Views */}
        <div className="space-y-3">
          
          {/* TAB 1: Command Map & Triage (Dominant 70% Map / 30% Intelligence Panel Split) */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
              
              {/* Left 8-9 Cols (approx 70%): Large Dominant GIS Plant Map */}
              <div className="lg:col-span-8 xl:col-span-9 space-y-3 flex flex-col">
                <div className="flex-1 min-h-[580px] h-[calc(100vh-280px)] rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
                  <PlantMap
                    siteData={siteData}
                    simulationResult={simulationResult}
                    currentTimeStep={currentTimeStep}
                    evacuationPlan={evacuationPlan}
                    selectedAssetId={selectedAssetId}
                    onSelectAsset={setSelectedAssetId}
                  />
                </div>
                {simulationResult && (
                  <TimeScrubber
                    timeSteps={simulationResult.time_steps}
                    currentTimeStep={currentTimeStep}
                    onSelectTimeStep={handleSelectTimeStep}
                  />
                )}
              </div>

              {/* Right 3-4 Cols (approx 30%): Vertical Scrollable Intelligence Sidebar */}
              <div className="lg:col-span-4 xl:col-span-3 min-h-[580px] h-[calc(100vh-280px)] flex flex-col">
                <IncidentIntelligencePanel
                  simulationResult={simulationResult}
                  impactResult={impactResult}
                  evacuationPlan={evacuationPlan}
                  resourcePlan={resourcePlan}
                  activeWeather={activeWeather}
                  liveTelemetry={liveTelemetry}
                  weatherMode={weatherMode}
                  onWeatherModeChange={setWeatherMode}
                  presets={presets}
                  onSelectPreset={handleSelectPreset}
                  onNavigateTab={setActiveTab}
                  onRunSimulation={executeSimulation}
                  loading={loading}
                />
              </div>

            </div>
          )}

          {/* TAB 2: Scenario Simulator */}
          {activeTab === 'simulator' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
              <div className="lg:col-span-7">
                <ScenarioBuilder
                  assets={siteData?.assets}
                  chemicals={chemicals}
                  presets={presets}
                  weatherMode={weatherMode}
                  onWeatherModeChange={setWeatherMode}
                  liveTelemetry={liveTelemetry}
                  demoWeather={demoWeather}
                  onDemoWeatherChange={handleDemoWeatherChange}
                  onRefreshWeather={handleRefreshWeather}
                  isRefreshingWeather={isRefreshingWeather}
                  onRunSimulation={executeSimulation}
                  loading={loading}
                  selectedAssetId={selectedAssetId}
                  onSelectAsset={setSelectedAssetId}
                />
              </div>
              <div className="lg:col-span-5 min-h-[560px] h-[calc(100vh-280px)] rounded-xl overflow-hidden border border-slate-800 shadow-xl">
                <PlantMap
                  siteData={siteData}
                  simulationResult={simulationResult}
                  currentTimeStep={currentTimeStep}
                  evacuationPlan={evacuationPlan}
                  selectedAssetId={selectedAssetId}
                  onSelectAsset={setSelectedAssetId}
                />
              </div>
            </div>
          )}

          {/* TAB 3: Impact & Personnel */}
          {activeTab === 'impact' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
              <div className="lg:col-span-7">
                <ImpactMatrix impactResult={impactResult} />
              </div>
              <div className="lg:col-span-5 min-h-[560px] h-[calc(100vh-280px)] rounded-xl overflow-hidden border border-slate-800 shadow-xl">
                <PlantMap
                  siteData={siteData}
                  simulationResult={simulationResult}
                  currentTimeStep={currentTimeStep}
                  evacuationPlan={evacuationPlan}
                  selectedAssetId={selectedAssetId}
                  onSelectAsset={setSelectedAssetId}
                />
              </div>
            </div>
          )}

          {/* TAB 4: Safe Evacuation */}
          {activeTab === 'evacuation' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
              <div className="lg:col-span-6">
                <EvacuationNavigator evacuationPlan={evacuationPlan} />
              </div>
              <div className="lg:col-span-6 min-h-[580px] h-[calc(100vh-280px)] rounded-xl overflow-hidden border border-slate-800 shadow-xl">
                <PlantMap
                  siteData={siteData}
                  simulationResult={simulationResult}
                  currentTimeStep={currentTimeStep}
                  evacuationPlan={evacuationPlan}
                  selectedAssetId={selectedAssetId}
                  onSelectAsset={setSelectedAssetId}
                />
              </div>
            </div>
          )}

          {/* TAB 5: Tactical Response */}
          {activeTab === 'resources' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
              <div className="lg:col-span-7">
                <ResourceTactics resourcePlan={resourcePlan} />
              </div>
              <div className="lg:col-span-5 min-h-[560px] h-[calc(100vh-280px)] rounded-xl overflow-hidden border border-slate-800 shadow-xl">
                <PlantMap
                  siteData={siteData}
                  simulationResult={simulationResult}
                  currentTimeStep={currentTimeStep}
                  evacuationPlan={evacuationPlan}
                  selectedAssetId={selectedAssetId}
                  onSelectAsset={setSelectedAssetId}
                />
              </div>
            </div>
          )}

          {/* TAB 6: Fire Pre-Plan */}
          {activeTab === 'preplan' && (
            <PrePlanViewer
              plantInfo={siteData?.plant}
              simulationResult={simulationResult}
              impactResult={impactResult}
              evacuationPlan={evacuationPlan}
              resourcePlan={resourcePlan}
              onExportPDF={handleExportPDF}
              isExporting={isExporting}
            />
          )}

          {/* TAB 7: Advanced Intelligence Hub (Phase 2 Features) */}
          {activeTab === 'intelligence' && (
            <IntelligenceHub
              assets={siteData?.assets}
              chemicals={chemicals}
              currentSimulation={simulationResult}
              onSimulateAssetConsequence={handleSimulateAssetConsequence}
              onCreateIncidentFromVision={handleCreateIncidentFromVision}
            />
          )}

        </div>

      </main>

      {/* 5. Global Floating AI Emergency Copilot Drawer */}
      <EmergencyCopilotDrawer
        simulationResult={simulationResult}
        impactResult={impactResult}
        evacuationPlan={evacuationPlan}
        resourcePlan={resourcePlan}
        onNavigateTab={setActiveTab}
      />

    </div>
  );
}
