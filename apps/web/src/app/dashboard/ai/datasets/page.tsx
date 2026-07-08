'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { GovernanceNav } from '../GovernanceNav';
import { Database, Plus, CheckCircle, FileText, Download, Code, Play } from 'lucide-react';

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState([
    {
      id: 'ds_golden_resume_v2.1',
      name: 'Golden Candidate Resume Set',
      version: 'v2.1',
      type: 'Golden Set',
      records: 50,
      description: 'Hand-labeled resume text with verified skills arrays for parsing evaluation.',
      created_at: '2026-06-12'
    },
    {
      id: 'ds_regression_coding_v1.0',
      name: 'Golden Coding Submission Tests',
      version: 'v1.0',
      type: 'Regression Set',
      records: 200,
      description: 'Pre-compiled code snippets with known syntax anomalies to test compiler output analysis.',
      created_at: '2026-06-28'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newDataset, setNewDataset] = useState({ name: '', version: 'v1.0', type: 'golden_set', desc: '' });
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDataset.name) return;

    const added = {
      id: `ds_${newDataset.name.toLowerCase().replace(/\s+/g, '_')}_${newDataset.version}`,
      name: newDataset.name,
      version: newDataset.version,
      type: newDataset.type === 'golden_set' ? 'Golden Set' : 'Regression Set',
      records: 12,
      description: newDataset.desc,
      created_at: new Date().toISOString().split('T')[0]
    };

    setDatasets([...datasets, added]);
    setShowAddForm(false);
    setNewDataset({ name: '', version: 'v1.0', type: 'golden_set', desc: '' });
    setMessage('Evaluation dataset registered successfully.');
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
        <h2 className="text-4xl font-bold tracking-tight mt-1">Evaluation Dataset Registry</h2>
      </div>

      <GovernanceNav active="/dashboard/ai/datasets" />

      {message && (
        <div className="mb-6 p-4 rounded bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {message}
        </div>
      )}

      <div className="mb-8 flex justify-end">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-5 py-2.5 rounded font-semibold text-xs uppercase tracking-wider transition-all hover:scale-105"
          style={{ backgroundColor: THEME_TOKENS.colors.brand.goldPremium, color: THEME_TOKENS.colors.neutral.grayDark }}
        >
          <Plus className="w-4 h-4" />
          Upload Evaluation Dataset
        </button>
      </div>

      {showAddForm && (
        <form 
          onSubmit={handleSubmit}
          className="mb-8 p-6 rounded-xl border backdrop-blur-md max-w-2xl space-y-4"
          style={{ 
            backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
            borderColor: THEME_TOKENS.colors.background.borderGlass 
          }}
        >
          <h3 className="text-lg font-medium text-[#d4af37]">Dataset Specification Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase text-gray-400 mb-1">Dataset Name</label>
              <input 
                type="text" 
                placeholder="e.g. ATS Screening Test Set"
                value={newDataset.name}
                onChange={(e) => setNewDataset({ ...newDataset, name: e.target.value })}
                className="w-full px-4 py-2 rounded border bg-black/40 text-sm text-white"
                style={{ borderColor: 'rgba(212,175,55,0.2)' }}
              />
            </div>
            <div>
              <label className="block text-xs uppercase text-gray-400 mb-1">Version tag</label>
              <input 
                type="text" 
                placeholder="e.g. v1.2"
                value={newDataset.version}
                onChange={(e) => setNewDataset({ ...newDataset, version: e.target.value })}
                className="w-full px-4 py-2 rounded border bg-black/40 text-sm text-white"
                style={{ borderColor: 'rgba(212,175,55,0.2)' }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase text-gray-400 mb-1">Dataset Type</label>
            <select 
              value={newDataset.type}
              onChange={(e) => setNewDataset({ ...newDataset, type: e.target.value })}
              className="w-full px-4 py-2 rounded border bg-black/40 text-sm text-white"
              style={{ borderColor: 'rgba(212,175,55,0.2)' }}
            >
              <option value="golden_set">Golden Set (Benchmark)</option>
              <option value="regression">Regression Set</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase text-gray-400 mb-1">Description</label>
            <input 
              type="text" 
              placeholder="Hypothesis check boundaries details"
              value={newDataset.desc}
              onChange={(e) => setNewDataset({ ...newDataset, desc: e.target.value })}
              className="w-full px-4 py-2 rounded border bg-black/40 text-sm text-white"
              style={{ borderColor: 'rgba(212,175,55,0.2)' }}
            />
          </div>
          <button 
            type="submit" 
            className="px-4 py-2 rounded text-xs font-bold uppercase tracking-wider text-black bg-[#e5c158]"
          >
            Register Dataset
          </button>
        </form>
      )}

      {/* Dataset List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {datasets.map((ds) => (
          <div 
            key={ds.id}
            className="p-6 rounded-xl border backdrop-blur-md flex flex-col justify-between h-64"
            style={{ 
              backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
              borderColor: THEME_TOKENS.colors.background.borderGlass 
            }}
          >
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400 font-mono font-light">{ds.type}</span>
                <span className="text-[10px] bg-yellow-500/10 text-[#ffa726] px-1.5 py-0.5 rounded font-bold">{ds.version}</span>
              </div>
              <h3 className="font-bold text-lg">{ds.name}</h3>
              <code className="text-xs font-mono block mt-1" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
                {ds.id}
              </code>
              <p className="text-xs text-gray-300 font-light mt-3 leading-relaxed">{ds.description}</p>
            </div>

            <div className="border-t border-gray-800/40 pt-4 flex justify-between items-center text-xs font-mono text-gray-400">
              <span>Records count: <b>{ds.records} samples</b></span>
              <div className="flex gap-2">
                <button className="p-1.5 hover:text-white transition-all">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-1.5 hover:text-white transition-all">
                  <Code className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
