'use client';

import React from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { ValidationNav } from '../ValidationNav';
import { CheckSquare, AlertCircle, CheckCircle } from 'lucide-react';

export default function QualityGates() {
  const gates = [
    { name: "Unit Test Coverage", metric: "unit_coverage", threshold: ">= 80.0%", current: "90.25%", status: "compliant" },
    { name: "Static Vulnerability Checks", metric: "critical_cves", threshold: "0 critical CVEs", current: "0 CVEs", status: "compliant" },
    { name: "Accessibility Contrast ratios", metric: "accessibility_violations", threshold: "0 contrast errors", current: "0 errors", status: "compliant" },
    { name: "System RTO metrics validation", metric: "rto_seconds", threshold: "<= 30 seconds", current: "12 seconds", status: "compliant" },
    { name: "PII Security Filters compliance", metric: "failed_scans", threshold: "0 violations", current: "0 violations", status: "compliant" }
  ];

  return (
    <div 
      className="min-h-screen p-8 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Automated Gates
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">Release Quality Gates</h2>
      </div>

      <ValidationNav active="/dashboard/validation/gates" />

      <div 
        className="p-6 rounded-xl border"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <h3 className="text-lg font-bold mb-4" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Active Automated Threshold Boundaries
        </h3>
        <div className="space-y-4">
          {gates.map((g, i) => (
            <div key={i} className="p-4 border rounded-xl border-gray-800 flex justify-between items-center bg-gray-900/5">
              <div className="flex items-center gap-3">
                <CheckSquare className="w-5 h-5" style={{ color: THEME_TOKENS.colors.brand.goldPremium }} />
                <div>
                  <div className="text-sm font-semibold">{g.name}</div>
                  <span className="text-xs text-gray-400">Metric key: {g.metric}</span>
                </div>
              </div>
              <div className="flex gap-12 text-xs text-right items-center">
                <div>
                  <span className="text-[9px] uppercase text-gray-400 block">Required Limit</span>
                  <span className="font-semibold text-white">{g.threshold}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-gray-400 block">Current Build</span>
                  <span className="font-semibold text-white">{g.current}</span>
                </div>
                <div>
                  <span 
                    className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                    style={{ 
                      backgroundColor: g.status === 'compliant' ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)', 
                      color: g.status === 'compliant' ? '#4ade80' : '#ef4444' 
                    }}
                  >
                    {g.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
