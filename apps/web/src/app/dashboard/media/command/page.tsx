'use client';

import React from 'react';
import { THEME_TOKENS } from '@hiremind/ui';

export default function MediaCommandCenter() {
  const stats = [
    { label: "Concurrent Media Streams", value: "8", change: "4 audio, 4 video" },
    { label: "Archived Recordings", value: "128", change: "Storage usage: 42 GB" },
    { label: "Average Latency", value: "14ms", change: "Highly stable connection" },
    { label: "Audio Jitter Index", value: "1.2ms", change: "Clean audio segments" },
  ];

  return (
    <div 
      className="min-h-screen p-10 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-10">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Enterprise Streaming Services
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">Media Command Center</h2>
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

      {/* Active rooms lists */}
      <div 
        className="p-8 rounded-xl border backdrop-blur-md max-w-4xl"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <h3 className="text-xl font-medium mb-6">Live Streaming Rooms</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm border-b border-gray-800 pb-3">
            <div>
              <span className="font-semibold text-gray-200">Room: room_consensus_albert</span>
              <p className="text-xs text-gray-400 font-light mt-0.5">Codecs: Opus, VP8 • Jitter: 1.1ms</p>
            </div>
            <span className="text-xs border px-3 py-1 rounded border-yellow-500/20 text-yellow-400 bg-yellow-500/5">Transcribing live</span>
          </div>
        </div>
      </div>
    </div>
  );
}
