'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { THEME_TOKENS } from '@hiremind/ui';
import { useAuth } from '../context/AuthContext';

export default function WelcomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

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

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      {/* Background radial soft light grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.07),transparent_50%)] pointer-events-none" />

      <div 
        className="w-full max-w-3xl p-12 rounded-2xl border backdrop-blur-md shadow-2xl text-center z-10 transition-all duration-500 animate-cinematic-fade"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass,
          borderColor: THEME_TOKENS.colors.background.borderGlass
        }}
      >
        <div className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Executive Intelligence Center
        </div>
        
        <h1 
          className="text-5xl font-bold mb-6 tracking-tight"
          style={{ fontFamily: THEME_TOKENS.typography.fontFamily }}
        >
          Welcome to <span style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>HireMind AI</span>
        </h1>

        <p className="text-lg text-gray-300 max-w-xl mx-auto mb-10 leading-relaxed font-light">
          Experience the autonomous enterprise recruiting network. Orchestrate specialized intelligence agents to source, interview, evaluate, and rank candidate talent pools.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/auth/signin"
            className="px-8 py-3 rounded-lg font-medium transition-all duration-300 border hover:scale-105"
            style={{ 
              backgroundColor: THEME_TOKENS.colors.brand.goldPremium,
              borderColor: THEME_TOKENS.colors.brand.goldPremium,
              color: THEME_TOKENS.colors.neutral.grayDark
            }}
          >
            Authenticate Session
          </a>
          <a
            href="/auth/register"
            className="px-8 py-3 rounded-lg font-medium transition-all duration-300 border hover:scale-105"
            style={{ 
              borderColor: THEME_TOKENS.colors.brand.goldPremium,
              color: THEME_TOKENS.colors.brand.goldPremium,
              backgroundColor: 'transparent'
            }}
          >
            Register Workspace
          </a>
        </div>
      </div>
    </div>
  );
}
