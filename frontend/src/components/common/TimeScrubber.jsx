import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Clock, FastForward } from 'lucide-react';

export default function TimeScrubber({ 
  timeSteps = [], 
  currentTimeStep = 120, 
  onSelectTimeStep 
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  const stepValues = timeSteps.length > 0 
    ? timeSteps.map(ts => ts.time_step_sec) 
    : [0, 30, 60, 120];

  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        const currentIdx = stepValues.indexOf(currentTimeStep);
        const nextIdx = (currentIdx + 1) % stepValues.length;
        onSelectTimeStep(stepValues[nextIdx]);
      }, 2000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentTimeStep, stepValues, onSelectTimeStep]);

  const currentSlice = timeSteps.find(ts => ts.time_step_sec === currentTimeStep) || timeSteps[timeSteps.length - 1];

  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-3 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        
        {/* Play / Pause / Reset Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all ${
              isPlaying 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' 
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/30'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>

          <button
            onClick={() => onSelectTimeStep(stepValues[0])}
            className="p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-all"
            title="Reset to T+0s"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="text-xs font-mono text-slate-400 flex items-center gap-1 pl-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>DISPERSION TIME:</span>
            <span className="text-white font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              T+{currentTimeStep}s
            </span>
          </div>
        </div>

        {/* Time Step Buttons */}
        <div className="flex items-center space-x-1.5 bg-slate-950/70 p-1 rounded-lg border border-slate-800">
          {stepValues.map(sec => (
            <button
              key={sec}
              onClick={() => {
                setIsPlaying(false);
                onSelectTimeStep(sec);
              }}
              className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                currentTimeStep === sec
                  ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/50 scale-105'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              T+{sec}s
            </button>
          ))}
        </div>

        {/* Plume Metrics for this slice */}
        {currentSlice && (
          <div className="flex items-center space-x-3 text-xs font-mono text-slate-300">
            <div>
              <span className="text-slate-500">Plume Front: </span>
              <span className="text-cyan-400 font-bold">{currentSlice.plume_front_distance_m}m</span>
            </div>
            <div className="h-3 w-[1px] bg-slate-800" />
            <div className="flex gap-2">
              <span className="text-red-400">🔴 {currentSlice.active_threat_zones[0]?.max_downwind_distance_m || 0}m</span>
              <span className="text-orange-400">🟠 {currentSlice.active_threat_zones[1]?.max_downwind_distance_m || 0}m</span>
              <span className="text-yellow-400">🟡 {currentSlice.active_threat_zones[2]?.max_downwind_distance_m || 0}m</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
