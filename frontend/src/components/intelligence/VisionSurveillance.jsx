import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Upload, ShieldAlert, Flame, Wind, 
  Users, CheckCircle2, AlertTriangle, RefreshCw, 
  ArrowRight, Video, Crosshair, Play 
} from 'lucide-react';
import { api } from '../../services/api';

export default function VisionSurveillance({ onCreateIncidentFromVision }) {
  const [presets, setPresets] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('CAM-01');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Load camera presets
  useEffect(() => {
    api.getVisionCameraPresets().then(res => {
      setPresets(res);
    }).catch(err => console.error('Failed to load camera presets:', err));
  }, []);

  // Run analysis on camera feed
  const runCameraAnalysis = async (camId, hazardType = null, file = null) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('camera_id', camId);
      if (hazardType) formData.append('simulate_hazard_type', hazardType);
      if (file) formData.append('image_file', file);

      const res = await api.analyzeVisionFrame(formData);
      setAnalysisResult(res);
    } catch (err) {
      console.error('Vision analysis failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial trigger
  useEffect(() => {
    runCameraAnalysis(selectedCameraId);
  }, [selectedCameraId]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
      runCameraAnalysis(selectedCameraId, null, file);
    }
  };

  const selectedCam = presets.find(p => p.camera_id === selectedCameraId) || presets[0];

  return (
    <div className="space-y-4 font-mono text-xs text-slate-200">
      
      {/* 1. Header & Disclaimer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              Computer Vision Thermal Radiation & Plume Surveillance
            </h3>
            <p className="text-[11px] text-slate-400">
              Optical anomaly detection classifying flame spectrums, dense aerosol clouds, and perimeter personnel.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[10px]">
            PROTOTYPE COMPUTER VISION — Non-Certified Decision Support
          </span>
        </div>
      </div>

      {/* 2. Camera Feeds & Upload Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* Left Column: Camera Feed Selector & Upload (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3">
          <div className="font-bold text-white text-xs border-b border-slate-800 pb-1.5 flex items-center justify-between">
            <span>CCTV CAMERA STATIONS</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              PROTOTYPE CAMERA STREAM
            </span>
          </div>

          <div className="space-y-1.5">
            {presets.map(cam => (
              <button
                key={cam.camera_id}
                type="button"
                onClick={() => {
                  setSelectedCameraId(cam.camera_id);
                  setUploadedImagePreview(null);
                }}
                className={`w-full p-2.5 rounded-lg border text-left transition-all ${
                  selectedCameraId === cam.camera_id
                    ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs flex justify-between">
                  <span>{cam.camera_id}</span>
                  <span className="text-[10px] text-cyan-400">{cam.chemical_id}</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">{cam.camera_name}</div>
              </button>
            ))}
          </div>

          {/* Test Hazard Trigger Buttons */}
          <div className="pt-2 border-t border-slate-800 space-y-1.5">
            <span className="text-[10px] text-slate-400 font-bold block">SIMULATE HAZARD FEED:</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => runCameraAnalysis(selectedCameraId, 'FIRE')}
                className="py-1.5 px-2 rounded bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 text-[10.5px] font-bold"
              >
                🔥 INJECT FLAME
              </button>
              <button
                type="button"
                onClick={() => runCameraAnalysis(selectedCameraId, 'SMOKE')}
                className="py-1.5 px-2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-[10.5px] font-bold"
              >
                💨 INJECT SMOKE
              </button>
            </div>
          </div>

          {/* Upload Custom Image / CCTV Frame */}
          <div className="pt-2 border-t border-slate-800">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 text-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>UPLOAD LOCAL CAMERA FRAME</span>
            </button>
          </div>
        </div>

        {/* Right Column: Video/Frame Viewport with Bounding Boxes (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
          
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <div>
              <span className="font-bold text-white text-xs flex items-center gap-2">
                <Video className="w-4 h-4 text-cyan-400" />
                {selectedCam?.camera_name || 'Active Surveillance Viewport'}
              </span>
              <span className="text-[10px] text-slate-400">Timestamp: {analysisResult?.timestamp || 'Streaming...'}</span>
            </div>

            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              analysisResult?.alert_level === 'CRITICAL'
                ? 'bg-red-500/20 text-red-300 border-red-500/50 animate-pulse'
                : analysisResult?.alert_level === 'WARNING'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
            }`}>
              ALERT: {analysisResult?.alert_level || 'MONITORING'}
            </span>
          </div>

          {/* Viewport Frame with Simulated CCTV Background & Bounding Boxes */}
          <div className="relative w-full h-80 rounded-lg overflow-hidden border border-slate-800 bg-[#060b13] flex items-center justify-center">
            
            {/* Background Feed (Uploaded image or synthetic grid) */}
            {uploadedImagePreview ? (
              <img 
                src={uploadedImagePreview} 
                alt="Camera Frame" 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full relative flex items-center justify-center opacity-60">
                {/* Synthetic Plant Background Graphics */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent"></div>
                <div className="text-center space-y-2 z-0 text-slate-600">
                  <Crosshair className="w-16 h-16 mx-auto opacity-30 animate-spin" style={{ animationDuration: '30s' }} />
                  <div className="text-xs font-mono font-bold tracking-widest">{selectedCam?.camera_id} • SIMULATED CAMERA FEED</div>
                  <div className="text-[10px]">Sector: {selectedCam?.sector}</div>
                </div>
              </div>
            )}

            {/* Bounding Box Overlays */}
            {analysisResult?.detections?.map(det => {
              const [x, y, w, h] = det.bbox_xywh;
              return (
                <div
                  key={det.id}
                  className="absolute border-2 transition-all duration-300 pointer-events-none"
                  style={{
                    left: `${x * 100}%`,
                    top: `${y * 100}%`,
                    width: `${w * 100}%`,
                    height: `${h * 100}%`,
                    borderColor: det.color_hex,
                    backgroundColor: `${det.color_hex}20`
                  }}
                >
                  <span 
                    className="absolute -top-5 left-0 px-1.5 py-0.2 text-[9.5px] font-bold rounded text-white"
                    style={{ backgroundColor: det.color_hex }}
                  >
                    {det.label} ({det.confidence_pct}%)
                  </span>
                </div>
              );
            })}

            {/* Corner HUD overlay */}
            <div className="absolute bottom-2 left-2 bg-slate-950/80 px-2 py-1 rounded text-[10px] text-slate-400 border border-slate-800">
              FPS: 30.0 • Res: 1920x1080 • Model: SIH-CV-ThermalNet
            </div>
          </div>

          {/* Detections List & Incident Suggestion Action */}
          {analysisResult && (
            <div className="space-y-2">
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 text-[11px] leading-relaxed">
                {analysisResult.suggestion_summary}
              </div>

              {analysisResult.incident_suggested && (
                <div className="bg-gradient-to-r from-red-950/50 to-amber-950/50 border border-red-500/60 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-lg">
                  <div>
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-red-400" />
                      Incident Suggestion Generated from Optical Alert
                    </span>
                    <div className="text-[10px] text-slate-300 mt-0.5">
                      Suggested Source: <b className="text-white">{analysisResult.suggested_asset_id}</b> • Chemical: <b className="text-rose-400">{analysisResult.suggested_chemical_id}</b> • Rate: <b className="text-amber-300">{analysisResult.suggested_release_rate_kg_s} kg/s</b>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onCreateIncidentFromVision && onCreateIncidentFromVision({
                      asset_id: analysisResult.suggested_asset_id,
                      chemical_id: analysisResult.suggested_chemical_id,
                      incident_type: analysisResult.suggested_incident_type,
                      release_rate_kg_s: analysisResult.suggested_release_rate_kg_s
                    })}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                  >
                    <span>CREATE INCIDENT FROM DETECTION</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
