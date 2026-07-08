'use client';

import React from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { ValidationNav } from '../ValidationNav';
import { Lock, FileText, CheckCircle2 } from 'lucide-react';

export default function ComplianceDashboard() {
  const frameworks = [
    { name: "GDPR Candidate Right to Deletion", type: "Privacy & Scrubbing", status: "Audited", details: "PII log redactors and soft-deletion procedures verified." },
    { name: "SOC 2 Trust Services Criteria", type: "Security Controls", status: "Ready", details: "Role-based action checks and audit logs cryptographically sealed." },
    { name: "ISO/IEC 27001 ISMS Alignment", type: "System Governance", status: "Compliant", details: "Active risk registers and key rotation pipelines verified." }
  ];

  return (
    <div 
      className="min-h-screen p-8 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Corporate Compliance
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">Enterprise Compliance Center</h2>
      </div>

      <ValidationNav active="/dashboard/validation/compliance" />

      <div 
        className="p-6 rounded-xl border"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <h3 className="text-lg font-bold mb-4" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Audit Evidence Frameworks
        </h3>
        <div className="space-y-4">
          {frameworks.map((f, i) => (
            <div key={i} className="p-4 border rounded-xl border-gray-800 flex justify-between items-center transition-all hover:bg-gray-800/10">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-sm font-semibold">{f.name}</div>
                  <p className="text-xs text-gray-400 mt-1">{f.details}</p>
                  <span className="text-[9px] uppercase tracking-wider text-gray-400">Framework Type: {f.type}</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-green-400/10 text-green-400 uppercase tracking-wider">
                  {f.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
