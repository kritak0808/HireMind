'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';

export default function AtsDashboardPage() {
  const [candidates] = useState([
    { name: "Albert Einstein", role: "Principal Physicist", relevancy: 98, skills: 95, overall: 96 },
    { name: "Marie Curie", role: "Research Chemist", relevancy: 94, skills: 92, overall: 93 },
  ]);

  return (
    <div 
      className="min-h-screen p-10 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-10">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          ATS Evaluations Core
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">Weighted Scoring Matrix</h2>
      </div>

      <div 
        className="rounded-xl border backdrop-blur-md overflow-hidden max-w-5xl"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-xs font-semibold uppercase tracking-wider text-gray-400" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <th className="p-4">Candidate Profile</th>
              <th className="p-4">Relevancy Weight</th>
              <th className="p-4">Skills Weight</th>
              <th className="p-4">Overall Score</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/40">
            {candidates.map((c, idx) => (
              <tr key={idx} className="transition-all hover:bg-black/10">
                <td className="p-4">
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-gray-400 font-light mt-0.5">{c.role}</div>
                </td>
                <td className="p-4 font-mono">{c.relevancy}%</td>
                <td className="p-4 font-mono">{c.skills}%</td>
                <td className="p-4 font-mono font-bold" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
                  {c.overall}/100
                </td>
                <td className="p-4 text-right">
                  <a 
                    href="#" 
                    className="text-xs font-medium border px-3 py-1.5 rounded transition-all hover:scale-105 inline-block"
                    style={{ borderColor: THEME_TOKENS.colors.brand.goldPremium, color: THEME_TOKENS.colors.brand.goldPremium }}
                  >
                    View Breakdown
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
