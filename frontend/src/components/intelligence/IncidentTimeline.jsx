import React, { useState, useEffect } from 'react';
import { 
  Clock, Play, Pause, RotateCcw, ChevronDown, ChevronUp, 
  AlertTriangle, ShieldCheck, Siren, Wind, Navigation, 
  FileCheck, Cpu, Radio, CheckCircle2, Flame, RefreshCw 
} from 'lucide-react';
import { api } from '../../services/api';

export default function IncidentTimeline({
  simulationResult,
  impactResult,
  evacuationPlan,
  resourcePlan,
  authorizationStatus = 'PENDING_HUMAN_AUTHORIZATION',
  onSelectTimeStep
}) {
  const [timelineData, setTimelineData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedEventId, setExpandedEventId] = useState('EVT-001');
  const [replayActiveIndex, setReplayActiveIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getIncidentTimeline(
        simulationResult,
        impactResult,
        evacuationPlan,
        resourcePlan,
        authorizationStatus
      );
      setTimelineData(res);
      if (res?.events?.length > 0 && replayActiveIndex === null) {
        setReplayActiveIndex(res.events.length - 1);
      }
    } catch (err) {
      console.error('Failed to fetch incident timeline:', err);
      setError(err.message || 'Could not load timeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [simulationResult, impactResult, evacuationPlan, resourcePlan, authorizationStatus]);

  // Event Replay Auto-Play Loop
  useEffect(() => {
    let interval = null;
    if (isPlaying && timelineData?.events?.length) {
      interval = setInterval(() => {
        setReplayActiveIndex((prev) => {
          if (prev === null || prev >= timelineData.events.length - 1) {
            setIsPlaying(false);
            return timelineData.events.length - 1;
          }
          const next = prev + 1;
          setExpandedEventId(timelineData.events[next].event_id);
          return next;
        });
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, timelineData]);

  const handleStepClick = (index, eventId) => {
    setReplayActiveIndex(index);
    setExpandedEventId(eventId === expandedEventId ? null : eventId);
  };

  const handleResetReplay = () => {
    setIsPlaying(false);
    setReplayActiveIndex(0);
    if (timelineData?.events?.[0]) {
      setExpandedEventId(timelineData.events[0].event_id);
    }
  };

  const getSeverityBadge = (level) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'WARNING':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case 'SUCCESS':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      default:
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
    }
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'SENSOR_TELEMETRY':
        return <Radio className="w-3.5 h-3.5 text-red-400" />;
      case 'WEATHER_SERVICE':
        return <Wind className="w-3.5 h-3.5 text-cyan-400" />;
      case 'GAUSSIAN_HAZARD':
        return <Flame className="w-3.5 h-3.5 text-amber-400" />;
      case 'IMPACT_ANALYZER':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
      case 'DIJKSTRA_EVACUATION':
        return <Navigation className="w-3.5 h-3.5 text-emerald-400" />;
      case 'TACTICAL_OPTIMIZER':
        return <Siren className="w-3.5 h-3.5 text-indigo-400" />;
      case 'DOMINO_SCREENER':
        return <Cpu className="w-3.5 h-3.5 text-purple-400" />;
      case 'HSE_AUTHORIZATION':
        return <FileCheck className="w-3.5 h-3.5 text-teal-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs text-slate-200">
      
      {/* 1. Header Card & Event Replay Scrubber */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-2">
                Incident Timeline & State Transition Replay
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                {timelineData?.asset_id || 'T-04'} • {timelineData?.chemical_name || 'Ammonia'} • Phase: <span className="text-cyan-300 font-bold">{timelineData?.current_phase || 'ACTIVE'}</span>
              </p>
            </div>
          </div>

          {/* Timeline Controls */}
          <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={handleResetReplay}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="Reset to T+00:00"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center space-x-1 px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded border border-cyan-500/40 font-bold transition-all text-[10px]"
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
              <span>{isPlaying ? 'PAUSE' : 'REPLAY'}</span>
            </button>
            <button
              type="button"
              onClick={fetchTimeline}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-cyan-400 rounded hover:bg-slate-800 transition-colors"
              title="Refresh Timeline"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Milestone Fast-Scrubber Bar */}
        {timelineData?.events && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>INCIDENT PROGRESSION STEP SCRUBBER</span>
              <span className="text-cyan-400">
                Active Step: {replayActiveIndex !== null ? timelineData.events[replayActiveIndex]?.relative_time_label : 'T+00:00'} ({replayActiveIndex !== null ? replayActiveIndex + 1 : 1}/{timelineData.events.length})
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-9 gap-1">
              {timelineData.events.map((evt, idx) => {
                const isActive = replayActiveIndex === idx;
                const isPast = replayActiveIndex !== null && idx <= replayActiveIndex;
                return (
                  <button
                    key={evt.event_id}
                    type="button"
                    onClick={() => handleStepClick(idx, evt.event_id)}
                    className={`py-1.5 px-1 rounded text-center text-[10px] font-bold border transition-all ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/30 scale-105 z-10'
                        : isPast
                        ? 'bg-slate-800 text-cyan-300 border-cyan-500/30'
                        : 'bg-slate-950/60 text-slate-500 border-slate-800 hover:bg-slate-900'
                    }`}
                  >
                    <div>{evt.relative_time_label}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-950/60 border border-red-500/80 p-3 rounded-lg text-red-200 text-xs">
          <b>Error:</b> {error}
        </div>
      )}

      {/* 2. Vertical Chronological Timeline */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:via-teal-500 before:to-indigo-500">
        {timelineData?.events?.map((evt, idx) => {
          const isExpanded = expandedEventId === evt.event_id;
          const isHighlighted = replayActiveIndex === idx;
          const isPastOrCurrent = replayActiveIndex === null || idx <= replayActiveIndex;

          return (
            <div 
              key={evt.event_id} 
              className={`relative transition-all duration-200 ${!isPastOrCurrent ? 'opacity-40' : 'opacity-100'}`}
            >
              {/* Timeline Node Point */}
              <div 
                className={`absolute -left-6 top-3.5 w-6 h-6 rounded-full border-2 flex items-center justify-center -translate-x-1/2 transition-all ${
                  isHighlighted
                    ? 'bg-cyan-400 border-white text-slate-950 scale-125 shadow-lg shadow-cyan-500/50'
                    : isPastOrCurrent
                    ? 'bg-slate-900 border-cyan-400 text-cyan-400'
                    : 'bg-slate-950 border-slate-700 text-slate-600'
                }`}
              >
                {getSourceIcon(evt.source_module)}
              </div>

              {/* Event Card */}
              <div 
                className={`rounded-xl border transition-all ${
                  isHighlighted 
                    ? 'bg-slate-900/95 border-cyan-500/70 shadow-lg shadow-cyan-500/10' 
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div 
                  onClick={() => setExpandedEventId(isExpanded ? null : evt.event_id)}
                  className="p-3.5 flex items-start justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-slate-800 text-cyan-300 px-2 py-0.5 rounded text-[10px] font-extrabold border border-slate-700">
                        {evt.relative_time_label}
                      </span>
                      <span className={`px-2 py-0.2 rounded text-[9px] font-bold border ${getSeverityBadge(evt.severity_level)}`}>
                        {evt.incident_state}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(evt.timestamp_iso).toLocaleTimeString('en-US', { hour12: false })}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5 pt-0.5">
                      {evt.title}
                    </h4>

                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {evt.short_description}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="p-1 text-slate-400 hover:text-white rounded"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Expanded Grounded Telemetry Details */}
                {isExpanded && evt.key_metrics && Object.keys(evt.key_metrics).length > 0 && (
                  <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-800/80 bg-slate-900/40 rounded-b-xl space-y-2">
                    <div className="text-[10px] font-bold text-slate-400">
                      GROUNDED METRIC TELEMETRY:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                      {Object.entries(evt.key_metrics).map(([key, val]) => (
                        <div key={key} className="bg-slate-950 p-1.5 rounded border border-slate-800">
                          <span className="text-slate-500 block text-[9px] uppercase">{key.replace(/_/g, ' ')}</span>
                          <span className="text-cyan-300 font-bold">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Prototype Notice */}
      <div className="text-[10px] text-slate-500 text-center italic">
        {timelineData?.prototype_notice || 'PROTOTYPE INCIDENT TIMELINE — Derived from Authoritative System State Transitions'}
      </div>

    </div>
  );
}
