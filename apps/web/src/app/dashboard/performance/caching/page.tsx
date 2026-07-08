'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { PerformanceNav } from '../PerformanceNav';
import { Zap, RefreshCw, Trash2, CheckCircle } from 'lucide-react';

export default function CacheAnalytics() {
  const [clearing, setClearing] = useState(false);
  const [warmed, setWarmed] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [metrics, setMetrics] = useState({
    hits: 0,
    misses: 0,
    total_calls: 0,
    hit_rate: 0.0
  });

  const [cacheRegions, setCacheRegions] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    const token = localStorage.getItem('hiremind_token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const headers = { Authorization: `Bearer ${token}` };

    try {
      setLoading(true);
      // Fetch dynamic Cache Stats
      const statsRes = await fetch(`${apiUrl}/api/v1/performance/metrics`, { headers });
      if (statsRes.ok) {
        const sData = await statsRes.json();
        if (sData.cache_metrics && sData.cache_metrics.length > 0) {
          const regions = sData.cache_metrics.map((c: any) => ({
            region: c.cache_region,
            size: `${(c.bytes_used / 1024).toFixed(1)} KB`,
            hits: c.hits.toLocaleString(),
            misses: c.misses.toLocaleString(),
            hitRate: `${((c.hits / Math.max(1, c.hits + c.misses)) * 100).toFixed(1)}%`
          }));
          setCacheRegions(regions);
        }
      }

      // Fetch global metrics
      const metricsRes = await fetch(`${apiUrl}/api/v1/performance/cache/metrics`, { headers });
      if (metricsRes.ok) {
        const mData = await metricsRes.json();
        setMetrics(mData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClearCache = async () => {
    const token = localStorage.getItem('hiremind_token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const headers = { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    };

    try {
      setClearing(true);
      const res = await fetch(`${apiUrl}/api/v1/performance/cache/clear`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ pattern: "*" })
      });
      if (res.ok) {
        await loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setClearing(false);
    }
  };

  const handleWarmCache = async () => {
    const token = localStorage.getItem('hiremind_token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const headers = { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    };

    try {
      setWarmed(true);
      const res = await fetch(`${apiUrl}/api/v1/performance/cache/warm`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          region: "prompts",
          keys: ["candidate_eval", "interview_feedback", "code_eval"]
        })
      });
      if (res.ok) {
        await loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setWarmed(false);
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
            Memory Optimization
          </span>
          <h2 className="text-4xl font-bold tracking-tight mt-1">Cache Management & Hit Rates</h2>
        </div>
        <button onClick={loadData} className="p-2 border border-gray-800 hover:bg-gray-800 rounded flex items-center gap-2 text-xs">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <PerformanceNav active="/dashboard/performance/caching" />

      {/* global hit rate panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="p-5 border border-gray-800 rounded-xl bg-gray-900/10">
          <span className="text-[10px] text-gray-400 uppercase">Cache Efficiency (Hit Rate)</span>
          <div className="text-2xl font-bold text-green-400">{(metrics.hit_rate * 100).toFixed(1)}%</div>
        </div>
        <div className="p-5 border border-gray-800 rounded-xl bg-gray-900/10">
          <span className="text-[10px] text-gray-400 uppercase">Cache Hits</span>
          <div className="text-2xl font-bold text-white">{metrics.hits.toLocaleString()}</div>
        </div>
        <div className="p-5 border border-gray-800 rounded-xl bg-gray-900/10">
          <span className="text-[10px] text-gray-400 uppercase">Cache Misses</span>
          <div className="text-2xl font-bold text-white">{metrics.misses.toLocaleString()}</div>
        </div>
        <div className="p-5 border border-gray-800 rounded-xl bg-gray-900/10">
          <span className="text-[10px] text-gray-400 uppercase">Total Access Attempts</span>
          <div className="text-2xl font-bold text-white">{metrics.total_calls.toLocaleString()}</div>
        </div>
      </div>

      {/* Control Actions Panel */}
      <div 
        className="p-6 rounded-xl border mb-8 flex justify-between items-center"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <div>
          <h3 className="text-lg font-bold" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
            Cache Operations Control
          </h3>
          <p className="text-xs text-gray-400 mt-1">Trigger manual invalidations or pre-heat active templates.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleWarmCache}
            disabled={warmed}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium uppercase tracking-wider transition-all hover:scale-105 border"
            style={{ 
              borderColor: THEME_TOKENS.colors.brand.goldPremium,
              color: THEME_TOKENS.colors.brand.goldPremium
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {warmed ? "Warming Complete" : "Pre-Heat Caches"}
          </button>
          <button 
            onClick={handleClearCache}
            disabled={clearing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium uppercase tracking-wider transition-all hover:scale-105"
            style={{ 
              backgroundColor: THEME_TOKENS.colors.brand.goldPremium,
              color: THEME_TOKENS.colors.neutral.grayDark
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {clearing ? "Clearing..." : "Invalidate All Keys"}
          </button>
        </div>
      </div>

      <div 
        className="p-6 rounded-xl border"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <h3 className="text-lg font-bold mb-4" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Cache Regions & Invalidation metrics
        </h3>
        {cacheRegions.length > 0 ? (
          <div className="space-y-4">
            {cacheRegions.map((region, idx) => (
              <div 
                key={idx} 
                className="p-4 border rounded-xl border-gray-800 flex justify-between items-center transition-all hover:bg-gray-800/10"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <div>
                    <div className="text-sm font-semibold capitalize">{region.region}</div>
                    <span className="text-[10px] text-gray-400 uppercase">Memory Footprint: {region.size}</span>
                  </div>
                </div>

                <div className="flex gap-8 text-xs text-right">
                  <div>
                    <span className="text-[9px] uppercase text-gray-400 block">Hits</span>
                    <span className="font-semibold text-white">{region.hits}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-gray-400 block">Misses</span>
                    <span className="font-semibold text-white">{region.misses}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-gray-400 block">Efficiency</span>
                    <span className="font-bold text-green-400">{region.hitRate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-xs text-gray-500 py-10">
            No active cache metrics populated. Click "Pre-Heat Caches" above or run simulated operations.
          </div>
        )}
      </div>
    </div>
  );
}
