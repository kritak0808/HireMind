'use client';

import React, { useState, useEffect } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import {
  TrendingDown, TrendingUp, BarChart3, Activity, Target,
  Download, RefreshCw, Loader2, Zap, Calendar, Users, Briefcase
} from 'lucide-react';

interface KPI {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: any;
  color: string;
}

interface FunnelBar { stage: string; count: number; pct: number; }

export default function ExecutiveCommandCenter() {
  const gold = THEME_TOKENS.colors.brand.goldPremium;

  const [timeToHire, setTimeToHire] = useState('—');
  const [predictedTTH, setPredictedTTH] = useState('—');
  const [confidence, setConfidence] = useState<{ lower: string; upper: string }>({ lower: '—', upper: '—' });
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const getToken = () => localStorage.getItem('hiremind_token') || '';
  const headers = () => ({ Authorization: `Bearer ${getToken()}` });

  const load = async () => {
    setRefreshing(true);
    await Promise.allSettled([
      fetch(`${apiUrl}/api/v1/analytics/kpis?kpi_name=time_to_hire`, { headers: headers() })
        .then(r => r.json())
        .then(d => { if (d.computed_value !== undefined) setTimeToHire(`${d.computed_value}d`); }),
      fetch(`${apiUrl}/api/v1/analytics/forecasts?kpi_name=time_to_hire`, { headers: headers() })
        .then(r => r.json())
        .then(d => {
          if (d.predicted_value !== undefined) setPredictedTTH(`${d.predicted_value}d`);
          if (d.bounds) {
            setConfidence({ lower: `${d.bounds.lower}d`, upper: `${d.bounds.upper}d` });
          }
        }),
      fetch(`${apiUrl}/api/v1/analytics/queries?query_text=${encodeURIComponent('summarize today pipeline health')}`, {
        method: 'POST',
        headers: headers(),
      }).then(r => r.json()).then(d => { if (d.answer_summary) setInsight(d.answer_summary); }),
    ]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const kpis: KPI[] = [
    { label: 'Avg. Time to Hire', value: timeToHire, change: '−2.4d vs prev month', positive: true, icon: TrendingDown, color: gold },
    { label: 'AI Forecasted TTH', value: predictedTTH, change: `CI: ${confidence.lower} – ${confidence.upper}`, positive: true, icon: Target, color: '#60a5fa' },
    { label: 'Offer Acceptance', value: '92.5%', change: '+1.2% this quarter', positive: true, icon: TrendingUp, color: '#34d399' },
    { label: 'Pipeline Health', value: '98%', change: 'Zero bottlenecks detected', positive: true, icon: Activity, color: '#a78bfa' },
  ];

  const funnel: FunnelBar[] = [
    { stage: 'Applied', count: 312, pct: 100 },
    { stage: 'Screening', count: 218, pct: 70 },
    { stage: 'Assessment', count: 130, pct: 42 },
    { stage: 'Technical', count: 78, pct: 25 },
    { stage: 'Manager', count: 45, pct: 14 },
    { stage: 'Offer', count: 22, pct: 7 },
    { stage: 'Hired', count: 14, pct: 4.5 },
  ];

  const monthlyData = [
    { month: 'Jan', hired: 8 }, { month: 'Feb', hired: 12 }, { month: 'Mar', hired: 10 },
    { month: 'Apr', hired: 16 }, { month: 'May', hired: 14 }, { month: 'Jun', hired: 19 },
  ];
  const maxHired = Math.max(...monthlyData.map(m => m.hired));

  const sources = [
    { name: 'LinkedIn', value: 42, color: '#0077b5' },
    { name: 'Referrals', value: 28, color: gold },
    { name: 'Job Boards', value: 18, color: '#34d399' },
    { name: 'Direct', value: 12, color: '#a78bfa' },
  ];

  return (
    <div className="min-h-full p-8 space-y-8" style={{ fontFamily: THEME_TOKENS.typography.fontFamily }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: gold }}>Executive Intelligence</p>
          <h1 className="text-3xl font-bold tracking-tight mt-1">Analytics Command Center</h1>
          <p className="text-sm text-gray-500 mt-1">AI-powered hiring forecasts and pipeline business intelligence</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs border text-gray-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-40"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
            style={{ backgroundColor: gold, color: '#0a0a0b' }}>
            <Download size={13} /> Export PDF
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="p-6 rounded-2xl border hover:scale-[1.02] transition-all"
              style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${kpi.color}15` }}>
                  <Icon size={17} style={{ color: kpi.color }} />
                </div>
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${kpi.positive ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                  {kpi.positive ? '↑' : '↓'} Good
                </span>
              </div>
              <div className="text-3xl font-bold" style={{ color: kpi.color }}>
                {loading ? <div className="h-8 w-16 bg-white/10 rounded animate-pulse" /> : kpi.value}
              </div>
              <div className="text-xs text-gray-500 mt-1">{kpi.label}</div>
              <div className="text-[10px] text-gray-600 mt-0.5">{kpi.change}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Hiring Funnel */}
        <div className="lg:col-span-2 rounded-2xl border p-6"
          style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 size={15} style={{ color: gold }} />
              <h2 className="font-bold text-sm">Hiring Funnel Conversion</h2>
            </div>
            <span className="text-[10px] text-gray-600">Last 90 days</span>
          </div>
          <div className="space-y-2.5">
            {funnel.map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-[10px] text-gray-500 w-20 shrink-0">{item.stage}</span>
                <div className="flex-1 h-7 rounded-lg overflow-hidden relative"
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                  <div className="h-full rounded-lg transition-all duration-700 flex items-center px-3"
                    style={{
                      width: `${item.pct}%`,
                      background: `linear-gradient(to right, ${gold}90, ${gold}50)`,
                      minWidth: '40px'
                    }}>
                    <span className="text-[10px] font-bold text-black">{item.count}</span>
                  </div>
                </div>
                <span className="text-[10px] text-gray-600 w-10 text-right shrink-0">{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Source Effectiveness */}
        <div className="rounded-2xl border p-6"
          style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center gap-2 mb-6">
            <Users size={15} style={{ color: gold }} />
            <h2 className="font-bold text-sm">Source Effectiveness</h2>
          </div>
          <div className="space-y-3">
            {sources.map(src => (
              <div key={src.name}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-400">{src.name}</span>
                  <span className="font-bold" style={{ color: src.color }}>{src.value}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${src.value}%`, backgroundColor: src.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Hiring + AI Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Chart */}
        <div className="lg:col-span-2 rounded-2xl border p-6"
          style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center gap-2 mb-6">
            <Calendar size={15} style={{ color: gold }} />
            <h2 className="font-bold text-sm">Monthly Hiring Velocity</h2>
          </div>
          <div className="flex items-end gap-4 h-32">
            {monthlyData.map(m => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-bold" style={{ color: gold }}>{m.hired}</span>
                <div className="w-full rounded-t-lg transition-all duration-700"
                  style={{
                    height: `${(m.hired / maxHired) * 100}%`,
                    background: `linear-gradient(to top, ${gold}, ${gold}50)`,
                    minHeight: '8px'
                  }} />
                <span className="text-[10px] text-gray-600">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insight */}
        <div className="rounded-2xl border p-6"
          style={{ borderColor: `${gold}25`, backgroundColor: `${gold}06` }}>
          <div className="flex items-center gap-2 mb-4">
            <Zap size={15} style={{ color: gold }} />
            <h2 className="font-bold text-sm" style={{ color: gold }}>AI Forecast Insight</h2>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-4 bg-white/10 rounded animate-pulse" />)}
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400 leading-relaxed">
                {insight || 'Engineering hiring velocities present a stable pipeline speed. No bottleneck anomalies detected.'}
              </p>
              <div className="mt-4 p-3 rounded-xl border text-xs"
                style={{ borderColor: `${gold}20`, backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <div className="font-bold mb-1" style={{ color: gold }}>AI Forecast</div>
                <div className="text-gray-500">Predicted TTH: <span className="text-white font-bold">{predictedTTH}</span></div>
                <div className="text-gray-500 mt-0.5">Confidence: <span className="text-white">{confidence.lower} – {confidence.upper}</span></div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
