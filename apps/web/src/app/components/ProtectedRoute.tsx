'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { THEME_TOKENS } from '@hiremind/ui';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/welcome');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center text-white"
        style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
      >
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: THEME_TOKENS.colors.brand.goldPremium, borderTopColor: 'transparent' }} />
        </div>
        <p className="text-sm font-light uppercase tracking-widest animate-pulse" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Synchronizing Security Keys...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Return a styled redirecting view instead of raw null to avoid temporary black screens
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center text-white"
        style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
      >
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: THEME_TOKENS.colors.brand.goldPremium, borderTopColor: 'transparent' }} />
        </div>
        <p className="text-sm font-light uppercase tracking-widest animate-pulse" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Redirecting to Welcome...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
