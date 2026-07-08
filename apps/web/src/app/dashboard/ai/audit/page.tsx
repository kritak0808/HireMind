'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { GovernanceNav } from '../GovernanceNav';
import { Key, ShieldCheck, User, Search, Terminal, AlertTriangle, FileCode } from 'lucide-react';

export default function GovernanceAuditPage() {
  const [audits] = useState([
    {
      id: 'aud_98124',
      actor: 'Ada Lovelace (Lead AI Researcher)',
      action: 'ModelPromoted',
      resource: 'gemini-2.0-flash (canary split 70%)',
      timestamp: '2026-07-01 15:42',
      prev_state: { canary_weight: 30, shadow_enabled: true },
      new_state: { canary_weight: 70, shadow_enabled: true },
      hash: '3f8e5c8e2b8344bbda6e949669528d228de825656b825da1825c04e2860d5b5d'
    },
    {
      id: 'aud_97412',
      actor: 'Alan Turing (Ops Engineer)',
      action: 'PromptApproved',
      resource: 'resume_parsing_core (v4.0.0)',
      timestamp: '2026-07-01 12:15',
      prev_state: { status: 'pending_review' },
      new_state: { status: 'approved' },
      hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    },
    {
      id: 'aud_96120',
      actor: 'Grace Hopper (Compiler Architect)',
      action: 'PolicyRuleCreated',
      resource: 'cost_limit_10_dollars',
      timestamp: '2026-06-30 18:10',
      prev_state: {},
      new_state: { limit: 10.0, action: 'block_routing' },
      hash: '7d92842010834da8392818a7c2901a91823abce9201a1d8716b71f92e01a1b18'
    }
  ]);

  const [selectedAudit, setSelectedAudit] = useState(audits[0]);

  return (
    <div 
      className="min-h-screen p-8 text-white animate-fade-in"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          AI Governance Platform
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">Immutable Governance Audit Explorer</h2>
      </div>

      <GovernanceNav active="/dashboard/ai/audit" />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Ledger logs */}
        <div 
          className="xl:col-span-2 p-6 rounded-xl border backdrop-blur-md"
          style={{ 
            backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
            borderColor: THEME_TOKENS.colors.background.borderGlass 
          }}
        >
          <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#d4af37]" />
            Audited Configuration Actions
          </h3>

          <div className="space-y-4">
            {audits.map((a) => (
              <div 
                key={a.id}
                onClick={() => setSelectedAudit(a)}
                className="p-4 rounded border transition-all cursor-pointer hover:bg-black/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                style={{ 
                  borderColor: selectedAudit.id === a.id ? THEME_TOKENS.colors.brand.goldPremium : 'rgba(212,175,55,0.1)'
                }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{a.action}</span>
                    <span className="text-[10px] text-gray-500">{a.timestamp}</span>
                  </div>
                  <div className="text-xs text-gray-400 font-light mt-1">
                    Resource: <b style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>{a.resource}</b>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <User className="w-4 h-4 text-gray-500" />
                    {a.actor.split(' ')[0]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Audit Details Inspector */}
        <div 
          className="p-6 rounded-xl border backdrop-blur-md h-fit space-y-4"
          style={{ 
            backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
            borderColor: THEME_TOKENS.colors.background.borderGlass 
          }}
        >
          <h3 className="text-lg font-bold flex items-center gap-2 text-[#d4af37]">
            <FileCode className="w-5 h-5" />
            Verification Ledger
          </h3>

          {selectedAudit ? (
            <div className="space-y-4 text-xs font-mono">
              <div>
                <span className="text-gray-500 block">Ledger Audit ID:</span>
                <span className="text-gray-300 font-bold">{selectedAudit.id}</span>
              </div>
              
              <div>
                <span className="text-gray-500 block">Previous State:</span>
                <pre className="p-3 bg-black/40 border border-gray-800 rounded text-gray-300 overflow-x-auto mt-1 max-h-36">
                  {JSON.stringify(selectedAudit.prev_state, null, 2)}
                </pre>
              </div>

              <div>
                <span className="text-gray-500 block">New Config State:</span>
                <pre className="p-3 bg-black/40 border border-gray-800 rounded text-gray-300 overflow-x-auto mt-1 max-h-36">
                  {JSON.stringify(selectedAudit.new_state, null, 2)}
                </pre>
              </div>

              <div className="pt-2 border-t border-gray-800/40">
                <span className="text-[#e5c158] font-bold block mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  SHA256 Evidence Hash
                </span>
                <span className="text-[10px] text-gray-400 break-all">{selectedAudit.hash}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 font-light">Select an audit item to inspect transaction properties.</p>
          )}
        </div>
      </div>
    </div>
  );
}
