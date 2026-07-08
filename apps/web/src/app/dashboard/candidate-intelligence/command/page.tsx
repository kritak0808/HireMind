'use client';

import React from 'react';
import { THEME_TOKENS } from '@hiremind/ui';

export default function CandidateIntelligenceCenter() {
  const stats = [
    { label: "Enriched Profiles", value: "1,240", change: "98% enrichment coverage" },
    { label: "Active Talent Pools", value: "12", change: "4 smart, 8 manual" },
    { label: "Average Similarity", value: "78%", change: "Job postings relevance" },
    { label: "Explainer Audit Log", value: "100%", change: "Zero black-box decisions" },
  ];

  return (
    <div 
      className="min-h-screen p-10 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-10">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Candidate Intelligence Core
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">Candidate Intelligence Command</h2>
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

      {/* Recruiter recent decision logs */}
      <div 
        className="p-8 rounded-xl border backdrop-blur-md max-w-4xl"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <h3 className="text-xl font-medium mb-6">Explainable Hiring Recommendations</h3>
        <div className="space-y-4">
          <div className="border-b border-gray-800 pb-4">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="font-semibold" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>Marie Curie</span>
              <span className="text-xs text-[#81c784] font-bold uppercase">Strong Hire (94%)</span>
            </div>
            <p className="text-xs text-gray-400 font-light leading-relaxed">
              Strengths: Extensive experience in core chemical analysis pipelines. Risk Factor: Highly focused on active lab infrastructure (ensure role offers sufficient hands-on workspace).
            </p>
          </div>
          <div className="border-b border-gray-800 pb-4">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="font-semibold" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>Richard Feynman</span>
              <span className="text-xs text-[#81c784] font-bold uppercase">Strong Hire (91%)</span>
            </div>
            <p className="text-xs text-gray-400 font-light leading-relaxed">
              Strengths: Strong mathematical modelling and technical depth. Risk Factor: Enjoys highly creative, unstructured tasks (ensure clear scoping).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
