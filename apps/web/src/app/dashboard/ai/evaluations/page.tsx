'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { GovernanceNav } from '../GovernanceNav';
import { BarChart2, Star, CheckSquare, Layers, Award, Terminal, Play, Sparkles } from 'lucide-react';

export default function EvaluationsPage() {
  const [reports, setReports] = useState([
    {
      id: 'eval_rep_parsing_104',
      name: 'Resume Skills Extractor Evaluation',
      dataset: 'Golden Candidate Resume Set (v2.1)',
      prompt: 'resume_parsing_core (v4.0.0)',
      model: 'gemini-2.0-flash',
      scores: {
        grounding: 98,
        faithfulness: 96,
        helpfulness: 94,
        correctness: 95,
        consistency: 97,
        cost_efficiency: 99,
        token_efficiency: 98
      },
      avg_latency: '135ms',
      overall: 96.7
    },
    {
      id: 'eval_rep_coding_78',
      name: 'Sandbox Logic Compiler Evaluation',
      dataset: 'Golden Coding Submission Tests (v1.0)',
      prompt: 'coding_feedback_agent (v2.1.0)',
      model: 'gpt-4o',
      scores: {
        grounding: 92,
        faithfulness: 91,
        helpfulness: 95,
        correctness: 94,
        consistency: 93,
        cost_efficiency: 75,
        token_efficiency: 80
      },
      avg_latency: '410ms',
      overall: 88.5
    }
  ]);

  const [benchmarks] = useState([
    { benchmark: 'MMLU (Massive Multitask Language Understanding)', score: '86.4%', model: 'gemini-2.0-flash' },
    { benchmark: 'GSM8K (Grade School Math 8k)', score: '94.2%', model: 'gpt-4o' },
    { benchmark: 'HumanEval (Python coding task)', score: '84.1%', model: 'gemini-2.0-flash' }
  ]);

  return (
    <div 
      className="min-h-screen p-8 text-white animate-fade-in"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          AI Governance Platform
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1">AI Evaluation Center & Matrix</h2>
      </div>

      <GovernanceNav active="/dashboard/ai/evaluations" />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Scorecard lists */}
        <div className="xl:col-span-2 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-[#d4af37]" />
            Reproducible Quality Scorecards
          </h3>

          {reports.map((r) => (
            <div 
              key={r.id}
              className="p-6 rounded-xl border backdrop-blur-md space-y-4"
              style={{ 
                backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
                borderColor: THEME_TOKENS.colors.background.borderGlass 
              }}
            >
              <div className="flex justify-between items-start border-b border-gray-800/40 pb-3">
                <div>
                  <h4 className="font-bold text-lg">{r.name}</h4>
                  <div className="text-xs text-gray-400 mt-1">
                    <span>Dataset: <b>{r.dataset}</b></span> | <span>Prompt: {r.prompt}</span> | <span>Model: {r.model}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-mono block">OVERALL SCORE</span>
                  <span className="text-3xl font-extrabold text-[#d4af37]">{r.overall}%</span>
                </div>
              </div>

              {/* Grid of details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 pt-2">
                {Object.entries(r.scores).map(([metric, val]) => (
                  <div key={metric} className="p-3 rounded border border-gray-800 bg-gray-950/20 text-center">
                    <span className="text-[10px] text-gray-400 uppercase font-mono block truncate mb-1">
                      {metric.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-bold text-white">{val}%</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center text-xs text-gray-400 pt-3 border-t border-gray-800/30 font-mono">
                <span>Scorecard: <b>{r.id}</b></span>
                <span>Average Latency: <b style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>{r.avg_latency}</b></span>
              </div>
            </div>
          ))}
        </div>

        {/* Global Benchmarks */}
        <div 
          className="p-6 rounded-xl border backdrop-blur-md h-fit"
          style={{ 
            backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
            borderColor: THEME_TOKENS.colors.background.borderGlass 
          }}
        >
          <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-[#d4af37]">
            <Sparkles className="w-5 h-5" />
            Standardized Benchmarks
          </h3>

          <div className="space-y-4 text-xs font-mono">
            {benchmarks.map((b, i) => (
              <div key={i} className="p-4 border border-gray-800 rounded bg-black/25">
                <span className="text-gray-400 block mb-1">{b.benchmark}</span>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-white">{b.model}</span>
                  <span style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>{b.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
