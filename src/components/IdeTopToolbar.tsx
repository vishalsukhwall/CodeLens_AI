'use client';

import React, { useState } from 'react';
import {
  FileCode2,
  Download,
  Key,
  Database,
  Layers,
  Sparkles,
  ShieldCheck,
  Flame,
  CheckCircle2,
  Clock,
  Cpu,
  ArrowRight,
} from 'lucide-react';
import { TelemetryMetrics } from '@/types/legacy';

interface IdeTopToolbarProps {
  activeView: 'xray' | 'deadcode' | 'testguard';
  onSelectView: (view: 'xray' | 'deadcode' | 'testguard') => void;
  engineStatus: 'live' | 'analyzing' | 'fallback';
  engineStatusMessage?: string;
  telemetry: TelemetryMetrics;
  onDownloadPdf: () => void;
  isDownloadingPdf: boolean;
  userApiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const IdeTopToolbar: React.FC<IdeTopToolbarProps> = ({
  activeView,
  onSelectView,
  engineStatus,
  engineStatusMessage,
  telemetry,
  onDownloadPdf,
  isDownloadingPdf,
  userApiKey,
  onSaveApiKey,
}) => {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState(userApiKey);

  const handleKeySave = () => {
    onSaveApiKey(tempKey);
    setShowKeyModal(false);
  };

  return (
    <>
      <header className="h-13 min-h-[52px] border-b border-blueprint-800 bg-blueprint-950/95 backdrop-blur-md px-4 flex items-center justify-between gap-3 z-40 select-none">
        {/* Left: Brand + Confident Engine Status Badge */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shadow-sm shadow-indigo-500/20">
              <FileCode2 className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1 font-mono">
                CodeLens <span className="text-indigo-400">AI</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blueprint-850 text-indigo-300 border border-indigo-500/30 font-semibold tracking-wider uppercase hidden sm:inline">
                IDE v2.5
              </span>
            </div>
          </div>

          {/* Confident Header Engine Status Badge */}
          <button
            onClick={() => setShowKeyModal(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border transition-all hover:brightness-110 cursor-pointer ${
              engineStatus === 'live'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : engineStatus === 'analyzing'
                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
            }`}
            title="Configure Gemini API Key or inspect AST engine status"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                engineStatus === 'live'
                  ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                  : engineStatus === 'analyzing'
                  ? 'bg-indigo-400 animate-ping'
                  : 'bg-cyan-400 shadow-sm shadow-cyan-400/40'
              }`}
            />
            <span className="hidden sm:inline">
              {engineStatus === 'live'
                ? '● LIVE AST + GEMINI ENGINE'
                : engineStatus === 'analyzing'
                ? '● ANALYZING...'
                : '● INSTANT AST ENGINE • READY'}
            </span>
            <span className="sm:hidden">
              {engineStatus === 'live' ? 'LIVE' : 'READY'}
            </span>
            <Key className="h-2.5 w-2.5 opacity-60 ml-0.5" />
          </button>
        </div>

        {/* Center: 3 Segmented Focused Views with Single-Line Whitespace-Nowrap */}
        <div className="hidden lg:flex items-center bg-blueprint-900 border border-blueprint-800 rounded-lg p-0.5 text-xs shrink-0">
          <button
            onClick={() => onSelectView('xray')}
            className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-md font-semibold transition-all ${
              activeView === 'xray'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-blueprint-850'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>Architecture & Code X-Ray</span>
          </button>

          <button
            onClick={() => onSelectView('deadcode')}
            className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-md font-semibold transition-all ${
              activeView === 'deadcode'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-blueprint-850'
            }`}
          >
            <Flame className="h-3.5 w-3.5 text-rose-400" />
            <span>Dead Code & Coupling Audit</span>
          </button>

          <button
            onClick={() => onSelectView('testguard')}
            className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-md font-semibold transition-all ${
              activeView === 'testguard'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-blueprint-850'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>TestGuard Generator</span>
          </button>
        </div>

        {/* Right: Modernization Health Strip & Primary PDF CTA */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Health Bar Pills */}
          <div className="hidden xl:flex items-center gap-2 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-blueprint-850 border border-blueprint-800 text-zinc-300">
              <span className="text-zinc-500">Files:</span> {telemetry.totalFiles} ({telemetry.totalLines}L)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 font-medium">
              <span className="text-amber-500">Rules:</span> {telemetry.hardcodedRulesCount}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 font-semibold">
              <span className="text-rose-500">Debt:</span> {telemetry.techDebtScore}/100
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-semibold flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>KT: 6 Wks → 10m</span>
            </span>
          </div>

          {/* Primary Blueprint PDF CTA */}
          <button
            onClick={onDownloadPdf}
            disabled={isDownloadingPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow-md shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            <Download className={`h-3.5 w-3.5 ${isDownloadingPdf ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">Export Technical KT & Blueprint PDF</span>
            <span className="sm:hidden">Export PDF</span>
          </button>
        </div>
      </header>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-blueprint-800 bg-blueprint-900 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white font-mono">Gemini API Key Configuration</h3>
                  <p className="text-xs text-zinc-400">Direct integration via @google/genai SDK</p>
                </div>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-zinc-400 hover:text-white text-base font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-300">
                Gemini API Key (Standard or <code className="text-indigo-400">AQ.</code> keys supported)
              </label>
              <input
                type="password"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder="AIza... or AQ.xxx..."
                className="w-full rounded-md border border-blueprint-700 bg-blueprint-950 px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
              />
              <p className="text-[11px] text-zinc-500">
                Zero prefix validation regex. Accepts any valid key format, or reads from <code className="text-zinc-400 font-mono">GEMINI_API_KEY</code> environment variable.
              </p>
            </div>

            <div className="rounded-lg bg-blueprint-950 border border-blueprint-800 p-3 text-xs text-zinc-300 space-y-1 font-mono">
              <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                <span>Deterministic Zero-Failure AST Engine</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                When running without an API key or offline, CodeLens AI operates in instant zero-failure demo mode using pre-indexed structured AST analysis.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-3 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={handleKeySave}
                className="px-4 py-1.5 rounded-md text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
