'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';

export default function SimulatorPage() {
  const [recruiters, setRecruiters] = useState(2);
  const [throughput, setThroughput] = useState(15);
  const [timeToHireChange, setTimeToHireChange] = useState(0);

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate projecting output metrics change
    setTimeToHireChange(-4.2);
  };

  return (
    <div 
      className="min-h-screen p-10 text-white flex flex-col md:flex-row gap-8 justify-center items-start"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      {/* Parameter adjust sliders */}
      <div 
        className="w-full md:w-1/2 p-8 rounded-xl border backdrop-blur-md"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <h3 className="text-xl font-medium mb-2">Adjust what-if parameters</h3>
        <p className="text-xs text-gray-400 font-light mb-6">Modify resource allocations to simulate projected pipeline outcomes.</p>

        <form onSubmit={handleSimulate} className="space-y-6">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-gray-300">
              Add Recruiters Count: {recruiters}
            </label>
            <input 
              type="range" 
              min="1" 
              max="10"
              value={recruiters}
              onChange={(e) => setRecruiters(Number(e.target.value))}
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-gray-300">
              Throughput Improvement Target: {throughput}%
            </label>
            <input 
              type="range" 
              min="5" 
              max="50"
              value={throughput}
              onChange={(e) => setThroughput(Number(e.target.value))}
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-3.5 rounded-lg font-medium text-sm transition-all hover:scale-[1.02]"
            style={{ backgroundColor: THEME_TOKENS.colors.brand.goldPremium, color: THEME_TOKENS.colors.neutral.grayDark }}
          >
            Calculate Projected Outcomes
          </button>
        </form>
      </div>

      {/* Projected results */}
      <div 
        className="w-full md:w-1/2 p-8 rounded-xl border backdrop-blur-md flex flex-col justify-center items-center h-[348px]"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <h3 className="text-lg font-medium mb-6">Projected Pipeline Outcome</h3>
        <div className="text-center">
          <div className="text-5xl font-mono font-bold mb-2 text-green-400">
            {timeToHireChange ? `${timeToHireChange} days` : "0.0 days"}
          </div>
          <p className="text-xs text-gray-400 font-light max-w-xs leading-relaxed mx-auto">
            Adding resource units is projected to drop average pipeline durations.
          </p>
        </div>
      </div>
    </div>
  );
}
