'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';

export default function TalentPoolsPage() {
  const [pools, setPools] = useState([
    { id: '1', name: 'Principal Infrastructure Leads', count: 14, tags: ['Rust', 'Distributed Systems', 'K8s'] },
    { id: '2', name: 'AI Compilers Specialist', count: 8, tags: ['LLVM', 'Haskell', 'Triton'] },
    { id: '3', name: 'Dormant Candidates Rediscovery', count: 42, tags: ['React', 'TypeScript'] }
  ]);
  const [newPoolName, setNewPoolName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setPools([
      ...pools,
      { id: String(pools.length + 1), name: newPoolName, count: 0, tags: ['Custom Filter'] }
    ]);
    setNewPoolName('');
  };

  return (
    <div 
      className="min-h-screen p-10 text-white flex flex-col md:flex-row gap-8 justify-center items-start"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      {/* Pools List */}
      <div 
        className="w-full md:w-1/2 p-8 rounded-xl border backdrop-blur-md"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <h3 className="text-xl font-medium mb-6">Talent Segment Pools</h3>
        <div className="space-y-4">
          {pools.map((p) => (
            <div 
              key={p.id}
              className="flex justify-between items-center p-4 rounded border transition-all hover:bg-black/10"
              style={{ borderColor: 'rgba(212,175,55,0.1)' }}
            >
              <div>
                <h4 className="font-semibold text-sm">{p.name}</h4>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {p.tags.map((t, idx) => (
                    <span key={idx} className="text-[10px] border px-2 py-0.5 rounded font-light border-gray-800 bg-gray-900/50">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-sm font-mono font-bold" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
                {p.count} profiles
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Create Dynamic Smart Pool Form */}
      <div 
        className="w-full md:w-1/2 p-8 rounded-xl border backdrop-blur-md"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <h3 className="text-xl font-medium mb-2">Create Dynamic Smart Pool</h3>
        <p className="text-xs text-gray-400 font-light mb-6">Generate segments auto-assigning matching profiles.</p>

        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-gray-300">Pool Name</label>
            <input 
              type="text" 
              value={newPoolName}
              onChange={(e) => setNewPoolName(e.target.value)}
              required
              placeholder="e.g. CUDA Optimization Engineers"
              className="w-full px-4 py-3 rounded border text-sm text-white focus:outline-none focus:ring-1"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(212,175,55,0.2)' }}
            />
          </div>

          <button 
            type="submit"
            className="w-full py-3 rounded font-medium text-sm transition-all hover:scale-[1.02]"
            style={{ backgroundColor: THEME_TOKENS.colors.brand.goldPremium, color: THEME_TOKENS.colors.neutral.grayDark }}
          >
            Deploy Smart Segment
          </button>
        </form>
      </div>
    </div>
  );
}
