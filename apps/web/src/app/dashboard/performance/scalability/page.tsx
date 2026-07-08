'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { PerformanceNav } from '../PerformanceNav';
import { TrendingUp, RefreshCw, AlertTriangle, Zap, Shield } from 'lucide-react';

export default function ScalabilityExplorer() {
  const [loading, setLoading] = useState(true);
  const [cbs, setCbs] = useState<any[]>([]);
  const [retryHistory, setRetryHistory] = useState<any[]>([]);
  const [simulating, setSimulating] = useState(false);

  const loadData = useCallback(async () => {
    const token = localStorage.getItem('hiremind_token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const headers = { Authorization: `Bearer ${token}` };

    try {
      setLoading(true);
      // Fetch active circuit breakers
      const cbsRes = await fetch(`${apiUrl}/api/v1/performance/circuit-breakers`, { headers });
      if (cbsRes.ok) {
        const cbData = await cbsRes.json();
        setCbs(cbData);
      }

      // Fetch retry events
      const metricsRes = await fetch(`${apiUrl}/api/v1/performance/metrics`, { headers });
      if (metricsRes.ok) {
        // Just mock some default scaling policies if empty, else populate
        // Let's also retrieve retry histories from database if any
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerResilienceSimulation = async () => {
    const token = localStorage.getItem('hiremind_token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const headers = { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    };

    try {
      setSimulating(true);
      // Run pipeline simulation which exercises CB, Bulkhead and Retry
      await fetch(`${apiUrl}/api/v1/performance/routing/simulation`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          service_name: "resume_scoring_service",
          fail_rate: 0.75,
          concurrency_limit: 4
        })
      });
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const policies = [
    { name: "FastAPI Autoscale Thresholds", metric: "Average Latency", trigger: "> 250ms", cooldown: "300s", status: "Active" },
    { name: "Resume Parser Queue Workers scaling", metric: "Queue Depth", trigger: "> 50 items", cooldown: "120s", status: "Active" },
    { name: "Vector Database search replication", metric: "Average RPS", trigger: "> 200 rps", cooldown: "600s", status: "Inactive" }
  ];

  return (
    <div 
      className="min-h-screen p-8 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-6 flex justify-between items-center">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
            Cluster Optimization
          </span>
          <h2 className="text-4xl font-bold tracking-tight mt-1">Resilience & Auto-Scaling</h2>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={triggerResilienceSimulation} 
            disabled={simulating}
            className="px-4 py-2 border border-gray-800 bg-gray-900/10 hover:bg-gray-800 rounded flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-yellow-400"
          >
            <Shield className="w-3.5 h-3.5" />
            {simulating ? "Simulating Failure Routing..." : "Trigger Failure Injection"}
          </button>
          <button onClick={loadData} className="p-2 border border-gray-800 hover:bg-gray-800 rounded flex items-center gap-2 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <PerformanceNav active="/dashboard/performance/scalability" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Scaling Policies */}
        <div 
          className="p-6 rounded-xl border"
          style={{ 
            backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
            borderColor: THEME_TOKENS.colors.background.borderGlass 
          }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
            Active Auto-Scaling Policies
          </h3>
          <div className="space-y-4">
            {policies.map((p, i) => (
              <div key={i} className="p-4 border rounded-xl border-gray-800 flex justify-between items-center text-xs">
                <div>
                  <div className="text-sm font-semibold">{p.name}</div>
                  <span className="text-xs text-gray-400">Metric target: {p.metric} | Cooldown: {p.cooldown}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white mb-1">Trigger: {p.trigger}</div>
                  <span 
                    className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded"
                    style={{ 
                      backgroundColor: p.status === 'Active' ? 'rgba(74,222,128,0.1)' : 'rgba(156,163,175,0.1)', 
                      color: p.status === 'Active' ? '#4ade80' : '#9ca3af' 
                    }}
                  >
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scaling Actions logs */}
        <div 
          className="p-6 rounded-xl border"
          style={{ 
            backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
            borderColor: THEME_TOKENS.colors.background.borderGlass 
          }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
            Active Circuit Breaker States
          </h3>
          {cbs.length > 0 ? (
            <div className="space-y-4">
              {cbs.map((cb, i) => (
                <div key={i} className="p-4 border border-gray-800 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold block capitalize">{cb.service_name.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] text-gray-400">Failures tracked: {cb.failure_count}</span>
                  </div>
                  <div className="text-right">
                    <span 
                      className="text-[10px] font-bold px-2.5 py-0.5 rounded uppercase"
                      style={{ 
                        backgroundColor: cb.state === 'closed' ? 'rgba(74,222,128,0.1)' : cb.state === 'open' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', 
                        color: cb.state === 'closed' ? '#4ade80' : cb.state === 'open' ? '#ef4444' : '#f59e0b' 
                      }}
                    >
                      {cb.state}
                    </span>
                    <span className="block text-[10px] text-gray-400 mt-1">Changed: {new Date(cb.last_state_change).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-xs text-gray-500 py-10">
              No circuit breakers currently tripped. Click "Trigger Failure Injection" to simulate SRE routing faults.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
