'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import {
  Plus, Trash2, Copy, Search, Filter, MoreVertical,
  Briefcase, Clock, DollarSign, Users, ChevronDown,
  X, Loader2, CheckCircle, AlertTriangle, Edit3, Sparkles
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  description: string;
  status: string;
  salary_range?: string;
  created_at: string;
}

const STATUS_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  open:    { color: '#34d399', bg: '#34d39915', label: 'Open' },
  draft:   { color: '#D4AF37', bg: '#D4AF3715', label: 'Draft' },
  closed:  { color: '#f87171', bg: '#f8717115', label: 'Closed' },
  default: { color: '#9ca3af', bg: '#9ca3af15', label: 'Unknown' },
};

export default function JobsPage() {
  const gold = THEME_TOKENS.colors.brand.goldPremium;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [saving, setSaving] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [page, setPage] = useState(1);

  const [form, setForm] = useState({ title: '', description: '', salary: '', skills: '', status: 'draft' });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const getToken = () => localStorage.getItem('hiremind_token') || '';
  const headers = () => ({ Authorization: `Bearer ${getToken()}` });

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/jobs`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setJobs(Array.isArray(data) ? data : []);
      }
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const skills = form.skills.split(',').map(s => s.trim()).filter(Boolean)
        .map(name => ({ name, weight: 1.0, target_tier: 'mid' }));

      if (editingJob) {
        // Update Job (PATCH)
        const res = await fetch(`${apiUrl}/api/v1/jobs/${editingJob.id}`, {
          method: 'PATCH',
          headers: { ...headers(), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title,
            description: form.description,
            salary_range: form.salary,
            status: form.status
          })
        });
        if (!res.ok) throw new Error();
        showToast('Job posting updated successfully', 'success');
      } else {
        // Create Job (POST)
        const res = await fetch(`${apiUrl}/api/v1/jobs`, {
          method: 'POST',
          headers: { ...headers(), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title, description: form.description,
            salary_range: form.salary || '80k–120k',
            skills, hiring_manager_id: '00000000-0000-0000-0000-000000000000'
          })
        });
        if (!res.ok) throw new Error();
        showToast('Job posting created successfully', 'success');
      }

      setShowModal(false);
      setEditingJob(null);
      setForm({ title: '', description: '', salary: '', skills: '', status: 'draft' });
      fetchJobs();
    } catch {
      showToast(editingJob ? 'Failed to update job' : 'Failed to create job', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (job: Job) => {
    setEditingJob(job);
    setForm({
      title: job.title,
      description: job.description,
      salary: job.salary_range || '',
      skills: '',
      status: job.status
    });
    setShowModal(true);
  };

  const handleOptimizeDescription = async () => {
    if (!form.title) {
      showToast('Please enter a Job Title first to run AI generation', 'error');
      return;
    }
    setOptimizing(true);
    try {
      const prompt = `Write a comprehensive professional enterprise role description, required core skills (comma-separated list), and recommended salary band for: ${form.title}`;
      const res = await fetch(
        `${apiUrl}/api/v1/ai/route?model_name=gemini-2.0-flash&prompt_input=${encodeURIComponent(prompt)}`,
        { method: 'POST', headers: headers() }
      );
      if (res.ok) {
        const data = await res.json();
        // Simple parsed splits for mock representation
        setForm(f => ({
          ...f,
          description: data.output || 'No output received.',
          skills: 'React, TypeScript, Kubernetes, gRPC, Python, AWS',
          salary: '140k-180k'
        }));
        showToast('Job Description optimized by AI', 'success');
      } else {
        throw new Error();
      }
    } catch {
      showToast('AI description generation failed', 'error');
    } finally {
      setOptimizing(false);
    }
  };

  const duplicateJob = async (job: Job) => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/jobs`, {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Copy of ${job.title}`, description: job.description,
          salary_range: job.salary_range || '80k–120k', skills: [],
          hiring_manager_id: '00000000-0000-0000-0000-000000000000'
        })
      });
      if (!res.ok) throw new Error();
      showToast('Job duplicated successfully', 'success');
      fetchJobs();
    } catch {
      showToast('Duplication failed', 'error');
    }
  };

  const deleteJob = async (id: string) => {
    if (!confirm('Are you sure you want to archive and delete this job posting?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/v1/jobs/${id}`, { method: 'DELETE', headers: headers() });
      if (!res.ok) throw new Error();
      showToast('Job posting deleted', 'success');
      fetchJobs();
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  const displayed = jobs.filter(j => {
    const matchFilter = j.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || j.status.toLowerCase() === statusFilter.toLowerCase();
    return matchFilter && matchStatus;
  });

  const getStatus = (s: string) => STATUS_STYLES[s] || STATUS_STYLES.default;

  const itemsPerPage = 6;
  const totalPages = Math.ceil(displayed.length / itemsPerPage);
  const paginated = displayed.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="min-h-full p-8" style={{ fontFamily: THEME_TOKENS.typography.fontFamily }}>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl text-sm font-medium transition-all ${toast.type === 'success' ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}`}>
          {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: gold }}>Talent Acquisition</p>
          <h1 className="text-3xl font-bold tracking-tight mt-1">Job Openings</h1>
          <p className="text-sm text-gray-500 mt-1">{jobs.length} active roles across all departments</p>
        </div>
        <button onClick={() => { setEditingJob(null); setForm({ title: '', description: '', salary: '', skills: '', status: 'draft' }); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 shrink-0 bg-yellow-500 text-black"
          style={{ backgroundColor: gold }}>
          <Plus size={16} /> Post New Role
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-xl border text-xs"
          style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
          <Search size={14} className="text-gray-500 shrink-0" />
          <input type="text" placeholder="Search job titles..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 bg-transparent text-white focus:outline-none placeholder-gray-600" />
        </div>
        <div className="flex gap-2">
          {['all', 'open', 'draft', 'closed'].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize border ${statusFilter === s ? 'text-black' : 'text-gray-500 hover:text-white'}`}
              style={statusFilter === s
                ? { backgroundColor: gold, borderColor: gold }
                : { borderColor: 'rgba(255,255,255,0.08)' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-52 rounded-2xl border animate-pulse" style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)' }} />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: `${gold}15` }}>
            <Briefcase size={24} style={{ color: gold }} />
          </div>
          <h3 className="font-bold text-lg mb-2">No Job Postings Found</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            {search || statusFilter !== 'all' ? 'No results match your filters.' : 'Create your first job posting to start sourcing talent.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {paginated.map(job => {
            const st = getStatus(job.status);
            return (
              <div key={job.id}
                className="group p-6 rounded-2xl border flex flex-col justify-between hover:border-white/20 transition-all hover:shadow-lg bg-black/40"
                style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-yellow-500/10">
                      <Briefcase size={14} style={{ color: gold }} />
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide"
                      style={{ color: st.color, backgroundColor: st.bg }}>
                      {st.label}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm leading-snug mb-1.5 line-clamp-2 text-white">{job.title}</h3>
                  <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed mt-1">{job.description || 'No description provided.'}</p>

                  <div className="flex items-center gap-3 mt-4 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <DollarSign size={10} />{job.salary_range || 'Negotiable'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} />{new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-800">
                  <span className="text-[10px] text-gray-600 font-mono">ID: {job.id.slice(0, 8)}…</span>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleEditClick(job)}
                      className="p-1.5 rounded-lg border border-gray-800 text-gray-400 hover:text-white hover:border-white/20 transition-colors"
                      title="Edit">
                      <Edit3 size={11} />
                    </button>
                    <button onClick={() => duplicateJob(job)}
                      className="p-1.5 rounded-lg border border-gray-800 text-gray-400 hover:text-white hover:border-white/20 transition-colors"
                      title="Duplicate">
                      <Copy size={11} />
                    </button>
                    <button onClick={() => deleteJob(job.id)}
                      className="p-1.5 rounded-lg border border-gray-800 text-red-500/60 hover:text-red-400 hover:border-red-500/30 transition-colors"
                      title="Delete">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-4 text-xs">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="px-3.5 py-2 rounded-xl border border-gray-800 disabled:opacity-30 hover:text-white">
            Previous
          </button>
          <span className="text-gray-500 font-mono">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
            className="px-3.5 py-2 rounded-xl border border-gray-800 disabled:opacity-30 hover:text-white">
            Next
          </button>
        </div>
      )}

      {/* Create / Edit Job Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <form onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden bg-black/95"
            style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="font-bold text-white text-base">{editingJob ? 'Edit Job Posting' : 'Post New Role'}</h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white">
                <X size={18} />
              </button>
            </div>
            
            <div className="px-6 py-5 space-y-4 max-h-[420px] overflow-y-auto">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleOptimizeDescription}
                  disabled={optimizing || !form.title}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 disabled:opacity-40"
                >
                  {optimizing ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  AI GENERATE JD & SKILLS
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Job Title *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Staff Backend Engineer (Go/K8s)"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-800 text-sm text-white bg-transparent focus:outline-none focus:border-yellow-500/50 transition-colors" />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Description *</label>
                <textarea required rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe responsibilities, team, and impact..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-800 text-xs text-white bg-transparent focus:outline-none focus:border-yellow-500/50 transition-colors resize-none leading-relaxed" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Salary Range</label>
                  <input value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))}
                    placeholder="e.g. 160k–200k"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-800 text-sm text-white bg-transparent focus:outline-none focus:border-yellow-500/50 transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Required Skills</label>
                  <input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
                    placeholder="Python, Go, Docker, AWS"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-800 text-sm text-white bg-transparent focus:outline-none focus:border-yellow-500/50 transition-colors" />
                </div>
              </div>

              {editingJob && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Job Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-800 text-sm bg-transparent text-white focus:outline-none focus:border-yellow-500/50">
                    <option value="draft" style={{ backgroundColor: '#0f0f10' }}>Draft</option>
                    <option value="open" style={{ backgroundColor: '#0f0f10' }}>Open</option>
                    <option value="closed" style={{ backgroundColor: '#0f0f10' }}>Closed</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-800 flex gap-3">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm border border-gray-800 text-gray-400 hover:text-white hover:border-white/20 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 bg-yellow-500 text-black"
                style={{ backgroundColor: gold }}>
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : editingJob ? 'Save Changes' : 'Post Role'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
