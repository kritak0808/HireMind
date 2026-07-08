'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { GovernanceNav } from '../GovernanceNav';
import { DollarSign, ShieldCheck, TrendingUp, TrendingDown, Layers, Calendar, BarChart2 } from 'lucide-react';

export default function CostDashboardPage() {
  const [costs] = useState([
    {
      model: 'gpt-4o',
      prompt_tokens: 18450000,
      completion_tokens: 6120000,
      total_cost: 184.05,
      calls: 12450,
      avg_per_call: 0.0148
    },
    {
      model: 'gemini-2.0-flash',
      prompt_tokens: 41200000,
      completion_tokens: 18200000,
      total_cost: 8.55,
      calls: 48600,
      avg_per_call: 0.00017
    },
    {
      model: 'claude-3-opus',
      prompt_tokens: 2840000,
      completion_tokens: 1210000,
      total_cost: 133.35,
      calls: 1400,
      avg_per_call: 0.0952
    }
  ]);

  const totalAggSpend = costs.reduce((sum, item) => sum + item.total_cost, 0);

  return (
    <div 
      className="min-h-screen p-8 text-white animate-fade-in"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          AI Governance Platform
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">AI Cost & Token Consumption Ledger</h2>
      </div>

      <GovernanceNav active="/dashboard/ai/cost" />

      {/* Aggregate Overview Card */}
      <div 
        className="p-8 rounded-xl border backdrop-blur-md mb-8 max-w-4xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <div className="space-y-1">
          <span className="text-xs uppercase text-gray-400 font-mono">Aggregated Spend Ledger</span>
          <div className="text-5xl font-extrabold text-[#d4af37] flex items-center">
            <DollarSign className="w-10 h-10" />
            {totalAggSpend.toFixed(2)}
          </div>
          <p className="text-xs text-gray-400 font-light pt-1">Total model invocation token spend mapped to active tenant.</p>
        </div>

        <div className="flex gap-6 text-xs font-mono">
          <div className="p-4 border border-gray-800 rounded bg-black/35">
            <span className="text-gray-500 block">Weekly Budget Cap</span>
            <span className="text-white font-bold text-base">$500.00</span>
          </div>
          <div className="p-4 border border-gray-800 rounded bg-black/35">
            <span className="text-gray-500 block">Current Burn Rate</span>
            <span className="text-white font-bold text-base">$4.12 / hr</span>
          </div>
        </div>
      </div>

      {/* Breakdown table */}
      <div 
        className="p-8 rounded-xl border backdrop-blur-md max-w-4xl"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <h3 className="text-xl font-medium mb-6 flex items-center gap-2">
          <BarChart2 className="w-5 h-5" style={{ color: THEME_TOKENS.colors.brand.goldPremium }} />
          Token Accounting By Model Node
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="pb-3 uppercase">Model ID</th>
                <th className="pb-3 uppercase text-right">Prompt Tokens</th>
                <th className="pb-3 uppercase text-right">Completion Tokens</th>
                <th className="pb-3 uppercase text-right">Total Calls</th>
                <th className="pb-3 uppercase text-right">Avg Cost / Call</th>
                <th className="pb-3 uppercase text-right" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>Total Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40 text-gray-300">
              {costs.map((c) => (
                <tr key={c.model} className="hover:bg-black/10">
                  <td className="py-4 font-bold text-white">{c.model}</td>
                  <td className="py-4 text-right">{c.prompt_tokens.toLocaleString()}</td>
                  <td className="py-4 text-right">{c.completion_tokens.toLocaleString()}</td>
                  <td className="py-4 text-right">{c.calls.toLocaleString()}</td>
                  <td className="py-4 text-right">${c.avg_per_call.toFixed(5)}</td>
                  <td className="py-4 text-right font-bold text-[#e5c158]">${c.total_cost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
