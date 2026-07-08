'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';

const DELIVERIES = [
  { id: 'evt_01', endpoint: 'https://api.acme.com/hooks/hiremind', event: 'resume.uploaded', status: 200, ts: '2026-07-01T04:18:00Z', duration: '42ms' },
  { id: 'evt_02', endpoint: 'https://api.acme.com/hooks/hiremind', event: 'interview.completed', status: 200, ts: '2026-07-01T03:55:12Z', duration: '38ms' },
  { id: 'evt_03', endpoint: 'https://api.beta.corp/hooks', event: 'offer.accepted', status: 503, ts: '2026-07-01T03:12:44Z', duration: '5002ms' },
  { id: 'evt_04', endpoint: 'https://api.beta.corp/hooks', event: 'offer.accepted', status: 200, ts: '2026-07-01T03:13:14Z', duration: '61ms' },
];

const ENDPOINTS = [
  { url: 'https://api.acme.com/hooks/hiremind', events: ['resume.*', 'interview.*'], active: true },
  { url: 'https://api.beta.corp/hooks', events: ['offer.*'], active: true },
];

export default function WebhookConsolePage() {
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState('');

  return (
    <div
      className="min-h-screen p-10 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-8">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Event Subscriptions & Delivery Audit
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">Webhook Console</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Delivery Timeline */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4">Delivery Timeline</h3>
          <div
            className="rounded-xl border backdrop-blur-md overflow-hidden"
            style={{ backgroundColor: THEME_TOKENS.colors.background.panelGlass, borderColor: THEME_TOKENS.colors.background.borderGlass }}
          >
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-xs font-semibold uppercase tracking-wider text-gray-400"
                  style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                  <th className="p-4">Event</th>
                  <th className="p-4">Endpoint</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {DELIVERIES.map((d) => (
                  <tr key={d.id} className="hover:bg-black/10 transition-all text-xs">
                    <td className="p-4 font-mono text-gray-300">{d.event}</td>
                    <td className="p-4 text-gray-500 truncate max-w-[160px]">{d.endpoint}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded font-bold font-mono border text-xs ${
                        d.status === 200
                          ? 'text-green-400 bg-green-500/5 border-green-500/20'
                          : 'text-red-400 bg-red-500/5 border-red-500/20'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono text-gray-400">{d.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Register Endpoint + Active Endpoints */}
        <div className="flex flex-col gap-6">
          {/* Register */}
          <div
            className="p-6 rounded-xl border backdrop-blur-md"
            style={{ backgroundColor: THEME_TOKENS.colors.background.panelGlass, borderColor: THEME_TOKENS.colors.background.borderGlass }}
          >
            <h3 className="text-sm font-semibold mb-4">Register Endpoint</h3>
            <div className="space-y-3">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-server.com/hook"
                className="w-full px-3 py-2.5 rounded border text-xs text-white focus:outline-none"
                style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(212,175,55,0.2)' }}
              />
              <input
                value={events}
                onChange={(e) => setEvents(e.target.value)}
                placeholder="e.g. resume.*, interview.*"
                className="w-full px-3 py-2.5 rounded border text-xs text-white focus:outline-none"
                style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(212,175,55,0.2)' }}
              />
              <button
                className="w-full py-2.5 rounded text-xs font-semibold transition-all hover:scale-[1.02]"
                style={{ backgroundColor: THEME_TOKENS.colors.brand.goldPremium, color: THEME_TOKENS.colors.neutral.grayDark }}
              >
                Register
              </button>
            </div>
          </div>

          {/* Active Endpoints */}
          <div
            className="p-6 rounded-xl border backdrop-blur-md"
            style={{ backgroundColor: THEME_TOKENS.colors.background.panelGlass, borderColor: THEME_TOKENS.colors.background.borderGlass }}
          >
            <h3 className="text-sm font-semibold mb-4">Active Endpoints</h3>
            <div className="space-y-3">
              {ENDPOINTS.map((ep, idx) => (
                <div key={idx} className="p-3 rounded border border-gray-800 text-xs">
                  <p className="font-mono text-gray-300 truncate">{ep.url}</p>
                  <p className="text-gray-500 mt-1">{ep.events.join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
