'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';

export default function WorkspacePage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Welcome Niels. Let's dive into distributed architectures. Can you describe how you would design a consensus node protocol handling high network lag?" }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const userMsg = { role: 'user', text: input };
    setMessages([...messages, userMsg]);
    setInput('');
    
    // Simulate AI adaptive follow-up question response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: "Interesting approach using Paxos. How would you optimize the write logs overhead under high write contention?" }
      ]);
    }, 1000);
  };

  return (
    <div 
      className="min-h-screen p-10 text-white flex justify-center items-start"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div 
        className="w-full max-w-4xl p-8 rounded-xl border backdrop-blur-md flex flex-col h-[650px] justify-between"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-6">
          <div>
            <h3 className="font-semibold text-lg">Consensus Architecture Interview Room</h3>
            <span className="text-xs text-gray-400 font-light">Candidate: Niels Bohr • Plan ID: hm_plan_consensus</span>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded bg-[#81c784]/10 text-[#81c784]">Session Connected</span>
        </div>

        {/* Conversation flow logs */}
        <div className="flex-grow overflow-y-auto space-y-6 mb-6 pr-1">
          {messages.map((m, idx) => (
            <div 
              key={idx}
              className={`flex flex-col max-w-2xl p-4 rounded-xl border ${m.role === 'assistant' ? 'self-start' : 'self-end ml-auto'}`}
              style={{
                backgroundColor: m.role === 'assistant' ? 'rgba(212,175,55,0.05)' : 'rgba(0,0,0,0.3)',
                borderColor: m.role === 'assistant' ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.05)',
              }}
            >
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">
                {m.role === 'assistant' ? "Interviewer AI" : "Candidate"}
              </span>
              <p className="text-sm font-light leading-relaxed text-gray-200">{m.text}</p>
            </div>
          ))}
        </div>

        {/* Input area */}
        <form onSubmit={handleSend} className="flex gap-4">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            required
            placeholder="Type your explanation text here..."
            className="flex-grow px-6 py-4 rounded-lg border text-sm text-white focus:outline-none focus:ring-1"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(212,175,55,0.2)' }}
          />
          <button 
            type="submit"
            className="px-8 py-4 rounded-lg font-medium text-sm transition-all hover:scale-105"
            style={{ backgroundColor: THEME_TOKENS.colors.brand.goldPremium, color: THEME_TOKENS.colors.neutral.grayDark }}
          >
            Submit Answer
          </button>
        </form>
      </div>
    </div>
  );
}
