'use client';

import React from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { ValidationNav } from '../ValidationNav';
import { Award, FileText, CheckCircle2 } from 'lucide-react';

export default function CertificationCenter() {
  const certifications = [
    { version: "v1.5.0-rc2", score: "98.5%", status: "Passed", hash: "9e107d9d...", date: "Just now" },
    { version: "v1.4.2-prod", score: "99.1%", status: "Passed", hash: "d41d8cd9...", date: "3 days ago" }
  ];

  return (
    <div 
      className="min-h-screen p-8 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Quality Certificate
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">Certification Center</h2>
      </div>

      <ValidationNav active="/dashboard/validation/certifications" />

      <div 
        className="p-6 rounded-xl border"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <h3 className="text-lg font-bold mb-4" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Issued Release Certificates
        </h3>
        <div className="space-y-4">
          {certifications.map((c, i) => (
            <div key={i} className="p-4 border rounded-xl border-gray-800 flex justify-between items-center bg-gray-900/5">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5" style={{ color: THEME_TOKENS.colors.brand.goldPremium }} />
                <div>
                  <div className="text-sm font-semibold">{c.version} Quality Certificate</div>
                  <p className="text-xs text-gray-400 mt-1">Overall score rating: {c.score} | Date: {c.date}</p>
                  <span className="text-[9px] text-gray-400 block mt-1">Certificate Sign: {c.hash}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-green-400/10 text-green-400 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {c.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
