'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';

export default function ReportBuilderPage() {
  const [reportTitle, setReportTitle] = useState('');
  const [schedule, setSchedule] = useState('weekly');

  const handleBuild = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div 
      className="min-h-screen p-10 text-white flex justify-center items-start"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div 
        className="w-full max-w-2xl p-10 rounded-xl border backdrop-blur-md"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <div className="mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
            Automated PDF/CSV Exports coordinator
          </span>
          <h2 className="text-3xl font-bold mt-1">Configure Executive Report</h2>
          <p className="text-xs text-gray-400 font-light mt-1">Design report templates dynamically aggregating pipeline conversions and cost allocations.</p>
        </div>

        <form onSubmit={handleBuild} className="space-y-6">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-gray-300">Report Template Title</label>
            <input 
              type="text" 
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              required
              placeholder="e.g. Q3 Engineering recruitment velocity audit report"
              className="w-full px-4 py-3 rounded border text-sm text-white focus:outline-none focus:ring-1"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(212,175,55,0.2)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-gray-300">Dispatch Schedule Frequency</label>
            <select 
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="w-full px-4 py-3 rounded border text-sm text-white focus:outline-none focus:ring-1"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(212,175,55,0.2)' }}
            >
              <option value="weekly">Weekly digest summary</option>
              <option value="monthly">Monthly operational reviews</option>
              <option value="quarterly">Quarterly board summaries</option>
            </select>
          </div>

          <button 
            type="submit"
            className="w-full py-3 rounded font-medium text-sm transition-all hover:scale-[1.02]"
            style={{ backgroundColor: THEME_TOKENS.colors.brand.goldPremium, color: THEME_TOKENS.colors.neutral.grayDark }}
          >
            Deploy Scheduled Report template
          </button>
        </form>
      </div>
    </div>
  );
}
