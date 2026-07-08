'use client';

import React, { useState, useEffect } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import {
  CreditCard, Shield, Key, Eye, Clipboard, Cpu, Settings, Users, CheckCircle, AlertTriangle, Loader2
} from 'lucide-react';

interface Invoice {
  id: string;
  period: string;
  amount: string;
  status: string;
  seats: number;
}

interface Plan {
  name: string;
  price: string;
  seats: number;
  features: string[];
}

const PLANS: Plan[] = [
  { name: 'Starter', price: '$299/mo', seats: 5, features: ['ATS Core', '5 Seats limit', 'Resume Parsing'] },
  { name: 'Growth', price: '$999/mo', seats: 20, features: ['All Starter', '20 Seats limit', 'Interview AI', 'Webhooks'] },
  { name: 'Enterprise', price: 'Custom', seats: 100, features: ['All Growth', '100 Seats limit', 'Full AI Suite', 'SSO Configs', 'SLA Clocks'] },
];

export default function BillingCenter() {
  const gold = THEME_TOKENS.colors.brand.goldPremium;

  const [activePlan, setActivePlan] = useState('Enterprise');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [usage, setUsage] = useState<any>({
    ai_tokens_used: 0,
    ai_tokens_limit: 1,
    resume_parsing_count: 0,
    resume_parsing_limit: 1,
    active_seats_assigned: 0,
    active_seats_limit: 1,
    api_requests_count: 0,
    api_requests_limit: 1
  });

  const [inviteEmail, setInviteEmail] = useState('');
  const [apiKeyName, setApiKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [integrations, setIntegrations] = useState<any[]>([]);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const getToken = () => localStorage.getItem('hiremind_token') || '';
  const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`
  });

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    try {
      // 1. Fetch usage meters
      const usageRes = await fetch(`${apiUrl}/api/v1/saas/billing/meter`, { headers: headers() });
      if (usageRes.ok) {
        const usageData = await usageRes.json();
        setUsage(usageData);
      }

      // 2. Fetch marketplace connectors
      const marketRes = await fetch(`${apiUrl}/api/v1/saas/marketplace/catalog`, { headers: headers() });
      if (marketRes.ok) {
        const marketData = await marketRes.json();
        setIntegrations(marketData);
      }

      setInvoices([
        { id: 'INV-0041', period: 'Jun 2026', amount: '$4,800.00', status: 'paid', seats: 40 },
        { id: 'INV-0040', period: 'May 2026', amount: '$4,800.00', status: 'paid', seats: 40 },
        { id: 'INV-0039', period: 'Apr 2026', amount: '$3,600.00', status: 'paid', seats: 30 },
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpgradePlan = async (planName: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/saas/billing/subscriptions`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ plan_name: planName })
      });
      if (res.ok) {
        setActivePlan(planName);
        showToast(`Upgraded subscription tier to ${planName} successfully`, 'success');
        loadData();
      }
    } catch (err) {
      showToast('Subscription upgrade failed', 'error');
    }
  };

  const handleAssignSeat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    try {
      const res = await fetch(`${apiUrl}/api/v1/saas/billing/licensing/assign`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ user_email: inviteEmail, action: 'assign' })
      });
      if (res.ok) {
        setInviteEmail('');
        showToast(`Seat license successfully assigned to ${inviteEmail}`, 'success');
        loadData();
      }
    } catch (err) {
      showToast('Licensing allocation failed', 'error');
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyName) return;
    try {
      const res = await fetch(`${apiUrl}/api/v1/saas/developer/apikeys`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ name: apiKeyName, scopes: ['candidates.read', 'applications.write'] })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedKey(data.api_key);
        setApiKeyName('');
        showToast('API Key generated successfully', 'success');
      }
    } catch (err) {
      showToast('Key generation failed', 'error');
    }
  };

  const handleInstallConnector = async (connectorType: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/saas/marketplace/install`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ connector_type: connectorType, credentials_payload: {} })
      });
      if (res.ok) {
        showToast(`Connector ${connectorType} installed successfully`, 'success');
        loadData();
      }
    } catch (err) {
      showToast('Connector installation failed', 'error');
    }
  };

  return (
    <div className="min-h-screen p-8 text-white space-y-8" style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}>
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl text-sm font-medium transition-all ${toast.type === 'success' ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}`}>
          {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: gold }}>
          Enterprise SaaS Console
        </span>
        <h1 className="text-3xl font-bold tracking-tight mt-1">Control Center</h1>
        <p className="text-sm text-gray-500 mt-1">Manage billing levels, dynamic seats assignment, public API keys, and marketplace connectors.</p>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center">
          <Loader2 size={36} className="animate-spin text-yellow-500" style={{ color: gold }} />
        </div>
      ) : (
        <>
          {/* Subscription Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const isActive = plan.name.toLowerCase() === activePlan.toLowerCase();
              return (
                <div key={plan.name} className="p-6 rounded-2xl border flex flex-col justify-between gap-5 bg-white/[0.01]"
                  style={{ borderColor: isActive ? gold : 'rgba(255,255,255,0.06)' }}>
                  <div>
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-sm text-white">{plan.name} Tier</h3>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold border border-yellow-500/30 text-yellow-500" style={{ color: gold }}>
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-bold mt-2 font-mono" style={{ color: gold }}>{plan.price}</p>
                    <span className="text-[10px] text-gray-500 mt-0.5 block">Up to {plan.seats} seats allocation</span>

                    <ul className="mt-4 space-y-2 text-xs text-gray-400 font-light">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-1.5">
                          <CheckCircle size={11} className="text-green-500 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {!isActive && (
                    <button onClick={() => handleUpgradePlan(plan.name)} className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-white/[0.08] hover:border-white/20 transition-all">
                      Select Plan Upgrade
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Usage Metering Cockpit */}
          <div className="rounded-2xl border p-6 bg-white/[0.01] grid grid-cols-1 md:grid-cols-2 gap-8" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-6">
                <Cpu size={16} style={{ color: gold }} />
                Usage Metering Quotas
              </h3>

              <div className="space-y-4 text-xs font-mono">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500">AI Tokens Billing Credits</span>
                    <span>{usage.ai_tokens_used.toLocaleString()} / {usage.ai_tokens_limit.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500" style={{ width: `${(usage.ai_tokens_used / usage.ai_tokens_limit) * 100}%`, backgroundColor: gold }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500">Resume Parsed Limit</span>
                    <span>{usage.resume_parsing_count} / {usage.resume_parsing_limit}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500" style={{ width: `${(usage.resume_parsing_count / usage.resume_parsing_limit) * 100}%`, backgroundColor: gold }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500">API Gateway Requests</span>
                    <span>{usage.api_requests_count.toLocaleString()} / {usage.api_requests_limit.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500" style={{ width: `${(usage.api_requests_count / usage.api_requests_limit) * 100}%`, backgroundColor: gold }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Seat assignments console */}
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-6">
                <Users size={16} style={{ color: gold }} />
                Seat Assignments licensing
              </h3>
              <p className="text-xs text-gray-500 mb-4 leading-normal">Assign, transfer, or recover active recruiter seating licenses to control roles permissions allocation.</p>

              <form onSubmit={handleAssignSeat} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter email to assign seat..."
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="px-3.5 py-2 text-xs bg-black/40 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-yellow-500/50 flex-grow"
                />
                <button type="submit" className="px-4 py-2 rounded-lg text-xs font-bold text-black" style={{ backgroundColor: gold }}>
                  Assign Seat
                </button>
              </form>
            </div>
          </div>

          {/* Dev Center (API keys generation) */}
          <div className="rounded-2xl border p-6 bg-white/[0.01]" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-6">
              <Key size={16} style={{ color: gold }} />
              Developer API Keys Configuration
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs">
              <div>
                <form onSubmit={handleCreateApiKey} className="space-y-4">
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Key Name Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. CI Production Pipeline Sync"
                      value={apiKeyName}
                      onChange={(e) => setApiKeyName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 text-xs bg-black/40 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-yellow-500/50"
                    />
                  </div>
                  <button type="submit" className="px-4 py-2 rounded-lg text-xs font-bold text-black" style={{ backgroundColor: gold }}>
                    Generate Live Key
                  </button>
                </form>

                {generatedKey && (
                  <div className="mt-4 p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/[0.02]">
                    <span className="text-[9px] text-yellow-500 font-bold block uppercase tracking-wider">Secret Key Generated</span>
                    <p className="mt-1 font-mono text-xs text-white truncate">{generatedKey}</p>
                    <span className="text-[9px] text-gray-600 block mt-1">Copy this key. It will not be shown again.</span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-[10px] text-gray-500 block mb-2 font-bold uppercase tracking-wider">REST API Integration example</span>
                <pre className="p-4 rounded-xl border border-gray-800 bg-black/40 font-mono text-[10px] leading-relaxed text-gray-300 overflow-x-auto">
{`curl -H 'Authorization: Bearer hm_live_...' \\
  https://api.hiremind.ai/v1/search/candidates`}
                </pre>
              </div>
            </div>
          </div>

          {/* Integrations Marketplace */}
          <div className="rounded-2xl border p-6 bg-white/[0.01]" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-6">
              <Settings size={16} style={{ color: gold }} />
              Connector Integrations Marketplace
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {integrations.map((item) => (
                <div key={item.connector_type} className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] flex justify-between items-center gap-4 text-xs">
                  <div>
                    <h4 className="font-bold text-white text-sm">{item.name}</h4>
                    <span className="text-[9px] text-yellow-500 uppercase font-bold tracking-wider" style={{ color: gold }}>{item.category}</span>
                    <p className="text-gray-500 mt-1 font-light leading-normal">{item.description}</p>
                  </div>

                  {item.is_installed ? (
                    <span className="px-3 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 font-semibold shrink-0">
                      Connected
                    </span>
                  ) : (
                    <button onClick={() => handleInstallConnector(item.connector_type)} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white font-semibold border border-white/10 shrink-0">
                      Connect
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
