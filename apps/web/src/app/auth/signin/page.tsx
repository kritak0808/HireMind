'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { THEME_TOKENS } from '@hiremind/ui';
import { useAuth } from '../../context/AuthContext';

export default function SignInPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      // Log in and save session info in context & storage
      await login(data.access_token);

    } catch (err: any) {
      setError(err.message || 'Invalid credentials or connection issue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6 text-white animate-fade-in"
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
          <h2 className="text-3xl font-semibold tracking-tight">Access Command</h2>
          <p className="text-sm text-gray-400 font-light mt-1">Authenticate your enterprise credentials</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded text-sm bg-red-950/40 border border-red-500/30 text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-gray-300">Corporate Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-3 rounded border text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-gold-premium transition-all disabled:opacity-50"
              style={{
                backgroundColor: 'rgba(0,0,0,0.4)',
                borderColor: 'rgba(212,175,55,0.2)',
              }}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-medium uppercase tracking-wider text-gray-300">Access Password</label>
              <a href="/auth/forgot-password" className="text-xs hover:underline" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>Recover key?</a>
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-3 rounded border text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-gold-premium transition-all disabled:opacity-50"
              style={{
                backgroundColor: 'rgba(0,0,0,0.4)',
                borderColor: 'rgba(212,175,55,0.2)',
              }}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded font-medium transition-all duration-300 text-sm hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
            style={{
              backgroundColor: THEME_TOKENS.colors.brand.goldPremium,
              color: THEME_TOKENS.colors.neutral.grayDark
            }}
          >
            {loading ? <span>Authenticating...</span> : <span>Authenticate Credentials</span>}
          </button>
        </form>

        <div className="mt-8 text-center text-xs font-light text-gray-400">
          First time? <a href="/auth/register" className="hover:underline font-normal" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>Register a workspace</a>
        </div>
      </div>
    </div>
  );
}
