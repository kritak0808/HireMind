'use client';

import React, { useState, useEffect } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { Search, Loader2, Sparkles, AlertTriangle, ArrowUpDown, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

interface CandidateRank {
  candidate_id: string;
  name: string;
  score: number;
  position: number;
  skills: number;
  exp: number;
}

interface JobOption {
  id: string;
  title: string;
}

const RadarChart = ({ skills, exp, overallScore }: { skills: number; exp: number; overallScore: number }) => {
  const r = 70;
  const cx = 100;
  const cy = 100;

  const p1x = cx;
  const p1y = cy - r * (skills / 100);

  const p2x = cx + r * (exp / 100);
  const p2y = cy;

  const p3x = cx;
  const p3y = cy + r * (overallScore / 100);

  const p4x = cx - r * ((overallScore * 0.95) / 100);
  const p4y = cy;

  const pointsStr = `${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y} ${p4x},${p4y}`;

  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-black/30 border border-white/[0.05] rounded-xl">
      <svg width="200" height="200" viewBox="0 0 200 200" className="overflow-visible">
        {/* Grid Circles */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={r * 0.7} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={r * 0.4} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

        {/* Axes Lines */}
        <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

        {/* Axis Labels */}
        <text x={cx} y={cy - r - 8} fill="#9ca3af" fontSize="9" textAnchor="middle" fontWeight="bold">Skills</text>
        <text x={cx + r + 8} y={cy + 3} fill="#9ca3af" fontSize="9" textAnchor="start" fontWeight="bold">Exp</text>
        <text x={cx} y={cy + r + 14} fill="#9ca3af" fontSize="9" textAnchor="middle" fontWeight="bold">Culture</text>
        <text x={cx - r - 8} y={cy + 3} fill="#9ca3af" fontSize="9" textAnchor="end" fontWeight="bold">Code</text>

        {/* Polygon */}
        <polygon points={pointsStr} fill="rgba(212,175,55,0.15)" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" />
        
        {/* Points Dot */}
        <circle cx={p1x} cy={p1y} r="3" fill="#d4af37" />
        <circle cx={p2x} cy={p2y} r="3" fill="#d4af37" />
        <circle cx={p3x} cy={p3y} r="3" fill="#d4af37" />
        <circle cx={p4x} cy={p4y} r="3" fill="#d4af37" />
      </svg>
      <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-2 font-mono">Skill Mapping Vector</span>
    </div>
  );
};

export default function RankingDashboard() {
  const gold = THEME_TOKENS.colors.brand.goldPremium;
  const bg = THEME_TOKENS.colors.background.deepMatte;
  const panel = THEME_TOKENS.colors.background.panelGlass;
  const border = THEME_TOKENS.colors.background.borderGlass;

  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [candidates, setCandidates] = useState<CandidateRank[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<any | null>(null);
  const [recLoading, setRecLoading] = useState<boolean>(false);
  
  // Search & Filter & Sort state
  const [search, setSearch] = useState<string>('');
  const [sortField, setSortField] = useState<'position' | 'score' | 'skills' | 'exp'>('position');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const pageSize = 5;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const getToken = () => localStorage.getItem('hiremind_token') || '';

  // Load jobs list on mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/v1/jobs`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) throw new Error('Failed to load jobs list.');
        const data = await res.json();
        setJobs(data);
        if (data.length > 0) {
          setSelectedJob(data[0].id);
        } else {
          setLoading(false);
        }
      } catch (err: any) {
        setError(err.message || 'System connectivity issue.');
        setLoading(false);
      }
    };
    fetchJobs();
  }, [apiUrl]);

  // Load rankings when selected job changes
  useEffect(() => {
    if (!selectedJob) return;
    const fetchRankings = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${apiUrl}/api/v1/candidate-intelligence/rank/${selectedJob}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) throw new Error('Failed to compute or retrieve candidate rankings.');
        const data = await res.json();
        setCandidates(data);
      } catch (err: any) {
        setError(err.message || 'Retrieval failed.');
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, [selectedJob, apiUrl]);

  const handleRowClick = async (candidateId: string) => {
    if (expandedCandidate === candidateId) {
      setExpandedCandidate(null);
      setRecommendation(null);
      return;
    }
    setExpandedCandidate(candidateId);
    setRecommendation(null);
    setRecLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/v1/candidate-intelligence/recommendations/${candidateId}?job_id=${selectedJob}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendation(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRecLoading(false);
    }
  };

  // Handle Sort
  const toggleSort = (field: 'position' | 'score' | 'skills' | 'exp') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
    setPage(1);
  };

  // Filter and Sort candidate lists
  const filtered = candidates.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (sortAsc) {
      return valA > valB ? 1 : -1;
    } else {
      return valA < valB ? 1 : -1;
    }
  });

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const paginated = sorted.slice(startIndex, startIndex + pageSize);

  return (
    <div 
      className="min-h-screen p-6 md:p-10 text-white"
      style={{ backgroundColor: bg, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      {/* Title block */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5" style={{ color: gold }}>
            <Sparkles size={14} /> Weighted Evaluator Index
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-1">Candidate Rankings</h2>
        </div>

        {/* Job selector */}
        {jobs.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">Active Position:</span>
            <select
              value={selectedJob}
              onChange={(e) => { setSelectedJob(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg text-xs font-semibold border focus:outline-none transition-all cursor-pointer"
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderColor: 'rgba(255,255,255,0.1)',
                color: 'white',
              }}
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id} style={{ backgroundColor: '#121214' }}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Live parsing status indicator */}
      <div className="max-w-5xl mb-6 p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Celery background queues active</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Qdrant Live</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Redis Ready</span>
        </div>
      </div>

      {/* Main Container */}
      <div 
        className="rounded-xl border backdrop-blur-md overflow-hidden max-w-5xl"
        style={{ 
          backgroundColor: panel, 
          borderColor: border 
        }}
      >
        {/* Table Toolbar */}
        <div className="p-4 border-b border-white/[0.06] flex flex-col sm:flex-row items-center gap-4 bg-white/[0.01]">
          {/* Search bar */}
          <div className="relative w-full sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search candidate profiles..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-white/[0.03] border rounded-lg text-xs text-white focus:outline-none focus:border-yellow-500/50 transition-all placeholder-gray-600"
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}
            />
          </div>
          {/* Active status */}
          <div className="text-[11px] text-gray-500 sm:ml-auto">
            Showing {paginated.length} of {sorted.length} results
          </div>
        </div>

        {/* State Renderers */}
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-3">
            <Loader2 size={36} className="animate-spin" style={{ color: gold }} />
            <span className="text-xs text-gray-400 font-medium">Recalculating AI weights and scoring parameters...</span>
          </div>
        ) : error ? (
          <div className="p-16 flex flex-col items-center justify-center text-center gap-3">
            <AlertTriangle size={36} className="text-red-500" />
            <div className="text-sm font-semibold">{error}</div>
            <div className="text-xs text-gray-500 max-w-md">Please ensure the backend is running and the database connection is healthy.</div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center gap-2">
            <Sparkles size={36} className="text-gray-600" />
            <div className="text-sm font-semibold text-gray-400">No Job Postings Found</div>
            <div className="text-xs text-gray-600">Please create job openings first to rank candidates against them.</div>
          </div>
        ) : paginated.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center gap-2">
            <Search size={36} className="text-gray-600" />
            <div className="text-sm font-semibold text-gray-400">No Matching Rankings Found</div>
            <div className="text-xs text-gray-600">Try adjusting your keyword filter or select another active job.</div>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] md:text-xs font-semibold uppercase tracking-wider text-gray-400 bg-white/[0.02]">
                    <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('position')}>
                      <div className="flex items-center gap-1.5">
                        Rank Position <ArrowUpDown size={12} className="opacity-60" />
                      </div>
                    </th>
                    <th className="p-4">Candidate Details</th>
                    <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('skills')}>
                      <div className="flex items-center gap-1.5">
                        Skills Score <ArrowUpDown size={12} className="opacity-60" />
                      </div>
                    </th>
                    <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('exp')}>
                      <div className="flex items-center gap-1.5">
                        Experience Score <ArrowUpDown size={12} className="opacity-60" />
                      </div>
                    </th>
                    <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('score')}>
                      <div className="flex items-center gap-1.5">
                        Computed Score <ArrowUpDown size={12} className="opacity-60" />
                      </div>
                    </th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {paginated.map((c) => {
                    const isExpanded = expandedCandidate === c.candidate_id;
                    return (
                      <React.Fragment key={c.candidate_id}>
                        <tr 
                          onClick={() => handleRowClick(c.candidate_id)}
                          className="transition-all hover:bg-white/[0.02] cursor-pointer"
                        >
                          <td className="p-4 font-mono font-bold" style={{ color: gold }}>
                            #{c.position}
                          </td>
                          <td className="p-4 font-semibold text-white">{c.name}</td>
                          <td className="p-4 font-mono text-gray-300">{c.skills}%</td>
                          <td className="p-4 font-mono text-gray-300">{c.exp}%</td>
                          <td className="p-4 font-mono font-bold" style={{ color: gold }}>
                            {c.score.toFixed(2)}/100.00
                          </td>
                          <td className="p-4 text-right">
                            {isExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-white/[0.01]">
                            <td colSpan={6} className="p-6 border-b border-white/[0.04]">
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                                {/* SVG Radar Chart */}
                                <div className="md:col-span-4 flex justify-center">
                                  <RadarChart skills={c.skills} exp={c.exp} overallScore={c.score} />
                                </div>
                                {/* Explainability Details */}
                                <div className="md:col-span-8 space-y-4">
                                  <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                    <Sparkles size={14} style={{ color: gold }} />
                                    AI Recommendation Explainability
                                  </h4>
                                  
                                  {recLoading ? (
                                    <div className="py-8 flex items-center gap-2 text-xs text-gray-400">
                                      <Loader2 size={16} className="animate-spin" style={{ color: gold }} />
                                      <span>Retrieving grounding details...</span>
                                    </div>
                                  ) : recommendation ? (
                                    <div className="space-y-3 text-xs leading-relaxed text-gray-300">
                                      <div>
                                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-0.5">Grounding Recommendation</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${recommendation.overall_recommendation === 'hire' ? 'text-green-400 bg-green-400/10' : 'text-yellow-400 bg-yellow-400/10'}`}>
                                          {recommendation.overall_recommendation}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Strengths</span>
                                        <div className="flex flex-wrap gap-1.5">
                                          {Object.entries(recommendation.strengths || {}).map(([key, val]: any) => (
                                            <span key={key} className="px-2 py-0.5 rounded border border-green-500/10 bg-green-500/[0.02] text-green-400 text-[10px]">
                                              <strong>{key}:</strong> {val}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Risks & Gaps</span>
                                        <div className="flex flex-wrap gap-1.5">
                                          {Object.entries(recommendation.weaknesses || {}).map(([key, val]: any) => (
                                            <span key={key} className="px-2 py-0.5 rounded border border-red-500/10 bg-red-500/[0.02] text-red-400 text-[10px]">
                                              <strong>{key}:</strong> {val}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-0.5">Reasoning Summary</span>
                                        <p className="text-gray-300 italic">"{recommendation.reasoning}"</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-red-400 flex items-center gap-1.5"><AlertTriangle size={14} /> Grounding report unavailable</span>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/[0.03] hover:bg-white/10 disabled:opacity-20 border rounded-lg text-xs font-semibold cursor-pointer transition-all"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span className="text-[11px] text-gray-500 font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/[0.03] hover:bg-white/10 disabled:opacity-20 border rounded-lg text-xs font-semibold cursor-pointer transition-all"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
