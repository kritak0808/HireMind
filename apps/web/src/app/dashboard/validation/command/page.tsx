'use client';

import React from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { Activity, Shield, Award, CheckSquare, FileText, Lock, Users, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { ValidationNav } from '../ValidationNav';

export default function ValidationCommand() {
  const scorecards = [
    { label: "Overall Quality Score", value: "98.5%", change: "Target threshold: 95.0%", icon: Award },
    { label: "Passed Quality Gates", value: "8 / 8 Gates", change: "Auto-rejections active", icon: CheckSquare },
    { label: "Security Risk Index", value: "0 Critical CVEs", change: "Zero open alerts", icon: Shield },
    { label: "Accessibility Score", value: "WCAG 2.2 AA", change: "Zero contrast violations", icon: Users }
  ];

  return (
    <div 
      className="min-h-screen p-8 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Release Readiness Control
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">Validation Command Center</h2>
      </div>

      <ValidationNav active="/dashboard/validation/command" />

      {/* Grid of scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {scorecards.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div 
              key={idx}
              className="p-6 rounded-xl border backdrop-blur-md transition-all hover:scale-[1.02] flex items-center justify-between"
              style={{ 
                backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
                borderColor: THEME_TOKENS.colors.background.borderGlass 
              }}
            >
              <div>
                <span className="text-xs uppercase tracking-wider text-gray-400 font-light">{s.label}</span>
                <div className="text-3xl font-bold my-2" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
                  {s.value}
                </div>
                <span className="text-xs text-green-400 font-medium">{s.change}</span>
              </div>
              <Icon className="w-8 h-8 opacity-40" style={{ color: THEME_TOKENS.colors.brand.goldPremium }} />
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Risk Assessment Heatmap */}
        <div 
          className="p-6 rounded-xl border"
          style={{ 
            backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
            borderColor: THEME_TOKENS.colors.background.borderGlass 
          }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
            Platform Vulnerability Risk Matrix
          </h3>
          <div className="grid grid-cols-3 gap-3 h-48">
            {[
              { level: "Low Risk", color: "rgba(16,185,129,0.15)", text: "Auth & IAM", border: "#10b981" },
              { level: "Low Risk", color: "rgba(16,185,129,0.15)", text: "Recruitment Core", border: "#10b981" },
              { level: "Low Risk", color: "rgba(16,185,129,0.15)", text: "Data Pipeline", border: "#10b981" },
              { level: "Low Risk", color: "rgba(16,185,129,0.15)", text: "Caching Layer", border: "#10b981" },
              { level: "Medium Risk", color: "rgba(245,158,11,0.15)", text: "AI Router Models", border: "#f59e0b" },
              { level: "Low Risk", color: "rgba(16,185,129,0.15)", text: "Coding Sandbox", border: "#10b981" }
            ].map((cell, idx) => (
              <div 
                key={idx} 
                className="rounded-lg border p-4 flex flex-col justify-between"
                style={{ backgroundColor: cell.color, borderColor: cell.border }}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider text-white opacity-80">{cell.level}</span>
                <span className="text-xs font-semibold text-white">{cell.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Release Candidate List */}
        <div 
          className="p-6 rounded-xl border"
          style={{ 
            backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
            borderColor: THEME_TOKENS.colors.background.borderGlass 
          }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
            Active Release Candidate Statuses
          </h3>
          <div className="space-y-4">
            {[
              { version: "v1.5.0-rc2", build: "Build 1240", status: "passed", date: "15 mins ago" },
              { version: "v1.5.0-rc1", build: "Build 1239", status: "rejected", date: "2 hours ago" },
              { version: "v1.4.2-prod", build: "Build 1198", status: "passed", date: "3 days ago" }
            ].map((candidate, i) => (
              <div key={i} className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <div>
                  <div className="text-sm font-semibold">{candidate.version}</div>
                  <div className="text-xs text-gray-400">{candidate.build} | {candidate.date}</div>
                </div>
                <div className="text-right">
                  <span 
                    className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded" 
                    style={{ 
                      backgroundColor: candidate.status === 'passed' ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)', 
                      color: candidate.status === 'passed' ? '#4ade80' : '#ef4444' 
                    }}
                  >
                    {candidate.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
