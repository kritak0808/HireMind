'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';

export default function WorkflowsPage() {
  const [rules, setRules] = useState([
    { id: '1', event: 'resume.parsed', action: 'send_invitation', status: 'Active' },
    { id: '2', event: 'interview.completed', action: 'generate_recommendation', status: 'Active' },
  ]);
  const [newEvent, setNewEvent] = useState('');
  const [newAction, setNewAction] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setRules([
      ...rules,
      { id: String(rules.length + 1), event: newEvent, action: newAction, status: 'Active' }
    ]);
    setNewEvent('');
    setNewAction('');
  };

  return (
    <div 
      className="min-h-screen p-10 text-white flex flex-col md:flex-row gap-8 justify-center items-start"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      {/* Rules list */}
      <div 
        className="w-full md:w-1/2 p-8 rounded-xl border backdrop-blur-md"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <h3 className="text-xl font-medium mb-6">Automation Trigger Rules</h3>
        <div className="space-y-4">
          {rules.map((r) => (
            <div 
              key={r.id}
              className="flex justify-between items-center p-4 rounded border transition-all hover:bg-black/10 text-xs"
              style={{ borderColor: 'rgba(212,175,55,0.1)' }}
            >
              <div>
                <span className="text-gray-400">Trigger:</span>
                <span className="font-mono ml-2 text-yellow-400 font-semibold">{r.event}</span>
                <div className="mt-1">
                  <span className="text-gray-400">Action:</span>
                  <span className="font-mono ml-2 text-gray-200">{r.action}</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 font-bold font-mono">
                {r.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Deploy automation rules form */}
      <div 
        className="w-full md:w-1/2 p-8 rounded-xl border backdrop-blur-md"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <h3 className="text-xl font-medium mb-2">Deploy automation workflow</h3>
        <p className="text-xs text-gray-400 font-light mb-6">Automatically route candidate transitions based on matching event triggers.</p>

        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-gray-300">Trigger Event</label>
            <input 
              type="text" 
              value={newEvent}
              onChange={(e) => setNewEvent(e.target.value)}
              required
              placeholder="e.g. resume.validated"
              className="w-full px-4 py-3 rounded border text-sm text-white focus:outline-none focus:ring-1"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(212,175,55,0.2)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-gray-300">Action Command</label>
            <input 
              type="text" 
              value={newAction}
              onChange={(e) => setNewAction(e.target.value)}
              required
              placeholder="e.g. bulk_grading"
              className="w-full px-4 py-3 rounded border text-sm text-white focus:outline-none focus:ring-1"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(212,175,55,0.2)' }}
            />
          </div>

          <button 
            type="submit"
            className="w-full py-3 rounded font-medium text-sm transition-all hover:scale-[1.02]"
            style={{ backgroundColor: THEME_TOKENS.colors.brand.goldPremium, color: THEME_TOKENS.colors.neutral.grayDark }}
          >
            Deploy Automation Rule
          </button>
        </form>
      </div>
    </div>
  );
}
