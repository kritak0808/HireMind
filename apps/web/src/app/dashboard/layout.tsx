'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { RealtimeProvider, useRealtime } from '../context/RealtimeContext';
import { THEME_TOKENS } from '@hiremind/ui';

// ─── Icons ────────────────────────────────────────────────────────────────────
import {
  LayoutDashboard, Briefcase, Users, FileUp, Cpu, Calendar,
  Code, BarChart3, Settings, Search, Bell, ChevronLeft, ChevronRight,
  Sparkles, LogOut, Building2, X, Send, Terminal, Menu,
  UserCircle, Shield, Key, Globe, Zap, GitBranch, Activity,
  ChevronDown, CheckCircle, AlertCircle, Info
} from 'lucide-react';

// ─── Nav Config ───────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    title: 'Recruitment',
    items: [
      { name: 'Dashboard', path: '/dashboard/recruitment', icon: LayoutDashboard },
      { name: 'Job Openings', path: '/dashboard/jobs', icon: Briefcase },
      { name: 'Candidates (ATS)', path: '/dashboard/candidates', icon: Users },
      { name: 'Pipeline View', path: '/dashboard/pipeline', icon: GitBranch },
    ]
  },
  {
    title: 'Intelligence',
    items: [
      { name: 'Resume Upload', path: '/dashboard/resumes/upload', icon: FileUp },
      { name: 'Candidate AI', path: '/dashboard/candidate-intelligence/compare', icon: Cpu },
      { name: 'AI Copilot', path: '/dashboard/copilot/workspace', icon: Sparkles },
    ]
  },
  {
    title: 'Interview',
    items: [
      { name: 'Planner', path: '/dashboard/interviews/planner', icon: Calendar },
      { name: 'Coding Sandbox', path: '/dashboard/coding/workspace', icon: Code },
    ]
  },
  {
    title: 'Analytics',
    items: [
      { name: 'Executive BI', path: '/dashboard/analytics/command', icon: BarChart3 },
    ]
  },
  {
    title: 'Enterprise',
    items: [
      { name: 'Command Center', path: '/dashboard/enterprise/command', icon: Shield },
      { name: 'Organizations', path: '/dashboard/organizations', icon: Building2 },
      { name: 'Settings', path: '/dashboard/settings/profile', icon: Settings },
    ]
  }
];

const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap(s => s.items);

// ─── Notification mock data ───────────────────────────────────────────────────
const NOTIFICATIONS = [
  { id: 1, type: 'success', title: 'Resume Processed', body: 'Ada Lovelace — ATS Score: 96%', time: '2m ago' },
  { id: 2, type: 'info', title: 'Interview Reminder', body: 'Technical assessment: Alan Turing at 3 PM', time: '45m ago' },
  { id: 3, type: 'warning', title: 'Pipeline Alert', body: '3 candidates pending decision for 7+ days', time: '2h ago' },
  { id: 4, type: 'success', title: 'Offer Accepted', body: 'Marie Curie accepted the Principal Engineer offer', time: '5h ago' },
];

// ─── Main Export ─────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <RealtimeProvider>
        <AppShell>{children}</AppShell>
      </RealtimeProvider>
    </ProtectedRoute>
  );
}

