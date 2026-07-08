'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { GovernanceNav } from '../GovernanceNav';
import { GitBranch, Play, CheckCircle2, RotateCcw, AlertCircle, BarChart3, HelpCircle } from 'lucide-react';

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState([
    {
      id: 'exp_resume_routing_v4',
      name: 'Resume Routing Optimizer (Gemini vs GPT)',
      type: 'A/B Model routing',
      status: 'Running',
      hypothesis: 'Routing parsed files to gemini-2.0-flash reduces latency by 60% without dropping skills accuracy.',
      split: { control: 50, treatment: 50 },
      runs: 1420,
      metrics: {
        control: { name: 'gpt-4o', latency: '410ms', accuracy: '94%', cost: '$5.40' },
        treatment: { name: 'gemini-2.0-flash', latency: '135ms', accuracy: '92.5%', cost: '$0.12' }
      },
      sig: '98.5% significant (Winner: Treatment)'
    },
    {
      id: 'exp_copilot_summarize',
      name: 'Recruiter Summary Prompt Test',
      type: 'Prompt A/B variation',
      status: 'Completed',
      hypothesis: 'Adding strict JSON structuring instructions reduces agent hallucination count.',
      split: { control: 0, treatment: 100 },
      runs: 840,
      metrics: {
        control: { name: 'v2.0 prompt', latency: '350ms', accuracy: '89%', cost: '$1.20' },
        treatment: { name: 'v2.1 prompt (json)', latency: '380ms', accuracy: '97.2%', cost: '$1.35' }
      },
      sig: '99.9% significant (Winner declared: Treatment)'
    }
  ]);

  const [message, setMessage] = useState('');

  const declareWinner = (id: string, variant: string) => {
    setExperiments(experiments.map(e => e.id === id ? { ...e, status: 'Completed', sig: `Winner declared: ${variant}` } : e));
    setMessage(`Winner declared successfully for ${id}. Production deployment updated.`);
    setTimeout(() => setMessage(''), 4000);
  };

  const rollbackExperiment = (id: string) => {
    setExperiments(experiments.map(e => e.id === id ? { ...e, status: 'Rolled Back', sig: 'Terminated due to variance' } : e));
    setMessage(`Experiment ${id} rolled back. Routing reverted to Control.`);
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
        <h2 className="text-4xl font-bold tracking-tight mt-1">Experiment Lab & Analytics</h2>
      </div>

      <GovernanceNav active="/dashboard/ai/experiments" />

      {message && (
        <div className="mb-6 p-4 rounded bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {message}
        </div>
      )}

      <div className="space-y-8">
        {experiments.map((exp) => (
          <div 
            key={exp.id}
            className="p-8 rounded-xl border backdrop-blur-md flex flex-col gap-6"
            style={{ 
              backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
              borderColor: THEME_TOKENS.colors.background.borderGlass 
            }}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold">{exp.name}</h3>
                  <span className="text-xs text-gray-400 bg-gray-900 border border-gray-800 px-2 py-0.5 rounded">
                    {exp.type}
                  </span>
                  <span 
                    className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: exp.status === 'Running' ? 'rgba(76,175,80,0.1)' : exp.status === 'Completed' ? 'rgba(33,150,243,0.1)' : 'rgba(244,67,54,0.1)',
                      color: exp.status === 'Running' ? '#4caf50' : exp.status === 'Completed' ? '#2196f3' : '#f44336'
                    }}
                  >
                    {exp.status}
                  </span>
                </div>
                <code className="text-xs font-mono block mt-1" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
                  {exp.id}
                </code>
              </div>

              {exp.status === 'Running' && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => declareWinner(exp.id, 'Treatment')}
                    className="px-4 py-2 rounded text-xs font-bold uppercase tracking-wider text-black bg-[#d4af37] transition-all hover:scale-105"
                  >
                    Promote Treatment
                  </button>
                  <button 
                    onClick={() => rollbackExperiment(exp.id)}
                    className="px-4 py-2 rounded text-xs font-bold uppercase tracking-wider border border-[#ef5350] text-[#ef5350] transition-all hover:bg-[#ef5350]/15"
                  >
                    Rollback
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 rounded bg-black/30 border border-gray-800 text-xs">
              <span className="text-[#e5c158] font-semibold uppercase block mb-1">Experiment Hypothesis</span>
              <p className="text-gray-300 font-light leading-relaxed">{exp.hypothesis}</p>
            </div>

            {/* Metrics cards split comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-800/40">
              {/* Control */}
              <div className="p-5 rounded border border-gray-800 bg-gray-950/20">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs uppercase font-bold tracking-wider text-gray-400">Control Variant</span>
                  <span className="text-xs font-bold text-gray-300">{exp.split.control}% Traffic</span>
                </div>
                <h4 className="font-semibold text-lg text-white mb-2">{exp.metrics.control.name}</h4>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-gray-500 block">Latency</span>
                    <span className="text-gray-300 font-bold">{exp.metrics.control.latency}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Accuracy</span>
                    <span className="text-gray-300 font-bold">{exp.metrics.control.accuracy}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Cost Spend</span>
                    <span className="text-gray-300 font-bold">{exp.metrics.control.cost}</span>
                  </div>
                </div>
              </div>

              {/* Treatment */}
              <div className="p-5 rounded border border-[#d4af37]/25 bg-gray-950/30">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs uppercase font-bold tracking-wider text-[#d4af37]">Treatment Variant</span>
                  <span className="text-xs font-bold text-[#d4af37]">{exp.split.treatment}% Traffic</span>
                </div>
                <h4 className="font-semibold text-lg text-white mb-2">{exp.metrics.treatment.name}</h4>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-gray-500 block">Latency</span>
                    <span className="text-[#e5c158] font-bold">{exp.metrics.treatment.latency}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Accuracy</span>
                    <span className="text-[#e5c158] font-bold">{exp.metrics.treatment.accuracy}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Cost Spend</span>
                    <span className="text-[#e5c158] font-bold">{exp.metrics.treatment.cost}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs border-t border-gray-800/40 pt-4">
              <span className="text-gray-400">Sample Size: <b>{exp.runs} runs</b></span>
              <span className="font-bold uppercase tracking-wider text-green-400 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4" />
                {exp.sig}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
