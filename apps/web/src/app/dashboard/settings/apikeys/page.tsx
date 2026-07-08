'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';

export default function ApiKeysSettingsPage() {
  const [keys, setKeys] = useState([
    { id: '1', name: 'ATS Synchronizer Key', prefix: 'hm_live_382a...', created: '2026-06-30' },
  ]);
  const [newKeyName, setNewKeyName] = useState('');

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const newKey = {
      id: String(keys.length + 1),
      name: newKeyName,
      prefix: 'hm_live_' + Math.random().toString(36).substring(7) + '...',
      created: new Date().toISOString().split('T')[0]
    };
    setKeys([...keys, newKey]);
    setNewKeyName('');
  };

  const handleRevoke = (id: string) => {
    setKeys(keys.filter(k => k.id !== id));
  };

  return (
    <div 
      className="min-h-screen p-10 text-white flex flex-col md:flex-row gap-8 justify-center items-start"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      {/* API Keys List */}
      <div 
        className="w-full md:w-1/2 p-8 rounded-xl border backdrop-blur-md"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass,
          borderColor: THEME_TOKENS.colors.background.borderGlass
        }}
      >
        <h3 className="text-xl font-medium mb-6">Active Integration API Keys</h3>
        <div className="space-y-4">
          {keys.map((k) => (
            <div 
              key={k.id}
              className="flex justify-between items-center p-4 rounded border transition-all hover:bg-black/10"
              style={{ borderColor: 'rgba(212,175,55,0.1)' }}
            >
              <div>
                <h4 className="font-medium text-sm">{k.name}</h4>
                <code className="text-xs font-mono text-gray-300 mt-1 block" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
                  {k.prefix}
                </code>
              </div>
              <button 
                onClick={() => handleRevoke(k.id)}
                className="px-4 py-2 border rounded text-xs transition-all border-red-500/20 text-red-400 hover:bg-red-500/10"
              >
                Revoke Key
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Generate API Key Form */}
      <div 
        className="w-full md:w-1/2 p-8 rounded-xl border backdrop-blur-md"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass,
          borderColor: THEME_TOKENS.colors.background.borderGlass
        }}
      >
        <h3 className="text-xl font-medium mb-2">Create API Integration Token</h3>
        <p className="text-xs text-gray-400 font-light mb-6">Generate credentials for ATS pipeline automation.</p>

        <form onSubmit={handleGenerate} className="space-y-6">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-gray-300">Token Description</label>
            <input 
              type="text" 
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              required
              placeholder="e.g. Jenkins Deploy Agent"
              className="w-full px-4 py-3 rounded border text-sm text-white focus:outline-none focus:ring-1"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(212,175,55,0.2)' }}
            />
          </div>

          <button 
            type="submit"
            className="w-full py-3 rounded font-medium text-sm transition-all hover:scale-[1.02]"
            style={{ backgroundColor: THEME_TOKENS.colors.brand.goldPremium, color: THEME_TOKENS.colors.neutral.grayDark }}
          >
            Generate Key Payload
          </button>
        </form>
      </div>
    </div>
  );
}
