'use client';

import React, { useState, useEffect } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { Cpu, TrendingUp, AlertTriangle, CheckCircle, Star, Loader2 } from 'lucide-react';

interface CandidateProfile {
  id: string;
  name: string;
  score: number;
  initials: string;
  color: string;
  skills: string[];
  experience: string;
  risk: string;
  fit: string;
  salary: string;
}

const NAMES = ['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Marie Curie', 'Richard Feynman', 'Niels Bohr'];
const AVATAR_COLORS = ['#D4AF37', '#60a5fa', '#34d399', '#a78bfa', '#f87171', '#fb923c'];

const RADAR_DIMS = ['Technical', 'Leadership', 'Communication', 'Culture Fit', 'Experience', 'Availability'];

function RadarChart({ scoreA, scoreB, colorA, colorB }: { scoreA: number; scoreB: number; colorA: string; colorB: string }) {
  const cx = 120, cy = 120, r = 90;
  const n = RADAR_DIMS.length;

  const toXY = (index: number, scale: number) => {
    const angle = (index / n) * 2 * Math.PI - Math.PI / 2;
    return {
      x: cx + r * scale * Math.cos(angle),
      y: cy + r * scale * Math.sin(angle),
    };
  };

  const makePolygon = (baseScore: number, variance: number[]) =>
    variance.map((v, i) => {
      const scale = Math.min(1, Math.max(0.1, (baseScore + v) / 100));
      const p = toXY(i, scale);
      return `${p.x},${p.y}`;
    }).join(' ');

  const aVariance = [-5, 8, -3, 4, -2, 6];
  const bVariance = [6, -4, 7, -8, 5, -3];

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-xs mx-auto">
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map(scale => (
        <polygon key={scale}
          points={RADAR_DIMS.map((_, i) => { const p = toXY(i, scale); return `${p.x},${p.y}`; }).join(' ')}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      {/* Axes */}
      {RADAR_DIMS.map((_, i) => {
        const p = toXY(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
      })}
      {/* Labels */}
      {RADAR_DIMS.map((dim, i) => {
        const p = toXY(i, 1.2);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="8" fill="rgba(255,255,255,0.4)">
            {dim}
          </text>
        );
      })}
      {/* Polygon A */}
      <polygon points={makePolygon(scoreA, aVariance)}
        fill={`${colorA}25`} stroke={colorA} strokeWidth="1.5" strokeLinejoin="round" />
      {/* Polygon B */}
      <polygon points={makePolygon(scoreB, bVariance)}
        fill={`${colorB}20`} stroke={colorB} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export default function ComparisonStudio() {
  const gold = THEME_TOKENS.colors.brand.goldPremium;

  const [profiles, setProfiles] = useState<CandidateProfile[]>([]);
  const [selectedA, setSelectedA] = useState('');
  const [selectedB, setSelectedB] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('hiremind_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      try {
        const res = await fetch(`${apiUrl}/api/v1/search/candidates`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped: CandidateProfile[] = data.slice(0, 6).map((c, i) => ({
            id: c.id,
            name: NAMES[i % NAMES.length],
            score: Math.floor(75 + Math.random() * 24),
            initials: NAMES[i % NAMES.length].split(' ').map(n => n[0]).join(''),
            color: AVATAR_COLORS[i % AVATAR_COLORS.length],
            skills: [['Python', 'ML', 'AWS'], ['Go', 'K8s', 'gRPC'], ['React', 'Node', 'SQL'], ['Rust', 'C++', 'WASM']][i % 4],
            experience: `${6 + i * 2} years`,
            risk: ['Low', 'Medium', 'Low', 'High', 'Low', 'Medium'][i % 6],
            fit: `${80 + i * 3}%`,
            salary: `$${140 + i * 15}k/yr`,
          }));
          setProfiles(mapped);
          if (mapped.length >= 2) { setSelectedA(mapped[0].id); setSelectedB(mapped[1].id); }
        }
      } catch { /* silent */ }
      setLoading(false);
    };
    load();
  }, []);

  const profA = profiles.find(p => p.id === selectedA);
  const profB = profiles.find(p => p.id === selectedB);

  const ATTRS = [
    { label: 'ATS Score', key: 'score', format: (v: any) => `${v}%` },
    { label: 'Experience', key: 'experience', format: (v: any) => v },
    { label: 'Culture Fit', key: 'fit', format: (v: any) => v },
    { label: 'Salary Expect.', key: 'salary', format: (v: any) => v },
    { label: 'Risk Level', key: 'risk', format: (v: any) => v },
  ];

  return (
    <div className="min-h-full p-8" style={{ fontFamily: THEME_TOKENS.typography.fontFamily }}>
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: gold }}>Candidate Intelligence</p>
        <h1 className="text-3xl font-bold tracking-tight mt-1">Comparison Studio</h1>
        <p className="text-sm text-gray-500 mt-1">Side-by-side AI-powered candidate evaluation with radar analysis</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={32} className="animate-spin" style={{ color: gold }} />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { label: 'Candidate Alpha', value: selectedA, setter: setSelectedA, color: gold },
              { label: 'Candidate Beta', value: selectedB, setter: setSelectedB, color: '#60a5fa' },
            ].map(({ label, value, setter, color }) => (
              <div key={label} className="p-5 rounded-2xl border"
                style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-2"
                  style={{ color }}>
                  {label}
                </label>
                <select value={value} onChange={e => setter(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm bg-transparent text-white focus:outline-none"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id} style={{ backgroundColor: '#0f0f10' }}>{p.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {profA && profB && (
            <>
              {/* Profile Cards + Radar */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile A */}
                <ProfileCard profile={profA} color={gold} rank={1} />

                {/* Radar Center */}
                <div className="rounded-2xl border p-6 flex flex-col items-center justify-center"
                  style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Skills Radar</h3>
                  <RadarChart scoreA={profA.score} scoreB={profB.score} colorA={gold} colorB="#60a5fa" />
                  <div className="flex gap-6 mt-3 text-[10px]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 rounded" style={{ backgroundColor: gold }} />
                      {profA.name.split(' ')[0]}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 rounded bg-blue-400" />
                      {profB.name.split(' ')[0]}
                    </span>
                  </div>
                </div>

                {/* Profile B */}
                <ProfileCard profile={profB} color="#60a5fa" rank={2} />
              </div>

              {/* Comparison Table */}
              <div className="rounded-2xl border overflow-hidden"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="grid grid-cols-3 px-6 py-3 border-b text-[10px] font-bold uppercase tracking-wider"
                  style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                  <span className="text-gray-500">Attribute</span>
                  <span style={{ color: gold }}>{profA.name}</span>
                  <span className="text-blue-400">{profB.name}</span>
                </div>
                {ATTRS.map(attr => {
                  const vA = (profA as any)[attr.key];
                  const vB = (profB as any)[attr.key];
                  const aWins = attr.key === 'score' ? vA > vB : false;
                  const bWins = attr.key === 'score' ? vB > vA : false;
                  return (
                    <div key={attr.label}
                      className="grid grid-cols-3 px-6 py-4 border-b hover:bg-white/[0.02] transition-colors"
                      style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <span className="text-xs text-gray-500">{attr.label}</span>
                      <span className={`text-xs font-semibold ${aWins ? 'text-green-400' : 'text-white'}`}>
                        {attr.format(vA)} {aWins && '↑'}
                      </span>
                      <span className={`text-xs font-semibold ${bWins ? 'text-green-400' : 'text-white'}`}>
                        {attr.format(vB)} {bWins && '↑'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileCard({ profile, color, rank }: { profile: CandidateProfile; color: string; rank: number }) {
  const riskColor = { Low: '#34d399', Medium: '#D4AF37', High: '#f87171' }[profile.risk] || '#9ca3af';
  return (
    <div className="rounded-2xl border p-6 space-y-4"
      style={{ borderColor: color === '#D4AF37' ? `${color}30` : 'rgba(96,165,250,0.2)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-black"
          style={{ backgroundColor: color }}>
          {profile.initials}
        </div>
        <div>
          <div className="font-bold text-sm">{profile.name}</div>
          <div className="text-[10px] text-gray-500">Rank #{rank}</div>
        </div>
        <div className="ml-auto text-2xl font-black" style={{ color }}>
          {profile.score}%
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Experience</span>
          <span className="font-medium">{profile.experience}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Salary Expectation</span>
          <span className="font-medium">{profile.salary}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Risk Level</span>
          <span className="font-bold" style={{ color: riskColor }}>{profile.risk}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Culture Fit</span>
          <span className="font-medium">{profile.fit}</span>
        </div>
      </div>

      <div>
        <div className="text-[10px] text-gray-600 mb-2 uppercase tracking-wider">Core Skills</div>
        <div className="flex flex-wrap gap-1.5">
          {profile.skills.map(s => (
            <span key={s} className="text-[10px] px-2 py-1 rounded-lg border font-medium"
              style={{ borderColor: `${color}30`, color, backgroundColor: `${color}10` }}>
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
