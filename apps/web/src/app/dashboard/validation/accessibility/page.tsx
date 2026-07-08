'use client';

import React from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { ValidationNav } from '../ValidationNav';
import { Users, Eye, CheckCircle } from 'lucide-react';

export default function AccessibilityCenter() {
  const checklists = [
    { rule: "Focus Ring visibility on inputs", target: "Forms & Controls", score: "Passed", details: "All interactive input tags define active outline state focus indicators." },
    { rule: "ARIA Landmarks on sidebar sections", target: "Main Application Layout", score: "Passed", details: "Correct HTML5 semantic components used (aside, nav, main, header)." },
    { rule: "Contrast ratios >= 4.5:1", target: "EIC Theme Colors palette", score: "Passed", details: "Validated background deepMatte color contrast ratios on text links." },
    { rule: "Keyboard navigability loops", target: "Dropdown navigation menu", score: "Passed", details: "Focus flows sequentially without trapping focus tags." }
  ];

  return (
    <div 
      className="min-h-screen p-8 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          UI Validation
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">Accessibility Audit Center</h2>
      </div>

      <ValidationNav active="/dashboard/validation/accessibility" />

      <div 
        className="p-6 rounded-xl border"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <h3 className="text-lg font-bold mb-4" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          WCAG 2.2 Compliance Checklist
        </h3>
        <div className="space-y-4">
          {checklists.map((chk, i) => (
            <div key={i} className="p-4 border rounded-xl border-gray-800 flex justify-between items-center transition-all hover:bg-gray-800/10">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-sm font-semibold">{chk.rule}</div>
                  <p className="text-xs text-gray-400 mt-1">{chk.details}</p>
                  <span className="text-[9px] uppercase tracking-wider text-gray-400">Target Area: {chk.target}</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-green-400/10 text-green-400 uppercase tracking-wider">
                  {chk.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
