'use client';

import React, { useState, useEffect } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import {
  Briefcase, CheckCircle, AlertTriangle, Loader2,
  Building, UserCheck, Plus, RefreshCw
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  role: string;
}

export default function OrganizationsPage() {
  const gold = THEME_TOKENS.colors.brand.goldPremium;

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrgName, setNewOrgName] = useState('');
  const [domainLock, setDomainLock] = useState('');
  const [provisioning, setProvisioning] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const getToken = () => localStorage.getItem('hiremind_token') || '';
  const headers = () => ({ Authorization: `Bearer ${getToken()}` });

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/organizations`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setOrgs(Array.isArray(data) ? data : []);
      }
    } catch {
      setOrgs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisioning(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/organizations`, {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newOrgName,
          domain_lock: domainLock || `${newOrgName.toLowerCase().replace(/\s+/g, '')}.com`
        })
      });
      if (res.ok) {
        showToast('Workspace provisioned successfully', 'success');
        setNewOrgName('');
        setDomainLock('');
        fetchOrganizations();
      } else {
        throw new Error();
      }
    } catch {
      showToast('Workspace onboarding failed', 'error');
    } finally {
      setProvisioning(false);
    }
  };

  const handleSwitch = async (orgId: string) => {
    setSwitching(orgId);
    try {
      const res = await fetch(`${apiUrl}/api/v1/organizations/switch/${orgId}`, {
        method: 'POST',
        headers: headers()
      });
      if (res.ok) {
        const data = await res.json();
        
        // 1. Update JWT token in local storage & cookie
        localStorage.setItem('hiremind_token', data.access_token);
        document.cookie = `hiremind_token=${data.access_token}; path=/; max-age=86400; SameSite=Lax`;
        
        // Update user tenant state in storage
        localStorage.setItem('hiremind_tenant', orgId);

        showToast('Switched context successfully', 'success');
        
        // 2. Reload page to trigger full context bootstrapping
        setTimeout(() => window.location.reload(), 800);
      } else {
        throw new Error();
      }
    } catch {
      showToast('Workspace switch context failed', 'error');
      setSwitching(null);
    }
  };

  const activeTenantId = localStorage.getItem('hiremind_tenant') || '';

  return (
    <div className="min-h-screen p-10 text-white flex flex-col md:flex-row gap-8 justify-center items-start"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}>
      
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl text-sm font-medium transition-all ${toast.type === 'success' ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}`}>
          {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Organizations Switcher List */}
      <div className="w-full md:w-1/2 p-8 rounded-2xl border bg-black/40"
        style={{ borderColor: THEME_TOKENS.colors.background.borderGlass }}>
        
        <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-3">
          <Building size={16} style={{ color: gold }} />
          <h3 className="text-xl font-medium">Active Enterprise Workspaces</h3>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="animate-spin text-yellow-500" style={{ color: gold }} />
          </div>
        ) : orgs.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No workspaces found for your user profile.</p>
        ) : (
          <div className="space-y-4">
            {orgs.map((org) => {
              const isActive = org.id === activeTenantId;
              return (
                <div key={org.id}
                  className={`flex justify-between items-center p-4 rounded-xl border transition-all hover:bg-white/[0.02] bg-white/[0.01] ${isActive ? 'border-yellow-500/30 bg-yellow-500/[0.02]' : 'border-gray-900'}`}>
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      {org.name}
                      {isActive && (
                        <span className="text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-yellow-500/10" style={{ color: gold }}>
                          Active
                        </span>
                      )}
                    </h4>
                    <span className="text-[10px] uppercase tracking-wider font-semibold font-mono" style={{ color: gold }}>
                      {org.role}
                    </span>
                  </div>
                  <button
                    disabled={switching !== null || isActive}
                    onClick={() => handleSwitch(org.id)}
                    className="px-4 py-2 border border-gray-800 rounded-lg text-xs hover:text-white hover:border-white/20 disabled:opacity-40 font-semibold"
                  >
                    {switching === org.id ? <Loader2 size={11} className="animate-spin" /> : 'Switch Context'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Onboarding creation form */}
      <div className="w-full md:w-1/2 p-8 rounded-2xl border bg-black/40"
        style={{ borderColor: THEME_TOKENS.colors.background.borderGlass }}>
        
        <div className="flex items-center gap-2 mb-2 border-b border-gray-800 pb-3">
          <Plus size={16} style={{ color: gold }} />
          <h3 className="text-xl font-medium">Onboard New Organization</h3>
        </div>
        <p className="text-xs text-gray-500 font-light mb-6">Provision a new dedicated tenant workspace environment</p>
        
        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-400">Organization Name *</label>
            <input 
              type="text" 
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              required
              placeholder="e.g. HireMind Corp"
              className="w-full px-4 py-3 rounded-xl border border-gray-800 text-xs text-white bg-transparent focus:outline-none focus:border-yellow-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-400">Domain Lock Lock (Optional)</label>
            <input 
              type="text" 
              value={domainLock}
              onChange={(e) => setDomainLock(e.target.value)}
              placeholder="e.g. hiremind.ai"
              className="w-full px-4 py-3 rounded-xl border border-gray-800 text-xs text-white bg-transparent focus:outline-none focus:border-yellow-500/50"
            />
          </div>

          <button 
            type="submit"
            disabled={provisioning || !newOrgName}
            className="w-full py-3 rounded-xl font-bold text-xs transition-all hover:scale-[1.02] disabled:opacity-40 bg-yellow-500 text-black flex items-center justify-center gap-1.5"
            style={{ backgroundColor: gold }}
          >
            {provisioning ? <Loader2 size={13} className="animate-spin" /> : null}
            DEPLOY WORKSPACE
          </button>
        </form>
      </div>
    </div>
  );
}
