'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { THEME_TOKENS } from '@hiremind/ui';

export default function RegisterPage() {
  const router = useRouter();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Client-side validations
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
          first_name: firstName,
          last_name: lastName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      setSuccess(true);
      
      // Auto redirect to signin page after 1.5 seconds
      setTimeout(() => {
        router.push('/auth/signin');
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
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
          <h2 className="text-3xl font-semibold tracking-tight">Register Account</h2>
          <p className="text-sm text-gray-400 font-light mt-1">Deploy your recruiter workspace</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded text-sm bg-red-950/40 border border-red-500/30 text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded text-sm bg-green-950/40 border border-green-500/30 text-green-200">
            Registration successful! Redirecting to sign in...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-gray-300">First Name</label>
              <input 
                type="text" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={loading || success}
                className="w-full px-4 py-3 rounded border text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-gold-premium transition-all disabled:opacity-50"
                style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(212,175,55,0.2)' }}
              />
            </div>
            <div className="w-1/2">
              <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-gray-300">Last Name</label>
              <input 
                type="text" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={loading || success}
                className="w-full px-4 py-3 rounded border text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-gold-premium transition-all disabled:opacity-50"
                style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(212,175,55,0.2)' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-gray-300">Corporate Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || success}
              className="w-full px-4 py-3 rounded border text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-gold-premium transition-all disabled:opacity-50"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(212,175,55,0.2)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-gray-300">Access Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading || success}
              className="w-full px-4 py-3 rounded border text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-gold-premium transition-all disabled:opacity-50"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(212,175,55,0.2)' }}
            />
          </div>

          <button 
            type="submit"
            disabled={loading || success}
            className="w-full py-3 mt-4 rounded font-medium transition-all duration-300 text-sm hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
            style={{
              backgroundColor: THEME_TOKENS.colors.brand.goldPremium,
              color: THEME_TOKENS.colors.neutral.grayDark
            }}
          >
            {loading ? (
              <span>Deploying...</span>
            ) : (
              <span>Create Credentials</span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs font-light text-gray-400">
          Already registered? <a href="/auth/signin" className="hover:underline font-normal" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>Authenticate session</a>
        </div>
      </div>
    </div>
  );
}
