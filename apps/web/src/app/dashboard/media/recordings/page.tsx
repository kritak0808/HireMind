'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';

export default function RecordingsManager() {
  const [recordings] = useState([
    { id: '1', candidate: "Albert Einstein", plan: "Consensus Physics Architectures", key: "recordings/org_1/session_ae/stream_raw.webm", size: "245 MB", duration: "45m 12s" },
    { id: '2', candidate: "Marie Curie", plan: "Laboratory Chemistry Lead", key: "recordings/org_1/session_mc/stream_raw.webm", size: "198 MB", duration: "38m 45s" }
  ]);

  return (
    <div 
      className="min-h-screen p-10 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-10">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Media Storage Archives
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">Recording Manager</h2>
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
              <th className="p-4">Candidate & Blueprint</th>
              <th className="p-4">Duration</th>
              <th className="p-4">Storage coordinate</th>
              <th className="p-4">File Size</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/40">
            {recordings.map((r) => (
              <tr key={r.id} className="transition-all hover:bg-black/10">
                <td className="p-4">
                  <div className="font-semibold text-gray-200">{r.candidate}</div>
                  <div className="text-xs text-gray-400 font-light mt-0.5">{r.plan}</div>
                </td>
                <td className="p-4 font-mono text-gray-300">{r.duration}</td>
                <td className="p-4 font-mono text-xs text-gray-400 truncate max-w-xs">{r.key}</td>
                <td className="p-4 font-mono text-gray-300">{r.size}</td>
                <td className="p-4 text-right">
                  <a 
                    href="#" 
                    className="text-xs font-medium border px-3 py-1.5 rounded transition-all hover:scale-105 inline-block"
                    style={{ borderColor: THEME_TOKENS.colors.brand.goldPremium, color: THEME_TOKENS.colors.brand.goldPremium }}
                  >
                    Request Playback
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
