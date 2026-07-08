'use client';

import React, { useState } from 'react';
import { THEME_TOKENS } from '@hiremind/ui';

export default function LiveStudioPage() {
  const [transcripts, setTranscripts] = useState([
    { speaker: "Interviewer AI", text: "Niels, describe your experience with high throughput message brokers." },
    { speaker: "Niels Bohr", text: "We optimized a Kafka cluster handling 100k messages per second with minimal partition lag." }
  ]);

  return (
    <div 
      className="min-h-screen p-6 text-white flex flex-col lg:flex-row gap-6 justify-center items-stretch"
      style={{ backgroundColor: THEME_TOKENS.colors.background.deepMatte, fontFamily: THEME_TOKENS.typography.fontFamily }}
    >
      {/* Video feeds panels */}
      <div className="flex-grow flex flex-col gap-6 lg:w-2/3">
        <div 
          className="flex-grow rounded-xl border backdrop-blur-md relative overflow-hidden h-[400px] flex items-center justify-center bg-black/40"
          style={{ borderColor: THEME_TOKENS.colors.background.borderGlass }}
        >
          {/* Main candidate stream layout stub */}
          <div className="text-center">
            <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-bold text-2xl mb-3">
              NB
            </div>
            <span className="font-semibold text-lg">Niels Bohr</span>
            <p className="text-xs text-gray-400 font-light mt-1">Live candidate video stream connection</p>
          </div>

          <div className="absolute bottom-4 left-4 flex gap-2">
            <span className="text-[10px] font-mono border px-2 py-1 rounded border-yellow-500/20 bg-black/80 text-yellow-400">
              HD 1080p • 2.4 Mbps
            </span>
            <span className="text-[10px] font-mono border px-2 py-1 rounded border-gray-800 bg-black/80 text-green-400">
              Jitter: 0.8ms
            </span>
          </div>
        </div>

        {/* Small interviewer feed */}
        <div 
          className="h-[120px] w-[200px] rounded-lg border backdrop-blur-md self-start flex items-center justify-center bg-black/40"
          style={{ borderColor: THEME_TOKENS.colors.background.borderGlass }}
        >
          <span className="text-xs font-semibold text-gray-300">Interviewer Feed</span>
        </div>
      </div>

      {/* Right intelligence rail: transcripts and analytics */}
      <div 
        className="w-full lg:w-1/3 p-6 rounded-xl border backdrop-blur-md flex flex-col justify-between h-[546px]"
        style={{ 
          backgroundColor: THEME_TOKENS.colors.background.panelGlass, 
          borderColor: THEME_TOKENS.colors.background.borderGlass 
        }}
      >
        <div>
          <h3 className="text-md font-semibold mb-4 border-b border-gray-800 pb-2">Realtime transcript Rail</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
            {transcripts.map((t, idx) => (
              <div key={idx} className="text-xs border-l-2 pl-3 border-yellow-500/20">
                <span className="font-bold text-gray-300 block mb-0.5">{t.speaker}</span>
                <p className="text-gray-400 font-light leading-relaxed">{t.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-800 pt-4 mt-4 flex justify-between items-center text-xs">
          <span className="text-gray-400 font-light">Speaking balance:</span>
          <span className="font-semibold text-yellow-400">Candidate 70% / AI 30%</span>
        </div>
      </div>
    </div>
  );
}
