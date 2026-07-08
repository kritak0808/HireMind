'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { Loader2, AlertTriangle, Sparkles } from 'lucide-react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: string; name: string; dept: string; experience: string; match: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const getToken = () => localStorage.getItem('hiremind_token') || '';

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiUrl}/api/v1/search/candidates?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      if (!res.ok) throw new Error('Search failed. Check API connectivity.');
      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Error occurred during search.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen p-10 text-white flex flex-col items-center justify-start"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="w-full max-w-4xl mb-10 text-center">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
          Enterprise Core Console
        </span>
        <h2 className="text-4xl font-bold tracking-tight mt-1 mb-8">Unified Intelligence Search</h2>

        <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto flex gap-4">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
            placeholder="Search keywords, skills (e.g. Python, distributed, compilers)..."
            className="flex-grow px-6 py-4 rounded-lg border text-sm text-white focus:outline-none focus:ring-1"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(212,175,55,0.2)' }}
          />
          <button 
            type="submit"
            disabled={loading}
            className="px-8 py-4 rounded-lg font-medium text-sm transition-all hover:scale-105 flex items-center gap-2"
            style={{ backgroundColor: THEME_TOKENS.colors.brand.goldPremium, color: THEME_TOKENS.colors.neutral.grayDark }}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Execute Query
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center p-12 gap-2 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: THEME_TOKENS.colors.brand.goldPremium }} />
          <span className="text-xs">Computing semantic alignments...</span>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div 
          className="w-full max-w-4xl p-8 rounded-xl border backdrop-blur-md"
          style={{ 
            backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
            borderColor: THEME_TOKENS.colors.background.borderGlass 
          }}
        >
          <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: THEME_TOKENS.colors.brand.goldPremium }} />
            Search Query Results
          </h3>
          <div className="space-y-4">
            {results.map((res) => (
              <div 
                key={res.id}
                className="flex justify-between items-center p-4 rounded border transition-all hover:bg-black/10"
                style={{ borderColor: 'rgba(212,175,55,0.1)' }}
              >
                <div>
                  <h4 className="font-medium text-sm">{res.name}</h4>
                  <p className="text-xs text-gray-400 font-light mt-1">{res.dept || 'Software Engineering'} • {res.experience || '5 years'} experience</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400 font-light">Match Index</span>
                  <div className="font-semibold text-sm" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
                    {res.match || '85%'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
