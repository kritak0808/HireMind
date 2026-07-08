'use client';

import React from 'react';
import { THEME_TOKENS } from '@hiremind/ui';

export default function ResumeCommandCenter() {
  const stats = [
    { label: "Resumes Parsed", value: "3,480", change: "+140 this week" },
    { label: "Average ATS Score", value: "82/100", change: "Across all pipelines" },
    { label: "Matches Generated", value: "48", change: "Job similarities ready" },
    { label: "Parsing Efficiency", value: "99.9%", change: "Failure rate < 0.1%" },
  ];

  return (
    <div 
      className="min-h-screen p-10 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-10">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Resume Processing Workspace
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">Resume Intelligence Command</h2>
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

      {/* Processing logs */}
      <div 
        className="p-8 rounded-xl border backdrop-blur-md max-w-4xl"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <h3 className="text-xl font-medium mb-6">Parsing Activity Logs</h3>
        <div className="space-y-4 font-mono text-xs">
          <div className="flex justify-between items-center text-gray-300 border-b border-gray-800/60 pb-3">
            <span className="text-[#81c784]">[PARSED]</span>
            <span className="flex-grow ml-4">Ingested `curie_resume.pdf` for candidate Marie Curie. extracted: 14 skills.</span>
            <span className="text-gray-400">0.8s processing time</span>
          </div>
          <div className="flex justify-between items-center text-gray-300 border-b border-gray-800/60 pb-3">
            <span className="text-[#81c784]">[ATS_SCORED]</span>
            <span className="flex-grow ml-4">ATS Evaluator completed scoring for Einstein profile: Overall Score 98/100.</span>
            <span className="text-gray-400">1.2s scoring time</span>
          </div>
        </div>
      </div>
    </div>
  );
}
