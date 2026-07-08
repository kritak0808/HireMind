'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';

export default function SecuritySettingsPage() {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [sessions, setSessions] = useState([
    { id: '1', device: 'Chrome / macOS (Vanguard Laptop)', ip: '192.168.1.45', current: true },
    { id: '2', device: 'Safari / iPhone 15 Pro', ip: '172.56.21.90', current: false },
  ]);

  const handleRevoke = (sessionId: string) => {
    setSessions(sessions.filter(s => s.id !== sessionId));
  };

  return (
    <div 
      className="min-h-screen p-10 text-white flex flex-col gap-8 items-center justify-start"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div 
        className="w-full max-w-3xl p-10 rounded-xl border backdrop-blur-md"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass,
          borderColor: THEME_TOKENS.colors.background.borderGlass
        }}
      >
        <div className="mb-8">
          <h2 className="text-3xl font-semibold tracking-tight">Security Configurations</h2>
          <p className="text-xs text-gray-400 font-light mt-1">Manage passwords, authentication devices, and active key sessions</p>
        </div>

        {/* 1. Multi-Factor Authentication (MFA) config */}
        <div className="pb-8 border-b border-gray-800">
          <h3 className="text-lg font-medium mb-2">Two-Factor Authentication (TOTP)</h3>
          <p className="text-xs text-gray-400 font-light mb-4">Secure your identity token using dynamic authenticator codes.</p>
          
          <div className="flex items-center justify-between p-4 rounded border" style={{ borderColor: 'rgba(212,175,55,0.1)' }}>
            <div>
              <span className="text-sm font-medium">TOTP Authenticator Application</span>
              <p className="text-xs text-gray-400 font-light mt-1">Google Authenticator, Authy, or 1Password</p>
            </div>
            <button 
              onClick={() => setMfaEnabled(!mfaEnabled)}
              className="px-6 py-2 rounded text-xs font-semibold tracking-wider uppercase transition-all hover:scale-105"
              style={{
                backgroundColor: mfaEnabled ? '#ff4d4d' : THEME_TOKENS.colors.brand.goldPremium,
                color: mfaEnabled ? '#fff' : THEME_TOKENS.colors.neutral.grayDark
              }}
            >
              {mfaEnabled ? "Disable MFA" : "Enroll TOTP"}
            </button>
          </div>
        </div>

        {/* 2. Active Session Management */}
        <div className="pt-8">
          <h3 className="text-lg font-medium mb-2">Active Administrator Sessions</h3>
          <p className="text-xs text-gray-400 font-light mb-4">Track and terminate active sessions accessing your account.</p>

          <div className="space-y-4">
            {sessions.map((s) => (
              <div 
                key={s.id}
                className="flex justify-between items-center p-4 rounded border transition-all hover:bg-black/10"
                style={{ borderColor: 'rgba(212,175,55,0.1)' }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{s.device}</span>
                    {s.current && (
                      <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded" style={{ backgroundColor: `${THEME_TOKENS.colors.brand.goldPremium}20`, color: THEME_TOKENS.colors.brand.goldPremium }}>
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-light mt-1">IP: {s.ip}</p>
                </div>
                {!s.current && (
                  <button 
                    onClick={() => handleRevoke(s.id)}
                    className="px-4 py-2 border rounded text-xs transition-all hover:scale-105 border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    Revoke Key
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
