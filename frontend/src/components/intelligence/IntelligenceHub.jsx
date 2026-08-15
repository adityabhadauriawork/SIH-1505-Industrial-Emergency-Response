import React, { useState } from 'react';
import { 
  Cpu, GitCompare, BarChart2, Activity, Camera, Sparkles 
} from 'lucide-react';
import WhatIfComparison from './WhatIfComparison';
import HistoricalAnalytics from './HistoricalAnalytics';
import PredictiveMaintenance from './PredictiveMaintenance';
import VisionSurveillance from './VisionSurveillance';

export default function IntelligenceHub({
  assets = [],
  chemicals = [],
  currentSimulation,
  onSimulateAssetConsequence,
  onCreateIncidentFromVision
}) {
  const [subTab, setSubTab] = useState('whatif');

  return (
    <div className="space-y-4 font-mono text-xs text-slate-200">
      
      {/* Sub-Navigation Strip */}
      <div className="flex border-b border-slate-800 bg-slate-950/80 rounded-xl p-1 gap-1 overflow-x-auto shadow-md">
        {[
          { id: 'whatif', label: '1. What-If Scenario Comparison', icon: GitCompare },
          { id: 'analytics', label: '2. Historical Incident Analytics', icon: BarChart2 },
          { id: 'predictive', label: '3. Asset Health & Early Warning', icon: Activity },
          { id: 'vision', label: '4. Computer Vision Surveillance', icon: Camera },
        ].map(t => {
          const Icon = t.icon;
          const isActive = subTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-Tab Contents */}
      {subTab === 'whatif' && (
        <WhatIfComparison
          assets={assets}
          chemicals={chemicals}
          currentSimulation={currentSimulation}
        />
      )}

      {subTab === 'analytics' && (
        <HistoricalAnalytics />
      )}

      {subTab === 'predictive' && (
        <PredictiveMaintenance
          onSimulateAssetConsequence={onSimulateAssetConsequence}
        />
      )}

      {subTab === 'vision' && (
        <VisionSurveillance
          onCreateIncidentFromVision={onCreateIncidentFromVision}
        />
      )}

    </div>
  );
}
