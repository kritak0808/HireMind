'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { GovernanceNav } from '../GovernanceNav';
import { Database, Plus, ToggleLeft, ArrowRight, ShieldCheck, Cpu, Sliders, Play, Trash2, HelpCircle } from 'lucide-react';

export default function ModelRegistryPage() {
  const [models, setModels] = useState([
    { 
      id: 'gemini-2.0-flash', 
      provider: 'Google Cloud Gemini', 
      status: 'Active', 
      type: 'Text/Vision', 
      capabilities: ['resume_parsing', 'code_eval', 'voice_dialogue'],
      cost_input: '$0.075 / 1M', 
      cost_output: '$0.30 / 1M', 
      canary_weight: 70,
      shadow_enabled: true
    },
    { 
      id: 'gpt-4o', 
      provider: 'OpenAI Enterprise', 
      status: 'Active', 
      type: 'Text/Multimodal', 
      capabilities: ['resume_parsing', 'skills_extraction'],
      cost_input: '$5.00 / 1M', 
      cost_output: '$15.00 / 1M', 
      canary_weight: 30,
      shadow_enabled: false
    },
    { 
      id: 'claude-3-opus', 
      provider: 'Anthropic AWS Bedrock', 
      status: 'Deprecated', 
      type: 'Text Only', 
      capabilities: ['complex_reasoning'],
      cost_input: '$15.00 / 1M', 
      cost_output: '$75.00 / 1M', 
      canary_weight: 0,
      shadow_enabled: false
    }
  ]);

  const [newModel, setNewModel] = useState({ name: '', provider: 'openai', desc: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState('');

  const handleSliderChange = (id: string, value: number) => {
    setModels(models.map(m => m.id === id ? { ...m, canary_weight: value } : m));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModel.name) return;
    
    const added = {
      id: newModel.name.toLowerCase().replace(/\s+/g, '-'),
      provider: newModel.provider === 'openai' ? 'OpenAI Enterprise' : 'Google Cloud Gemini',
      status: 'Active',
      type: 'Text/Multimodal',
      capabilities: ['general_inference'],
      cost_input: '$1.00 / 1M',
      cost_output: '$3.00 / 1M',
      canary_weight: 0,
      shadow_enabled: false
    };

    setModels([...models, added]);
    setShowAddForm(false);
    setNewModel({ name: '', provider: 'openai', desc: '' });
    setMessage('Model successfully registered in governance database.');
    setTimeout(() => setMessage(''), 4000);
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
        <h2 className="text-4xl font-bold tracking-tight mt-1">Model & Provider Registry</h2>
      </div>

      <GovernanceNav active="/dashboard/ai/registry" />

      {message && (
        <div className="mb-6 p-4 rounded bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          {message}
        </div>
      )}

      {/* Action panel */}
      <div className="mb-8 flex justify-end">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-5 py-2.5 rounded font-semibold text-xs uppercase tracking-wider transition-all hover:scale-105"
          style={{ backgroundColor: THEME_TOKENS.colors.brand.goldPremium, color: THEME_TOKENS.colors.neutral.grayDark }}
        >
          <Plus className="w-4 h-4" />
          Register New Model Node
        </button>
      </div>

      {showAddForm && (
        <form 
          onSubmit={handleAddSubmit}
          className="mb-8 p-6 rounded-xl border backdrop-blur-md max-w-2xl space-y-4"
          style={{ 
            backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
            borderColor: THEME_TOKENS.colors.background.borderGlass 
          }}
        >
          <h3 className="text-lg font-medium text-[#d4af37]">New Model Node Specification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase text-gray-400 mb-1">Model Identifier</label>
              <input 
                type="text" 
                placeholder="e.g. gemini-2.0-pro"
                value={newModel.name}
                onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                className="w-full px-4 py-2 rounded border bg-black/40 text-sm text-white"
                style={{ borderColor: 'rgba(212,175,55,0.2)' }}
              />
            </div>
            <div>
              <label className="block text-xs uppercase text-gray-400 mb-1">Provider Service</label>
              <select 
                value={newModel.provider}
                onChange={(e) => setNewModel({ ...newModel, provider: e.target.value })}
                className="w-full px-4 py-2 rounded border bg-black/40 text-sm text-white"
                style={{ borderColor: 'rgba(212,175,55,0.2)' }}
              >
                <option value="openai">OpenAI Enterprise</option>
                <option value="gemini">Google Cloud Vertex</option>
                <option value="anthropic">Anthropic Bedrock</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase text-gray-400 mb-1">Model Description</label>
            <input 
              type="text" 
              placeholder="Primary use case details"
              value={newModel.desc}
              onChange={(e) => setNewModel({ ...newModel, desc: e.target.value })}
              className="w-full px-4 py-2 rounded border bg-black/40 text-sm text-white"
              style={{ borderColor: 'rgba(212,175,55,0.2)' }}
            />
          </div>
          <button 
            type="submit" 
            className="px-4 py-2 rounded text-xs font-bold uppercase tracking-wider text-black bg-[#e5c158]"
          >
            Submit Specification
          </button>
        </form>
      )}

      {/* Model nodes table */}
      <div 
        className="p-8 rounded-xl border backdrop-blur-md"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <h3 className="text-xl font-medium mb-6 flex items-center gap-2">
          <Cpu className="w-5 h-5" style={{ color: THEME_TOKENS.colors.brand.goldPremium }} />
          Registered Model Capabilities & Canary Split
        </h3>

        <div className="space-y-6">
          {models.map((model) => (
            <div 
              key={model.id} 
              className="p-6 rounded-lg border transition-all hover:bg-black/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              style={{ borderColor: 'rgba(212,175,55,0.1)' }}
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h4 className="text-lg font-bold">{model.id}</h4>
                  <span className="text-[10px] text-gray-400 bg-gray-900 border border-gray-800 px-2 py-0.5 rounded">
                    {model.provider}
                  </span>
                  <span 
                    className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: model.status === 'Active' ? 'rgba(76,175,80,0.15)' : 'rgba(239,83,80,0.1)',
                      color: model.status === 'Active' ? '#81c784' : '#ef5350'
                    }}
                  >
                    {model.status}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-1.5">
                  {model.capabilities.map((c) => (
                    <span key={c} className="text-[10px] border px-2 py-0.5 rounded font-mono border-gray-800 bg-gray-950/60 text-gray-300">
                      {c}
                    </span>
                  ))}
                </div>

                <div className="flex gap-4 text-xs text-gray-400">
                  <span>Input rate: <b>{model.cost_input}</b></span>
                  <span>Output rate: <b>{model.cost_output}</b></span>
                </div>
              </div>

              {/* Canary Routing controls */}
              <div className="w-full md:w-1/3 space-y-2 border-l border-gray-800/40 pl-0 md:pl-6">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Canary Weight Traffic Split:</span>
                  <span className="font-bold text-[#d4af37]">{model.canary_weight}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={model.canary_weight} 
                  onChange={(e) => handleSliderChange(model.id, parseInt(e.target.value))}
                  disabled={model.status === 'Deprecated'}
                  className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
                />
                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                  <div className="flex items-center gap-1">
                    <input 
                      type="checkbox" 
                      checked={model.shadow_enabled}
                      disabled={model.status === 'Deprecated'}
                      onChange={(e) => {
                        setModels(models.map(m => m.id === model.id ? { ...m, shadow_enabled: e.target.checked } : m));
                      }}
                      className="accent-[#d4af37]"
                    />
                    <span>Enable Shadow Mirror Routing</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
