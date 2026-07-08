'use client';

import React, { useState, useEffect } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import {
  Shield, Settings, Sliders, CheckSquare, BarChart2, ShieldAlert, FileText, Database, Activity, DollarSign, CheckCircle2, GitBranch, AlertTriangle, Loader2, Sparkles, Send
} from 'lucide-react';
import { GovernanceNav } from '../GovernanceNav';

export default function AICommandCenter() {
  const gold = THEME_TOKENS.colors.brand.goldPremium;

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'prompts' | 'models' | 'rag' | 'experiments'>('overview');

  // Prompts registry state
  const [prompts, setPrompts] = useState<any[]>([]);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptDesc, setNewPromptDesc] = useState('');
  const [newPromptContent, setNewPromptContent] = useState('');
  const [newPromptVersion, setNewPromptVersion] = useState(1);

  // Models registry state
  const [models, setModels] = useState<any[]>([]);

  // RAG query state
  const [ragQuery, setRagQuery] = useState('');
  const [ragResponse, setRagResponse] = useState<any>(null);
  const [queryingRag, setQueryingRag] = useState(false);

  // Experiment & Evaluations state
  const [experiments, setExperiments] = useState<any[]>([]);
  const [evalReports, setEvalReports] = useState<any[]>([]);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const getToken = () => localStorage.getItem('hiremind_token') || '';
  const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`
  });

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    try {
      // 1. Fetch Prompts Registry
      const promptRes = await fetch(`${apiUrl}/api/v1/ai-governance/prompts`, { headers: headers() });
      if (promptRes.ok) {
        const pData = await promptRes.json();
        setPrompts(pData);
      }

      // 2. Fetch Models Registry
      const modelRes = await fetch(`${apiUrl}/api/v1/ai-governance/models`, { headers: headers() });
      if (modelRes.ok) {
        const mData = await modelRes.json();
        setModels(mData);
      }

      // 3. Fetch Experiments
      const expRes = await fetch(`${apiUrl}/api/v1/ai-mlops/experiments`, { headers: headers() });
      if (expRes.ok) {
        const eData = await expRes.json();
        setExperiments(eData);
      }

      // 4. Fetch Evaluation Reports
      const evalRes = await fetch(`${apiUrl}/api/v1/ai-mlops/evaluations/reports`, { headers: headers() });
      if (evalRes.ok) {
        const rData = await evalRes.json();
        setEvalReports(rData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromptName || !newPromptContent) return;

    try {
      const res = await fetch(`${apiUrl}/api/v1/ai-governance/prompts`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          name: newPromptName,
          description: newPromptDesc,
          content: newPromptContent,
          version_number: newPromptVersion
        })
      });
      if (res.ok) {
        setNewPromptName('');
        setNewPromptDesc('');
        setNewPromptContent('');
        setNewPromptVersion(v => v + 1);
        showToast('Prompt version registered to Governance Vault', 'success');
        loadData();
      }
    } catch (err) {
      showToast('Prompt registration failed', 'error');
    }
  };

  const handleQueryRag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragQuery.trim()) return;

    setQueryingRag(true);
    setRagResponse(null);
    try {
      const res = await fetch(`${apiUrl}/api/v1/ai-rag/knowledge/query`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ query_text: ragQuery })
      });
      if (res.ok) {
        const data = await res.json();
        setRagResponse(data);
      }
    } catch (err) {
      showToast('RAG Retrieval failed', 'error');
    } finally {
      setQueryingRag(false);
    }
  };

  return (
    <div className="min-h-screen p-8 text-white space-y-6" style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}>
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl text-sm font-medium transition-all ${toast.type === 'success' ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: gold }}>
          AI MLOps Console
        </span>
        <h1 className="text-3xl font-bold tracking-tight mt-1">AI Governance CommandCenter</h1>
      </div>

      <GovernanceNav active="/dashboard/ai/command" />

      {/* Subtab Navigation */}
      <div className="flex gap-2 border-b border-white/[0.04] pb-3 text-xs font-bold uppercase tracking-wider shrink-0 overflow-x-auto">
        {[
          { id: 'overview', name: 'Analytics Overview', icon: Activity },
          { id: 'prompts', name: 'Prompt Registry', icon: FileText },
          { id: 'models', name: 'Model Registry', icon: Database },
          { id: 'rag', name: 'Knowledge Base (RAG)', icon: Sparkles },
          { id: 'experiments', name: 'Experiment & Eval Lab', icon: GitBranch },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors shrink-0 ${isActive ? 'bg-yellow-500 text-black font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              style={isActive ? { backgroundColor: gold } : {}}
            >
              <Icon size={12} />
              {tab.name}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-24 flex justify-center">
          <Loader2 size={36} className="animate-spin text-yellow-500" style={{ color: gold }} />
        </div>
      ) : (
        <>
          {/* VIEW 1: Overview & Analytics */}
          {activeSubTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Active Model Deployments", value: "14 Nodes", change: "Multi-provider failover", icon: Database },
                  { label: "Grounding Fidelity", value: "99.2%", change: "Based on evaluated runs", icon: CheckCircle2 },
                  { label: "P95 Latency Index", value: "320 ms", change: "Within SLAs limits", icon: Activity },
                  { label: "Aggregated AI Spend", value: "$124.84", change: "Weekly budget threshold: $500", icon: DollarSign },
                ].map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div key={i} className="p-6 rounded-2xl border bg-white/[0.01]" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{s.label}</span>
                        <Icon size={16} style={{ color: gold }} />
                      </div>
                      <div className="text-3xl font-bold font-mono text-white mt-1">{s.value}</div>
                      <span className="text-[10px] text-gray-400 block mt-1">{s.change}</span>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl border bg-white/[0.01]" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-4">
                    <ShieldAlert size={15} style={{ color: gold }} />
                    Safety Shield Incident Feed
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl border border-red-500/10 bg-red-500/[0.02] text-xs">
                      <span className="font-bold text-red-400">Prompt Injection Blocked (10m ago)</span>
                      <p className="text-gray-400 mt-1">Adversarial bypass string intercepted and blocked on candidate parsing model.</p>
                    </div>
                    <div className="p-3 rounded-xl border border-yellow-500/10 bg-yellow-500/[0.02] text-xs">
                      <span className="font-bold text-yellow-500">PII Data Redacted (2h ago)</span>
                      <p className="text-gray-400 mt-1">Credit Card syntax redacted from Recruiter Copilot session content.</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl border bg-white/[0.01]" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-4">
                    <Activity size={15} style={{ color: gold }} />
                    Provider Node Availability
                  </h3>
                  <div className="space-y-2 text-xs">
                    {[
                      { name: "Google Gemini 2.0 Flash", status: "Healthy", latency: "140ms", traffic: "65%" },
                      { name: "OpenAI GPT-4o Enterprise", status: "Healthy", latency: "420ms", traffic: "25%" },
                      { name: "Anthropic Claude 3.5 Sonnet", status: "Degraded", latency: "980ms", traffic: "10%" }
                    ].map((m, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-white/[0.04]">
                        <div>
                          <div className="font-bold">{m.name}</div>
                          <span className="text-[10px] text-gray-500">Latency: {m.latency}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${m.status === 'Healthy' ? 'text-green-400 bg-green-400/10' : 'text-yellow-400 bg-yellow-400/10'}`}>
                          {m.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: Prompt Registry */}
          {activeSubTab === 'prompts' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <FileText size={16} style={{ color: gold }} />
                  Active Prompt Templates
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {prompts.map((p) => (
                    <div key={p.id} className="p-5 rounded-xl border border-white/[0.04] bg-white/[0.01] text-xs">
                      <h4 className="font-bold text-sm text-white">{p.name}</h4>
                      <p className="text-gray-400 mt-1 leading-normal">{p.description}</p>
                      <span className="text-[10px] text-gray-600 block mt-3 font-mono">Created: {new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add version form */}
              <div className="p-6 rounded-2xl border bg-white/[0.01]" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <h3 className="font-bold text-sm text-white mb-4">Register Prompt Version</h3>
                <form onSubmit={handleRegisterPrompt} className="space-y-4 text-xs">
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Prompt Name</label>
                    <input
                      type="text"
                      placeholder="e.g. resume_summarizer"
                      value={newPromptName}
                      onChange={e => setNewPromptName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 text-xs bg-black/40 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-yellow-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Condenses profiles to resume markdown grids"
                      value={newPromptDesc}
                      onChange={e => setNewPromptDesc(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 text-xs bg-black/40 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-yellow-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Prompt Template System Instructions</label>
                    <textarea
                      placeholder="You are an expert ATS screener. Summarize candidate {{name}}..."
                      value={newPromptContent}
                      onChange={e => setNewPromptContent(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 text-xs bg-black/40 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-yellow-500/50 h-28"
                    />
                  </div>
                  <button type="submit" className="w-full py-2 rounded-lg text-xs font-bold text-black" style={{ backgroundColor: gold }}>
                    Register Version #{newPromptVersion}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* VIEW 3: Model Registry */}
          {activeSubTab === 'models' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Database size={16} style={{ color: gold }} />
                Active Model Providers Registries
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {models.map((m) => (
                  <div key={m.id} className="p-5 rounded-xl border border-white/[0.04] bg-white/[0.01] text-xs">
                    <span className="text-[9px] uppercase tracking-wider text-yellow-500 font-bold" style={{ color: gold }}>{m.provider_name}</span>
                    <h4 className="font-bold text-sm text-white mt-1">{m.name}</h4>
                    <p className="text-gray-500 mt-1 leading-normal">{m.description}</p>
                    <span className="mt-3 px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold border border-green-500/20 text-green-400 bg-green-500/5 block w-max">
                      Active Deployment
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 4: Knowledge Hub & RAG Explorer */}
          {activeSubTab === 'rag' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Sparkles size={16} style={{ color: gold }} />
                  Knowledge RAG Query Explorer
                </h3>

                <form onSubmit={handleQueryRag} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask AI candidate matching rules or equality policy limits..."
                    value={ragQuery}
                    onChange={e => setRagQuery(e.target.value)}
                    required
                    className="px-3.5 py-2.5 bg-black/40 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-yellow-500/50 flex-grow"
                  />
                  <button type="submit" className="px-4 py-2.5 rounded-lg font-bold text-black flex items-center gap-1.5 shrink-0" style={{ backgroundColor: gold }}>
                    {queryingRag ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    Query Knowledge
                  </button>
                </form>

                {ragResponse && (
                  <div className="p-5 rounded-xl border border-yellow-500/20 bg-yellow-500/[0.02] space-y-3 leading-relaxed animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                      <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider">Semantic Retrieval Score: {ragResponse.confidence_score * 100}%</span>
                      <span className="text-[9px] text-gray-500 font-mono">Latency: {ragResponse.decision_trace.retrieval_latency_ms}ms</span>
                    </div>

                    <p className="text-gray-300">{ragResponse.answer}</p>

                    <div className="border-t border-white/[0.04] pt-3">
                      <span className="text-[9px] text-gray-500 block uppercase tracking-wider mb-1.5">Cited Sources Evidence</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {ragResponse.citations.map((c: string) => (
                          <span key={c} className="px-2 py-0.5 rounded bg-black/40 border border-gray-800 font-mono text-[9px] text-gray-400">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* RAG Knowledge hub contents */}
              <div className="p-6 rounded-2xl border bg-white/[0.01]" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <h3 className="font-bold text-sm text-white mb-4">Centralized Document Hub</h3>
                <div className="space-y-3">
                  {[
                    { title: "Corporate Equality Hiring Standards", cat: "compliance" },
                    { title: "Engineering Interview Rubrics Guide", cat: "playbooks" },
                    { title: "Equal Employment Opportunity Policy", cat: "compliance" }
                  ].map((doc, i) => (
                    <div key={i} className="p-3 rounded-xl border border-white/[0.04] bg-white/[0.02]">
                      <span className="text-[8px] uppercase tracking-wider text-yellow-500 font-bold" style={{ color: gold }}>{doc.cat}</span>
                      <h4 className="font-bold text-xs text-white mt-0.5">{doc.title}</h4>
                      <span className="text-[9px] text-gray-600 block mt-1.5 font-mono">Qdrant Indexed</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 5: Experiments & Evaluations */}
          {activeSubTab === 'experiments' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
              <div className="p-6 rounded-2xl border bg-white/[0.01]" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-4">
                  <GitBranch size={15} style={{ color: gold }} />
                  Model Experiments traffic routing
                </h3>
                <div className="space-y-3">
                  {experiments.map((e) => (
                    <div key={e.id} className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.02]">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-sm text-white">{e.name}</h4>
                        <span className="px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold text-green-400 border border-green-500/20 bg-green-500/5">
                          {e.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 font-mono">Split: {JSON.stringify(e.traffic_split)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl border bg-white/[0.01]" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-4">
                  <BarChart2 size={15} style={{ color: gold }} />
                  Evaluation Reports cards
                </h3>
                <div className="space-y-3">
                  {evalReports.map((r) => (
                    <div key={r.id} className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.02]">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-xs text-white">{r.name}</h4>
                        <span className="font-bold text-yellow-500 font-mono" style={{ color: gold }}>Score: {r.overall_score * 100}%</span>
                      </div>
                      <div className="flex gap-4 font-mono text-[9px] text-gray-500">
                        <span>Correctness: {r.scores?.correctness}%</span>
                        <span>Safety: {r.scores?.safety}%</span>
                        <span>Helpfulness: {r.scores?.helpfulness}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
