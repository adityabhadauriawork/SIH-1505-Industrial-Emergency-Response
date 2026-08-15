import React, { useState } from 'react';
import { 
  Users, Flame, AlertOctagon, ShieldCheck, 
  ChevronRight, Phone, ShieldAlert, CheckCircle2, 
  MapPin, AlertTriangle, Search, Filter 
} from 'lucide-react';

export default function ImpactMatrix({ impactResult }) {
  const [activeTab, setActiveTab] = useState('workers');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterZone, setFilterZone] = useState('ALL');

  if (!impactResult) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-8 text-center text-slate-500 font-mono text-xs">
        No active impact assessment. Run a hazard dispersion scenario to evaluate spatial population and asset triage.
      </div>
    );
  }

  const { 
    risk_assessment, 
    affected_workers = [], 
    affected_assets = [], 
    blocked_roads = [], 
    assembly_points = [] 
  } = impactResult;

  // Filter workers
  const filteredWorkers = affected_workers.filter(w => {
    const matchesSearch = w.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          w.role?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          w.id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesZone = filterZone === 'ALL' || w.zone_tier === filterZone;
    return matchesSearch && matchesZone;
  });

  return (
    <div className="space-y-4 font-mono text-xs text-slate-200">
      
      {/* 1. Transparent Explainable Risk Score Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400">EXPLAINABLE RISK ENGINE</span>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              Multi-Factor Spatial Vulnerability Assessment
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-black" style={{ color: risk_assessment.color }}>
              {risk_assessment.overall_score}
            </span>
            <span className="text-xs text-slate-500">/ 100</span>
            <span 
              className="text-xs px-2.5 py-1 rounded font-bold uppercase" 
              style={{ backgroundColor: `${risk_assessment.color}20`, color: risk_assessment.color, border: `1px solid ${risk_assessment.color}40` }}
            >
              {risk_assessment.risk_category}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-300 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
          {risk_assessment.summary_verdict}
        </p>

        {/* 5 Risk Factors Gauges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {risk_assessment.factors?.map((factor, idx) => (
            <div key={idx} className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400 truncate">{factor.name}</span>
                <span className="text-cyan-400 font-bold">{factor.score}/{factor.max_score}</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-500 rounded-full"
                  style={{ width: `${(factor.score / factor.max_score) * 100}%` }}
                />
              </div>
              <p className="text-[9px] text-slate-500 leading-tight truncate" title={factor.description}>
                {factor.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Impact Inspection Drill-down Tabs */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        
        {/* Navigation Sub-Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/70 px-3 pt-2 gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('workers')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-lg transition-all whitespace-nowrap ${
              activeTab === 'workers'
                ? 'bg-slate-900 text-white border-t-2 border-red-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-red-400" />
            <span>PERSONNEL EXPOSURE ({affected_workers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('assets')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-lg transition-all whitespace-nowrap ${
              activeTab === 'assets'
                ? 'bg-slate-900 text-white border-t-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>THREATENED ASSETS ({affected_assets.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roads')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-lg transition-all whitespace-nowrap ${
              activeTab === 'roads'
                ? 'bg-slate-900 text-white border-t-2 border-red-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
            <span>BLOCKED ROADWAYS ({blocked_roads.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('assembly')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-lg transition-all whitespace-nowrap ${
              activeTab === 'assembly'
                ? 'bg-slate-900 text-white border-t-2 border-emerald-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>MUSTER POINTS ({assembly_points.length})</span>
          </button>
        </div>

        {/* Tab 1 Content: Personnel Exposure */}
        {activeTab === 'workers' && (
          <div className="p-4 space-y-3">
            {affected_workers.length === 0 ? (
              <div className="bg-emerald-950/20 border border-emerald-500/40 p-4 rounded-lg text-center text-emerald-300 space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <div className="font-bold text-xs">Zero Worker Coordinates Compromised</div>
                <p className="text-[10px] text-slate-400">
                  No active seeded worker coordinates intersected the calculated threat envelopes at simulation time.
                </p>
              </div>
            ) : (
              <>
                {/* Search & Filter Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by worker name, role, ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">Zone:</span>
                    {['ALL', 'RED', 'ORANGE', 'YELLOW'].map(z => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => setFilterZone(z)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                          filterZone === z
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                            : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        {z}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Worker Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {filteredWorkers.map(w => {
                    const zoneBadge = {
                      'RED': 'bg-red-500/20 text-red-300 border-red-500/50',
                      'ORANGE': 'bg-orange-500/20 text-orange-300 border-orange-500/50',
                      'YELLOW': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                    }[w.zone_tier] || 'bg-slate-800 text-slate-300 border-slate-700';

                    // Mask contact phone for demo privacy and professionalism
                    const rawPhone = w.contact_phone || '+91 98765 43210';
                    const maskedPhone = rawPhone.length > 8 
                      ? `${rawPhone.slice(0, 7)}*** ${rawPhone.slice(-4)}`
                      : rawPhone;

                    return (
                      <div key={w.id} className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 space-y-1.5 hover:border-slate-700 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-white text-xs">{w.name}</div>
                            <div className="text-[10px] text-slate-400">{w.role} • Sector {w.assigned_sector}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold border ${zoneBadge}`}>
                            {w.zone_tier} ZONE
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                          <div>PPE: <b className="text-rose-300">{w.ppe_level_required || 'Level A SCBA'}</b></div>
                          <div>Status: <b className="text-amber-300">{w.evacuation_status || 'EVACUATING'}</b></div>
                          <div className="col-span-2 flex items-center gap-1 text-slate-400">
                            <Phone className="w-3 h-3 text-cyan-400" />
                            <span>Contact: <b className="text-slate-300">{maskedPhone}</b> (Masked Demo)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 2 Content: Threatened Assets */}
        {activeTab === 'assets' && (
          <div className="p-4 space-y-2 max-h-[420px] overflow-y-auto">
            {affected_assets.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-xs">No plant assets intersecting active hazard plume.</div>
            ) : (
              affected_assets.map(a => (
                <div key={a.id} className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>{a.id} — {a.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Sector: {a.sector} • Contents: {a.contents || 'Hydrocarbon'}
                    </div>
                  </div>
                  <div className="text-right text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                      Criticality: {a.criticality}
                    </span>
                    <div className="text-slate-400 mt-1">Deluge Cooling: <b className="text-blue-400">Required</b></div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3 Content: Blocked Roadways */}
        {activeTab === 'roads' && (
          <div className="p-4 space-y-2 max-h-[420px] overflow-y-auto">
            {blocked_roads.length === 0 ? (
              <div className="p-4 text-center text-emerald-400 text-xs">✓ All internal road corridors are 100% clear.</div>
            ) : (
              blocked_roads.map(r => (
                <div key={r.id} className="bg-red-950/20 p-3 rounded-lg border border-red-500/40 flex justify-between items-center text-xs text-red-200">
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                      <span>{r.name} ({r.id})</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Intersection: {r.intersection_zone || 'Lethal Red Zone Plume'}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-red-500/30 text-red-300 border border-red-500/50 text-[10px] font-bold">
                    SEVERED / BLOCKED
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4 Content: Assembly Muster Points */}
        {activeTab === 'assembly' && (
          <div className="p-4 space-y-2 max-h-[420px] overflow-y-auto">
            {assembly_points.map(ap => {
              const isSafe = ap.status === 'SAFE';
              return (
                <div 
                  key={ap.id} 
                  className={`p-3 rounded-lg border flex justify-between items-center text-xs ${
                    isSafe ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-red-950/20 border-red-500/40'
                  }`}
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className={`w-3.5 h-3.5 ${isSafe ? 'text-emerald-400' : 'text-red-400'}`} />
                      <span>{ap.name} ({ap.id})</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Capacity: {ap.capacity || 100} workers • Sector {ap.sector}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    isSafe ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-red-500/20 text-red-300 border-red-500/40'
                  }`}>
                    {ap.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
