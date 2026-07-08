'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { PerformanceNav } from '../PerformanceNav';
import { Server, Activity, Database, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export default function InfraHealth() {
  const [loading, setLoading] = useState(true);
  const [dbStats, setDbStats] = useState({
    active_connections: 18,
    idle_connections: 12,
    waiting_requests: 0,
    pool_size: 40,
    max_overflow: 10
  });

  const [nodes, setNodes] = useState<any[]>([]);
  const [dependencies, setDependencies] = useState<Record<string, string>>({
    database: "offline",
    redis: "offline",
    qdrant: "offline",
    minio: "offline",
    smtp: "offline",
    celery_workers: "offline"
  });

  const loadData = useCallback(async () => {
    const token = localStorage.getItem('hiremind_token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const headers = { Authorization: `Bearer ${token}` };

    try {
      setLoading(true);
      // Fetch system health dependencies
      const depRes = await fetch(`${apiUrl}/api/v1/deployment/simulate/health`, { headers });
      if (depRes.ok) {
        const dData = await depRes.json();
        if (dData.services) {
          setDependencies(dData.services);
        }
      }

      // Fetch node metrics
      const metricsRes = await fetch(`${apiUrl}/api/v1/performance/metrics`, { headers });
      if (metricsRes.ok) {
        const mData = await metricsRes.json();
        
        if (mData.infrastructure_metrics && mData.infrastructure_metrics.length > 0) {
          // Group metrics by node ID
          const latestNodes = mData.infrastructure_metrics.map((n: any) => ({
            name: n.node_id,
            cpu: `${n.cpu_utilization.toFixed(1)}%`,
            mem: `${n.memory_utilization.toFixed(1)}%`,
            network: `${(n.network_rx_bytes / 1024).toFixed(0)} KB/s`,
            status: n.cpu_utilization > 85 ? "Degraded" : "Healthy"
          }));
          setNodes(latestNodes);
        }

        // Set simulated DB Pool from cache/db metrics
        const cacheMetrics = mData.cache_metrics;
        if (cacheMetrics && cacheMetrics.length > 0) {
          const totalHits = cacheMetrics.reduce((acc: number, c: any) => acc + c.hits, 0);
          const activeConns = Math.min(40, Math.floor(totalHits / 1000) + 5);
          setDbStats({
            active_connections: activeConns,
            idle_connections: Math.max(0, 40 - activeConns),
            waiting_requests: activeConns > 35 ? activeConns - 35 : 0,
            pool_size: 40,
            max_overflow: 10
          });
        }
      }
    } catch (e) {
      console.error("Error fetching health data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div 
      className="min-h-screen p-8 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
            Cluster Telemetry
          </span>
          <h2 className="text-4xl font-bold tracking-tight mt-1">Infrastructure Health & Dependencies</h2>
        </div>
        <button onClick={loadData} className="p-2 hover:bg-gray-800 rounded border border-gray-800 flex items-center gap-2 text-xs">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <PerformanceNav active="/dashboard/performance/health" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Connection Pool Status */}
        <div 
          className="p-6 rounded-xl border col-span-1"
          style={{ 
            backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
            borderColor: THEME_TOKENS.colors.background.borderGlass 
          }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
            Database Connection Pool
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Pool Utilization</span>
                <span>{((dbStats.active_connections / dbStats.pool_size) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-700 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ 
                    backgroundColor: THEME_TOKENS.colors.brand.goldPremium,
                    width: `${(dbStats.active_connections / dbStats.pool_size) * 100}%` 
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="border p-3 rounded-lg border-gray-800">
                <span className="text-[10px] text-gray-400 uppercase">Active Links</span>
                <div className="text-xl font-bold text-white">{dbStats.active_connections}</div>
              </div>
              <div className="border p-3 rounded-lg border-gray-800">
                <span className="text-[10px] text-gray-400 uppercase">Idle Links</span>
                <div className="text-xl font-bold text-white">{dbStats.idle_connections}</div>
              </div>
              <div className="border p-3 rounded-lg border-gray-800">
                <span className="text-[10px] text-gray-400 uppercase">Waiting count</span>
                <div className="text-xl font-bold text-green-400">{dbStats.waiting_requests}</div>
              </div>
              <div className="border p-3 rounded-lg border-gray-800">
                <span className="text-[10px] text-gray-400 uppercase">Pool limit</span>
                <div className="text-xl font-bold text-white">{dbStats.pool_size}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dependency Status */}
        <div 
          className="p-6 rounded-xl border col-span-2"
          style={{ 
            backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
            borderColor: THEME_TOKENS.colors.background.borderGlass 
          }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
            System Dependencies Health
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(dependencies).map(([depName, status], index) => {
              const isHealthy = status === 'connected' || status === 'active';
              return (
                <div key={index} className="p-4 border border-gray-800 rounded-xl flex items-center justify-between">
                  <span className="text-sm font-semibold capitalize">{depName.replace('_', ' ')}</span>
                  <span 
                    className="flex items-center gap-1.5 px-3 py-1 rounded text-[10px] uppercase font-bold tracking-wider"
                    style={{ 
                      backgroundColor: isHealthy ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
                      color: isHealthy ? '#4ade80' : '#ef4444' 
                    }}
                  >
                    {isHealthy ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Distributed Nodes */}
      <div 
        className="p-6 rounded-xl border"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <h3 className="text-lg font-bold mb-4" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Active Host Instances
        </h3>
        {nodes.length > 0 ? (
          <div className="space-y-4">
            {nodes.map((node, i) => (
              <div 
                key={i} 
                className="flex items-center justify-between p-4 border rounded-xl border-gray-800 transition-all hover:bg-gray-800/20"
              >
                <div className="flex items-center gap-3">
                  <Server className="w-5 h-5" style={{ color: THEME_TOKENS.colors.brand.goldPremium }} />
                  <div>
                    <div className="text-sm font-semibold">{node.name}</div>
                    <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">{node.status}</span>
                  </div>
                </div>

                <div className="flex gap-6 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase">CPU Load</span>
                    <span className="font-semibold text-white">{node.cpu}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase">Memory</span>
                    <span className="font-semibold text-white">{node.mem}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase">Network</span>
                    <span className="font-semibold text-white">{node.network}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-xs text-gray-500 py-10">
            No node telemetry registered. Click "Seed Simulation Data" in the Command Center first.
          </div>
        )}
      </div>
    </div>
  );
}
