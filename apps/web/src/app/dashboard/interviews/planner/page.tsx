'use client';

import React, { useState, useEffect } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import {
  Sparkles, Loader2, Calendar, Target, CheckCircle,
  AlertTriangle, Briefcase, Plus, Users, Clock, HelpCircle
} from 'lucide-react';

interface Job { id: string; title: string; }
interface Candidate { id: string; name: string; }
interface Question { id: string; text: string; category: string; }

const NAMES = ['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Marie Curie', 'Richard Feynman'];

export default function InterviewPlannerPage() {
  const gold = THEME_TOKENS.colors.brand.goldPremium;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  
  // Script / Questions state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [planning, setPlanning] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const getToken = () => localStorage.getItem('hiremind_token') || '';
  const headers = () => ({ Authorization: `Bearer ${getToken()}` });

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const jobsRes = await fetch(`${apiUrl}/api/v1/jobs`, { headers: headers() });
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          if (Array.isArray(jobsData)) {
            setJobs(jobsData);
            if (jobsData.length) setSelectedJobId(jobsData[0].id);
          }
        }

        const candidatesRes = await fetch(`${apiUrl}/api/v1/search/candidates`, { headers: headers() });
        if (candidatesRes.ok) {
          const candidatesData = await candidatesRes.json();
          if (Array.isArray(candidatesData)) {
            const mapped = candidatesData.slice(0, 5).map((c, i) => ({ id: c.id, name: NAMES[i % NAMES.length] }));
            setCandidates(mapped);
            if (mapped.length) setSelectedCandidateId(mapped[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const handlePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId || planning) return;
    setPlanning(true);

    try {
      const res = await fetch(`${apiUrl}/api/v1/interviews/plan?job_id=${selectedJobId}&title=${encodeURIComponent(title || 'Engineering Evaluation')}&difficulty=${difficulty}`, {
        method: 'POST',
        headers: headers()
      });
      if (res.ok) {
        showToast('Interview planned and saved to database', 'success');
        
        // Trigger AI Question Generation using model route
        setGeneratingQuestions(true);
        const prompt = `Generate 4 specific interview questions (2 technical, 2 behavioural/hr) for a candidate applying to a ${difficulty} difficulty role with title: ${title}. Output as plain checklist.`;
        const aiRes = await fetch(
          `${apiUrl}/api/v1/ai/route?model_name=gemini-2.0-flash&prompt_input=${encodeURIComponent(prompt)}`,
          { method: 'POST', headers: headers() }
        );
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          // Map raw output onto Question nodes
          const outputLines = (aiData.output || '')
            .split('\n')
            .map((line: string) => line.replace(/^[-*+\d.]\s*/, '').trim())
            .filter(Boolean);

          const qList: Question[] = outputLines.map((line: string, i: number) => ({
            id: String(i),
            text: line,
            category: i < 2 ? 'Technical' : 'HR/Behavioral'
          }));
          setQuestions(qList);
        }
      } else {
        throw new Error();
      }
    } catch {
      showToast('Failed to schedule interview plan', 'error');
    } finally {
      setPlanning(false);
      setGeneratingQuestions(false);
    }
  };

  return (
    <div className="min-h-screen p-8 text-white flex flex-col gap-6" style={{ fontFamily: THEME_TOKENS.typography.fontFamily }}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl text-sm font-medium transition-all ${toast.type === 'success' ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}`}>
          {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: gold }}>Planner Workspace</span>
        <h1 className="text-3xl font-bold tracking-tight mt-1">Configure Interview Blueprint</h1>
        <p className="text-sm text-gray-500 mt-1">Design screening questions and structure candidate evaluation kits</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Configurator (6 cols) */}
        <div className="lg:col-span-6 p-8 rounded-2xl border bg-black/40"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <form onSubmit={handlePlan} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Blueprint Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Distributed Systems Senior Architect Interview Plan"
                className="w-full px-4 py-3 rounded-xl border border-gray-800 text-xs text-white bg-transparent focus:outline-none focus:border-yellow-500/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Target Candidate *</label>
                <select
                  value={selectedCandidateId}
                  onChange={e => setSelectedCandidateId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-800 text-xs bg-transparent text-white focus:outline-none focus:border-yellow-500/50"
                >
                  {candidates.map(c => (
                    <option key={c.id} value={c.id} style={{ backgroundColor: '#0f0f10' }}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Target Job Openings *</label>
                <select
                  value={selectedJobId}
                  onChange={e => setSelectedJobId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-800 text-xs bg-transparent text-white focus:outline-none focus:border-yellow-500/50"
                >
                  {jobs.map(j => (
                    <option key={j.id} value={j.id} style={{ backgroundColor: '#0f0f10' }}>{j.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Difficulty Profile</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-800 text-xs bg-transparent text-white focus:outline-none focus:border-yellow-500/50"
              >
                <option value="easy">Easy (Fundamentals check)</option>
                <option value="medium">Medium (Standard engineering scope)</option>
                <option value="hard">Hard (Deep systems architectural probe)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={planning || !selectedJobId}
              className="w-full py-3.5 rounded-xl font-bold text-xs transition-all hover:scale-[1.02] disabled:opacity-40 bg-yellow-500 text-black flex items-center justify-center gap-1.5"
              style={{ backgroundColor: gold }}
            >
              {planning ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              GENERATE AI INTERVIEW PLAN
            </button>
          </form>
        </div>

        {/* AI Guide Roster (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl border bg-black/40 flex flex-col min-h-[380px]"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
            <Calendar size={15} style={{ color: gold }} />
            <span className="font-bold text-sm">AI Scorecard Question Guide</span>
          </div>

          <div className="flex-grow p-6 flex flex-col justify-center">
            {generatingQuestions ? (
              <div className="flex flex-col items-center justify-center gap-3">
                <Loader2 size={24} className="animate-spin text-yellow-500" />
                <p className="text-xs text-gray-500 font-mono">Formulating question vectors...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center gap-3 py-16">
                <HelpCircle size={24} className="text-gray-700" />
                <div>
                  <p className="text-xs font-semibold text-gray-500">Configure blueprint and click generate</p>
                  <p className="text-[10px] text-gray-600 mt-1">Questions will be customized for the selected role</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-xl border border-gray-900 bg-white/[0.01] hover:border-gray-800 transition-colors">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[8px] font-bold uppercase tracking-wider font-mono" style={{ color: gold }}>Q{idx + 1} · {q.category}</span>
                      <span className="text-[9px] text-green-400 bg-green-400/5 px-2 py-0.5 rounded border border-green-500/10">Active</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed font-light">{q.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
