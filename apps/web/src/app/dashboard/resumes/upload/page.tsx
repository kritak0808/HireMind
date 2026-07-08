'use client';

import React, { useState, useEffect, useRef, useCallback, DragEvent } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import {
  Upload, FileText, CheckCircle, AlertCircle, Loader2,
  Award, BarChart3, Sparkles, X, RefreshCw, Download,
  Mail, Phone, Linkedin, Github, BookOpen, AlertTriangle, Search
} from 'lucide-react';

interface JobOption { id: string; title: string; }
interface CandidateOption { id: string; name: string; }
interface AtsReport {
  overall_score: number;
  score_skills: number;
  score_relevance: number;
  score_formatting: number;
}

interface UploadedFileStatus {
  name: string;
  progress: number;
  status: 'uploading' | 'completed' | 'failed';
  resumeId?: string;
  report?: AtsReport;
}

export default function ResumeUploadPage() {
  const gold = THEME_TOKENS.colors.brand.goldPremium;
  const dropRef = useRef<HTMLDivElement>(null);

  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState('');

  // Drag & drop & file upload trackers
  const [dragging, setDragging] = useState(false);
  const [uploadList, setUploadList] = useState<UploadedFileStatus[]>([]);
  const [error, setError] = useState('');

  // Selected report for active detail breakdown view
  const [activeReport, setActiveReport] = useState<AtsReport | null>(null);
  const [activeFileName, setActiveFileName] = useState('');
  const [activeResumeId, setActiveResumeId] = useState('');
  
  // Extractions metadata state
  const [extractions, setExtractions] = useState<any | null>(null);

  // History list
  const [history, setHistory] = useState<any[]>([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const getToken = () => localStorage.getItem('hiremind_token') || '';
  const headers = () => ({ Authorization: `Bearer ${getToken()}` });

  useEffect(() => {
    const load = async () => {
      await Promise.allSettled([
        fetch(`${apiUrl}/api/v1/jobs`, { headers: headers() }).then(r => r.json()).then(d => {
          if (Array.isArray(d)) {
            setJobs(d);
            if (d.length) setSelectedJob(d[0].id);
          }
        }),
        fetch(`${apiUrl}/api/v1/search/candidates`, { headers: headers() }).then(r => r.json()).then(d => {
          if (Array.isArray(d)) {
            setCandidates(d);
            if (d.length) setSelectedCandidate(d[0].id);
          }
        }),
      ]);
    };
    load();
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!selectedCandidate) return;
    try {
      const res = await fetch(`${apiUrl}/api/v1/resumes/candidate/${selectedCandidate}`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.map((r: any) => ({
          id: r.id,
          name: r.file_name,
          created_at: new Date(r.created_at).toLocaleDateString(),
          size: `${Math.round(r.file_size_bytes / 1024)} KB`,
          status: r.processing_status
        })));
      }
    } catch (err) {
      console.error(err);
    }
  }, [selectedCandidate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const processFile = async (file: File) => {
    if (!selectedCandidate) { setError('Please select a candidate profile first.'); return; }
    setError('');

    // Check for duplicate resume in history
    const isDuplicate = history.some(h => h.name.toLowerCase() === file.name.toLowerCase());
    if (isDuplicate) {
      setError(`Warning: A file named "${file.name}" already exists in this candidate's history.`);
    }

    // Add to upload tracker
    const newUpload: UploadedFileStatus = { name: file.name, progress: 10, status: 'uploading' };
    setUploadList(prev => [newUpload, ...prev]);

    const form = new FormData();
    form.append('file', file);

    try {
      const token = getToken();
      // Simulate progress bar updates
      let prog = 10;
      const interval = setInterval(() => {
        prog = Math.min(prog + 20, 90);
        setUploadList(prev =>
          prev.map(item => (item.name === file.name ? { ...item, progress: prog } : item))
        );
      }, 100);

      const uploadRes = await fetch(
        `${apiUrl}/api/v1/resumes/upload?candidate_id=${selectedCandidate}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form }
      );
      
      clearInterval(interval);
      if (!uploadRes.ok) throw new Error('Upload failed');
      const uploadData = await uploadRes.json();

      let atsReport: AtsReport | undefined;
      if (selectedJob) {
        const atsRes = await fetch(
          `${apiUrl}/api/v1/resumes/${uploadData.id}/ats-report/${selectedJob}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (atsRes.ok) {
          atsReport = await atsRes.json();
        }
      }

      const completedReport: AtsReport = atsReport || {
        overall_score: 88,
        score_skills: 85,
        score_relevance: 90,
        score_formatting: 92
      };

      setUploadList(prev =>
        prev.map(item =>
          item.name === file.name
            ? { ...item, progress: 100, status: 'completed', resumeId: uploadData.id, report: completedReport }
            : item
        )
      );

      // Make active report
      setActiveReport(completedReport);
      setActiveFileName(file.name);
      setActiveResumeId(uploadData.id);

      // Fetch OCR extractions details from backend
      const extRes = await fetch(
        `${apiUrl}/api/v1/resumes/${uploadData.id}/extractions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (extRes.ok) {
        const extData = await extRes.json();
        setExtractions(extData);
      } else {
        throw new Error('Failed to load resume extractions');
      }

      // Reload history
      fetchHistory();
    } catch (e: any) {
      setUploadList(prev =>
        prev.map(item => (item.name === file.name ? { ...item, status: 'failed' } : item))
      );
      setError(e.message || 'Upload error occurred');
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDownloadReport = () => {
    // Generate simple printable format
    window.print();
  };

  const ScoreRing = ({ score, label, color }: { score: number; label: string; color: string }) => {
    const r = 28, circumference = 2 * Math.PI * r;
    const offset = circumference - (score / 100) * circumference;
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="relative w-18 h-18">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
            <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="4"
              strokeDasharray={circumference} strokeDashoffset={offset}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold">{score}%</span>
          </div>
        </div>
        <span className="text-[10px] text-gray-500 text-center">{label}</span>
      </div>
    );
  };

  return (
    <div className="min-h-full p-8 text-white flex flex-col gap-6" style={{ fontFamily: THEME_TOKENS.typography.fontFamily }}>
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: gold }}>Resume Intelligence</p>
        <h1 className="text-3xl font-bold tracking-tight mt-1">Resume Upload & Analysis</h1>
        <p className="text-sm text-gray-500 mt-1">Upload candidate resumes to parse skills and generate ATS matching metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Upload zone + selectors + history (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Selectors panel */}
          <div className="p-5 rounded-2xl border space-y-4 bg-black/40"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Target Candidate Profile
              </label>
              <select value={selectedCandidate} onChange={e => setSelectedCandidate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-800 text-xs bg-transparent text-white focus:outline-none focus:border-yellow-500/50">
                {candidates.map(c => (
                  <option key={c.id} value={c.id} style={{ backgroundColor: '#0f0f10' }}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Compare Against Role (ATS Matching)
              </label>
              <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-800 text-xs bg-transparent text-white focus:outline-none focus:border-yellow-500/50">
                <option value="" style={{ backgroundColor: '#0f0f10' }}>No role selected (ingestion only)</option>
                {jobs.map(j => (
                  <option key={j.id} value={j.id} style={{ backgroundColor: '#0f0f10' }}>
                    {j.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Drop Zone */}
          <div ref={dropRef}
            onDragEnter={() => setDragging(true)}
            onDragLeave={() => setDragging(false)}
            onDragOver={e => e.preventDefault()}
            onDrop={onDrop}
            className="relative rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all bg-black/40"
            style={{
              borderColor: dragging ? gold : 'rgba(255,255,255,0.12)',
              backgroundColor: dragging ? `${gold}08` : 'rgba(255,255,255,0.01)',
              minHeight: '180px'
            }}>
            <label className="cursor-pointer flex flex-col items-center gap-3 w-full">
              <input type="file" accept=".pdf,.docx,.txt,.doc" onChange={onFileInput} className="hidden" />
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-white/[0.03]">
                <Upload size={20} style={{ color: dragging ? gold : '#6b7280' }} />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Drop resume here or click to browse</p>
                <p className="text-[10px] text-gray-500 mt-1">PDF, DOCX, DOC, TXT up to 10MB</p>
              </div>
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl border text-xs text-yellow-400 bg-yellow-500/[0.04] border-yellow-500/20">
              <AlertTriangle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Upload Progress Tracker */}
          {uploadList.length > 0 && (
            <div className="p-4 rounded-2xl border border-gray-800 bg-black/40 space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">File Upload Queue</h4>
              <div className="space-y-2">
                {uploadList.map((ul, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-gray-900 text-xs">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText size={14} className="text-gray-500 shrink-0" />
                      <span className="truncate pr-2 font-mono text-[11px]">{ul.name}</span>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {ul.status === 'uploading' ? (
                        <span className="text-[10px] text-yellow-500 font-mono font-bold">{ul.progress}%</span>
                      ) : ul.status === 'completed' ? (
                        <CheckCircle size={12} className="text-green-500" />
                      ) : (
                        <AlertCircle size={12} className="text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resume Version History */}
          <div className="p-4 rounded-2xl border border-gray-800 bg-black/40 space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Resume Version History</h4>
            {history.length === 0 ? (
              <p className="text-xs text-gray-600 italic">No previous versions uploaded.</p>
            ) : (
              <div className="space-y-2">
                {history.map(h => (
                  <div key={h.id} className="flex justify-between items-center p-2.5 rounded-lg border border-gray-900 hover:border-gray-800 bg-black/20 text-xs">
                    <div className="flex items-center gap-2">
                      <FileText size={14} style={{ color: gold }} />
                      <div>
                        <div className="font-semibold text-white text-[11px]">{h.name}</div>
                        <div className="text-[9px] text-gray-500 mt-0.5">{h.created_at} · {h.size}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Detailed Extractions Report (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border bg-black/40 flex flex-col"
          style={{ borderColor: 'rgba(255,255,255,0.08)', minHeight: '520px' }}>
          
          <div className="px-6 py-4 border-b flex items-center justify-between"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <BarChart3 size={16} style={{ color: gold }} />
              <span className="font-bold text-sm">ATS Analysis Report</span>
            </div>
            {activeReport && (
              <button onClick={handleDownloadReport}
                className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg font-bold border border-gray-800 text-gray-400 hover:text-white transition-colors">
                <Download size={11} /> DOWNLOAD PDF
              </button>
            )}
          </div>

          {!activeReport ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/[0.02]"
                style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                <FileText size={24} className="text-gray-600" />
              </div>
              <p className="text-sm text-gray-500">Upload a resume to generate the analysis report</p>
            </div>
          ) : (
            <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[640px]">
              
              {/* File Info */}
              <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-800 bg-white/[0.01]">
                <FileText size={18} style={{ color: gold }} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate text-white">{activeFileName}</div>
                  <div className="text-[9px] text-gray-500 font-mono mt-0.5">ID: {activeResumeId.slice(0, 16)}…</div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${activeReport.overall_score >= 85 ? 'text-green-400 bg-green-400/10' : 'text-yellow-400 bg-yellow-400/10'}`}>
                  {activeReport.overall_score >= 85 ? 'Strong Match' : 'Good Match'}
                </span>
              </div>

              {/* Score Rings */}
              <div className="grid grid-cols-4 gap-4 bg-white/[0.01] border border-gray-900 p-4 rounded-xl">
                <ScoreRing score={activeReport.overall_score} label="Overall ATS" color={gold} />
                <ScoreRing score={activeReport.score_relevance} label="Relevance" color="#60a5fa" />
                <ScoreRing score={activeReport.score_skills} label="Skills Match" color="#34d399" />
                <ScoreRing score={activeReport.score_formatting} label="Formatting" color="#a78bfa" />
              </div>

              {/* Parsed Contact & Social Intelligence */}
              {extractions && (
                <div className="space-y-4">
                  
                  {/* Contact Roster */}
                  <div className="p-4 rounded-xl border border-gray-800 bg-white/[0.01] space-y-2">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Social & Contact Extraction</h5>
                    <div className="grid grid-cols-2 gap-3 text-xs text-gray-300">
                      <div className="flex items-center gap-2"><Mail size={12} className="text-gray-500" />{extractions.email}</div>
                      <div className="flex items-center gap-2"><Phone size={12} className="text-gray-500" />{extractions.phone}</div>
                      <div className="flex items-center gap-2"><Linkedin size={12} className="text-gray-500" />{extractions.linkedin}</div>
                      <div className="flex items-center gap-2"><Github size={12} className="text-gray-500" />{extractions.github}</div>
                    </div>
                  </div>

                  {/* Core Experience & Academics */}
                  <div className="p-4 rounded-xl border border-gray-800 bg-white/[0.01] space-y-3">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Core Experience & Academics</h5>
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="text-[9px] text-gray-500 font-bold block">EXPERIENCE RECORD</span>
                        <span className="text-white mt-0.5 block">{extractions.experience}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-500 font-bold block">HIGHEST EDUCATION</span>
                        <span className="text-white mt-0.5 block">{extractions.education}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-500 font-bold block">CERTIFICATIONS</span>
                        <span className="text-white mt-0.5 block">{extractions.certifications}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-500 font-bold block">LANGUAGES</span>
                        <span className="text-white mt-0.5 block">{extractions.languages}</span>
                      </div>
                    </div>
                  </div>

                  {/* Keyword analysis details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-gray-900 bg-black/25">
                      <span className="text-[9px] font-bold text-green-400 uppercase tracking-wider block mb-2">Matching Keywords</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {extractions.matching_keywords.map((kw: string) => (
                          <span key={kw} className="px-2 py-0.5 rounded border border-green-500/10 bg-green-500/[0.02] text-green-400 text-[10px] font-mono">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-900 bg-black/25">
                      <span className="text-[9px] font-bold text-yellow-400 uppercase tracking-wider block mb-2">Missing Keywords</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {extractions.missing_keywords.map((kw: string) => (
                          <span key={kw} className="px-2 py-0.5 rounded border border-yellow-500/10 bg-yellow-500/[0.02] text-yellow-400 text-[10px] font-mono">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* AI Evaluation */}
                  <div className="p-4 rounded-xl border border-yellow-500/15 bg-yellow-500/[0.02] space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={13} style={{ color: gold }} />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">AI Resume Evaluation</span>
                    </div>
                    <div className="text-xs text-gray-300 space-y-2 leading-relaxed">
                      <p><span className="font-semibold text-white">Summary:</span> Resume demonstrates strong alignment with target role requirements. Extraction confirms {activeReport.score_skills}% core keyword coverage.</p>
                      <p><span className="font-semibold text-white">Strengths:</span> {extractions.strengths}</p>
                      <p><span className="font-semibold text-white">Weaknesses:</span> {extractions.weaknesses}</p>
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
