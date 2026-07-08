'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { GovernanceNav } from '../GovernanceNav';
import { CheckSquare, CheckCircle2, XCircle, Clock, FileText, User, ArrowRight, ShieldCheck } from 'lucide-react';

export default function ApprovalsPage() {
  const [requests, setRequests] = useState([
    {
      id: 'req_apr_12',
      type: 'Prompt Publish',
      target: 'resume_parsing_core (v4.0.0 proposed)',
      requester: 'Ada Lovelace (Lead AI Researcher)',
      date: '3 hours ago',
      comments: 'Optimized parser regex constraints and added formatting instruction parameters.',
      status: 'Pending'
    },
    {
      id: 'req_apr_14',
      type: 'Model Promotion',
      target: 'gemini-2.0-flash (Production canary split 70%)',
      requester: 'Alan Turing (Ops Engineer)',
      date: '1 day ago',
      comments: 'Canary split shift to direct 70% of candidate traffic to Gemini endpoint.',
      status: 'Pending'
    },
    {
      id: 'req_apr_10',
      type: 'Prompt Publish',
      target: 'coding_feedback_agent (v2.1.0)',
      requester: 'Grace Hopper (Compiler Architect)',
      date: '2 days ago',
      comments: 'Added unit test result mapping variables.',
      status: 'Approved'
    }
  ]);

  const [message, setMessage] = useState('');

  const handleAction = (id: string, action: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: action } : r));
    setMessage(`Approval Request ${id} has been ${action.toLowerCase()}.`);
    setTimeout(() => setMessage(''), 4000);
  };

  return (
    <div 
      className="min-h-screen p-8 text-white animate-fade-in"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          AI Governance Platform
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">AI Approvals Console</h2>
      </div>

      <GovernanceNav active="/dashboard/ai/approvals" />

      {message && (
        <div className="mb-6 p-4 rounded bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          {message}
        </div>
      )}

      <div className="space-y-6 max-w-5xl">
        {requests.map((r) => (
          <div 
            key={r.id}
            className="p-6 rounded-xl border backdrop-blur-md flex flex-col md:flex-row justify-between gap-6"
            style={{ 
              backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
              borderColor: THEME_TOKENS.colors.background.borderGlass 
            }}
          >
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-gray-900 border border-gray-800 px-2.5 py-0.5 rounded text-gray-400">
                  {r.type}
                </span>
                <span 
                  className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: r.status === 'Pending' ? 'rgba(255,235,59,0.1)' : r.status === 'Approved' ? 'rgba(76,175,80,0.1)' : 'rgba(244,67,54,0.1)',
                    color: r.status === 'Pending' ? '#fdd835' : r.status === 'Approved' ? '#4caf50' : '#f44336'
                  }}
                >
                  {r.status}
                </span>
              </div>

              <h3 className="font-extrabold text-lg flex items-center gap-2">
                {r.target}
              </h3>

              <div className="flex gap-4 text-xs text-gray-400 font-light items-center">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#d4af37]" />
                  {r.requester}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {r.date}
                </span>
              </div>

              <p className="text-xs text-gray-300 font-light border-l-2 pl-3 border-gray-800 italic mt-2">
                "{r.comments}"
              </p>
            </div>

            {r.status === 'Pending' && (
              <div className="flex flex-row md:flex-col justify-end gap-2 items-end">
                <button 
                  onClick={() => handleAction(r.id, 'Approved')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider text-black bg-[#d4af37] transition-all hover:scale-105"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve Promotion
                </button>
                <button 
                  onClick={() => handleAction(r.id, 'Rejected')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider border border-[#ef5350] text-[#ef5350] transition-all hover:bg-[#ef5350]/15"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Request
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
