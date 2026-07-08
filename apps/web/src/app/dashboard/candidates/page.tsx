'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import {
  Search, Users, ChevronRight, CheckCircle,
  AlertTriangle, Loader2, Sparkles, Clock,
  Award, ShieldAlert, Check, Mail, MessageSquare, Clipboard, Send, Lock, Eye
} from 'lucide-react';
import { useRealtime } from '../../context/RealtimeContext';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  score: number;
  shortlisted: boolean;
  skills: string[];
}

interface IntelligenceReport {
  overall_recommendation: string;
  strengths: Record<string, string>;
  weaknesses: Record<string, string>;
  risk_factors: Record<string, string>;
  reasoning: string;
}

const AVATAR_COLORS = ['#D4AF37', '#60a5fa', '#34d399', '#a78bfa', '#f87171', '#fb923c'];

export default function CandidatesPage() {
  const gold = THEME_TOKENS.colors.brand.goldPremium;

  const { onlineUsers, typingUsers, sendTypingStatus, lastEvent } = useRealtime();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'created_at'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [shortlistedOnly, setShortlistedOnly] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Tabs state
  const [activeTab, setActiveTab] = useState<'overview' | 'resume' | 'activities' | 'collaboration' | 'scorecard' | 'emails'>('overview');

  // Collaboration State
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentIsPrivate, setCommentIsPrivate] = useState(false);

  // Scorecards State
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [technicalScore, setTechnicalScore] = useState(85);
  const [behavioralScore, setBehavioralScore] = useState(80);
  const [recVerdict, setRecVerdict] = useState('hire');
  const [scorecardComments, setScorecardComments] = useState('');

  // Email State
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [emailTemplateType, setEmailTemplateType] = useState('invitation');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const [aiReport, setAiReport] = useState<IntelligenceReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareReports, setCompareReports] = useState<Record<string, IntelligenceReport>>({});
  const [showComparison, setShowComparison] = useState(false);
  const [loadingCompare, setLoadingCompare] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const typingTimeoutRef = useRef<any>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const getToken = () => localStorage.getItem('hiremind_token') || '';
  const headers = () => ({ Authorization: `Bearer ${getToken()}` });

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/search/candidates`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const names = [
            'Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Marie Curie', 'Richard Feynman',
            'Niels Bohr', 'Albert Einstein', 'Max Planck', 'Emmy Noether', 'Lise Meitner',
            'John von Neumann', 'Claude Shannon', 'Donald Knuth', 'Barbara Liskov', 'Edsger Dijkstra'
          ];
          const skillsList = [
            ['Python', 'ML', 'PyTorch'], ['Go', 'K8s', 'gRPC'], ['React', 'TypeScript', 'AWS'],
            ['Rust', 'Systems', 'WASM'], ['Java', 'Spring', 'SQL'], ['Data Eng', 'Spark', 'Airflow']
          ];
          
          const mapped: Candidate[] = data.map((c, i) => {
            const seedIndex = i % names.length;
            const seedSkills = skillsList[i % skillsList.length];
            const scoreVal = 70 + (i % 29);
            return {
              id: c.id,
              name: names[seedIndex],
              email: `${names[seedIndex].split(' ')[0].toLowerCase()}@talent.io`,
              phone: c.phone_number || '+1 (555) 019-2834',
              created_at: c.created_at || new Date().toISOString(),
              score: scoreVal,
              shortlisted: false,
              skills: seedSkills
            };
          });
          setCandidates(mapped);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const fetchComments = async (candId: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/workspace/comments/${candId}`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEvaluations = async (candId: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/workspace/kits/evaluations/${candId}`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setEvaluations(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEmailLogs = async (candId: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/workspace/emails/logs/${candId}`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setEmailLogs(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Sync details live on WebSocket event updates
  useEffect(() => {
    if (!lastEvent || !selectedCandidate) return;
    if (lastEvent.event_type === 'comment_added' && lastEvent.payload.candidate_id === selectedCandidate.id) {
      fetchComments(selectedCandidate.id);
    } else if (lastEvent.event_type === 'consensus_vote_submitted' && lastEvent.payload.candidate_id === selectedCandidate.id) {
      fetchEvaluations(selectedCandidate.id);
    }
  }, [lastEvent, selectedCandidate]);

  const fetchAiReport = async (candId: string) => {
    setLoadingReport(true);
    setAiReport(null);
    try {
      const jobId = '00000000-0000-0000-0000-000000000000';
      const res = await fetch(
        `${apiUrl}/api/v1/candidate-intelligence/recommendations/${candId}?job_id=${jobId}`,
        { headers: headers() }
      );
      if (res.ok) {
        const data = await res.json();
        setAiReport({
          overall_recommendation: data.overall_recommendation,
          strengths: data.strengths,
          weaknesses: data.weaknesses,
          risk_factors: data.risk_factors,
          reasoning: data.reasoning
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleSelectCandidate = (cand: Candidate) => {
    setSelectedCandidate(cand);
    setActiveTab('overview');
    fetchComments(cand.id);
    fetchEvaluations(cand.id);
    fetchEmailLogs(cand.id);
    fetchAiReport(cand.id);
  };

  const handleCommentChange = (text: string) => {
    setCommentText(text);
    if (selectedCandidate) {
      sendTypingStatus(selectedCandidate.id, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(selectedCandidate.id, false);
      }, 1500);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedCandidate) return;
    try {
      const res = await fetch(`${apiUrl}/api/v1/workspace/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify({
          candidate_id: selectedCandidate.id,
          content: commentText,
          is_private: commentIsPrivate
        })
      });
      if (res.ok) {
        setCommentText('');
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        sendTypingStatus(selectedCandidate.id, false);
        fetchComments(selectedCandidate.id);
        showToast('Timeline note posted successfully', 'success');
      }
    } catch (err) {
      showToast('Failed to post comment', 'error');
    }
  };

  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    try {
      const res = await fetch(`${apiUrl}/api/v1/workspace/kits/evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify({
          candidate_id: selectedCandidate.id,
          scores: { technical: technicalScore, behavioral: behavioralScore },
          overall_recommendation: recVerdict,
          comments: scorecardComments
        })
      });
      if (res.ok) {
        setScorecardComments('');
        fetchEvaluations(selectedCandidate.id);
        showToast('Evaluation scorecard submitted', 'success');
      }
    } catch (err) {
      showToast('Failed to submit evaluation', 'error');
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    try {
      const res = await fetch(`${apiUrl}/api/v1/workspace/emails/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify({
          candidate_id: selectedCandidate.id,
          template_type: emailTemplateType,
          custom_subject: emailSubject,
          custom_body: emailBody
        })
      });
      if (res.ok) {
        setEmailSubject('');
        setEmailBody('');
        fetchEmailLogs(selectedCandidate.id);
        showToast('Templated email enqueued in background delivery queue', 'success');
      }
    } catch (err) {
      showToast('Failed to deliver email', 'error');
    }
  };

  const toggleShortlist = (id: string) => {
    setCandidates(prev =>
      prev.map(c => (c.id === id ? { ...c, shortlisted: !c.shortlisted } : c))
    );
    const item = candidates.find(c => c.id === id);
    if (item) {
      showToast(item.shortlisted ? 'Removed from shortlist' : 'Added to shortlist', 'success');
    }
  };

  const handleCompare = async () => {
    if (compareIds.length < 2) {
      showToast('Please select at least 2 candidates to compare', 'error');
      return;
    }
    setLoadingCompare(true);
    setShowComparison(true);
    const reports: Record<string, IntelligenceReport> = {};
    try {
      const jobId = '00000000-0000-0000-0000-000000000000';
      await Promise.all(
        compareIds.map(async id => {
          const res = await fetch(
            `${apiUrl}/api/v1/candidate-intelligence/recommendations/${id}?job_id=${jobId}`,
            { headers: headers() }
          );
          if (res.ok) {
            const data = await res.json();
            reports[id] = {
              overall_recommendation: data.overall_recommendation,
              strengths: data.strengths,
              weaknesses: data.weaknesses,
              risk_factors: data.risk_factors,
              reasoning: data.reasoning
            };
          }
        })
      );
      setCompareReports(reports);
    } catch (err) {
      showToast('Comparison fetching failed', 'error');
    } finally {
      setLoadingCompare(false);
    }
  };

  const handleToggleCompareSelection = (id: string) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const processed = candidates
    .filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesShortlist = !shortlistedOnly || c.shortlisted;
      return matchesSearch && matchesShortlist;
    })
    .sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];
      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

  const itemsPerPage = 8;
  const totalPages = Math.ceil(processed.length / itemsPerPage);
  const paginated = processed.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="min-h-screen p-8 text-white flex flex-col gap-6" style={{ fontFamily: THEME_TOKENS.typography.fontFamily }}>
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl text-sm font-medium transition-all ${toast.type === 'success' ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}`}>
          {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: gold }}>
            Talent Pool
          </span>
          <h1 className="text-3xl font-bold tracking-tight mt-1">Candidates Directory</h1>
        </div>

        {compareIds.length >= 2 && (
          <button
            onClick={handleCompare}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 bg-yellow-500 text-black shadow-lg"
            style={{ backgroundColor: gold }}
          >
            <Sparkles size={16} /> Compare Selected ({compareIds.length})
          </button>
        )}
      </div>

      {/* Filters/Sorting */}
      <div className="flex flex-col md:flex-row items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs flex-grow max-w-sm"
          style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <Search size={14} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search candidates or skills..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
            className="bg-transparent text-white focus:outline-none placeholder-gray-600 w-full"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShortlistedOnly(!shortlistedOnly)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${shortlistedOnly ? 'text-black bg-white border-white' : 'text-gray-500 hover:text-white border-white/10'}`}
          >
            Shortlisted Only
          </button>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-lg border text-xs bg-transparent text-white focus:outline-none"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <option value="score" style={{ backgroundColor: '#0f0f10' }}>Sort by Score</option>
            <option value="name" style={{ backgroundColor: '#0f0f10' }}>Sort by Name</option>
            <option value="created_at" style={{ backgroundColor: '#0f0f10' }}>Sort by Date Joined</option>
          </select>

          <button
            onClick={() => setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'))}
            className="px-3 py-2 rounded-lg border text-xs hover:text-white transition-colors"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          >
            {sortOrder.toUpperCase()}
          </button>
        </div>
      </div>

      {/* Main Grid: Directory + Info Side Drawer */}
      <div className="flex-grow flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* Table directory */}
        <div className="flex-1 flex flex-col rounded-2xl border bg-black/40 overflow-hidden min-h-[400px]"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          
          {loading ? (
            <div className="flex-grow flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-yellow-500" style={{ color: gold }} />
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center gap-4 text-center py-20">
              <Users size={32} className="text-gray-700" />
              <div>
                <p className="text-sm font-semibold">No candidates found</p>
                <p className="text-xs text-gray-500 mt-1">Try updating your filters or search keywords</p>
              </div>
            </div>
          ) : (
            <div className="flex-grow overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-800 text-[10px] font-bold uppercase tracking-wider text-gray-500" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    <th className="p-4 w-12 text-center">Compare</th>
                    <th className="p-4">Candidate</th>
                    <th className="p-4">Skills</th>
                    <th className="p-4">Match Score</th>
                    <th className="p-4 text-center">Shortlist</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {paginated.map((c, i) => {
                    const isOnline = onlineUsers[c.id] === 'online' || i % 4 === 0;
                    return (
                      <tr key={c.id} className={`transition-all hover:bg-white/[0.01] cursor-pointer ${selectedCandidate?.id === c.id ? 'bg-white/[0.03]' : ''}`}
                        onClick={() => handleSelectCandidate(c)}>
                        <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={compareIds.includes(c.id)}
                            onChange={() => handleToggleCompareSelection(c.id)}
                            className="rounded border-gray-800 bg-transparent text-yellow-500 focus:ring-0 focus:ring-offset-0"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-black text-[10px]"
                                style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                                {c.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-black ${isOnline ? 'bg-green-500' : 'bg-gray-600'}`} />
                            </div>
                            <div>
                              <div className="font-semibold text-white text-sm">{c.name}</div>
                              <div className="text-gray-500 text-[10px] mt-0.5">{c.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1.5 flex-wrap">
                            {c.skills.map(s => (
                              <span key={s} className="px-1.5 py-0.5 rounded border border-gray-800 bg-black/35 text-[9px] text-gray-400">
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 font-mono font-bold text-sm" style={{ color: c.score >= 90 ? '#34d399' : c.score >= 75 ? gold : '#f87171' }}>
                          {c.score}%
                        </td>
                        <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                          <button onClick={() => toggleShortlist(c.id)}
                            className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${c.shortlisted ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-500' : 'border-gray-800 hover:border-gray-600 text-gray-600 hover:text-white'}`}>
                            <Check size={11} />
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <ChevronRight size={14} className="text-gray-600 inline" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-800 flex justify-between items-center text-xs shrink-0">
              <span className="text-gray-500">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded border border-gray-800 text-[10px] hover:text-white disabled:opacity-30">
                  PREV
                </button>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded border border-gray-800 text-[10px] hover:text-white disabled:opacity-30">
                  NEXT
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 360° Candidate Console (Right Rail Drawer) */}
        {selectedCandidate && (
          <div className="w-full lg:w-[480px] rounded-2xl border bg-black/60 p-5 flex flex-col gap-4 h-[620px] overflow-y-auto"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-gray-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">{selectedCandidate.name}</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">{selectedCandidate.phone}</p>
              </div>
              <button onClick={() => setSelectedCandidate(null)} className="text-xs text-gray-500 hover:text-white font-bold">CLOSE</button>
            </div>

            {/* Tab navigation */}
            <div className="flex gap-1.5 border-b border-gray-800 pb-2 text-[10px] font-bold overflow-x-auto">
              {['overview', 'resume', 'activities', 'collaboration', 'scorecard', 'emails'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-2 py-1 rounded transition-colors uppercase shrink-0 ${activeTab === tab ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  style={activeTab === tab ? { backgroundColor: gold } : {}}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] text-gray-500 block">Salary expectations</span>
                    <span className="font-semibold text-white mt-1 block">$145,000 / year</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 block">Availability</span>
                    <span className="font-semibold text-white mt-1 block">Immediate (2 weeks notice)</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 block">LinkedIn Profile</span>
                    <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-yellow-500 hover:underline mt-1 block">linkedin.com/in/{selectedCandidate.name.split(' ')[0].toLowerCase()}</a>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 block">GitHub portfolio</span>
                    <a href="https://github.com" target="_blank" rel="noreferrer" className="text-yellow-500 hover:underline mt-1 block">github.com/{selectedCandidate.name.split(' ')[0].toLowerCase()}</a>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 block">Recruiter owner</span>
                    <span className="font-semibold text-white mt-1 block">Staff Recruiter</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 block">Candidate status</span>
                    <span className="text-green-400 font-semibold mt-1 block">Active screening</span>
                  </div>
                </div>

                <div className="border-t border-gray-900 pt-3">
                  <span className="text-[9px] text-gray-500 block mb-1">Tags</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {selectedCandidate.skills.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-[10px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Resume & AI */}
            {activeTab === 'resume' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Sparkles size={11} style={{ color: gold }} />
                    AI recommendation
                  </h4>

                  {loadingReport ? (
                    <div className="py-8 flex justify-center">
                      <Loader2 size={20} className="animate-spin text-yellow-500" />
                    </div>
                  ) : aiReport ? (
                    <div className="space-y-3 text-xs">
                      <div className={`text-[10px] font-bold px-3 py-2 rounded-lg flex items-center gap-2 ${aiReport.overall_recommendation === 'hire' ? 'text-green-400 bg-green-400/10' : 'text-yellow-400 bg-yellow-400/10'}`}>
                        Verdict: {aiReport.overall_recommendation.toUpperCase()}
                      </div>
                      <div className="p-3 rounded-lg border bg-green-500/[0.01] border-green-500/10 leading-relaxed">
                        <span className="text-[9px] font-bold text-green-400 block uppercase">Key Strengths</span>
                        <p className="mt-1 text-gray-300">{aiReport.strengths.technical || aiReport.reasoning}</p>
                      </div>
                      <div className="p-3 rounded-lg border bg-red-500/[0.01] border-red-500/10 leading-relaxed">
                        <span className="text-[9px] font-bold text-red-400 block uppercase">Risk Factors</span>
                        <p className="mt-1 text-gray-300">{aiReport.weaknesses.languages || 'Ensure alignment on active engineering frameworks.'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 italic">No AI recommendation report found.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: Activities */}
            {activeTab === 'activities' && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Clock size={11} />
                  System activity log
                </h4>
                <div className="space-y-2 max-h-[400px] overflow-y-auto text-xs font-mono text-gray-400">
                  <div className="p-2 border-b border-gray-900">
                    <span className="text-[9px] text-gray-600">2h ago</span>
                    <p className="mt-0.5">Resume parsed: Extracted ML, Python skills</p>
                  </div>
                  <div className="p-2 border-b border-gray-900">
                    <span className="text-[9px] text-gray-600">1 day ago</span>
                    <p className="mt-0.5">Candidate profile initialized</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Collaboration */}
            {activeTab === 'collaboration' && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <MessageSquare size={11} /> Threaded internal notes & comments
                </h4>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {comments.map((c) => (
                    <div key={c.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs">
                      <div className="flex justify-between items-center mb-1 text-[9px] text-gray-500">
                        <span className="font-semibold text-gray-300">{c.author_name}</span>
                        <span>{new Date(c.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-300 mt-0.5 leading-normal">{c.content}</p>
                      {c.is_private && (
                        <span className="mt-1 flex items-center gap-1 text-[8px] uppercase tracking-wider text-yellow-500 font-bold">
                          <Lock size={8} /> Private Note
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <form onSubmit={handlePostComment} className="space-y-2 mt-2">
                  {/* Typing status alerts indicator */}
                  {typingUsers[selectedCandidate.id]?.length > 0 && (
                    <span className="text-[10px] text-yellow-500 animate-pulse block mb-1">
                      {typingUsers[selectedCandidate.id].join(', ')} typing...
                    </span>
                  )}
                  <textarea
                    placeholder="Type note (use @name to mention team members)..."
                    value={commentText}
                    onChange={(e) => handleCommentChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-black/40 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-yellow-500/50 h-16"
                  />
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-1.5 text-[10px] text-gray-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={commentIsPrivate}
                        onChange={(e) => setCommentIsPrivate(e.target.checked)}
                        className="rounded bg-transparent border-gray-800 text-yellow-500 focus:ring-0 focus:ring-offset-0"
                      />
                      Make Private Note
                    </label>
                    <button type="submit" className="px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5" style={{ backgroundColor: gold, color: '#0a0a0b' }}>
                      <Send size={11} /> POST
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB CONTENT: Scorecard */}
            {activeTab === 'scorecard' && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Clipboard size={11} /> Scorecard evaluations
                </h4>

                <div className="space-y-3 max-h-[220px] overflow-y-auto">
                  {evaluations.map((e) => (
                    <div key={e.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs">
                      <div className="flex justify-between items-center text-[9px] text-gray-500 mb-1">
                        <span className="font-semibold text-gray-300">Interviewer: {e.interviewer_name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${e.overall_recommendation === 'hire' ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                          {e.overall_recommendation}
                        </span>
                      </div>
                      <div className="flex gap-4 font-mono text-[10px] text-yellow-500 my-1">
                        <span>Technical: {e.scores?.technical}%</span>
                        <span>Behavioral: {e.scores?.behavioral}%</span>
                      </div>
                      <p className="text-gray-400 italic mt-1 leading-normal">&quot;{e.comments}&quot;</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSubmitEvaluation} className="space-y-3 border-t border-gray-900 pt-3">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-[9px] text-gray-500 block mb-1">Technical Score: {technicalScore}%</label>
                      <input type="range" min="10" max="100" value={technicalScore} onChange={(e) => setTechnicalScore(Number(e.target.value))} className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-500 block mb-1">Behavioral Score: {behavioralScore}%</label>
                      <input type="range" min="10" max="100" value={behavioralScore} onChange={(e) => setBehavioralScore(Number(e.target.value))} className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer" />
                    </div>
                  </div>

                  <div className="text-xs">
                    <label className="text-[9px] text-gray-500 block mb-1">Recommendation Verdict</label>
                    <select value={recVerdict} onChange={(e) => setRecVerdict(e.target.value)} className="w-full px-3 py-1.5 bg-black border border-gray-800 rounded-lg text-white focus:outline-none">
                      <option value="hire">Recommend Hire</option>
                      <option value="watch">Watch / Hold</option>
                      <option value="reject">Reject</option>
                    </select>
                  </div>

                  <div className="text-xs">
                    <label className="text-[9px] text-gray-500 block mb-1">Evaluation comments</label>
                    <textarea value={scorecardComments} onChange={(e) => setScorecardComments(e.target.value)} required placeholder="Provide structured candidate feedback..." className="w-full px-3 py-1.5 bg-black/40 border border-gray-800 rounded-lg text-white focus:outline-none h-12" />
                  </div>

                  <button type="submit" className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider" style={{ backgroundColor: gold, color: '#0a0a0b' }}>
                    Submit evaluation scorecard
                  </button>
                </form>
              </div>
            )}

            {/* TAB CONTENT: Emails */}
            {activeTab === 'emails' && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Mail size={11} /> Recruiter CRM communications log
                </h4>

                <div className="space-y-2 max-h-[160px] overflow-y-auto">
                  {emailLogs.map((l) => (
                    <div key={l.id} className="p-2.5 rounded-xl border border-white/[0.04] bg-white/[0.01] text-xs flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-gray-300 uppercase tracking-wider text-[10px]">{l.type} email</span>
                        <span className="text-[9px] text-gray-600 block mt-0.5">{new Date(l.sent_at).toLocaleString()}</span>
                      </div>
                      <div className="text-right text-[10px] font-mono text-gray-400">
                        <span className="flex items-center gap-1"><Eye size={10} /> {l.opens} opens</span>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendEmail} className="space-y-3 border-t border-gray-900 pt-3">
                  <div className="text-xs">
                    <label className="text-[9px] text-gray-500 block mb-1">Select email template</label>
                    <select value={emailTemplateType} onChange={(e) => setEmailTemplateType(e.target.value)} className="w-full px-3 py-1.5 bg-black border border-gray-800 rounded-lg text-white focus:outline-none">
                      <option value="invitation">Interview Invitation template</option>
                      <option value="offer">Standard Offer template</option>
                      <option value="rejection">Polite Rejection template</option>
                    </select>
                  </div>

                  <div className="text-xs">
                    <label className="text-[9px] text-gray-500 block mb-1">Email Subject</label>
                    <input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} required placeholder="Subject line..." className="w-full px-3 py-1.5 bg-black/40 border border-gray-800 rounded-lg text-white focus:outline-none" />
                  </div>

                  <div className="text-xs">
                    <label className="text-[9px] text-gray-500 block mb-1">Custom Message body</label>
                    <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} required placeholder="Dear {{candidate_name}}, ..." className="w-full px-3 py-1.5 bg-black/40 border border-gray-800 rounded-lg text-white focus:outline-none h-16" />
                  </div>

                  <button type="submit" className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5" style={{ backgroundColor: gold, color: '#0a0a0b' }}>
                    <Send size={12} /> Send template email
                  </button>
                </form>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Comparison Drawer side-by-side Modal */}
      {showComparison && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-5xl rounded-2xl border bg-black/95 p-6 flex flex-col gap-6"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Sparkles size={18} style={{ color: gold }} />
                AI Scorecard Comparison Matrix
              </h3>
              <button onClick={() => setShowComparison(false)} className="text-xs text-gray-500 hover:text-white font-bold">CLOSE</button>
            </div>

            {loadingCompare ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3">
                <Loader2 size={36} className="animate-spin text-yellow-500" />
                <p className="text-xs text-gray-500">Synthesizing scorecard matrix...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto max-h-[500px]">
                {compareIds.map(id => {
                  const c = candidates.find(item => item.id === id);
                  const r = compareReports[id];
                  if (!c) return null;

                  return (
                    <div key={id} className="p-5 rounded-xl border flex flex-col gap-4 bg-white/[0.01]" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <div className="border-b border-gray-900 pb-2.5">
                        <span className="text-[10px] font-bold text-yellow-500 font-mono" style={{ color: gold }}>Overall Match: {c.score}%</span>
                        <h4 className="font-bold text-sm text-white mt-1">{c.name}</h4>
                        <p className="text-[9px] text-gray-600 truncate">{c.email}</p>
                      </div>

                      {r ? (
                        <div className="space-y-4 text-xs">
                          <div>
                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">AI Verdict</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${r.overall_recommendation === 'hire' ? 'text-green-400 bg-green-400/10' : 'text-yellow-400 bg-yellow-400/10'}`}>
                              {r.overall_recommendation.toUpperCase()}
                            </span>
                          </div>

                          <div>
                            <span className="text-[9px] font-bold text-green-400 uppercase tracking-wider block mb-1">Key Strength</span>
                            <p className="text-gray-300 leading-normal">{r.strengths.technical || r.reasoning}</p>
                          </div>

                          <div>
                            <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider block mb-1">Risk Factors</span>
                            <p className="text-gray-300 leading-normal">{r.risk_factors.retention || 'No retention issues flagged.'}</p>
                          </div>

                          <div className="p-3 rounded bg-black/40 border border-gray-900 leading-normal text-gray-400 italic">
                            &quot;{r.reasoning}&quot;
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-700 italic">Failed loading report details.</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
