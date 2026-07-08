'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { GovernanceNav } from '../GovernanceNav';
import { ShieldCheck, FileText, CheckCircle2, AlertCircle, Bookmark, FileSpreadsheet, Lock } from 'lucide-react';

export default function ComplianceHubPage() {
  const [reports] = useState([
    {
      type: 'GDPR Compliance Check',
      score: 100,
      status: 'Compliant',
      evidence_ref: 's3://hm-governance-audit/evidence/gdpr_compliance_2026_q2.pdf',
      findings: {
        'Candidate PII Redacted': true,
        'Right to be Forgotten Hooks Active': true,
        'Data Retention Limit Checked': true,
        'Encrypted Storage Verification': true
      }
    },
    {
      type: 'EU AI Act Alignment Assessment',
      score: 95,
      status: 'High Alignment',
      evidence_ref: 's3://hm-governance-audit/evidence/eu_ai_act_eval_v1.0.pdf',
      findings: {
        'Bias evaluations registered': true,
        'Model lineage tracing active': true,
        'Human-in-the-loop triggers': true,
        'Reproducibility card logs': false
      }
    },
    {
      type: 'SOC2 Type II - Section CC7 (AI Trust)',
      score: 100,
      status: 'Compliant',
      evidence_ref: 's3://hm-governance-audit/evidence/soc2_type2_cc7_audit.pdf',
      findings: {
        'Immutability hashing enabled': true,
        'Access controls restricted': true,
        'Model input safety blocklist active': true
      }
    }
  ]);

  return (
    <div 
      className="min-h-screen p-8 text-white animate-fade-in"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          AI Governance Platform
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">Compliance & Evidence Auditing</h2>
      </div>

      <GovernanceNav active="/dashboard/ai/compliance" />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {reports.map((r, i) => (
          <div 
            key={i}
            className="p-6 rounded-xl border backdrop-blur-md flex flex-col justify-between"
            style={{ 
              backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
              borderColor: THEME_TOKENS.colors.background.borderGlass 
            }}
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-gray-400 font-light font-mono">COMPLIANCE LEDGER</span>
                <span 
                  className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                  style={{
                    backgroundColor: r.score === 100 ? 'rgba(76,175,80,0.1)' : 'rgba(255,152,0,0.1)',
                    color: r.score === 100 ? '#4caf50' : '#ff9800'
                  }}
                >
                  {r.status}
                </span>
              </div>

              <h3 className="font-bold text-lg mb-4">{r.type}</h3>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl font-extrabold text-[#d4af37]">{r.score}%</div>
                <div className="text-xs text-gray-400 font-light">Calculated compliance alignment score index</div>
              </div>

              {/* Findings checklist */}
              <div className="space-y-3 mb-6 pt-4 border-t border-gray-800/40">
                {Object.entries(r.findings).map(([finding, ok]) => (
                  <div key={finding} className="flex justify-between items-center text-xs">
                    <span className="text-gray-300 font-light">{finding}</span>
                    {ok ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800/40 flex items-center gap-2 text-xs font-mono text-gray-400">
              <Lock className="w-3.5 h-3.5 text-[#d4af37]" />
              <span className="truncate">{r.evidence_ref}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
