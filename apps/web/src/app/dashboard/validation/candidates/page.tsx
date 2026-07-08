'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { ValidationNav } from '../ValidationNav';
import { FileText, Play, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function ReleaseCandidates() {
  const [approving, setApproving] = useState<string | null>(null);

  const candidates = [
    { id: "1", version: "v1.5.0-rc2", build: 1240, status: "pending", config: "e3b0c442...", date: "Just now" },
    { id: "2", version: "v1.5.0-rc1", build: 1239, status: "rejected", config: "cf83e135...", date: "2 hours ago" },
    { id: "3", version: "v1.4.2-prod", build: 1198, status: "passed", config: "d41d8cd9...", date: "3 days ago" }
  ];

  const handleSignoff = async (id: string) => {
    setApproving(id);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setApproving(null);
  };

  return (
    <div 
      className="min-h-screen p-8 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Release Cycle
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">Release Candidates & Approvals</h2>
      </div>

      <ValidationNav active="/dashboard/validation/candidates" />

      <div 
        className="p-6 rounded-xl border"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <h3 className="text-lg font-bold mb-4" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Release Candidate builds
        </h3>
        <div className="space-y-4">
          {candidates.map((rc, i) => (
            <div key={i} className="p-4 border rounded-xl border-gray-800 flex justify-between items-center bg-gray-900/5">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm font-semibold">{rc.version}</div>
                  <span className="text-xs text-gray-400">Build: #{rc.build} | Config SHA: {rc.config}</span>
                </div>
              </div>

              <div className="flex gap-4 items-center">
                <span 
                  className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded" 
                  style={{ 
                    backgroundColor: rc.status === 'passed' ? 'rgba(74,222,128,0.1)' : rc.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', 
                    color: rc.status === 'passed' ? '#4ade80' : rc.status === 'rejected' ? '#ef4444' : '#f59e0b' 
                  }}
                >
                  {rc.status}
                </span>
                {rc.status === 'pending' && (
                  <button 
                    onClick={() => handleSignoff(rc.id)}
                    disabled={approving !== null}
                    className="flex items-center gap-1 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105"
                    style={{ 
                      backgroundColor: THEME_TOKENS.colors.brand.goldPremium,
                      color: THEME_TOKENS.colors.neutral.grayDark
                    }}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {approving === rc.id ? "Signing..." : "Signoff"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
