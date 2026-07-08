'use client';

import React from 'react';
import { THEME_TOKENS } from '@hiremind/ui';

export default function MediaAnalyticsPage() {
  const connectionLogs = [
    { metric: "Peak Jitter Index", value: "2.1ms", threshold: "Max 10ms (Good)" },
    { metric: "Bitrate Stability Coefficient", value: "98.5%", threshold: "Min 90% (Good)" },
    { metric: "Average RTT Latency", value: "12ms", threshold: "Max 150ms (Excellent)" },
    { metric: "Overall packet loss", value: "0.00%", threshold: "Max 1.00% (Perfect)" }
  ];

  return (
    <div 
      className="min-h-screen p-10 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-10">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Connection QoS Diagnostic
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">Network & Stream Analytics</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
        {/* Network Quality Console */}
        <div 
          className="p-8 rounded-xl border backdrop-blur-md"
          style={{ 
            backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
            borderColor: THEME_TOKENS.colors.background.borderGlass 
          }}
        >
          <h3 className="text-lg font-medium mb-6">Connection Quality Console</h3>
          <div className="space-y-4">
            {connectionLogs.map((l, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-800 pb-3">
                <div>
                  <span className="font-semibold text-gray-300">{l.metric}</span>
                  <p className="text-[10px] text-gray-400 font-light mt-0.5">{l.threshold}</p>
                </div>
                <span className="font-mono font-bold" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
                  {l.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time diagnostics metrics */}
        <div 
          className="p-8 rounded-xl border backdrop-blur-md flex flex-col justify-center items-center"
          style={{ 
            backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
            borderColor: THEME_TOKENS.colors.background.borderGlass 
          }}
        >
          <div className="w-32 h-32 rounded-full border-4 border-yellow-500/20 flex items-center justify-center relative">
            <div className="text-center">
              <span className="text-3xl font-mono font-bold" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>99</span>
              <p className="text-[9px] uppercase tracking-wider text-gray-400 mt-1">QoS Score</p>
            </div>
            <div className="absolute top-0 right-0 w-4 h-4 rounded-full bg-[#81c784] border-2 border-black animate-ping" />
          </div>
          <p className="text-xs text-gray-400 font-light text-center mt-6 leading-relaxed max-w-xs">
            WebRTC connection is stable. Bandwidth Allocation Coordinator is streaming without congestion flags.
          </p>
        </div>
      </div>
    </div>
  );
}
