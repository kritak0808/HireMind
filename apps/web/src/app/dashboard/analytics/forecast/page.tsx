'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';

export default function ForecastExplorer() {
  const [forecasts] = useState([
    { period: "Next 30 Days", metric: "Average Time-to-screen", predicted: "2.1 days", lower: "1.8 days", upper: "2.4 days", confidence: "95%" },
    { period: "Next 60 Days", metric: "Offer Acceptance rate", predicted: "94.0%", lower: "91.2%", upper: "96.8%", confidence: "90%" },
  ]);

  return (
    <div 
      className="min-h-screen p-10 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-10">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Predictive pipeline velocities
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">Forecast Explorer</h2>
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
              <th className="p-4">Target Period</th>
              <th className="p-4">Evaluation Metric</th>
              <th className="p-4">Predicted Value</th>
              <th className="p-4">Confidence Interval Bounds</th>
              <th className="p-4 text-right">Confidence Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/40">
            {forecasts.map((f, idx) => (
              <tr key={idx} className="transition-all hover:bg-black/10 text-xs">
                <td className="p-4 font-semibold text-gray-200">{f.period}</td>
                <td className="p-4 text-gray-300">{f.metric}</td>
                <td className="p-4 font-mono font-bold" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
                  {f.predicted}
                </td>
                <td className="p-4 font-mono text-gray-400">[{f.lower} to {f.upper}]</td>
                <td className="p-4 text-right font-bold text-green-400 font-mono">{f.confidence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
