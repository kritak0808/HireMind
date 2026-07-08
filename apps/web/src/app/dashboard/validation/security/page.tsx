'use client';

import React from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { ValidationNav } from '../ValidationNav';
import { Shield, ShieldAlert, Award } from 'lucide-react';

export default function SecurityFindings() {
  const findings = [
    { cve: "CVE-2026-1042", severity: "medium", component: "Authentication Handler", desc: "Slightly outdated session token configuration setup. Patched on rc2.", status: "resolved" },
    { cve: "SCA-Npm-Lock", severity: "low", component: "libs/events package dependencies", desc: "Minor updates available for indirect sub-dependencies.", status: "open" }
  ];

  return (
    <div 
      className="min-h-screen p-8 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Vulnerability Audit
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">Security Findings Explorer</h2>
      </div>

      <ValidationNav active="/dashboard/validation/security" />

      <div 
        className="p-6 rounded-xl border"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <h3 className="text-lg font-bold mb-4" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          SCA and Penetration Vulnerabilities
        </h3>
        <div className="space-y-4">
          {findings.map((f, i) => {
            let color = "#10b981";
            let bg = "rgba(16,185,129,0.1)";
            if (f.severity === "critical" || f.severity === "high") {
              color = "#ef4444";
              bg = "rgba(239,68,68,0.1)";
            } else if (f.severity === "medium") {
              color = "#f59e0b";
              bg = "rgba(245,158,11,0.1)";
            }

            return (
              <div key={i} className="p-4 border rounded-xl border-gray-800 flex justify-between items-center transition-all hover:bg-gray-800/10">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5" style={{ color: color }} />
                  <div>
                    <div className="text-sm font-semibold">{f.cve}</div>
                    <p className="text-xs text-gray-400 mt-1">{f.desc}</p>
                    <span className="text-[10px] text-gray-400 block mt-1">Component: {f.component}</span>
                  </div>
                </div>

                <div className="flex gap-4 text-xs items-center text-right">
                  <div>
                    <span className="text-[9px] uppercase text-gray-400 block">Severity</span>
                    <span className="font-bold uppercase" style={{ color: color }}>{f.severity}</span>
                  </div>
                  <div>
                    <span 
                      className="text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded" 
                      style={{ backgroundColor: bg, color: color }}
                    >
                      {f.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
