'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState([
    { id: '1', type: 'Offer Letter Release', candidate: "Albert Einstein", detail: "Generate offer: $180,000 base salary, Senior Physics Lead" },
    { id: '2', type: 'Rejection Email Release', candidate: "Werner Heisenberg", detail: "Send rejection feedback: Lacks Go microservices experience" }
  ]);

  const handleApprove = (id: string) => {
    setApprovals(approvals.filter(a => a.id !== id));
  };

  return (
    <div 
      className="min-h-screen p-10 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-10">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          External Communications Release Checks
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">Approval Queue</h2>
      </div>

      <div 
        className="rounded-xl border backdrop-blur-md overflow-hidden max-w-5xl"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-xs font-semibold uppercase tracking-wider text-gray-400" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <th className="p-4">Approval Action Type</th>
              <th className="p-4">Candidate Details</th>
              <th className="p-4">Generated draft parameters</th>
              <th className="p-4 text-right">Confirm release</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/40">
            {approvals.map((a) => (
              <tr key={a.id} className="transition-all hover:bg-black/10 text-xs">
                <td className="p-4 font-semibold text-gray-200">{a.type}</td>
                <td className="p-4 text-yellow-400 font-semibold">{a.candidate}</td>
                <td className="p-4 text-gray-400 font-light max-w-xs truncate">{a.detail}</td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => handleApprove(a.id)}
                    className="px-4 py-2 rounded text-xs font-medium transition-all hover:scale-105"
                    style={{ backgroundColor: THEME_TOKENS.colors.brand.goldPremium, color: THEME_TOKENS.colors.neutral.grayDark }}
                  >
                    Release Communication
                  </button>
                </td>
              </tr>
            ))}
            {approvals.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-400 font-light">
                  No pending draft release tasks inside approvals queue.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