// ─── App Shell ───────────────────────────────────────────────────────────────
function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, organization, logout } = useAuth();
  const { connectionStatus } = useRealtime();

  // UI State
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount] = useState(2);

  // Copilot State
  const [copilotMessages, setCopilotMessages] = useState<Array<{ role: 'user' | 'ai'; text: string; time: string }>>([
    { role: 'ai', text: 'Hello! I\'m your AI Recruiting Assistant. Ask me anything — find candidates, rank applicants, draft offer letters, or summarize your pipeline.', time: 'now' }
  ]);
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotSession, setCopilotSession] = useState<string | null>(null);
  const copilotEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowNotifications(false);
        setShowProfile(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (showSearch) setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [showSearch]);

  // Scroll copilot to bottom
  useEffect(() => {
    copilotEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [copilotMessages]);

  const handleCopilotSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotInput.trim() || copilotLoading) return;
    const text = copilotInput.trim();
    setCopilotInput('');
    setCopilotMessages(prev => [...prev, { role: 'user', text, time: 'just now' }]);
    setCopilotLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('hiremind_token');
      const res = await fetch(`${apiUrl}/api/v1/copilot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text, session_id: copilotSession })
      });
      if (res.ok) {
        const data = await res.json();
        setCopilotSession(data.session_id);
        setCopilotMessages(prev => [...prev, { role: 'ai', text: data.reply, time: 'just now' }]);
      } else {
        throw new Error('API error');
      }
    } catch {
      setCopilotMessages(prev => [...prev, { role: 'ai', text: 'Unable to reach AI backend. Check your connection.', time: 'just now' }]);
    } finally {
      setCopilotLoading(false);
    }
  };

  const getBreadcrumbs = () => {
    const parts = pathname.split('/').filter(Boolean);
    return parts.map((part, i) => ({
      label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
      isLast: i === parts.length - 1
    }));
  };

  const filteredItems = ALL_NAV_ITEMS.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const gold = THEME_TOKENS.colors.brand.goldPremium;
  const bg = THEME_TOKENS.colors.background.deepMatte;
  const panel = THEME_TOKENS.colors.background.panelGlass;
  const border = THEME_TOKENS.colors.background.borderGlass;

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <div className="flex h-screen overflow-hidden text-white" style={{ backgroundColor: bg, fontFamily: THEME_TOKENS.typography.fontFamily }}>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* ══════════════════════════════════════════════════════════
          LEFT SIDEBAR NAVIGATION
      ══════════════════════════════════════════════════════════ */}
      <aside
        className={`
          fixed lg:relative z-50 lg:z-auto h-full flex flex-col border-r shrink-0 transition-all duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          width: collapsed ? '72px' : '260px',
          backgroundColor: '#0a0a0b',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-16 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-black text-sm"
                style={{ background: `linear-gradient(135deg, ${gold}, #b8860b)` }}>
                H
              </div>
              <div>
                <div className="text-sm font-bold tracking-tight" style={{ color: gold }}>HireMind</div>
                <div className="text-[9px] text-gray-500 font-light uppercase tracking-widest">Enterprise AI</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center font-black text-black text-sm"
              style={{ background: `linear-gradient(135deg, ${gold}, #b8860b)` }}>
              H
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Nav Sections */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="mb-2">
              {!collapsed && (
                <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-gray-600 mb-1">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => { router.push(item.path); setMobileOpen(false); }}
                    title={collapsed ? item.name : undefined}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all duration-150 group
                      ${active
                        ? 'font-semibold'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 font-medium'
                      }
                    `}
                    style={active ? {
                      backgroundColor: `${gold}15`,
                      color: gold,
                      boxShadow: `inset 2px 0 0 ${gold}`,
                    } : {}}
                  >
                    <Icon size={16} className="shrink-0" />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                    {active && !collapsed && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: gold }} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="shrink-0 border-t px-2 py-3 space-y-1" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {!collapsed && (
            <div className="px-3 py-2 rounded-lg bg-white/[0.03] border mb-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="text-[10px] text-gray-500 font-light">Logged in as</div>
              <div className="text-xs font-medium text-white truncate mt-0.5">{user?.email}</div>
              <div className="text-[10px] mt-0.5" style={{ color: gold }}>{organization?.name || 'Corporate Workspace'}</div>
              <div className="border-t border-white/[0.04] mt-2 pt-2 flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold">
                <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-gray-400">Gateway {connectionStatus}</span>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={15} className="shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════
          MAIN CONTENT AREA
      ══════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* TOP HEADER */}
        <header className="h-16 shrink-0 flex items-center gap-4 px-6 border-b relative z-30"
          style={{ backgroundColor: '#0a0a0b', borderColor: 'rgba(255,255,255,0.06)' }}>

          {/* Mobile menu toggle */}
          <button className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white" onClick={() => setMobileOpen(true)}>
            <Menu size={18} />
          </button>

          {/* Breadcrumbs */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs flex-1 min-w-0">
            {getBreadcrumbs().map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-gray-700">/</span>}
                <span className={crumb.isLast ? 'text-white font-medium' : 'text-gray-500'}>
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2 ml-auto">

            {/* Global Search Trigger */}
            <button
              onClick={() => setShowSearch(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-white transition-all border"
              style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' }}
            >
              <Search size={13} />
              <span className="hidden md:inline">Search anything...</span>
              <kbd className="hidden md:inline text-[10px] px-1.5 py-0.5 rounded border font-mono"
                style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                ⌘K
              </kbd>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
                className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: gold }} />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border shadow-2xl overflow-hidden z-50"
                  style={{ backgroundColor: '#0f0f10', borderColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <span className="text-xs font-bold">Notifications</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${gold}20`, color: gold }}>
                      {unreadCount} new
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {NOTIFICATIONS.map(n => (
                      <div key={n.id} className="px-4 py-3 border-b hover:bg-white/[0.03] cursor-pointer transition-colors"
                        style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 shrink-0">
                            {n.type === 'success' && <CheckCircle size={13} className="text-green-400" />}
                            {n.type === 'info' && <Info size={13} className="text-blue-400" />}
                            {n.type === 'warning' && <AlertCircle size={13} className="text-yellow-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-white">{n.title}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{n.body}</div>
                            <div className="text-[9px] text-gray-600 mt-1">{n.time}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Copilot Button */}
            <button
              onClick={() => setShowCopilot(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 border"
              style={{ borderColor: `${gold}40`, color: gold, backgroundColor: `${gold}10` }}
            >
              <Sparkles size={14} />
              <span className="hidden sm:inline">AI Copilot</span>
            </button>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-all"
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-black"
                  style={{ background: `linear-gradient(135deg, ${gold}, #b8860b)` }}>
                  {user?.email ? user.email.slice(0, 2).toUpperCase() : 'U'}
                </div>
                <ChevronDown size={12} className="text-gray-500 hidden sm:block" />
              </button>

              {showProfile && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-2xl overflow-hidden z-50"
                  style={{ backgroundColor: '#0f0f10', borderColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="text-xs font-semibold">{user?.email}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: gold }}>{organization?.name}</div>
                  </div>
                  {[
                    { icon: UserCircle, label: 'Profile Settings', path: '/dashboard/settings/profile' },
                    { icon: Key, label: 'API Keys', path: '/dashboard/settings/apikeys' },
                    { icon: Shield, label: 'Security', path: '/dashboard/settings/security' },
                  ].map(item => (
                    <button key={item.path}
                      onClick={() => { router.push(item.path); setShowProfile(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                      <item.icon size={13} />
                      {item.label}
                    </button>
                  ))}
                  <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <button onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                      <LogOut size={13} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* ══════════════════════════════════════════════════════════
          COMMAND PALETTE (Ctrl+K)
      ══════════════════════════════════════════════════════════ */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-start justify-center pt-[15vh] px-4"
          onClick={(e) => e.target === e.currentTarget && setShowSearch(false)}>
          <div className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden"
            style={{ backgroundColor: '#0f0f10', borderColor: 'rgba(255,255,255,0.12)' }}>
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <Search size={17} className="text-gray-500 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search pages, candidates, jobs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder-gray-600"
              />
              <button onClick={() => setShowSearch(false)}
                className="text-[10px] px-2 py-1 rounded border text-gray-500 hover:text-white transition-colors font-mono"
                style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                ESC
              </button>
            </div>
            {/* Results */}
            <div className="max-h-80 overflow-y-auto py-2">
              {searchQuery.length === 0 && (
                <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-600">Quick Navigation</div>
              )}
              {filteredItems.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-gray-600">No results found for "{searchQuery}"</div>
              ) : (
                filteredItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => { router.push(item.path); setShowSearch(false); setSearchQuery(''); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-white/5 transition-colors text-left"
                      style={{ color: active ? gold : '#9ca3af' }}
                    >
                      <Icon size={14} className="shrink-0" />
                      <span>{item.name}</span>
                      <span className="ml-auto text-gray-700 font-mono text-[9px]">{item.path}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          AI COPILOT DRAWER
      ══════════════════════════════════════════════════════════ */}
      {showCopilot && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[90]" onClick={() => setShowCopilot(false)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md border-l z-[95] flex flex-col shadow-2xl"
            style={{ backgroundColor: '#0a0a0b', borderColor: 'rgba(255,255,255,0.1)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0"
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${gold}15`, border: `1px solid ${gold}30` }}>
                  <Sparkles size={15} style={{ color: gold }} />
                </div>
                <div>
                  <div className="text-sm font-bold">AI Recruiting Copilot</div>
                  <div className="text-[10px] text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Online
                  </div>
                </div>
              </div>
              <button onClick={() => setShowCopilot(false)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5">
                <X size={16} />
              </button>
            </div>

            {/* Quick prompts */}
            <div className="px-4 py-3 border-b flex gap-2 overflow-x-auto shrink-0"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {['Find Java devs', 'Rank candidates', 'Summarize pipeline', 'Draft offer letter'].map(p => (
                <button key={p}
                  onClick={() => { setCopilotInput(p); }}
                  className="shrink-0 text-[10px] px-2.5 py-1.5 rounded-lg border hover:border-yellow-500/40 hover:text-yellow-400 transition-all whitespace-nowrap text-gray-500"
                  style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  {p}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {copilotMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'ai' && (
                    <div className="w-6 h-6 rounded-full shrink-0 mr-2 mt-0.5 flex items-center justify-center"
                      style={{ backgroundColor: `${gold}20`, border: `1px solid ${gold}30` }}>
                      <Sparkles size={10} style={{ color: gold }} />
                    </div>
                  )}
                  <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-tr-sm text-white'
                      : 'rounded-tl-sm text-gray-300'
                  }`}
                    style={msg.role === 'user'
                      ? { backgroundColor: `${gold}20`, border: `1px solid ${gold}30` }
                      : { backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }
                    }>
                    {msg.text}
                  </div>
                </div>
              ))}
              {copilotLoading && (
                <div className="flex justify-start">
                  <div className="w-6 h-6 rounded-full shrink-0 mr-2 mt-0.5 flex items-center justify-center"
                    style={{ backgroundColor: `${gold}20` }}>
                    <Sparkles size={10} style={{ color: gold }} />
                  </div>
                  <div className="px-3.5 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
              <div ref={copilotEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleCopilotSend}
              className="px-4 py-4 border-t shrink-0"
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-end gap-2 rounded-xl border p-2"
                style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                <textarea
                  value={copilotInput}
                  onChange={e => setCopilotInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCopilotSend(e as any); } }}
                  placeholder="Ask anything about your hiring pipeline..."
                  rows={2}
                  className="flex-1 bg-transparent text-xs text-white focus:outline-none resize-none placeholder-gray-600 leading-relaxed"
                />
                <button type="submit" disabled={copilotLoading || !copilotInput.trim()}
                  className="p-2 rounded-lg transition-all disabled:opacity-30 hover:scale-105"
                  style={{ backgroundColor: gold }}>
                  <Send size={13} className="text-black" />
                </button>
              </div>
              <div className="text-[9px] text-gray-700 mt-1.5 text-center">
                Shift+Enter for new line · Enter to send
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
