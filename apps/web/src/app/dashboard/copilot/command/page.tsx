'use client';

import React from 'react';
import { THEME_TOKENS } from '@hiremind/ui';

export default function CopilotCommandCenter() {
  const stats = [
    { label: "Active Copilot Sessions", value: "4", change: "+1 this hour" },
    { label: "Intent accuracy Ratio", value: "98.2%", change: "NLP query parsing" },
    { label: "Automated Triggers", value: "1,240", change: "Transitions, reminders run" },
    { label: "Pending Approvals", value: "3", change: "Requires review validations" },
  ];

  return (
    <div 
      className="min-h-screen p-10 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-10">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Enterprise Workflow Automation
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">Copilot Command Center</h2>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((s, idx) => (
          <div 
            key={idx}
            className="p-6 rounded-xl border backdrop-blur-md transition-all hover:scale-[1.02]"
            style={{ 
              backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
              borderColor: THEME_TOKENS.colors.background.borderGlass 
            }}
          >
            <span className="text-xs uppercase tracking-wider text-gray-400 font-light">{s.label}</span>
            <div className="text-4xl font-bold my-2" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
              {s.value}
            </div>
            <span className="text-xs text-gray-300 font-light">{s.change}</span>
          </div>
        ))}
      </div>

      {/* AI Activity stream logs */}
      <div 
        className="p-8 rounded-xl border backdrop-blur-md max-w-4xl"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <h3 className="text-xl font-medium mb-6">Copilot Intent Logs</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm border-b border-gray-800 pb-3">
            <div>
              <span className="font-semibold text-gray-200">Query: \"Compare the top five candidates\"</span>
              <p className="text-xs text-gray-400 font-light mt-0.5">Intent: compare_candidates • Score: 99%</p>
            </div>
            <span className="text-xs border px-3 py-1 rounded border-yellow-500/20 text-yellow-400 bg-yellow-500/5">Completed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
