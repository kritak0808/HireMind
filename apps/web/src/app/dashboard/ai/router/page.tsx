'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { GovernanceNav } from '../GovernanceNav';
import { Sliders, ToggleLeft, ShieldCheck, Activity, DollarSign, RefreshCw, Plus, HelpCircle } from 'lucide-react';

export default function RouterSettingsPage() {
  const [policies, setPolicies] = useState([
    { 
      id: '1', 
      name: 'Latency Optimized Parsing Policy', 
      active: true, 
      latency_limit: 300, 
      cost_limit: 10.0, 
      failover_chain: ['gemini-2.0-flash', 'gpt-4o'] 
    },
    { 
      id: '2', 
      name: 'Cost Minimized Screening Policy', 
      active: false, 
      latency_limit: 1200, 
      cost_limit: 1.5, 
      failover_chain: ['gemini-2.0-flash', 'gemini-1.5-pro'] 
    },
  ]);

  const [message, setMessage] = useState('');

  const handleToggle = (id: string) => {
    setPolicies(policies.map(p => p.id === id ? { ...p, active: !p.active } : p));
    setMessage('Routing Policy state modified successfully.');
    setTimeout(() => setMessage(''), 4000);
  };

  return (
    <div 
      className="min-h-screen p-8 text-white flex flex-col justify-start items-start"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          AI Governance Platform
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">Routing & Load Balancing Policies</h2>
      </div>

      <GovernanceNav active="/dashboard/ai/router" />

      {message && (
        <div className="mb-6 p-4 rounded bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          {message}
        </div>
      )}

      <div 
        className="w-full max-w-4xl p-8 rounded-xl border backdrop-blur-md"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <div className="mb-8">
          <h3 className="text-2xl font-bold">Priority Load Balancing Policies</h3>
          <p className="text-xs text-gray-400 font-light mt-1">Define thresholds, latency triggers, and automatic provider failover lists.</p>
        </div>

        <div className="space-y-6">
          {policies.map((p) => (
            <div 
              key={p.id}
              className="p-6 rounded border transition-all hover:bg-black/15 flex flex-col gap-6"
              style={{ borderColor: 'rgba(212,175,55,0.1)' }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-base flex items-center gap-2">
                    <Sliders className="w-4 h-4" style={{ color: THEME_TOKENS.colors.brand.goldPremium }} />
                    {p.name}
                  </h4>
                  <div className="flex gap-4 mt-2 text-xs text-gray-400 font-light">
                    <span>Failover Chain: <b style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>{p.failover_chain.join(' → ')}</b></span>
                  </div>
                </div>

                <button 
                  onClick={() => handleToggle(p.id)}
                  className="px-6 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-all hover:scale-105"
                  style={{
                    backgroundColor: p.active ? THEME_TOKENS.colors.brand.goldPremium : 'transparent',
                    color: p.active ? THEME_TOKENS.colors.neutral.grayDark : THEME_TOKENS.colors.brand.goldPremium,
                    border: `1px solid ${THEME_TOKENS.colors.brand.goldPremium}`
                  }}
                >
                  {p.active ? "Active Policy" : "Disabled"}
                </button>
              </div>

              {/* Threshold controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-800/40 text-sm">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Latency Redirection Trigger:</span>
                    <span>{p.latency_limit} ms</span>
                  </div>
                  <input 
                    type="range" 
                    min="100" 
                    max="2000" 
                    value={p.latency_limit} 
                    onChange={(e) => {
                      setPolicies(policies.map(x => x.id === p.id ? { ...x, latency_limit: parseInt(e.target.value) } : x));
                    }}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Cost Budget Limit:</span>
                    <span>${p.cost_limit.toFixed(2)} / 1M tokens</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="25.0" 
                    step="0.5"
                    value={p.cost_limit} 
                    onChange={(e) => {
                      setPolicies(policies.map(x => x.id === p.id ? { ...x, cost_limit: parseFloat(e.target.value) } : x));
                    }}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
