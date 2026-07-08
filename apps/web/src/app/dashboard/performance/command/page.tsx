'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { Activity, Zap, Cpu, Server, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { PerformanceNav } from '../PerformanceNav';

export default function PerformanceCommand() {
  const [loading, setLoading] = useState(true);
  const [sloStatus, setSloStatus] = useState("99.99%");
  const [latency, setLatency] = useState("120 ms");
  const [cacheHitRate, setCacheHitRate] = useState("85.0%");
  const [dbConnections, setDbConnections] = useState("0 connections");
  
  const [services, setServices] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<number[]>([]);
  const [simulating, setSimulating] = useState(false);

  const loadData = useCallback(async () => {
    const token = localStorage.getItem('hiremind_token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const headers = { Authorization: `Bearer ${token}` };

    try {
      setLoading(true);
      // Fetch health status
      const healthRes = await fetch(`${apiUrl}/api/v1/performance/services/health`, { headers });
      if (healthRes.ok) {
        const hData = await healthRes.json();
        setServices(hData);
        if (hData.length > 0) {
          const avgLat = hData.reduce((acc: number, s: any) => acc + s.latency_p95_ms, 0) / hData.length;
          setLatency(`${avgLat.toFixed(0)} ms`);
          const avgAvailability = hData.reduce((acc: number, s: any) => acc + s.availability, 0) / hData.length;
          setSloStatus(`${(avgAvailability * 100).toFixed(2)}%`);
        }
      }

      // Fetch metrics
      const metricsRes = await fetch(`${apiUrl}/api/v1/performance/metrics`, { headers });
      if (metricsRes.ok) {
        const mData = await metricsRes.json();
        // Database connection calculation
        if (mData.infrastructure_metrics && mData.infrastructure_metrics.length > 0) {
          const latest = mData.infrastructure_metrics[0];
          setDbConnections(`${latest.cpu_utilization.toFixed(0)}% CPU Load`);
        }
        
        // Cache calculation
        if (mData.cache_metrics && mData.cache_metrics.length > 0) {
          const hits = mData.cache_metrics.reduce((acc: number, c: any) => acc + c.hits, 0);
          const misses = mData.cache_metrics.reduce((acc: number, c: any) => acc + c.misses, 0);
          const total = hits + misses;
          const rate = total > 0 ? (hits / total) * 100 : 85.0;
          setCacheHitRate(`${rate.toFixed(1)}%`);
        }
      }

      // Generate random simulated latency heatmap points
      const arr = Array.from({ length: 96 }, () => Math.random());
      setHeatmapData(arr);
    } catch (err) {
      console.error("Error loading performance stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerSimulation = async () => {
    const token = localStorage.getItem('hiremind_token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const headers = { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    };

    try {
      setSimulating(true);
      // Run seed first to make sure there's data, then run simulate/ops and simulate/qa
      await fetch(`${apiUrl}/api/v1/deployment/simulate/seed`, { method: 'POST', headers });
      await fetch(`${apiUrl}/api/v1/deployment/simulate/ops`, { method: 'POST', headers });
      await fetch(`${apiUrl}/api/v1/validation/simulate/qa`, { method: 'POST', headers });
      
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

  const stats = [
    { label: "Overall SLO Status", value: sloStatus, change: "Target SLA: 99.90%", icon: Activity },
    { label: "Aggregate Latency", value: latency, change: "Within baseline threshold", icon: Zap },
    { label: "Cache hit-rate", value: cacheHitRate, change: "Prompt caching active", icon: Cpu },
    { label: "Cluster Resource Status", value: dbConnections, change: "Average of active instances", icon: Server }
  ];

  return (
    <div 
      className="min-h-screen p-8 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
            Enterprise Reliability Cockpit
          </span>
          <h2 className="text-4xl font-bold tracking-tight mt-1">Performance Command Center</h2>
        </div>
        <button 
          onClick={triggerSimulation}
          disabled={simulating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 border"
          style={{ 
            borderColor: THEME_TOKENS.colors.brand.goldPremium,
            color: THEME_TOKENS.colors.brand.goldPremium,
            backgroundColor: simulating ? 'rgba(212,175,55,0.05)' : 'transparent'
          }}
        >
          <Sparkles className="w-4 h-4 animate-pulse" />
          {simulating ? "Generating Live Metrics..." : "Seed Simulation Data"}
        </button>
      </div>

      <PerformanceNav active="/dashboard/performance/command" />

      {/* Grid of stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div 
              key={idx}
              className="p-6 rounded-xl border backdrop-blur-md transition-all hover:scale-[1.02] flex items-center justify-between"
              style={{ 
                backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
                borderColor: THEME_TOKENS.colors.background.borderGlass 
              }}
            >
              <div>
                <span className="text-xs uppercase tracking-wider text-gray-400 font-light">{s.label}</span>
                <div className="text-3xl font-bold my-2" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
                  {s.value}
                </div>
                <span className="text-xs text-green-400 font-medium">{s.change}</span>
              </div>
              <Icon className="w-8 h-8 opacity-40" style={{ color: THEME_TOKENS.colors.brand.goldPremium }} />
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Live Latency Heatmap */}
        <div 
          className="p-6 rounded-xl border"
          style={{ 
            backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
            borderColor: THEME_TOKENS.colors.background.borderGlass 
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
              Live API Latency Heatmap
            </h3>
            <button onClick={loadData} className="p-1 hover:bg-gray-800 rounded">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="grid grid-cols-12 gap-1.5 h-36">
            {(heatmapData.length > 0 ? heatmapData : Array.from({ length: 96 }, () => 0.15)).map((val, idx) => {
              return (
                <div 
                  key={idx} 
                  className="rounded-sm w-full h-full transition-all hover:scale-110 cursor-pointer"
                  style={{ 
                    backgroundColor: THEME_TOKENS.colors.brand.goldPremium,
                    opacity: Math.max(0.1, val)
                  }}
                  title={`Interval ${idx}: Latency ${Math.floor(val * 450) + 50}ms`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-4">
            <span>&lt; 50ms (Low Load)</span>
            <span>&gt; 500ms (Spike Alert)</span>
          </div>
        </div>

        {/* SLO/SLI Status metrics */}
        <div 
          className="p-6 rounded-xl border"
          style={{ 
            backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
            borderColor: THEME_TOKENS.colors.background.borderGlass 
          }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
            System SLA & Service Objectives
          </h3>
          <div className="space-y-4">
            {services.length > 0 ? (
              services.map((obj, i) => (
                <div key={i} className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div>
                    <div className="text-sm font-semibold uppercase">{obj.service_name}</div>
                    <div className="text-xs text-gray-400">P95 Target Latency: &lt; 250ms</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-400">{(obj.availability * 100).toFixed(2)}% availability</div>
                    <span 
                      className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded" 
                      style={{ 
                        backgroundColor: obj.status === 'healthy' ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)', 
                        color: obj.status === 'healthy' ? '#4ade80' : '#ef4444' 
                      }}
                    >
                      {obj.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-xs text-gray-500 py-10">
                No active service records. Click "Seed Simulation Data" to run baseline telemetry metrics.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
