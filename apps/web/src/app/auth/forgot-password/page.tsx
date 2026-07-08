'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
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
          <h2 className="text-3xl font-semibold tracking-tight">Key Recovery</h2>
          <p className="text-sm text-gray-400 font-light mt-1">Recover your password credentials</p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-gray-300">Corporate Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              Send Reset Link
            </button>
          </form>
        ) : (
          <div className="text-center py-6 space-y-4">
            <p className="text-sm font-light text-gray-300">
              An encryption key reset link has been dispatched to <span className="font-medium" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>{email}</span> if the account exists.
            </p>
            <a 
              href="/auth/signin" 
              className="inline-block px-6 py-2 border rounded text-xs transition-all hover:scale-105"
              style={{ borderColor: THEME_TOKENS.colors.brand.goldPremium, color: THEME_TOKENS.colors.brand.goldPremium }}
            >
              Return to Login
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
