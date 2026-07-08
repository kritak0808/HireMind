'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';

export default function MatchInsightsPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ name: string; score: number; explanation: string }>>([]);

  const handleMatch = (e: React.FormEvent) => {
    e.preventDefault();
    setResults([
      { name: "Albert Einstein", score: 98, explanation: "Candidate profile presents matching achievements in theoretical systems physics." },
      { name: "Marie Curie", score: 94, explanation: "Strong alignment found with radiochemistry labs projects metrics." },
    ]);
  };

  return (
    <div 
      className="min-h-screen p-10 text-white flex flex-col items-center justify-start"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="w-full max-w-4xl mb-10 text-center">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Semantic Engine Console
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1 mb-8">AI Match Insights</h2>

        <form onSubmit={handleMatch} className="w-full max-w-2xl mx-auto flex gap-4">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
            placeholder="Select a Job Posting context..."
            className="flex-grow px-6 py-4 rounded-lg border text-sm text-white focus:outline-none focus:ring-1"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(212,175,55,0.2)' }}
          />
          <button 
            type="submit"
            className="px-8 py-4 rounded-lg font-medium text-sm transition-all hover:scale-105"
            style={{ backgroundColor: THEME_TOKENS.colors.brand.goldPremium, color: THEME_TOKENS.colors.neutral.grayDark }}
          >
            Compute Matches
          </button>
        </form>
      </div>

      {results.length > 0 && (
        <div className="w-full max-w-4xl space-y-6">
          {results.map((res, idx) => (
            <div 
              key={idx}
              className="p-8 rounded-xl border backdrop-blur-md flex justify-between gap-6"
              style={{ 
                backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
                borderColor: THEME_TOKENS.colors.background.borderGlass 
              }}
            >
              <div className="flex-grow">
                <h3 className="font-semibold text-lg tracking-tight mb-2">{res.name}</h3>
                <p className="text-sm text-gray-300 font-light leading-relaxed">{res.explanation}</p>
              </div>

              <div className="text-center flex-shrink-0">
                <span className="text-xs text-gray-400 font-light uppercase tracking-wider">Similarity</span>
                <div className="text-4xl font-extrabold my-1" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
                  {res.score}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
