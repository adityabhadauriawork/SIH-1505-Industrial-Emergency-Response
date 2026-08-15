import React, { useState, useEffect } from 'react';
import { 
  BarChart2, TrendingUp, Clock, AlertTriangle, 
  ShieldAlert, Database, Search, Filter, RefreshCw, 
  Flame, CheckCircle2, ChevronRight, Activity, Info 
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { api } from '../../services/api';

export default function HistoricalAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getHistoricalAnalyticsSummary();
      setData(res);
    } catch (err) {
      console.error('Failed to load historical analytics:', err);
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading && !data) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-12 text-center text-slate-400 font-mono text-xs space-y-2">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-cyan-400" />
        <div>Computing statistical distributions across 3-year historical dataset...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-950/40 border border-rose-500/60 p-4 rounded-xl text-xs font-mono text-rose-200">
        <b>Analytics Error:</b> {error || 'Unable to load dataset.'}
      </div>
    );
  }

  const allIncidents = data.recent_incidents || [];
  const filteredIncidents = allIncidents.filter(inc => {
    const matchesSearch = inc.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inc.asset_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inc.chemical_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inc.cause_category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inc.root_cause_summary?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSev = filterSeverity === 'ALL' || inc.severity_category === filterSeverity;
    return matchesSearch && matchesSev;
  });

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#38bdf8', '#10b981'];

  return (
    <div className="space-y-4 font-mono text-xs text-slate-200">
      
      {/* 1. Header & Explicit Dataset Clarification */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              Historical Incident Analytics & Equipment Risk Patterns
            </h3>
            <p className="text-[11px] text-slate-400">
              Aggregated failure mode frequencies, chemical incident distributions, and emergency response performance metrics across plant history.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[10px]">
            SYNTHETIC DEMO DATASET ({data.total_historical_incidents} Plant Incidents • 3-Year Baseline)
          </span>
        </div>
      </div>

      {/* 2. Top KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md space-y-1">
          <span className="text-[10px] text-slate-400 uppercase block">Total Logged Incidents</span>
          <span className="text-xl font-black text-white">{data.total_historical_incidents} Events</span>
          <span className="text-[9px] text-slate-500 block">100% Analyzed in Risk Models</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md space-y-1">
          <span className="text-[10px] text-slate-400 uppercase block">Avg Response Time</span>
          <span className="text-xl font-black text-cyan-400">{data.avg_response_time_min} min</span>
          <span className="text-[9px] text-slate-500 block">Fire tender on-scene</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md space-y-1">
          <span className="text-[10px] text-slate-400 uppercase block">Avg Evac Time</span>
          <span className="text-xl font-black text-emerald-400">{data.avg_evacuation_time_min} min</span>
          <span className="text-[9px] text-slate-500 block">Muster completion</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md space-y-1">
          <span className="text-[10px] text-slate-400 uppercase block">High/Critical Tier</span>
          <span className="text-xl font-black text-rose-400">{data.high_critical_incident_count}</span>
          <span className="text-[9px] text-slate-500 block">Score &ge; 75.0</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-slate-400 uppercase block">Top Vulnerable Asset</span>
          <span className="text-xl font-black text-amber-400">{data.top_vulnerable_asset}</span>
          <span className="text-[9px] text-slate-500 block">Highest frequency</span>
        </div>
      </div>

      {/* 3. Recharts Trend & Distribution Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* Left 7 cols: Response & Evacuation Time Trend */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="font-bold text-xs text-white flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              Incident Response & Evacuation Timeline (Half-Year Trends)
            </span>
            <span className="text-[10px] text-slate-400">Response Speed Improvement</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend_over_time} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="period" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="avg_response_time_min" name="Avg Response Time (min)" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="avg_evacuation_time_min" name="Avg Evacuation Time (min)" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="avg_severity" name="Avg Severity (0-100)" stroke="#f87171" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 5 cols: Chemical Incident Breakdown Bar Chart */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="font-bold text-xs text-white flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              Chemical Substance Distribution
            </span>
            <span className="text-[10px] text-slate-400">By Event Count</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.chemical_breakdowns} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis dataKey="chemical_name" type="category" stroke="#64748b" fontSize={9.5} width={120} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="incident_count" name="Incidents" fill="#0ea5e9" radius={[0, 4, 4, 0]}>
                  {data.chemical_breakdowns.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 4. Equipment Vulnerability & Failure Ranking */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <span className="font-bold text-xs text-white flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            Equipment Vulnerability & Failure Frequency Ranking
          </span>
          <span className="text-[10px] text-slate-400">Prioritized by Total Incidents & Severity</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 bg-slate-950/60">
                <th className="py-2.5 px-3">Asset ID</th>
                <th className="py-2.5 px-3">Total Events</th>
                <th className="py-2.5 px-3">Avg Severity</th>
                <th className="py-2.5 px-3">Max Severity</th>
                <th className="py-2.5 px-3">Primary Substance</th>
                <th className="py-2.5 px-3">Risk Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data.asset_risk_rankings.map((a, idx) => (
                <tr key={idx} className="hover:bg-slate-950/40">
                  <td className="py-2 px-3 font-bold text-white">{a.asset_id}</td>
                  <td className="py-2 px-3 text-cyan-300 font-bold">{a.incident_count} events</td>
                  <td className="py-2 px-3 text-slate-300">{a.avg_severity}/100</td>
                  <td className="py-2 px-3 text-amber-300 font-bold">{a.max_severity}/100</td>
                  <td className="py-2 px-3 text-rose-300">{a.primary_chemical}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                      a.highest_severity_category === 'CRITICAL' ? 'bg-red-500/20 text-red-300' : 'bg-orange-500/20 text-orange-300'
                    }`}>
                      {a.highest_severity_category}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Searchable Historical Incident Log */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div>
            <span className="font-bold text-xs text-white flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              Historical Plant Incident Archive ({filteredIncidents.length} of {data.total_historical_incidents} Records)
            </span>
            <div className="text-[10px] text-slate-400 mt-0.5">
              All {data.total_historical_incidents} synthetic incidents logged in the 3-year baseline are available for root-cause search & compliance audit.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800">
              <Search className="w-3 h-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search root cause, asset, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-48"
              />
            </div>

            <div className="flex gap-1">
              {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterSeverity(cat)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                    filterSeverity === cat 
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400' 
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {filteredIncidents.map(inc => (
            <div key={inc.id} className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-white text-xs">{inc.id} • {inc.asset_id} ({inc.chemical_name})</span>
                  <div className="text-[10px] text-slate-400">Date: {inc.incident_date} • Failure: {inc.incident_type}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                  inc.severity_category === 'CRITICAL' ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 
                  inc.severity_category === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 
                  'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                }`}>
                  {inc.severity_category} ({inc.severity_score}/100)
                </span>
              </div>

              <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800/60">
                <b>Root Cause:</b> {inc.root_cause_summary}
              </div>

              <div className="text-[10.5px] text-emerald-300/90 italic">
                <b>Corrective Engineering Action:</b> {inc.lessons_learned}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
