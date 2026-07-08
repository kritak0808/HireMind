'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { GovernanceNav } from '../GovernanceNav';
import { FileText, GitCompare, ShieldAlert, CheckCircle, Code, HelpCircle, Save, Layers } from 'lucide-react';

export default function PromptStudioPage() {
  const [prompts, setPrompts] = useState([
    { 
      name: 'resume_parsing_core', 
      description: 'Extracts skills, work experience, and educational background from resumes.',
      variables: ['resume_text', 'organization_rules'],
      parent: 'global_recruiter_base',
      active_version: 'v4.0.0',
      versions: ['v4.0.0', 'v3.1.2', 'v3.0.0'],
      lint_results: ["Safe structure: True", "No credential placeholders: True", "Grounding check rule added: True"]
    },
    { 
      name: 'coding_feedback_agent', 
      description: 'Assesses code outputs in compilers and formats unit test scores.', 
      variables: ['compilation_logs', 'plagiarism_report'],
      parent: 'None',
      active_version: 'v2.1.0',
      versions: ['v2.1.0', 'v2.0.0'],
      lint_results: ["Safe structure: True", "No credential placeholders: True", "Grounding check rule added: False"]
    },
  ]);
  const [selectedPrompt, setSelectedPrompt] = useState(prompts[0]);
  const [editorContent, setEditorContent] = useState(
    '# INHERITS global_recruiter_base\n\nYou are a premium talent parser. Extract structured details from the following candidate resume: {{resume_text}}.\nAdhere to org policies: {{organization_rules}}.\nFormat results strictly as a clean JSON schema.'
  );
  const [targetVersion, setTargetVersion] = useState('v4.0.0');
  const [diffOriginal, setDiffOriginal] = useState(
    'You are a basic parser. Parse the resume: {{resume_text}}.'
  );
  const [showDiff, setShowDiff] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('Saved draft. Approval request created in pending state.');
    setTimeout(() => setStatusMessage(''), 4000);
  };

  return (
    <div 
      className="min-h-screen p-8 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          AI Governance Platform
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">PromptOps Studio</h2>
      </div>

      <GovernanceNav active="/dashboard/ai/prompts" />

      {statusMessage && (
        <div className="mb-6 p-4 rounded bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {statusMessage}
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-8 items-start">
        {/* Sidebar templates */}
        <div 
          className="w-full xl:w-1/3 p-6 rounded-xl border backdrop-blur-md"
          style={{ 
            backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
            borderColor: THEME_TOKENS.colors.background.borderGlass 
          }}
        >
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" style={{ color: THEME_TOKENS.colors.brand.goldPremium }} />
            Prompt Templates Registry
          </h3>
          <div className="space-y-4">
            {prompts.map((p, idx) => (
              <div 
                key={idx}
                onClick={() => { 
                  setSelectedPrompt(p);
                  if (p.name === 'coding_feedback_agent') {
                    setEditorContent('You are a coding evaluator. Review compiler outputs: {{compilation_logs}}.');
                    setDiffOriginal('Review compile logs: {{compilation_logs}}.');
                  } else {
                    setEditorContent('# INHERITS global_recruiter_base\n\nYou are a premium talent parser. Extract structured details from the following candidate resume: {{resume_text}}.\nAdhere to org policies: {{organization_rules}}.\nFormat results strictly as a clean JSON schema.');
                    setDiffOriginal('You are a basic parser. Parse the resume: {{resume_text}}.');
                  }
                }}
                className="p-4 rounded border transition-all cursor-pointer hover:bg-black/20"
                style={{ 
                  borderColor: selectedPrompt.name === p.name ? THEME_TOKENS.colors.brand.goldPremium : 'rgba(212,175,55,0.1)'
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm">{p.name}</span>
                  <span className="text-[10px] bg-yellow-500/10 text-[#fbc02d] px-1.5 py-0.5 rounded font-bold">{p.active_version}</span>
                </div>
                <p className="text-xs text-gray-400 font-light mt-1 line-clamp-2">{p.description}</p>
                {p.parent !== 'None' && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-400 font-light">
                    <Layers className="w-3 h-3 text-[#d4af37]" />
                    Inherits: {p.parent}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Editor Main */}
        <div 
          className="w-full xl:w-2/3 p-8 rounded-xl border backdrop-blur-md"
          style={{ 
            backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
            borderColor: THEME_TOKENS.colors.background.borderGlass 
          }}
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-medium">Prompt Editor & Analytics</h3>
              <p className="text-xs text-gray-400 font-light mt-1">Configure variables, overrides, inheritance and validation properties.</p>
            </div>
            <button
              onClick={() => setShowDiff(!showDiff)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-semibold uppercase tracking-wider transition-all hover:bg-black/35"
              style={{ borderColor: THEME_TOKENS.colors.brand.goldPremium, color: THEME_TOKENS.colors.brand.goldPremium }}
            >
              <GitCompare className="w-3.5 h-3.5" />
              {showDiff ? "Hide Prompt Diff" : "Show Prompt Diff"}
            </button>
          </div>

          {showDiff && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-xs font-mono">
              <div className="p-4 rounded bg-red-950/20 border border-red-500/20">
                <span className="text-red-400 font-bold block mb-2">- ORIGINAL VERSION</span>
                <p className="whitespace-pre-wrap text-gray-300">{diffOriginal}</p>
              </div>
              <div className="p-4 rounded bg-green-950/20 border border-green-500/20">
                <span className="text-green-400 font-bold block mb-2">+ CURRENT PROPOSED DRAFT</span>
                <p className="whitespace-pre-wrap text-gray-300">{editorContent}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-gray-300">Variables Mapping</label>
                <div className="flex gap-2 flex-wrap">
                  {selectedPrompt.variables.map((v) => (
                    <span key={v} className="text-xs bg-gray-800/80 border border-gray-700 px-2.5 py-1 rounded font-mono text-[#e5c158]">
                      {"{{" + v + "}}"}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-gray-300">Environment Overrides</label>
                <select 
                  className="w-full px-4 py-2.5 rounded border text-xs text-white"
                  style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(212,175,55,0.2)' }}
                >
                  <option>Production (Default)</option>
                  <option>Staging Override</option>
                  <option>Development Override</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-gray-300">Instructions Template Editor</label>
              <textarea 
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                rows={10}
                className="w-full px-4 py-3 rounded border text-sm text-white font-mono focus:outline-none focus:ring-1"
                style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(212,175,55,0.2)' }}
              />
            </div>

            <div className="p-6 rounded-lg bg-black/30 border border-gray-800/60">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#d4af37] mb-3 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                Prompt Static Analysis & Lint Checks
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                {selectedPrompt.lint_results.map((res, i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-300">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    <span>{res}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="submit"
                className="flex items-center gap-2 px-6 py-3 rounded font-medium text-sm transition-all hover:scale-105"
                style={{ backgroundColor: THEME_TOKENS.colors.brand.goldPremium, color: THEME_TOKENS.colors.neutral.grayDark }}
              >
                <Save className="w-4 h-4" />
                Propose Approval Version
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
