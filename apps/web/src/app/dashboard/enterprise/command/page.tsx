'use client';

import React from 'react';
import { THEME_TOKENS } from '@hiremind/ui';

const statusItems = [
  { label: 'API Gateway', status: 'Operational', latency: '14ms' },
  { label: 'Webhook Dispatcher', status: 'Operational', latency: '8ms' },
  { label: 'Integration Connectors', status: 'Degraded', latency: '420ms' },
  { label: 'Billing Engine', status: 'Operational', latency: '22ms' },
  { label: 'Feature Flag Service', status: 'Operational', latency: '3ms' },
  { label: 'Marketplace Registry', status: 'Operational', latency: '11ms' },
];

const licenseStats = [
  { label: 'Seats Allocated', value: '42 / 50', pct: 84 },
  { label: 'AI Credits Used', value: '8.2M / 10M', pct: 82 },
  { label: 'Storage Used', value: '1.4 TB / 2 TB', pct: 70 },
];

export default function EnterpriseCommandCenter() {
  return (
    <div
      className="min-h-screen p-10 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      {/* Header */}
      <div className="mb-10">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Enterprise Operations Platform
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">Enterprise Command Center</h2>
        <p className="text-sm text-gray-400 font-light mt-1">
          Real-time operational visibility across all enterprise platform services.
        </p>
      </div>

      {/* Operational Status Grid */}
      <div className="mb-10">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4">Platform Health</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statusItems.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl border backdrop-blur-md flex justify-between items-center transition-all hover:scale-[1.01]"
              style={{
                backgroundColor: THEME_TOKENS.colors.background.panelGlass,
                borderColor: THEME_TOKENS.colors.background.borderGlass
              }}
            >
              <div>
                <p className="text-sm font-semibold text-gray-200">{item.label}</p>
                <p className="text-xs text-gray-500 font-light mt-0.5">p95 latency: {item.latency}</p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded font-bold font-mono border ${
                  item.status === 'Operational'
                    ? 'text-green-400 bg-green-500/5 border-green-500/20'
                    : 'text-yellow-400 bg-yellow-500/5 border-yellow-500/20'
                }`}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* License Utilization */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4">License Utilization</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {licenseStats.map((stat, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl border backdrop-blur-md"
              style={{
                backgroundColor: THEME_TOKENS.colors.background.panelGlass,
                borderColor: THEME_TOKENS.colors.background.borderGlass
              }}
            >
              <p className="text-xs uppercase tracking-wider text-gray-400 font-light mb-2">{stat.label}</p>
              <p className="text-2xl font-bold mb-3" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
                {stat.value}
              </p>
              <div className="w-full bg-gray-800 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${stat.pct}%`,
                    backgroundColor: stat.pct > 90
                      ? '#ef4444'
                      : THEME_TOKENS.colors.brand.goldPremium
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 font-light mt-1">{stat.pct}% utilized</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
