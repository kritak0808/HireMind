'use client';

import React from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { ValidationNav } from '../ValidationNav';
import { Lock, CheckCircle2, Shield } from 'lucide-react';

export default function EvidenceExplorer() {
  const records = [
    { type: "OWASP Vulnerability scan report", path: "/evidence/security/zap-build-1240.json", hash: "9e107d9d372bb6826bd81d3542a419d6" },
    { type: "WCAG Accessibility contrast logs", path: "/evidence/accessibility/audits-v1.5.json", hash: "cf83e1357eefb8d3f6bdc0e419a419d5" },
    { type: "GDPR candidate data scrub receipts", path: "/evidence/compliance/gdpr-scrub-tenant_12.json", hash: "1234567890abcdef1234567890abcdef" }
  ];

  return (
    <div 
      className="min-h-screen p-8 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Evidence Locker
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">Audit Evidence Explorer</h2>
      </div>

      <ValidationNav active="/dashboard/validation/evidence" />

      <div 
        className="p-6 rounded-xl border"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <h3 className="text-lg font-bold mb-4" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Tamper-Proof Audit Records (SHA-256 Locked)
        </h3>
        <div className="space-y-4">
          {records.map((rec, i) => (
            <div key={i} className="p-4 border rounded-xl border-gray-800 flex justify-between items-center transition-all hover:bg-gray-800/10">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5" style={{ color: THEME_TOKENS.colors.brand.goldPremium }} />
                <div>
                  <div className="text-sm font-semibold">{rec.type}</div>
                  <p className="text-xs text-gray-400 mt-1">Document path: {rec.path}</p>
                  <span className="text-[9px] text-gray-400 block mt-1">SHA-256 Hash: {rec.hash}</span>
                </div>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-green-400/10 text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Sealed
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
