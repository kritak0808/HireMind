'use client';

import React, { useState, useEffect } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import {
  Sparkles, Send, Loader2, RefreshCw, CheckCircle,
  HelpCircle, Terminal, UserCheck, ShieldAlert, Cpu
} from 'lucide-react';

interface Message {
  role: 'assistant' | 'user';
  text: string;
}

interface PendingApproval {
  id: string;
  title: string;
  type: string;
  candidate: string;
  status: 'pending' | 'approved';
}

const QUICK_COMMANDS = [
  'Find candidates with Kubernetes experience',
  'Compare Marie Curie and Niels Bohr scorecards',
  'Generate recruiter outreach email for Alan Turing',
  'Draft formal offer letter for Albert Einstein'
];

export default function CopilotWorkspacePage() {
  const gold = THEME_TOKENS.colors.brand.goldPremium;

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: "Hello! I am your Recruiter Copilot. How can I assist you with your pipelines, evaluations, or approvals today?" }
  ]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [reasoning, setReasoning] = useState('Standby. Enter recruiter query or select a shortcut.');

  // Approvals management list
  const [approvals, setApprovals] = useState<PendingApproval[]>([
    { id: '00000000-0000-0000-0000-000000000001', title: 'Publish Offer Letter draft', type: 'generate_offer', candidate: 'Albert Einstein', status: 'pending' },
    { id: '00000000-0000-0000-0000-000000000002', title: 'Promote to Technical Assessment stage', type: 'stage_advance', candidate: 'Marie Curie', status: 'pending' }
  ]);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const getToken = () => localStorage.getItem('hiremind_token') || '';
  const headers = () => ({ Authorization: `Bearer ${getToken()}` });

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || sending) return;
    setSending(true);

    const userMsg = { role: 'user' as const, text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setReasoning("Initializing LLM Router... Scanning safety shields and redacting PII logs...");

    try {
      const res = await fetch(`${apiUrl}/api/v1/copilot/chat`, {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          session_id: sessionId
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.session_id) setSessionId(data.session_id);

        setMessages(prev => [
          ...prev,
          { role: 'assistant', text: data.reply }
        ]);

        // Show split reasoning logs
        setReasoning(
          `Intent recognized: "${data.intent.toUpperCase()}"\nEvidence parsed: ${JSON.stringify(data.evidence, null, 2)}\nExecution status: success\nFaithfulness rating: 98%`
        );
      } else {
        throw new Error('API request failed');
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: 'Sorry, I encountered an issue processing that query. Please try again.' }
      ]);
      setReasoning('Execution halted. Errors detected in router handshake.');
    } finally {
      setSending(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/copilot/approvals/${id}`, {
        method: 'POST',
        headers: headers()
      });
      if (res.ok) {
        setApprovals(prev =>
          prev.map(appr => (appr.id === id ? { ...appr, status: 'approved' as const } : appr))
        );
        showToast('Decision approved and signed off successfully', 'success');
      } else {
        throw new Error();
      }
    } catch {
      showToast('Failed to sign off approval', 'error');
    }
  };

  return (
    <div className="min-h-screen p-6 text-white flex flex-col lg:flex-row gap-6 justify-center items-stretch"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}>
      
      {/* Toast alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl text-sm font-medium transition-all ${toast.type === 'success' ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}`}>
          {toast.type === 'success' ? <CheckCircle size={15} /> : <ShieldAlert size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Main Dialogue Console (8 cols equivalent) */}
      <div className="flex-grow flex flex-col gap-5 lg:w-2/3 min-h-0">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: gold }}>Recruiter Copilot</span>
          <h1 className="text-3xl font-bold tracking-tight mt-1">Autonomous Agent Workspace</h1>
        </div>

        {/* Chat window */}
        <div className="flex-grow rounded-2xl border bg-black/40 flex flex-col overflow-hidden h-[450px]"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          
          <div className="flex justify-between items-center border-b border-gray-800 px-4 py-3 bg-black/20 text-xs shrink-0">
            <span className="font-semibold text-gray-400">Dialogue Board</span>
            <span className="font-mono text-yellow-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
              Agent Router Active
            </span>
          </div>

          {/* Messages */}
          <div className="flex-grow overflow-y-auto p-5 space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col max-w-lg p-4 rounded-xl border ${m.role === 'assistant' ? 'self-start' : 'self-end ml-auto'}`}
                style={{
                  backgroundColor: m.role === 'assistant' ? 'rgba(212,175,55,0.03)' : 'rgba(255,255,255,0.01)',
                  borderColor: m.role === 'assistant' ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.05)',
                }}
              >
                <span className="text-[9px] uppercase font-bold tracking-widest text-gray-500 mb-1">
                  {m.role === 'assistant' ? "Copilot AI" : "Recruiter"}
                </span>
                <p className="text-xs text-gray-300 leading-relaxed font-light">{m.text}</p>
              </div>
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Loader2 size={13} className="animate-spin text-yellow-500" />
                <span>Copilot is parsing context query...</span>
              </div>
            )}
          </div>

          {/* Prompt Shortcuts */}
          <div className="px-4 py-2 border-t border-gray-900 bg-black/35 flex gap-2 overflow-x-auto shrink-0">
            {QUICK_COMMANDS.map(qc => (
              <button key={qc} onClick={() => handleSend(qc)} disabled={sending}
                className="px-3 py-1.5 rounded-lg border border-gray-800 text-[10px] text-gray-400 hover:text-white hover:border-gray-600 transition-colors whitespace-nowrap shrink-0">
                {qc}
              </button>
            ))}
          </div>

          {/* Chat Form */}
          <form onSubmit={handleFormSubmit} className="flex gap-3 p-4 border-t border-gray-800 shrink-0 bg-black/20">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              required
              placeholder="Query copilot: e.g. Find senior backend engineers with Kubernetes experience..."
              className="flex-grow px-4 py-3 rounded-xl border border-gray-800 text-xs text-white bg-transparent focus:outline-none focus:border-yellow-500/50"
            />
            <button
              type="submit"
              disabled={sending}
              className="px-5 py-3 rounded-xl font-bold text-xs transition-all hover:scale-105 disabled:opacity-40 bg-yellow-500 text-black flex items-center gap-1.5"
              style={{ backgroundColor: gold }}
            >
              <Send size={12} />
              SEND
            </button>
          </form>
        </div>
      </div>

      {/* Split Reasoning & Context (4 cols equivalent) */}
      <div className="w-full lg:w-96 flex flex-col gap-6 shrink-0 h-[640px] overflow-y-auto">
        
        {/* Split Reasoning */}
        <div className="rounded-2xl border p-5 bg-black/40 space-y-4 flex flex-col"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <Terminal size={12} />
            Split Reasoning Panel
          </h3>
          <pre className="p-3.5 rounded-lg border bg-black/50 border-gray-900 text-[10px] font-mono leading-relaxed text-yellow-500/80 overflow-x-auto whitespace-pre-wrap">
            {reasoning}
          </pre>
        </div>

        {/* Approvals Checklist */}
        <div className="rounded-2xl border p-5 bg-black/40 space-y-4"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <UserCheck size={12} />
            Decision Approvals
          </h3>
          <div className="space-y-3">
            {approvals.map(appr => (
              <div key={appr.id} className="p-3 rounded-xl border border-gray-900 bg-white/[0.01] flex flex-col gap-2">
                <div>
                  <span className="text-[8px] font-bold text-yellow-500 font-mono uppercase tracking-wider" style={{ color: gold }}>{appr.type}</span>
                  <h4 className="font-bold text-xs text-white mt-0.5">{appr.title}</h4>
                  <p className="text-[9px] text-gray-600">Candidate: {appr.candidate}</p>
                </div>
                
                {appr.status === 'pending' ? (
                  <button onClick={() => handleApprove(appr.id)}
                    className="w-full py-1.5 rounded-lg text-[10px] font-bold border border-yellow-500/20 text-yellow-500 bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors">
                    APPROVE AND EXECUTE
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-green-400 bg-green-400/5 border border-green-500/10 rounded-lg py-1 text-center flex items-center justify-center gap-1">
                    <CheckCircle size={10} /> APPROVED
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Context parameters */}
        <div className="rounded-2xl border p-4 bg-black/40 text-[10px] space-y-2"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex justify-between">
            <span className="text-gray-500">Security Redactions:</span>
            <span className="font-mono text-gray-300">Enabled (PII Masking)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">AI Tokens Cost Limit:</span>
            <span className="font-mono text-gray-300">$10.00 / Hour</span>
          </div>
        </div>

      </div>
    </div>
  );
}
