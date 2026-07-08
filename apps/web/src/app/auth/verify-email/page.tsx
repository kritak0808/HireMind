'use client';

import React, { useState, useEffect } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';

export default function VerifyEmailPage() {
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Mimic token verification delay
    const timer = setTimeout(() => {
      setVerifying(false);
      setSuccess(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div 
        className="w-full max-w-md p-10 rounded-xl border backdrop-blur-md shadow-2xl z-10 text-center"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass,
          borderColor: THEME_TOKENS.colors.background.borderGlass
        }}
      >
        <div className="mb-6">
          <h2 className="text-3xl font-semibold tracking-tight">Key Activation</h2>
          <p className="text-sm text-gray-400 font-light mt-1">Verifying your invitation validation token</p>
        </div>

        {verifying ? (
          <div className="py-8 flex flex-col items-center gap-4">
            {/* Spinning Gold Indicator */}
            <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${THEME_TOKENS.colors.brand.goldPremium}1a`, borderTopColor: THEME_TOKENS.colors.brand.goldPremium }} />
            <p className="text-sm font-light text-gray-400">Verifying session signatures...</p>
          </div>
        ) : (
          <div className="py-6 space-y-6">
            <p className="text-sm font-light text-gray-300">
              {success 
                ? "Your email verification token was validated successfully. Your workspace context is active."
                : "The verification token has expired or is invalid."
              }
            </p>
            <a 
              href="/auth/signin" 
              className="inline-block px-8 py-3 rounded font-medium text-sm transition-all hover:scale-105"
              style={{ backgroundColor: THEME_TOKENS.colors.brand.goldPremium, color: THEME_TOKENS.colors.neutral.grayDark }}
            >
              Continue to Gateway
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
