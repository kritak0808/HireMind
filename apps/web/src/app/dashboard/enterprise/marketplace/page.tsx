'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';

const CATALOG = [
  { id: 'hris-bamboohr', name: 'BambooHR HRIS', category: 'HRIS', description: 'Sync employee lifecycle events from BambooHR.', installed: true, version: '2.1.0' },
  { id: 'calendar-gcal', name: 'Google Calendar', category: 'Calendar', description: 'Schedule interviews directly in Google Calendar.', installed: false, version: '1.4.0' },
  { id: 'slack-notif', name: 'Slack Notifications', category: 'Messaging', description: 'Post pipeline updates and alerts to Slack channels.', installed: true, version: '3.0.1' },
  { id: 'github-assess', name: 'GitHub Assessments', category: 'Code', description: 'Fetch GitHub activity and language stats for candidates.', installed: false, version: '1.0.0' },
  { id: 'outlook-cal', name: 'Microsoft Outlook', category: 'Calendar', description: 'Sync interview invites with Outlook calendars.', installed: false, version: '2.0.0' },
  { id: 'teams-notif', name: 'Microsoft Teams', category: 'Messaging', description: 'Post hiring updates and approvals to Teams channels.', installed: false, version: '1.2.0' },
];

export default function MarketplacePage() {
  const [catalog, setCatalog] = useState(CATALOG);
  const [filter, setFilter] = useState('All');
  const categories = ['All', 'HRIS', 'Calendar', 'Messaging', 'Code'];

  const handleToggle = (id: string) => {
    setCatalog(catalog.map(c => c.id === id ? { ...c, installed: !c.installed } : c));
  };

  const displayed = filter === 'All' ? catalog : catalog.filter(c => c.category === filter);

  return (
    <div
      className="min-h-screen p-10 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-8">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Integration Catalog & Plugin Registry
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">Marketplace</h2>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filter === cat ? 'text-black' : 'text-gray-400 border-gray-700 hover:border-gray-500'
            }`}
            style={filter === cat
              ? { backgroundColor: THEME_TOKENS.colors.brand.goldPremium, borderColor: THEME_TOKENS.colors.brand.goldPremium }
              : {}}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayed.map((pkg) => (
          <div
            key={pkg.id}
            className="p-6 rounded-xl border backdrop-blur-md flex flex-col gap-4 transition-all hover:scale-[1.01]"
            style={{
              backgroundColor: THEME_TOKENS.colors.background.panelGlass,
              borderColor: pkg.installed ? 'rgba(212,175,55,0.2)' : THEME_TOKENS.colors.background.borderGlass
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-100">{pkg.name}</p>
                <p className="text-[10px] font-mono text-gray-500 mt-0.5">v{pkg.version} · {pkg.category}</p>
              </div>
              {pkg.installed && (
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border text-green-400 border-green-500/30 bg-green-500/5">
                  Installed
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 font-light leading-relaxed flex-grow">{pkg.description}</p>
            <button
              onClick={() => handleToggle(pkg.id)}
              className="w-full py-2.5 rounded text-xs font-semibold transition-all hover:scale-[1.02]"
              style={pkg.installed
                ? { backgroundColor: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }
                : { backgroundColor: THEME_TOKENS.colors.brand.goldPremium, color: THEME_TOKENS.colors.neutral.grayDark }}
            >
              {pkg.installed ? 'Uninstall' : 'Install'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
