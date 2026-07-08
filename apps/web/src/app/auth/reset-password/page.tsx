'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === confirmPassword) {
      setSuccess(true);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div 
        className="w-full max-w-md p-10 rounded-xl border backdrop-blur-md shadow-2xl z-10"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass,
          borderColor: THEME_TOKENS.colors.background.borderGlass
        }}
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold tracking-tight">Key Reset</h2>
          <p className="text-sm text-gray-400 font-light mt-1">Configure your new security credentials</p>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-gray-300">New Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded border text-sm text-white focus:outline-none focus:ring-1"
                style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(212,175,55,0.2)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-gray-300">Confirm Password</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded border text-sm text-white focus:outline-none focus:ring-1"
                style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(212,175,55,0.2)' }}
              />
            </div>

            <button 
              type="submit"
              className="w-full py-3 rounded font-medium transition-all duration-300 text-sm hover:scale-[1.02]"
              style={{
                backgroundColor: THEME_TOKENS.colors.brand.goldPremium,
                color: THEME_TOKENS.colors.neutral.grayDark
              }}
            >
              Update Credentials
            </button>
          </form>
        ) : (
          <div className="text-center py-6 space-y-4">
            <p className="text-sm font-light text-gray-300">
              Your security key has been successfully rotated and updated.
            </p>
            <a 
              href="/auth/signin" 
              className="inline-block px-6 py-2 border rounded text-xs transition-all hover:scale-105"
              style={{ borderColor: THEME_TOKENS.colors.brand.goldPremium, color: THEME_TOKENS.colors.brand.goldPremium }}
            >
              Sign In
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
