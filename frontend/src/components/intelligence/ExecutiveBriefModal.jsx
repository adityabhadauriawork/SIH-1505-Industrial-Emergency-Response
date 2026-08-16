import React, { useState, useEffect } from 'react';
import { 
  X, FileText, Copy, Download, CheckCircle2, ShieldAlert, 
  AlertTriangle, Users, Navigation, Siren, Clock, Check, RefreshCw 
} from 'lucide-react';
import { api } from '../../services/api';

export default function ExecutiveBriefModal({
  isOpen,
  onClose,
  simulationResult,
  impactResult,
  evacuationPlan,
  resourcePlan,
  authorizationRecord,
  onExportPDF
}) {
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchBrief();
    }
  }, [isOpen, simulationResult, impactResult, evacuationPlan, resourcePlan, authorizationRecord]);

  const fetchBrief = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getExecutiveSituationBrief(
        simulationResult,
        impactResult,
        evacuationPlan,
        resourcePlan,
        authorizationRecord
      );
      setBrief(res);
    } catch (err) {
      console.error('Failed to generate executive situation brief:', err);
      setError(err.message || 'Brief generation failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCopyMarkdown = () => {
    if (brief?.formatted_brief_markdown) {
      navigator.clipboard.writeText(brief.formatted_brief_markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadText = () => {
    if (!brief) return;
    const blob = new Blob([brief.formatted_brief_markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Executive_Situation_Brief_${brief.source_asset}_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const getRiskBadge = (category) => {
    switch (category) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'MODERATE':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0b101e] border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl font-mono text-xs text-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded border border-cyan-500/30">
                  EXECUTIVE BRIEFING
                </span>
                <h2 className="text-base font-black text-white uppercase tracking-tight">
                  Executive Situation Brief
                </h2>
              </div>
              <p className="text-[11px] text-slate-400">
                {brief?.facility_name || 'PetroChem Complex Alpha'} • Real-Time Multi-Engine Synthesis
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border font-bold text-xs transition-all ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY BRIEF'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadText}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-bold text-xs transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT TXT</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          
          {loading && (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
              <div className="font-bold text-white text-sm">Compiling Authoritative Executive Brief...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-950/60 border border-red-500/80 p-4 rounded-xl text-red-200 text-xs">
              <b>Error:</b> {error}
            </div>
          )}

          {!loading && brief && (
            <div className="space-y-4">
              
              {/* Executive Q&A Cards (6 Key Questions) */}
              
              {/* Q1 & Q2: What Happened & How Serious Is It? */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="text-[10px] font-bold text-cyan-400 uppercase">1. WHAT HAPPENED?</div>
                  <div className="text-sm font-black text-white">
                    {brief.source_asset} • {brief.chemical}
                  </div>
                  <div className="text-[11px] text-slate-300 space-y-1">
                    <div><b>Type:</b> {brief.incident_type.replace(/_/g, ' ')}</div>
                    <div><b>Sector:</b> {brief.sector}</div>
                    <div><b>Wind Vector:</b> {brief.wind_vector_summary}</div>
                    <div><b>Plume:</b> {brief.plume_bearing_summary}</div>
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="text-[10px] font-bold text-rose-400 uppercase">2. HOW SERIOUS IS IT?</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-black text-white">{brief.severity_score}/100</span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${getRiskBadge(brief.severity_category)}`}>
                      {brief.severity_category}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 space-y-1">
                    <div><b>Trend:</b> <span className="text-amber-300 font-bold">{brief.escalation_trend}</span></div>
                    <div><b>Lethal Red Zone Reach:</b> {brief.max_red_reach_m.toFixed(0)} meters</div>
                    <div><b>Severe Orange Zone Reach:</b> {brief.max_orange_reach_m.toFixed(0)} meters</div>
                  </div>
                </div>
              </div>

              {/* Q3 & Q4: Who/What Is Affected & Is It Under Control? */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="text-[10px] font-bold text-amber-400 uppercase">3. WHO & WHAT IS AFFECTED?</div>
                  <div className="text-sm font-bold text-white">
                    {brief.exposed_workers_count} Workers Exposed • {brief.compromised_assets_count} Units Compromised
                  </div>
                  <div className="text-[11px] text-slate-300 space-y-1">
                    <div><b>Casualty Triage:</b> {brief.casualty_triage_summary}</div>
                    <div><b>Severed Internal Roads:</b> {brief.blocked_road_segments_count} segment</div>
                    <div><b>Site Accessibility:</b> {brief.site_accessibility_status}</div>
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase">4. IS IT UNDER CONTROL & WHAT IS BEING DONE?</div>
                  <div className="text-sm font-bold text-white">
                    {brief.containment_status}
                  </div>
                  <div className="text-[11px] text-slate-300 space-y-1">
                    <div><b>Evacuation Directive:</b> Active to <b>{brief.primary_assembly_point}</b> via <b>{brief.primary_exit_gate}</b> ({brief.evacuation_distance_m}m, ~{brief.estimated_walk_time_min}m walk)</div>
                    <div><b>Lead Unit:</b> {brief.lead_tactical_unit} (ETA: {brief.lead_unit_eta_min} min)</div>
                    <div><b>Suppression Demand:</b> {brief.firewater_demand_lpm.toLocaleString()} LPM Firewater • PPE: {brief.mandatory_ppe}</div>
                  </div>
                </div>
              </div>

              {/* Q5 & Q6: Pending Decisions & Governance Status */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-bold text-teal-400 uppercase">5. GOVERNANCE & ACTION ITEMS REQUIRING ATTENTION</span>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                    brief.human_authorization_status === 'AUTHORIZED' 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' 
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  }`}>
                    {brief.human_authorization_status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  <div className="space-y-1.5">
                    <div className="font-bold text-white">Pending Executive / HSE Actions:</div>
                    <ul className="space-y-1 text-slate-300">
                      {brief.pending_decisions.map((dec, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{dec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                    <div className="font-bold text-white">Human Authorization Record:</div>
                    <div className="text-slate-400">
                      <b>Approver:</b> {brief.approver_name ? `${brief.approver_name} (${brief.approver_role})` : 'Awaiting HSE Controller Review'}
                    </div>
                    {brief.authorization_timestamp && (
                      <div className="text-slate-400">
                        <b>Timestamp:</b> {new Date(brief.authorization_timestamp).toUTCString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>{brief?.prototype_disclaimer || 'PROTOTYPE EXECUTIVE SITUATION BRIEF'}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold"
          >
            Close Briefing
          </button>
        </div>

      </div>
    </div>
  );
}
