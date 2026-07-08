'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { GovernanceNav } from '../GovernanceNav';
import { Activity, ShieldCheck, Heart, AlertTriangle, RefreshCw, BarChart } from 'lucide-react';

export default function ModelHealthPage() {
  const [healthRecords] = useState([
    {
      model: 'gemini-2.0-flash',
      status: 'Healthy',
      latency_p95: '135ms',
      error_rate: '0.00%',
      availability: '100%',
      throughput: '124,800 tokens/min',
      calls_today: 4120
    },
    {
      model: 'gpt-4o',
      status: 'Healthy',
      latency_p95: '410ms',
      error_rate: '0.08%',
      availability: '99.92%',
      throughput: '48,600 tokens/min',
      calls_today: 1210
    },
    {
      model: 'claude-3-opus',
      status: 'Degraded',
      latency_p95: '980ms',
      error_rate: '2.50%',
      availability: '97.50%',
      throughput: '8,400 tokens/min',
      calls_today: 140
    }
  ]);

  return (
    <div 
      className="min-h-screen p-8 text-white animate-fade-in"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          AI Governance Platform
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">Model Availability & Health Explorer</h2>
      </div>

      <GovernanceNav active="/dashboard/ai/health" />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {healthRecords.map((rec, i) => (
          <div 
            key={i}
            className="p-6 rounded-xl border backdrop-blur-md flex flex-col justify-between"
            style={{ 
              backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
              borderColor: THEME_TOKENS.colors.background.borderGlass 
            }}
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-gray-400 font-mono font-light">HEALTH RECORD</span>
                <span 
                  className="text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider"
                  style={{
                    backgroundColor: rec.status === 'Healthy' ? 'rgba(76,175,80,0.1)' : 'rgba(244,67,54,0.1)',
                    color: rec.status === 'Healthy' ? '#4caf50' : '#f44336'
                  }}
                >
                  {rec.status}
                </span>
              </div>

              <h3 className="font-extrabold text-lg mb-4">{rec.model}</h3>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono mb-4 pt-4 border-t border-gray-800/40">
                <div>
                  <span className="text-gray-500 block">P95 Latency</span>
                  <span className="text-[#e5c158] font-bold text-sm">{rec.latency_p95}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Availability</span>
                  <span className="text-white font-bold text-sm">{rec.availability}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Error Rate</span>
                  <span className="text-white font-bold text-sm">{rec.error_rate}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Calls Count</span>
                  <span className="text-white font-bold text-sm">{rec.calls_today} calls</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800/40 flex items-center justify-between text-xs text-gray-400 font-mono">
              <span className="flex items-center gap-1">
                <Heart className="w-4.5 h-4.5 text-red-500" />
                Throughput:
              </span>
              <span>{rec.throughput}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
