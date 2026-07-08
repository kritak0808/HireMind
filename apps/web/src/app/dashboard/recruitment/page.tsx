'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { THEME_TOKENS } from '@hiremind/ui';
import {
  Briefcase, Users, Clock, TrendingUp, ArrowRight, Plus,
  FileText, BarChart3, Activity, Zap, Bell, Star, CheckCircle
} from 'lucide-react';
import { useRealtime } from '../../context/RealtimeContext';

interface KpiCard {
  label: string;
  value: string | number;
  change: string;
  changePositive: boolean;
  icon: any;
  color: string;
}

interface ActivityItem {
  text: string;
  time: string;
  type: 'job' | 'candidate' | 'offer' | 'interview';
}

export default function RecruitmentDashboard() {
  const router = useRouter();
  const gold = THEME_TOKENS.colors.brand.goldPremium;

  const { lastEvent } = useRealtime();

  const [stats, setStats] = useState<any>({
    time_saved_hours: 0,
    automation_actions_run: 0,
    interview_completion_rate: '0%',
    hiring_velocity_days: 0,
    response_time_minutes: 0,
    tasks_completed: 0,
    ai_token_usage: 0,
    productivity_score: 0,
    active_jobs_count: 0,
    total_candidates_count: 0,
    pending_approvals_count: 0,
    unread_notifications_count: 0,
    leaderboard: []
  });

  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    const token = localStorage.getItem('hiremind_token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const statsRes = await fetch(`${apiUrl}/api/v1/workspace/cockpit`, { headers });
      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData);
      }
    } catch (err) {
      console.error("Failed to load cockpit stats:", err);
    }

    try {
      const notifRes = await fetch(`${apiUrl}/api/v1/workspace/notifications`, { headers });
      if (notifRes.ok) {
        const nData = await notifRes.json();
        setNotifications(nData);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Failed to load workspace notifications:", err);
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await loadData();
      setActivities([
        { text: 'Ada Lovelace advanced to Technical Interview stage', time: '8m ago', type: 'candidate' },
        { text: 'New job posted: Staff Backend Engineer (Go/K8s)', time: '1h ago', type: 'job' },
        { text: 'Resume processed: Marie Curie — ATS Score 96%', time: '2h ago', type: 'candidate' },
        { text: 'Offer accepted: Richard Feynman — Principal Architect', time: '4h ago', type: 'offer' },
        { text: 'Interview scheduled: Alan Turing — System Design', time: '6h ago', type: 'interview' },
      ]);
      setLoading(false);
    };
    init();
  }, [loadData]);

  // Handle Real-Time event synchronizations
  useEffect(() => {
    if (lastEvent) {
      loadData();
      setActivities(prev => [
        {
          text: `Live update: Intercepted ${lastEvent.event_type} event on websocket gateway`,
          time: 'just now',
          type: 'candidate'
        },
        ...prev.slice(0, 4)
      ]);
    }
  }, [lastEvent, loadData]);

  const kpis: KpiCard[] = [
    {
      label: 'Active Job Openings', value: stats.active_jobs_count,
      change: '+2 this week', changePositive: true,
      icon: Briefcase, color: '#D4AF37'
    },
    {
      label: 'Total Candidates', value: stats.total_candidates_count,
      change: '+18 this month', changePositive: true,
      icon: Users, color: '#60a5fa'
    },
    {
      label: 'Avg. Time to Hire', value: `${stats.hiring_velocity_days}d`,
      change: '−2.4d vs last month', changePositive: true,
      icon: Clock, color: '#34d399'
    },
    {
      label: 'Productivity Score', value: `${stats.productivity_score}%`,
      change: '+1.2% this week', changePositive: true,
      icon: TrendingUp, color: '#a78bfa'
    },
  ];

  const quickActions = [
    { label: 'Post New Job', icon: Plus, path: '/dashboard/jobs', color: gold },
    { label: 'Upload Resume', icon: FileText, path: '/dashboard/resumes/upload', color: '#60a5fa' },
    { label: 'View Pipeline', icon: Users, path: '/dashboard/pipeline', color: '#34d399' },
    { label: 'AI Copilot', icon: Zap, path: '/dashboard/copilot/workspace', color: '#a78bfa' },
  ];

  const activityColors: Record<string, string> = {
    job: '#D4AF37', candidate: '#60a5fa', offer: '#34d399', interview: '#a78bfa'
  };

  return (
    <div className="min-h-full p-8 space-y-8" style={{ fontFamily: THEME_TOKENS.typography.fontFamily }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: gold }}>
            Recruiter Command Cockpit
          </p>
          <h1 className="text-3xl font-bold tracking-tight mt-1">Recruiter Workspace</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time statistics, calendar schedules, and AI-powered intelligence metrics</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/jobs')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 shrink-0"
          style={{ backgroundColor: gold, color: '#0a0a0b' }}
        >
          <Plus size={16} />
          New Job Opening
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i}
              className="p-6 rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-lg cursor-default"
              style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${kpi.color}18` }}>
                  <Icon size={18} style={{ color: kpi.color }} />
                </div>
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${kpi.changePositive ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                  {kpi.change}
                </span>
              </div>
              <div className="text-3xl font-bold tracking-tight mb-1">
                {loading ? (
                  <div className="h-8 w-16 bg-white/10 rounded animate-pulse" />
                ) : (
                  <span style={{ color: kpi.color }}>{kpi.value}</span>
                )}
              </div>
              <div className="text-xs text-gray-500">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Live Activity Feed */}
        <div className="lg:col-span-2 rounded-2xl border p-6 flex flex-col justify-between"
          style={{ backgroundColor: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity size={16} style={{ color: gold }} />
                <h2 className="font-bold text-sm">Hiring Activity Timeline</h2>
              </div>
              <button onClick={() => router.push('/dashboard/candidates')}
                className="text-xs flex items-center gap-1 hover:underline" style={{ color: gold }}>
                View all candidates <ArrowRight size={12} />
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {activities.map((act, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: activityColors[act.type] || '#fff' }} />
                    <span className="text-xs text-gray-300 flex-1">{act.text}</span>
                    <span className="text-[10px] text-gray-600 shrink-0">{act.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leaderboard stats */}
          <div className="mt-8 border-t border-white/[0.05] pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-1.5">
              <Star size={12} style={{ color: gold }} /> Recruiter Leaderboard
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {stats.leaderboard?.map((user: any, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[10px] text-gray-500 block">Rank #{i + 1}</span>
                  <div className="font-semibold text-xs mt-1">{user.name}</div>
                  <div className="text-[11px] font-mono mt-0.5" style={{ color: gold }}>{user.hired} hires ({user.score} pts)</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">

          {/* Quick Actions */}
          <div className="rounded-2xl border p-5 bg-white/[0.01]"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Zap size={15} style={{ color: gold }} />
              <h2 className="font-bold text-sm">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map(action => {
                const Icon = action.icon;
                return (
                  <button key={action.path}
                    onClick={() => router.push(action.path)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all hover:scale-105 hover:border-white/20"
                    style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${action.color}18` }}>
                      <Icon size={15} style={{ color: action.color }} />
                    </div>
                    <span className="text-gray-400">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alerts & Pending Approvals */}
          <div className="rounded-2xl border p-5 bg-white/[0.01]"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Bell size={15} style={{ color: gold }} />
              <h2 className="font-bold text-sm">Approvals & Inbox</h2>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-xl border border-yellow-500/10 bg-yellow-500/[0.02] text-xs">
                <span className="font-semibold text-yellow-500">Offer Review Request</span>
                <p className="text-gray-400 mt-1">Lise Meitner offer package draft pending signing approval.</p>
              </div>
              <div className="p-3 rounded-xl border border-blue-500/10 bg-blue-500/[0.02] text-xs">
                <span className="font-semibold text-blue-400">Collaboration Comment</span>
                <p className="text-gray-400 mt-1">Albert Einstein: &quot;Interview evaluation looks solid. Recommended to proceed.&quot;</p>
              </div>
            </div>
          </div>

          {/* Productivity Stats */}
          <div className="rounded-2xl border p-5 bg-white/[0.01]"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={15} style={{ color: gold }} />
              <h2 className="font-bold text-sm">Productivity Statistics</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-gray-500 block text-[10px] uppercase">Hours Saved</span>
                <span className="text-lg font-bold text-white mt-1 block">{stats.time_saved_hours}h</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase">Automation Runs</span>
                <span className="text-lg font-bold text-white mt-1 block">{stats.automation_actions_run}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase">Hiring Velocity</span>
                <span className="text-lg font-bold text-white mt-1 block">{stats.hiring_velocity_days} days</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase">Response Time</span>
                <span className="text-lg font-bold text-white mt-1 block">{stats.response_time_minutes} min</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Hiring Funnel Graph */}
      <div className="rounded-2xl border p-6 bg-white/[0.01]"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 size={16} style={{ color: gold }} />
          <h2 className="font-bold text-sm">Hiring Funnel Overview</h2>
          <span className="text-[10px] text-gray-600 ml-auto">Last 30 days</span>
        </div>
        <div className="flex items-end gap-3 h-28">
          {[
            { stage: 'Applied', count: 124, pct: 100 },
            { stage: 'Screening', count: 87, pct: 70 },
            { stage: 'Assessment', count: 52, pct: 42 },
            { stage: 'Technical', count: 31, pct: 25 },
            { stage: 'Manager', count: 18, pct: 15 },
            { stage: 'Offer', count: 9, pct: 7 },
            { stage: 'Hired', count: 6, pct: 5 },
          ].map((item, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-bold text-gray-300">{item.count}</span>
              <div className="w-full rounded-t-lg transition-all"
                style={{
                  height: `${item.pct}%`,
                  background: `linear-gradient(to top, ${gold}90, ${gold}40)`,
                  minHeight: '8px'
                }} />
              <span className="text-[9px] text-gray-600 truncate w-full text-center">{item.stage}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
