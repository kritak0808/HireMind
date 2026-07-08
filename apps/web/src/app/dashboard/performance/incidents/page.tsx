'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { PerformanceNav } from '../PerformanceNav';
import { ShieldAlert, RefreshCw, Clock, CheckCircle, Plus } from 'lucide-react';

export default function IncidentTimeline() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // New incident form states
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("warning");
  const [description, setDescription] = useState("");

  const loadData = useCallback(async () => {
    const token = localStorage.getItem('hiremind_token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const headers = { Authorization: `Bearer ${token}` };

    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/v1/performance/incidents`, { headers });
      if (res.ok) {
        const data = await res.json();
        setIncidents(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    const token = localStorage.getItem('hiremind_token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const headers = { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    };

    try {
      setCreating(true);
      const res = await fetch(`${apiUrl}/api/v1/performance/incidents`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title, severity, description })
      });
      if (res.ok) {
        setTitle("");
        setDescription("");
        await loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleResolveIncident = async (id: string) => {
    const token = localStorage.getItem('hiremind_token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await fetch(`${apiUrl}/api/v1/performance/incidents/${id}/resolve`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        await loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div 
      className="min-h-screen p-8 text-white"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      <div className="mb-6 flex justify-between items-center">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
            Operational Anomalies
          </span>
          <h2 className="text-4xl font-bold tracking-tight mt-1">Incident History & Timeline</h2>
        </div>
        <button onClick={loadData} className="p-2 border border-gray-800 hover:bg-gray-800 rounded flex items-center gap-2 text-xs">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <PerformanceNav active="/dashboard/performance/incidents" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Incident logs list */}
        <div 
          className="p-6 rounded-xl border col-span-2"
          style={{ 
            backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
            borderColor: THEME_TOKENS.colors.background.borderGlass 
          }}
        >
          <h3 className="text-lg font-bold mb-6" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
            System Regressions & Incidents
          </h3>
          
          {incidents.length > 0 ? (
            <div className="space-y-6 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-800">
              {incidents.map((inc, i) => {
                let iconColor = "#9ca3af";
                let tagColor = "rgba(156,163,175,0.1)";
                let textColor = "#9ca3af";
                
                if (inc.severity === "critical") {
                  iconColor = "#f87171";
                  tagColor = "rgba(248,113,113,0.1)";
                  textColor = "#f87171";
                } else if (inc.severity === "warning" || inc.severity === "high") {
                  iconColor = "#fbbf24";
                  tagColor = "rgba(251,191,36,0.1)";
                  textColor = "#fbbf24";
                } else if (inc.status === "resolved") {
                  iconColor = "#34d399";
                  tagColor = "rgba(52,211,153,0.1)";
                  textColor = "#34d399";
                }

                return (
                  <div key={i} className="flex gap-6 items-start relative pl-1">
                    {/* Timeline circle */}
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10"
                      style={{ backgroundColor: tagColor }}
                    >
                      <ShieldAlert className="w-5 h-5" style={{ color: iconColor }} />
                    </div>

                    <div className="flex-1 p-4 border border-gray-800 rounded-xl bg-gray-900/10">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold">{inc.title}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(inc.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 leading-normal my-2">{inc.description}</p>
                      
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex gap-3">
                          <span 
                            className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded"
                            style={{ backgroundColor: tagColor, color: textColor }}
                          >
                            {inc.severity}
                          </span>
                          <span 
                            className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-gray-800 text-gray-400"
                          >
                            Status: {inc.status}
                          </span>
                        </div>
                        {inc.status !== 'resolved' && (
                          <button 
                            onClick={() => handleResolveIncident(inc.id)}
                            className="px-2.5 py-1 rounded bg-green-500 hover:bg-green-600 text-neutral-900 font-extrabold text-[9px] uppercase tracking-wider transition-all"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-xs text-gray-500 py-12">
              No incidents reported. Run simulated operations or trigger a manual incident.
            </div>
          )}
        </div>

        {/* Trigger manual incident */}
        <div 
          className="p-6 rounded-xl border col-span-1 h-fit"
          style={{ 
            backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
            borderColor: THEME_TOKENS.colors.background.borderGlass 
          }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: THEME_TOKENS.colors.brand.goldPremium }}>
            Raise Incident
          </h3>
          <form onSubmit={handleCreateIncident} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Title</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g. DB Pool Saturated"
                className="w-full bg-gray-950 border border-gray-850 p-2 text-xs rounded text-white" 
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Severity</label>
              <select 
                value={severity} 
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full bg-gray-950 border border-gray-850 p-2 text-xs rounded text-white"
              >
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Description</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details of the operational issue..."
                rows={3} 
                className="w-full bg-gray-950 border border-gray-850 p-2 text-xs rounded text-white"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={creating}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-900 text-xs font-bold uppercase tracking-wider rounded transition-all"
            >
              <Plus className="w-4 h-4" />
              {creating ? "Reporting..." : "Report Incident"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
