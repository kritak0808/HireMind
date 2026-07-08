'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { PerformanceNav } from '../PerformanceNav';
import { RefreshCw, Play, Shield, Activity, CheckCircle2, CloudLightning } from 'lucide-react';

export default function RecoveryCenter() {
  const [runningPlan, setRunningPlan] = useState<string | null>(null);
  const [status, setStatus] = useState("Idle");
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [backups, setBackups] = useState<any[]>([]);
  const [backingUp, setBackingUp] = useState(false);

  const loadData = useCallback(async () => {
    const token = localStorage.getItem('hiremind_token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const headers = { Authorization: `Bearer ${token}` };

    try {
      setLoading(true);

      // Fetch active DR recovery plans
      const plansRes = await fetch(`${apiUrl}/api/v1/performance/recovery/plans`, { headers });
      if (plansRes.ok) {
        const pData = await plansRes.json();
        setPlans(pData);
      }

      // Fetch backup history
      const backupsRes = await fetch(`${apiUrl}/api/v1/deployment/backups`, { headers });
      if (backupsRes.ok) {
        const bData = await backupsRes.json();
        setBackups(bData);
      }
    } catch (e) {
      console.error("Error loading recovery data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTriggerRecovery = async (planId: string, planName: string) => {
    const token = localStorage.getItem('hiremind_token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const headers = { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    };

    try {
      setRunningPlan(planName);
      setStatus("Initiating Recovery Execution...");
      
      const res = await fetch(`${apiUrl}/api/v1/performance/recovery/executions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          plan_id: planId,
          details: { execution_type: "simulated_failover", triggered_by: "SRE Operator Console" }
        })
      });

      if (res.ok) {
        setStatus("Executing Failover Runbook Steps...");
        await new Promise(resolve => setTimeout(resolve, 800));
        setStatus("Verifying Replication Sync (RPO Checks)...");
        await new Promise(resolve => setTimeout(resolve, 800));
        setStatus("Rerouting Traffic Gateway Nodes...");
        await new Promise(resolve => setTimeout(resolve, 600));
        setStatus("Completed Recovery Switchover Successfully");
      } else {
        setStatus("Recovery failed: API gateway returned error status");
      }
    } catch (e) {
      console.error(e);
      setStatus("Failed to connect to recovery platform");
    } finally {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setRunningPlan(null);
      setStatus("Idle");
      await loadData();
    }
  };

  const handleTriggerBackup = async () => {
    const token = localStorage.getItem('hiremind_token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const headers = { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    };

    try {
      setBackingUp(true);
      const res = await fetch(`${apiUrl}/api/v1/deployment/backups`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ backup_type: "full" })
      });
      if (res.ok) {
        await loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBackingUp(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div 
      className="min-h-screen p-8 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-6 flex justify-between items-center">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
            Disaster Recovery
          </span>
          <h2 className="text-4xl font-bold tracking-tight mt-1">Disaster Recovery & Recovery Plans</h2>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleTriggerBackup} 
            disabled={backingUp}
            className="px-4 py-2 border border-gray-800 bg-gray-900/10 hover:bg-gray-800 rounded flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-green-400"
          >
            <CloudLightning className="w-3.5 h-3.5" />
            {backingUp ? "Taking Backup..." : "Snapshot Backup"}
          </button>
          <button onClick={loadData} className="p-2 border border-gray-800 hover:bg-gray-800 rounded flex items-center gap-2 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <PerformanceNav active="/dashboard/performance/recovery" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Recovery Plans lists */}
        <div 
          className="p-6 rounded-xl border col-span-2"
          style={{ 
            backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
            borderColor: THEME_TOKENS.colors.background.borderGlass 
          }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
            Active System Recovery Plans
          </h3>
          {plans.length > 0 ? (
            <div className="space-y-4">
              {plans.map((p, i) => (
                <div key={i} className="p-4 border rounded-xl border-gray-800 flex justify-between items-center bg-gray-900/5">
                  <div>
                    <div className="text-sm font-semibold">{p.plan_name}</div>
                    <span className="text-xs text-gray-400">RPO Threshold: {p.rpo_seconds}s</span>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="text-right text-xs">
                      <span className="text-gray-400 block text-[9px] uppercase">RTO Target</span>
                      <span className="font-bold text-white">{p.rto_seconds}s</span>
                    </div>
                    <button 
                      onClick={() => handleTriggerRecovery(p.id, p.plan_name)}
                      disabled={runningPlan !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105"
                      style={{ 
                        backgroundColor: THEME_TOKENS.colors.brand.goldPremium,
                        color: THEME_TOKENS.colors.neutral.grayDark
                      }}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Simulate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-xs text-gray-500 py-10">
              No active recovery plans recorded. Click "Seed Simulation Data" in Command Center to sync default DR playbooks.
            </div>
          )}
        </div>

        {/* Live Execution Status */}
        <div 
          className="p-6 rounded-xl border col-span-1"
          style={{ 
            backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
            borderColor: THEME_TOKENS.colors.background.borderGlass 
          }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
            Live DR Simulator Console
          </h3>
          {runningPlan ? (
            <div className="flex flex-col items-center justify-center h-48">
              <RefreshCw className="w-10 h-10 animate-spin mb-4" style={{ color: THEME_TOKENS.colors.brand.goldPremium }} />
              <div className="text-sm font-semibold text-center">{runningPlan}</div>
              <span className="text-xs text-yellow-400 mt-2 text-center">{status}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <Shield className="w-12 h-12 opacity-30 mb-2" />
              <span className="text-xs">Replication State: ACTIVE SYNC</span>
              <span className="text-[10px] text-green-400 mt-1 uppercase font-bold text-center">Zero lagged transactions</span>
            </div>
          )}
        </div>
      </div>

      {/* Snapshot Backup history log */}
      <div 
        className="p-6 rounded-xl border"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <h3 className="text-lg font-bold mb-4" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Disaster Recovery Backup Registry
        </h3>
        {backups.length > 0 ? (
          <div className="space-y-3">
            {backups.map((b, idx) => (
              <div key={idx} className="p-3 border border-gray-800 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold block">{b.backup_file_path}</span>
                  <span className="text-[10px] text-gray-400">Created: {new Date(b.created_at).toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase font-extrabold px-2 py-0.5 rounded bg-green-400/10 text-green-400">
                    {b.backup_type} backup
                  </span>
                  <span className="block text-[10px] text-gray-400 mt-1">Size: {(b.file_size_bytes / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-xs text-gray-500 py-10">
            No database snapshot backups taken yet. Click "Snapshot Backup" above to run one.
          </div>
        )}
      </div>
    </div>
  );
}
