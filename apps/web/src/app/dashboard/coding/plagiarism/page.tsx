'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';

export default function PlagiarismExplorer() {
  const [reports] = useState([
    { candidate: "Albert Einstein", matched: "Marie Curie", similarity: "12.4%", status: "Clean", reason: "AST structures overlap within standard library syntax template bounds." },
    { candidate: "Max Planck", matched: "Niels Bohr", similarity: "8.5%", status: "Clean", reason: "No matching syntax signatures patterns found." },
  ]);

  return (
    <div 
      className="min-h-screen p-10 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-10">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          AST Token Match Engine
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">Plagiarism Explorer</h2>
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
              <th className="p-4">Submission Owner</th>
              <th className="p-4">Similarity Match Ratio</th>
              <th className="p-4">Matched Candidate</th>
              <th className="p-4">Status Check</th>
              <th className="p-4 text-right">Reasoning Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/40">
            {reports.map((r, idx) => (
              <tr key={idx} className="transition-all hover:bg-black/10 text-xs">
                <td className="p-4 font-semibold text-gray-200">{r.candidate}</td>
                <td className="p-4 font-mono text-yellow-400">{r.similarity}</td>
                <td className="p-4 text-gray-300">{r.matched}</td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 font-bold font-mono">
                    {r.status}
                  </span>
                </td>
                <td className="p-4 text-right text-gray-400 font-light max-w-xs truncate">{r.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
