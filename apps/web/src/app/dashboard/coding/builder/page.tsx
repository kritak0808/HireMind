'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';

export default function AssessmentBuilderPage() {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [cpuLimit, setCpuLimit] = useState(30);
  const [memLimit, setMemLimit] = useState(256);

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
            Interactive Task Architect
          </span>
          <h2 className="text-3xl font-bold mt-1">Design Coding Assessment</h2>
          <p className="text-xs text-gray-400 font-light mt-1">Deploy coding challenges mapping specific sandbox memory limits and runtime checks.</p>
        </div>

        <form onSubmit={handleBuild} className="space-y-6">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-gray-300">Challenge Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Design LRU Cache with O(1) ops"
              className="w-full px-4 py-3 rounded border text-sm text-white focus:outline-none focus:ring-1"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(212,175,55,0.2)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-gray-300">Problem Description</label>
            <textarea 
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              required
              placeholder="Provide clean markdown challenge descriptions here..."
              className="w-full h-32 px-4 py-3 rounded border text-sm text-white focus:outline-none focus:ring-1 resize-none"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(212,175,55,0.2)' }}
            />
          </div>

          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-gray-300">Timeout (Seconds)</label>
              <input 
                type="number" 
                value={cpuLimit}
                onChange={(e) => setCpuLimit(Number(e.target.value))}
                className="w-full px-4 py-3 rounded border text-sm text-white focus:outline-none focus:ring-1"
                style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(212,175,55,0.2)' }}
              />
            </div>
            <div className="w-1/2">
              <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-gray-300">Memory Limit (MB)</label>
              <input 
                type="number" 
                value={memLimit}
                onChange={(e) => setMemLimit(Number(e.target.value))}
                className="w-full px-4 py-3 rounded border text-sm text-white focus:outline-none focus:ring-1"
                style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(212,175,55,0.2)' }}
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-3 rounded font-medium text-sm transition-all hover:scale-[1.02]"
            style={{ backgroundColor: THEME_TOKENS.colors.brand.goldPremium, color: THEME_TOKENS.colors.neutral.grayDark }}
          >
            Deploy Code Challenge Template
          </button>
        </form>
      </div>
    </div>
  );
}
