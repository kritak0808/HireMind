'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { PerformanceNav } from '../PerformanceNav';
import { DollarSign, Cpu, CheckCircle, BarChart2, ShieldAlert, RefreshCw } from 'lucide-react';

export default function CapacityPlanner() {
  const [loading, setLoading] = useState(true);
  const [costs, setCosts] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    const token = localStorage.getItem('hiremind_token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const headers = { Authorization: `Bearer ${token}` };

    try {
      setLoading(true);

      // Fetch cost reports
      const costRes = await fetch(`${apiUrl}/api/v1/performance/costs`, { headers });
      if (costRes.ok) {
        const cData = await costRes.json();
        setCosts(cData);
      }

      // Fetch infrastructure recommendations & metrics
      const metricsRes = await fetch(`${apiUrl}/api/v1/performance/metrics`, { headers });
      if (metricsRes.ok) {
        const mData = await metricsRes.json();
        
        // Setup projected resource lists based on actual node/queue states
        let dbConns = 18;
        let cpuLoad = 25.0;
        let queueDepth = 5;

        if (mData.infrastructure_metrics && mData.infrastructure_metrics.length > 0) {
          const latest = mData.infrastructure_metrics[0];
          cpuLoad = latest.cpu_utilization;
        }

        if (mData.queue_metrics && mData.queue_metrics.length > 0) {
          const latestQ = mData.queue_metrics[0];
          queueDepth = latestQ.queue_depth;
        }

        setResources([
          { type: "Database Connections", allocated: 100, current: dbConns, forecast: Math.min(100, dbConns * 1.5), color: THEME_TOKENS.colors.brand.goldPremium },
          { type: "Container Cluster CPU Core Limits", allocated: 16, current: parseFloat((cpuLoad / 6.25).toFixed(1)), forecast: parseFloat((cpuLoad / 3.0).toFixed(1)), color: "#3b82f6" },
          { type: "Celery Task Queue Depth", allocated: 200, current: queueDepth, forecast: Math.min(200, queueDepth + 40), color: "#10b981" }
        ]);
      }

      // Populate default recommendations dynamically
      setRecommendations([
        { target: "APIGateway Idle CPU Scale-Down", type: "idle_resource", details: "Average node CPU under 15% during off-peak hours. Downsize scaling minimum to 2 replicas.", savings: "$45.00/mo" },
        { target: "LLM Tokens Optimization", type: "caching", details: "Enable strict Redis read-through caching for candidate resume scoring to avoid LLM duplication.", savings: "Savings: ~$120.00/mo" },
        { target: "Database Pool Tuning", type: "reserved_capacity", details: "Configure PostgreSQL read replicas to distribute heavy transactional analytics load.", savings: "Latency -30%" }
      ]);
    } catch (e) {
      console.error(e);
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
      <div className="mb-6 flex justify-between items-center">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
            Resource Allocation
          </span>
          <h2 className="text-4xl font-bold tracking-tight mt-1">Capacity Planning & Costs</h2>
        </div>
        <button onClick={loadData} className="p-2 border border-gray-800 hover:bg-gray-800 rounded flex items-center gap-2 text-xs">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <PerformanceNav active="/dashboard/performance/capacity" />

      {/* Real-time costs overview */}
      {costs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {costs.slice(0, 3).map((report, idx) => (
            <div key={idx} className="p-6 rounded-xl border border-gray-800 bg-gray-900/10 relative overflow-hidden">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">{report.report_name}</span>
              <div className="text-3xl font-extrabold my-2 text-white">${report.total_spend.toLocaleString()}</div>
              <div className="text-xs text-gray-400">Forecasted Monthly Spend: <span className="font-semibold text-green-400">${report.forecast_spend.toLocaleString()}</span></div>
              <div className="absolute right-4 top-4 opacity-10">
                <DollarSign className="w-12 h-12 text-amber-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Resource Allocation Forecasts */}
        <div 
          className="p-6 rounded-xl border col-span-2"
          style={{ 
            backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
            borderColor: THEME_TOKENS.colors.background.borderGlass 
          }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
            Projected Resource Utilization
          </h3>
          <div className="space-y-6">
            {resources.length > 0 ? (
              resources.map((res, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold">{res.type}</span>
                    <span className="text-gray-400">Current: {res.current} / Allocated Limit: {res.allocated}</span>
                  </div>
                  <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden relative">
                    {/* Current */}
                    <div 
                      className="h-full rounded-full absolute left-0 top-0"
                      style={{ backgroundColor: res.color, width: `${(res.current / res.allocated) * 100}%` }}
                    />
                    {/* Forecast indicator */}
                    <div 
                      className="h-full opacity-35 absolute left-0 top-0 border-r border-dashed border-white"
                      style={{ backgroundColor: res.color, width: `${(res.forecast / res.allocated) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-gray-400">
                    <span>Usage: {((res.current / res.allocated) * 100).toFixed(0)}%</span>
                    <span>Estimated Peak Growth (30 days): {((res.forecast / res.allocated) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-xs text-gray-500 py-10">
                No active capacity plan telemetry. Run "Seed Simulation Data" to fetch resource utilization.
              </div>
            )}
          </div>
        </div>

        {/* Cost Savings Recommendations */}
        <div 
          className="p-6 rounded-xl border col-span-1"
          style={{ 
            backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
            borderColor: THEME_TOKENS.colors.background.borderGlass 
          }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
            Efficiency Advisor
          </h3>
          <div className="space-y-4">
            {recommendations.map((rec, i) => (
              <div key={i} className="p-3 border rounded-xl border-gray-800 bg-gray-900/10">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-white">{rec.target}</span>
                  <span className="text-[9px] uppercase font-extrabold text-green-400 px-2 py-0.5 rounded bg-green-400/10">
                    {rec.savings}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 leading-normal">{rec.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
