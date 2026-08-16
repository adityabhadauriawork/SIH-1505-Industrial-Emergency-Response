import React, { useState, useEffect } from 'react';
import { 
  FileCheck, Shield, Filter, RefreshCw, CheckCircle2, 
  AlertTriangle, Navigation, Siren, Flame, Cpu, UserCheck, Search 
} from 'lucide-react';
import { api } from '../../services/api';

const MODULE_OPTIONS = [
  { id: 'ALL', label: 'All Modules' },
  { id: 'EVACUATION', label: 'Evacuation Routing' },
  { id: 'TACTICAL_RESPONSE', label: 'Tactical Suppression' },
  { id: 'PREPLAN_AUTHORIZATION', label: 'HSE Authorization' },
  { id: 'DOMINO_SCREENING', label: 'Domino Risk' },
  { id: 'HAZARD_SIMULATION', label: 'Hazard Simulation' }
];

export default function DecisionAuditTrail({ incidentId }) {
  const [auditData, setAuditData] = useState(null);
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAuditTrail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDecisionAuditTrail(incidentId, selectedModule, 50);
      setAuditData(res);
    } catch (err) {
      console.error('Failed to load decision audit trail:', err);
      setError(err.message || 'Could not load audit trail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditTrail();
  }, [incidentId, selectedModule]);

  const filteredRecords = auditData?.records?.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.id.toLowerCase().includes(term) ||
      r.module.toLowerCase().includes(term) ||
      r.recommendation.toLowerCase().includes(term) ||
      r.reason.toLowerCase().includes(term) ||
      r.human_action.toLowerCase().includes(term) ||
      r.actor_role.toLowerCase().includes(term)
    );
  }) || [];

  const getModuleBadge = (mod) => {
    switch (mod) {
      case 'EVACUATION':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'TACTICAL_RESPONSE':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40';
      case 'PREPLAN_AUTHORIZATION':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
      case 'DOMINO_SCREENING':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'APPROVED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
      case 'DISPATCHED':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-300 border-red-500/50';
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs text-slate-200">
      
      {/* 1. Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-teal-950/60 border border-teal-500/40 text-teal-400">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-2">
                Operational Decision Support Audit Trail
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Structured decision records with recommendation rationale, human reviews, and authority endorsements.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchAuditTrail}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg border border-slate-700 font-bold transition-all text-[11px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh Audit Log</span>
          </button>
        </div>

        {/* Prototype Notice Banner */}
        <div className="bg-amber-950/40 border border-amber-500/40 p-2.5 rounded-lg flex items-center justify-between text-[11px] text-amber-200">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <span><b>PROTOTYPE AUDIT TRAIL:</b> Logged in SQLite database. Production scope incorporates tamper-evident PKI digital signing and immutable ledger storage.</span>
          </div>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-500/40">
            DEMO AUDIT LOG
          </span>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 pt-1">
          {/* Module Filter Chips */}
          <div className="md:col-span-8 flex flex-wrap gap-1 items-center">
            {MODULE_OPTIONS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedModule(m.id)}
                className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-all ${
                  selectedModule === m.id
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-800'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="md:col-span-4 relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search recommendation / approver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg pl-8 pr-2.5 py-1 text-[11px] focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/60 border border-red-500/80 p-3 rounded-lg text-red-200 text-xs">
          <b>Error:</b> {error}
        </div>
      )}

      {/* 2. Audit Records List */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-8 text-center text-slate-400 space-y-2">
            <FileCheck className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="font-bold text-white text-xs">No Decision Records Match Filter</div>
            <p className="text-[11px]">No audit entries found for module "{selectedModule}".</p>
          </div>
        ) : (
          filteredRecords.map((rec) => (
            <div
              key={rec.id}
              className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-2.5 transition-all shadow-md"
            >
              {/* Header Line */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-cyan-400 text-xs">
                    {rec.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getModuleBadge(rec.module)}`}>
                    {rec.module.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Incident: <b className="text-slate-300">{rec.incident_id}</b>
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-[10px]">
                  <span className="text-slate-400">
                    {new Date(rec.timestamp).toLocaleString('en-US', { hour12: false })} UTC
                  </span>
                  <span className={`px-2 py-0.5 rounded font-bold border ${getActionBadge(rec.human_action)}`}>
                    {rec.human_action}
                  </span>
                </div>
              </div>

              {/* Recommendation & Reason Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                  <div className="text-[9px] font-bold text-slate-500 uppercase">SYSTEM RECOMMENDATION</div>
                  <div className="font-bold text-white leading-relaxed">
                    {rec.recommendation}
                  </div>
                  <div className="text-[10px] text-slate-400 pt-0.5">
                    <b>Input:</b> {rec.input_summary}
                  </div>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                  <div className="text-[9px] font-bold text-slate-500 uppercase">ENGINEERING RATIONALE</div>
                  <div className="text-slate-300 leading-relaxed italic">
                    "{rec.reason}"
                  </div>
                  {rec.result && (
                    <div className="text-[10px] text-emerald-400 font-medium pt-0.5">
                      <b>Result:</b> {rec.result}
                    </div>
                  )}
                </div>
              </div>

              {/* Actor & Authority Footer */}
              <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Recorded by: <b className="text-white">{rec.actor_name}</b> ({rec.actor_role})</span>
                </div>
                <span className="text-slate-500 font-mono text-[9px]">
                  {rec.data_classification}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
