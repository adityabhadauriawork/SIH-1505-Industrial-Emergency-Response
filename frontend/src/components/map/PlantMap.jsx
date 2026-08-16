import React, { useEffect, useState, useMemo } from 'react';
import { 
  MapContainer, TileLayer, GeoJSON, Marker, 
  Popup, Polyline, Tooltip, useMap 
} from 'react-leaflet';
import L from 'leaflet';
import { 
  Layers, Eye, EyeOff, Shield, Flame, 
  Users, Navigation, Droplets, MapPin, Compass 
} from 'lucide-react';

// Custom Map Controller to smoothly pan/zoom when asset or simulation changes
function MapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 16, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

export default function PlantMap({ 
  siteData, 
  simulationResult, 
  currentTimeStep = 120, 
  evacuationPlan, 
  selectedAssetId, 
  onSelectAsset 
}) {
  // Layer visibility toggles
  const [layers, setLayers] = useState({
    threatZones: true,
    evacuationRoute: true,
    assets: true,
    workers: true,
    roads: true,
    assemblyPoints: true,
    gates: true,
    hydrants: false,
    resources: true,
    boundary: true
  });

  const [showLayerPanel, setShowLayerPanel] = useState(false);

  const plant = siteData?.plant;
  const centerCoords = useMemo(() => {
    return plant?.center ? [plant.center[0], plant.center[1]] : [21.6850, 72.5750];
  }, [plant]);

  // Create custom DivIcons
  const createIcon = (htmlContent, className = '', size = [32, 32]) => {
    return L.divIcon({
      html: htmlContent,
      className: `custom-leaflet-icon ${className}`,
      iconSize: size,
      iconAnchor: [size[0] / 2, size[1] / 2],
      popupAnchor: [0, -size[1] / 2]
    });
  };

  const assetIcon = (asset, isSelected, isSource) => {
    let bg = 'bg-slate-900 border-slate-600 text-slate-200';
    let ring = '';

    if (isSource) {
      bg = 'bg-red-950 border-red-500 text-red-300 animate-pulse';
      ring = 'ring-4 ring-red-500/50';
    } else if (isSelected) {
      bg = 'bg-cyan-950 border-cyan-400 text-cyan-300';
      ring = 'ring-2 ring-cyan-400';
    } else if (asset.type === 'STORAGE_TANK') {
      bg = 'bg-indigo-950/90 border-indigo-500/80 text-indigo-300';
    } else if (asset.type === 'PROCESS_UNIT') {
      bg = 'bg-purple-950/90 border-purple-500/80 text-purple-300';
    } else if (asset.type === 'CONTROL_ROOM') {
      bg = 'bg-emerald-950/90 border-emerald-500/80 text-emerald-300';
    }

    const html = `
      <div class="relative flex items-center justify-center w-8 h-8 rounded-lg border shadow-lg font-mono text-[10px] font-bold ${bg} ${ring} transition-all">
        <span>${asset.id}</span>
        ${asset.chemical_id ? `<span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-slate-900"></span>` : ''}
      </div>
    `;
    return createIcon(html, '', [32, 32]);
  };

  const apIcon = (ap) => {
    const isCompromised = ap.status === 'COMPROMISED';
    const bg = isCompromised 
      ? 'bg-red-950 border-red-500 text-red-400' 
      : 'bg-emerald-950 border-emerald-500 text-emerald-400';
    const html = `
      <div class="flex items-center justify-center w-7 h-7 rounded-full border shadow-md font-mono text-[9px] font-extrabold ${bg}">
        ${ap.id}
      </div>
    `;
    return createIcon(html, '', [28, 28]);
  };

  const gateIcon = (gate) => {
    const html = `
      <div class="flex items-center justify-center px-1.5 py-0.5 rounded bg-slate-900 border border-slate-600 shadow text-[9px] font-mono font-bold text-cyan-300">
        ${gate.id}
      </div>
    `;
    return createIcon(html, '', [36, 20]);
  };

  const workerIcon = (worker) => {
    const html = `
      <div class="w-3 h-3 rounded-full bg-cyan-400 border border-slate-950 shadow-md transition-transform hover:scale-150" title="${worker.name} (${worker.role})"></div>
    `;
    return createIcon(html, '', [12, 12]);
  };

  const resourceIcon = (res) => {
    const html = `
      <div class="flex items-center justify-center w-6 h-6 rounded-md bg-amber-950 border border-amber-500 shadow-md text-amber-300 text-[10px] font-bold font-mono">
        🚨
      </div>
    `;
    return createIcon(html, '', [24, 24]);
  };

  // Get active time-step GeoJSON for threat zones
  const activeGeoJSON = useMemo(() => {
    if (!simulationResult) return null;
    const slice = simulationResult.time_steps.find(ts => ts.time_step_sec === currentTimeStep);
    return slice ? slice.geojson : simulationResult.current_geojson;
  }, [simulationResult, currentTimeStep]);

  // GeoJSON style handler for threat polygons
  const geojsonStyle = (feature) => {
    const props = feature.properties || {};
    return {
      fillColor: props.color || '#ef4444',
      fillOpacity: props.fillOpacity || 0.35,
      color: props.stroke || '#b91c1c',
      weight: 2,
      dashArray: props.zone_id === 'YELLOW_ZONE_CAUTION' ? '4, 4' : null,
    };
  };

  const onEachHazardFeature = (feature, layer) => {
    const props = feature.properties || {};
    layer.bindTooltip(`
      <div class="font-mono text-xs p-1">
        <b style="color:${props.color}">${props.name}</b><br/>
        <span class="text-slate-300">${props.threshold_label}</span><br/>
        <span>Max Reach: <b>${props.max_distance_m}m</b></span>
      </div>
    `, { sticky: true, className: 'leaflet-dark-tooltip' });
  };

  return (
    <div className="relative w-full h-full min-h-[550px] rounded-xl overflow-hidden border border-slate-800 bg-[#06090e] shadow-2xl">
      
      {/* Map Layer Controls floating bar */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col items-end space-y-2">
        <button
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className="flex items-center space-x-1.5 bg-slate-900/90 backdrop-blur hover:bg-slate-800 text-slate-200 text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-700 shadow-lg transition-all"
        >
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>MAP LAYERS</span>
        </button>

        {showLayerPanel && (
          <div className="bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl p-3 shadow-2xl space-y-2 w-56 font-mono text-xs">
            <div className="font-bold text-white uppercase text-[10px] pb-1 border-b border-slate-800 flex justify-between">
              <span>Map Layer Toggles</span>
              <span className="text-cyan-400">GIS 2D</span>
            </div>
            
            <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                Hazard Threat Zones
              </span>
              <input 
                type="checkbox" 
                checked={layers.threatZones} 
                onChange={(e) => setLayers({ ...layers, threatZones: e.target.checked })} 
                className="accent-cyan-400"
              />
            </label>

            <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                Evacuation Route
              </span>
              <input 
                type="checkbox" 
                checked={layers.evacuationRoute} 
                onChange={(e) => setLayers({ ...layers, evacuationRoute: e.target.checked })} 
                className="accent-cyan-400"
              />
            </label>

            <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                Plant Assets
              </span>
              <input 
                type="checkbox" 
                checked={layers.assets} 
                onChange={(e) => setLayers({ ...layers, assets: e.target.checked })} 
                className="accent-cyan-400"
              />
            </label>

            <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                Personnel / Workers
              </span>
              <input 
                type="checkbox" 
                checked={layers.workers} 
                onChange={(e) => setLayers({ ...layers, workers: e.target.checked })} 
                className="accent-cyan-400"
              />
            </label>

            <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                Internal Road Grid
              </span>
              <input 
                type="checkbox" 
                checked={layers.roads} 
                onChange={(e) => setLayers({ ...layers, roads: e.target.checked })} 
                className="accent-cyan-400"
              />
            </label>

            <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Assembly Muster Points
              </span>
              <input 
                type="checkbox" 
                checked={layers.assemblyPoints} 
                onChange={(e) => setLayers({ ...layers, assemblyPoints: e.target.checked })} 
                className="accent-cyan-400"
              />
            </label>

            <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                Emergency Resources
              </span>
              <input 
                type="checkbox" 
                checked={layers.resources} 
                onChange={(e) => setLayers({ ...layers, resources: e.target.checked })} 
                className="accent-cyan-400"
              />
            </label>
          </div>
        )}
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[400] bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-2 shadow-lg font-mono text-[10px] space-y-1">
        <div className="font-bold text-white uppercase border-b border-slate-800 pb-0.5">Threat Legend</div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded bg-red-600 border border-red-400"></span>
          <span className="text-red-300 font-bold">Red Zone (Lethal / ERPG-3)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded bg-orange-500 border border-orange-400"></span>
          <span className="text-orange-300 font-bold">Orange Zone (Severe / ERPG-2)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded bg-yellow-500 border border-yellow-400"></span>
          <span className="text-yellow-300 font-bold">Yellow Zone (Caution / ERPG-1)</span>
        </div>
      </div>

      {/* Leaflet Map */}
      <MapContainer
        center={centerCoords}
        zoom={16}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', minHeight: '550px' }}
      >
        <MapRecenter center={centerCoords} zoom={16} />

        {/* Dark OpenStreetMap / CartoDB TileLayer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 1. Plant Boundary Polygon */}
        {layers.boundary && plant?.bounds && (
          <Polyline
            positions={plant.bounds}
            pathOptions={{ color: '#06b6d4', weight: 2, dashArray: '6, 6', opacity: 0.7 }}
          >
            <Tooltip permanent direction="top" className="leaflet-dark-tooltip">
              {plant.name} Boundary
            </Tooltip>
          </Polyline>
        )}

        {/* 2. Internal Roads */}
        {layers.roads && siteData?.roads?.map((road) => (
          <Polyline
            key={road.id}
            positions={road.coordinates}
            pathOptions={{ 
              color: road.status === 'BLOCKED' ? '#ef4444' : '#64748b', 
              weight: road.width_m ? Math.max(3, road.width_m / 2) : 4,
              opacity: road.status === 'BLOCKED' ? 0.9 : 0.6,
              dashArray: road.status === 'BLOCKED' ? '4, 4' : null
            }}
          >
            <Tooltip sticky className="leaflet-dark-tooltip">
              <span className="font-mono text-xs">{road.name} ({road.status})</span>
            </Tooltip>
          </Polyline>
        ))}

        {/* 3. Pipelines */}
        {siteData?.pipelines?.map((pl) => (
          <Polyline
            key={pl.id}
            positions={pl.coordinates}
            pathOptions={{ color: '#ec4899', weight: 3, opacity: 0.8, dashArray: '5, 8' }}
          >
            <Tooltip sticky className="leaflet-dark-tooltip">
              <span className="font-mono text-xs">{pl.name}</span>
            </Tooltip>
          </Polyline>
        ))}

        {/* 4. Hazard Dispersion Threat Zones (GeoJSON) */}
        {layers.threatZones && activeGeoJSON && (
          <GeoJSON
            key={`hazard-${currentTimeStep}-${JSON.stringify(simulationResult?.source_coordinates)}`}
            data={activeGeoJSON}
            style={geojsonStyle}
            onEachFeature={onEachHazardFeature}
          />
        )}

        {/* 5. Evacuation Route Polyline */}
        {layers.evacuationRoute && evacuationPlan?.primary_evacuation_route?.route_coordinates && (
          <Polyline
            positions={evacuationPlan.primary_evacuation_route.route_coordinates}
            pathOptions={{ color: '#10b981', weight: 6, opacity: 0.95 }}
          >
            <Tooltip sticky className="leaflet-dark-tooltip">
              <div className="font-mono text-xs">
                <b className="text-emerald-400">Safe Evacuation Route</b><br/>
                Distance: {evacuationPlan.primary_evacuation_route.total_distance_m}m (~{evacuationPlan.primary_evacuation_route.estimated_evac_time_min} min)
              </div>
            </Tooltip>
          </Polyline>
        )}

        {/* 6. Plant Assets */}
        {layers.assets && siteData?.assets?.map((asset) => {
          const isSelected = selectedAssetId === asset.id;
          const isSource = simulationResult?.source_asset_id === asset.id;
          return (
            <Marker
              key={asset.id}
              position={asset.coordinates}
              icon={assetIcon(asset, isSelected, isSource)}
              eventHandlers={{
                click: () => {
                  if (onSelectAsset) onSelectAsset(asset.id);
                }
              }}
            >
              <Popup className="leaflet-dark-popup" maxWidth={320} minWidth={240}>
                <div className="font-mono text-xs space-y-2 text-slate-200 p-0.5">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-extrabold text-cyan-400 text-sm">{asset.id}</span>
                      {isSource && (
                        <span className="bg-red-500/30 text-red-300 px-1.5 py-0.2 rounded text-[9px] font-bold border border-red-500/50 animate-pulse">
                          EPICENTER
                        </span>
                      )}
                    </div>
                    <span className="bg-slate-800 text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-700">
                      {asset.criticality}
                    </span>
                  </div>

                  <div>
                    <div className="font-bold text-white text-xs">{asset.name}</div>
                    <div className="text-[10px] text-slate-400">{asset.sector} • {asset.type}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-500 block text-[9px]">CHEMICAL</span>
                      <span className="text-rose-400 font-bold truncate block">{asset.chemical_id || 'Hydrocarbon / Toxic'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">FILL LEVEL</span>
                      <span className="text-cyan-300 font-bold">{asset.current_fill_pct || 75}% ({asset.capacity_m3?.toLocaleString() || '5,000'} m³)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">OPERATING PRESSURE</span>
                      <span className="text-slate-200">{asset.operating_pressure_bar || 1.0} bar</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">TEMPERATURE</span>
                      <span className="text-slate-200">{asset.operating_temp_c || 25}°C</span>
                    </div>
                  </div>

                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={() => onSelectAsset && onSelectAsset(asset.id)}
                      className="w-full bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 text-[10px] font-bold py-1.5 rounded-lg transition-all text-center tracking-wide"
                    >
                      SELECT FOR SCENARIO
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 7. Assembly Points */}
        {layers.assemblyPoints && siteData?.assembly_points?.map((ap) => (
          <Marker
            key={ap.id}
            position={ap.coordinates}
            icon={apIcon(ap)}
          >
            <Popup className="leaflet-dark-popup" maxWidth={280} minWidth={220}>
              <div className="font-mono text-xs space-y-1.5 text-slate-200 p-0.5">
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-1">
                  <span className="font-bold text-white">{ap.name}</span>
                  <span className={`px-2 py-0.2 rounded text-[9px] font-bold border ${
                    ap.status === 'SAFE' 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' 
                      : 'bg-red-500/20 text-red-300 border-red-500/50'
                  }`}>
                    {ap.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Capacity: <b className="text-cyan-300">{ap.capacity} Personnel</b>
                </div>
                <div className="text-[10px] text-slate-400 bg-slate-950/80 p-1.5 rounded border border-slate-800">
                  {ap.equipment}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 8. Gates */}
        {layers.gates && siteData?.gates?.map((g) => (
          <Marker
            key={g.id}
            position={g.coordinates}
            icon={gateIcon(g)}
          >
            <Popup className="leaflet-dark-popup" maxWidth={260} minWidth={200}>
              <div className="font-mono text-xs space-y-1 text-slate-200 p-0.5">
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-1">
                  <span className="font-bold text-white">{g.name}</span>
                  <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded text-[9px] font-bold border border-emerald-500/50">
                    {g.status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Perimeter Logistics & Emergency Evacuation Gate
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 9. Personnel / Workers */}
        {layers.workers && siteData?.workers?.map((w) => (
          <Marker
            key={w.id}
            position={w.coordinates}
            icon={workerIcon(w)}
          >
            <Tooltip className="leaflet-dark-tooltip">
              <div className="font-mono text-xs">
                <b>{w.name}</b> ({w.id})<br/>
                <span className="text-cyan-300">{w.role}</span><br/>
                <span className="text-slate-400">{w.sector}</span>
              </div>
            </Tooltip>
          </Marker>
        ))}

        {/* 10. Emergency Resources */}
        {layers.resources && siteData?.emergency_resources?.map((res) => (
          <Marker
            key={res.id}
            position={res.coordinates}
            icon={resourceIcon(res)}
          >
            <Popup className="leaflet-dark-popup" maxWidth={280} minWidth={220}>
              <div className="font-mono text-xs space-y-1.5 text-slate-200 p-0.5">
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-1">
                  <span className="font-bold text-white">{res.name}</span>
                  <span className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded text-[9px] font-bold border border-indigo-500/50">
                    ACTIVE
                  </span>
                </div>
                <div className="text-[10px] text-cyan-300">
                  Stationed: {res.stationed_at} • Crew: {res.crew_count}
                </div>
                <div className="text-[10px] text-slate-400 bg-slate-950/80 p-1.5 rounded border border-slate-800">
                  {res.capacity_details}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

      </MapContainer>
    </div>
  );
}
