'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';

export default function ProfileSettingsPage() {
  const [firstName, setFirstName] = useState('Alexander');
  const [lastName, setLastName] = useState('Vanguard');
  const [email] = useState('alexander@hiremind.ai');

  const handleSave = (e: React.FormEvent) => {
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
        <div className="mb-8">
          <h2 className="text-3xl font-semibold tracking-tight">Identity Profile</h2>
          <p className="text-xs text-gray-400 font-light mt-1">Manage your administrator details</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-gray-300">First Name</label>
              <input 
                type="text" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 rounded border text-sm text-white focus:outline-none focus:ring-1"
                style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(212,175,55,0.2)' }}
              />
            </div>
            <div className="w-1/2">
              <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-gray-300">Last Name</label>
              <input 
                type="text" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 rounded border text-sm text-white focus:outline-none focus:ring-1"
                style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(212,175,55,0.2)' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-gray-300">Email Address (Read-only)</label>
            <input 
              type="email" 
              value={email}
              disabled
              className="w-full px-4 py-3 rounded border text-sm text-gray-400 cursor-not-allowed"
              style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderColor: 'rgba(212,175,55,0.1)' }}
            />
          </div>

          <button 
            type="submit"
            className="px-6 py-3 rounded font-medium text-sm transition-all hover:scale-105"
            style={{ backgroundColor: THEME_TOKENS.colors.brand.goldPremium, color: THEME_TOKENS.colors.neutral.grayDark }}
          >
            Save Profile Modifications
          </button>
        </form>
      </div>
    </div>
  );
}
