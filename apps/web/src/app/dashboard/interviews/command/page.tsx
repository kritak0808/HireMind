'use client';

import React from 'react';
import { THEME_TOKENS } from '@hiremind/ui';

export default function InterviewCommandCenter() {
  const stats = [
    { label: "Planned Blueprints", value: "32", change: "HR & Tech interview blueprints" },
    { label: "Conducted Sessions", value: "142", change: "+12 this week" },
    { label: "Active Live Rooms", value: "2", change: "HR live dialogue" },
    { label: "Evaluation Match Rate", value: "94.5%", change: "Recruiter score validation" },
  ];

  return (
    <div 
      className="min-h-screen p-10 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-10">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Interview Workspace Core
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">Interview Intelligence Center</h2>
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

      {/* Dynamic list */}
      <div 
        className="p-8 rounded-xl border backdrop-blur-md max-w-4xl"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <h3 className="text-xl font-medium mb-6">Active Interview Session Tracks</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm border-b border-gray-800 pb-3">
            <div>
              <span className="font-semibold" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>Albert Einstein</span>
              <p className="text-xs text-gray-400 font-light mt-0.5">Principal Physicist • Technical Deep-Dive</p>
            </div>
            <span className="text-xs border px-3 py-1 rounded border-yellow-500/20 text-yellow-400 bg-yellow-500/5 animate-pulse">Live Workspace Active</span>
          </div>
          <div className="flex justify-between items-center text-sm border-b border-gray-800 pb-3">
            <div>
              <span className="font-semibold" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>Max Planck</span>
              <p className="text-xs text-gray-400 font-light mt-0.5">Quantum Comp. Engineer • HR & Leadership Fit</p>
            </div>
            <span className="text-xs text-gray-400">Scheduled: 2:00 PM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
