'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { Play, RotateCcw, AlertTriangle, Database, ShieldAlert, Activity, Users, Layers, Cpu, Cloud } from 'lucide-react';

export default function OperationsCommand() {
  const [canaryStage, setCanaryStage] = useState(25);
  const [backingUp, setBackingUp] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);

  const triggerBackup = async () => {
    setBackingUp(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setBackingUp(false);
  };

  const triggerRollback = async () => {
    setRollingBack(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRollingBack(false);
  };

  const incidents = [
    { id: "INC-1092", title: "API Gateway container restarts detected", severity: "high", time: "12 mins ago" },
    { id: "INC-1089", title: "Redis cache memory allocation drift", severity: "low", time: "2 hours ago" }
  ];

  return (
    <div 
      className="min-h-screen p-8 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
            Operations & Live Release Management
          </span>
          <h2 className="text-4xl font-bold tracking-tight mt-1">Operations Command Center</h2>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={triggerBackup}
            disabled={backingUp}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg text-xs font-semibold uppercase tracking-wider transition-all hover:scale-105"
            style={{ 
              borderColor: THEME_TOKENS.colors.brand.goldPremium,
              color: THEME_TOKENS.colors.brand.goldPremium 
            }}
          >
            <Database className="w-4 h-4" />
            {backingUp ? "Backing up..." : "Trigger Backup"}
          </button>
          <button 
            onClick={triggerRollback}
            disabled={rollingBack}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all hover:scale-105"
          >
            <RotateCcw className="w-4 h-4" />
            {rollingBack ? "Rolling back..." : "Force Rollback"}
          </button>
        </div>
      </div>

      {/* Grid Status Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div 
          className="p-6 rounded-xl border flex items-center justify-between"
          style={{ backgroundColor: THEME_TOKENS.colors.background.panelGlass, borderColor: THEME_TOKENS.colors.background.borderGlass }}
        >
          <div>
            <span className="text-xs uppercase text-gray-400 font-light">Global Uptime</span>
            <div className="text-3xl font-bold my-2" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>99.98%</div>
            <span className="text-xs text-green-400 font-medium">SLO Target: 99.9%</span>
          </div>
          <Activity className="w-10 h-10 opacity-30" style={{ color: THEME_TOKENS.colors.brand.goldPremium }} />
        </div>

        <div 
          className="p-6 rounded-xl border flex items-center justify-between"
          style={{ backgroundColor: THEME_TOKENS.colors.background.panelGlass, borderColor: THEME_TOKENS.colors.background.borderGlass }}
        >
          <div>
            <span className="text-xs uppercase text-gray-400 font-light">Active Pod Replicas</span>
            <div className="text-3xl font-bold my-2" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>15 Pods</div>
            <span className="text-xs text-gray-400">Horizontal Scaling Active</span>
          </div>
          <Cpu className="w-10 h-10 opacity-30" style={{ color: THEME_TOKENS.colors.brand.goldPremium }} />
        </div>

        <div 
          className="p-6 rounded-xl border flex items-center justify-between"
          style={{ backgroundColor: THEME_TOKENS.colors.background.panelGlass, borderColor: THEME_TOKENS.colors.background.borderGlass }}
        >
          <div>
            <span className="text-xs uppercase text-gray-400 font-light">Environment status</span>
            <div className="text-3xl font-bold my-2 text-green-400">Healthy</div>
            <span className="text-xs text-gray-400">All regions synchronized</span>
          </div>
          <Cloud className="w-10 h-10 opacity-30 text-green-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Canary Progress Visualizer */}
        <div 
          className="p-6 rounded-xl border"
          style={{ backgroundColor: THEME_TOKENS.colors.background.panelGlass, borderColor: THEME_TOKENS.colors.background.borderGlass }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
            Active Canary Deployment (v1.0.0)
          </h3>
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Canary Traffic Routing</span>
              <span className="font-bold text-white">{canaryStage}% Traffic</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3.5 border border-gray-700">
              <div 
                className="h-full rounded-full transition-all duration-500" 
                style={{ width: `${canaryStage}%`, backgroundColor: THEME_TOKENS.colors.brand.goldPremium }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            {[10, 25, 50, 100].map(val => (
              <button 
                key={val}
                onClick={() => setCanaryStage(val)}
                className="flex-1 py-2 text-xs font-bold rounded border transition-all hover:scale-105"
                style={{ 
                  borderColor: THEME_TOKENS.colors.brand.goldPremium,
                  color: canaryStage === val ? THEME_TOKENS.colors.neutral.grayDark : THEME_TOKENS.colors.brand.goldPremium,
                  backgroundColor: canaryStage === val ? THEME_TOKENS.colors.brand.goldPremium : 'transparent'
                }}
              >
                {val === 100 ? "Promote Full" : `${val}% Canary`}
              </button>
            ))}
          </div>
        </div>

        {/* Incidents List */}
        <div 
          className="p-6 rounded-xl border"
          style={{ backgroundColor: THEME_TOKENS.colors.background.panelGlass, borderColor: THEME_TOKENS.colors.background.borderGlass }}
        >
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
            <ShieldAlert className="w-5 h-5" /> Open Operational Incidents
          </h3>
          <div className="space-y-4">
            {incidents.map((inc, i) => (
              <div key={i} className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <div>
                  <div className="text-sm font-semibold">{inc.title}</div>
                  <div className="text-xs text-gray-400">{inc.id} | Triggered {inc.time}</div>
                </div>
                <div>
                  <span 
                    className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded"
                    style={{ 
                      backgroundColor: inc.severity === 'high' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', 
                      color: inc.severity === 'high' ? '#ef4444' : '#f59e0b' 
                    }}
                  >
                    {inc.severity} Severity
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
