'use client';

import React, { useState } from 'react';
import {
  FileCode2,
  Upload,
  Download,
  Key,
  RotateCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Database,
  ExternalLink,
} from 'lucide-react';

interface TopControlBarProps {
  engineStatus: 'live' | 'analyzing' | 'fallback';
  engineStatusMessage?: string;
  isAnalyzing: boolean;
  onLoadSampleRepo: () => void;
  onOpenIngestDrawer: () => void;
  onDownloadPdf: () => void;
  isDownloadingPdf: boolean;
  userApiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const TopControlBar: React.FC<TopControlBarProps> = ({
  engineStatus,
  engineStatusMessage,
  isAnalyzing,
  onLoadSampleRepo,
  onOpenIngestDrawer,
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
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-4 sm:px-6 py-3 transition-colors">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo & Status Brand Pill */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 shadow-sm shadow-blue-500/20">
                <FileCode2 className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                    CodeLense <span className="text-blue-400">AI</span>
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60 uppercase tracking-wider">
                    v2.5 Flash Copilot
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 hidden sm:block">
                  Developer-First Legacy Codebase, Blast-Radius & KT Blueprint Copilot
                </p>
              </div>
            </div>

            {/* Live Engine Status Pill */}
            <button
              onClick={() => setShowKeyModal(true)}
              title="Click to configure Gemini API Key"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border transition-all cursor-pointer hover:brightness-110 ${
                engineStatus === 'live'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : engineStatus === 'analyzing'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  engineStatus === 'live'
                    ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                    : engineStatus === 'analyzing'
                    ? 'bg-blue-400 animate-ping'
                    : 'bg-amber-400'
                }`}
              />
              <span>
                {engineStatus === 'live'
                  ? '● LIVE GEMINI 2.5 FLASH'
                  : engineStatus === 'analyzing'
                  ? '● ANALYZING...'
                  : '● FALLBACK CACHE ACTIVE'}
              </span>
              <Key className="h-3 w-3 opacity-60 ml-0.5" />
            </button>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* 1-Click Sample Banking Repo Preset */}
            <button
              onClick={onLoadSampleRepo}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-900 hover:bg-zinc-800/90 text-zinc-200 border border-zinc-700/70 transition-all hover:border-zinc-600 disabled:opacity-50"
              title="Load 4-file tightly-coupled legacy banking repository"
            >
              <Database className={`h-3.5 w-3.5 text-blue-400 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span className="hidden lg:inline">Load Sample Enterprise Legacy Repo (4 Connected Files)</span>
              <span className="lg:hidden">Sample Repo (4 Files)</span>
            </button>

            {/* Ingest Code / Upload Drawer */}
            <button
              onClick={onOpenIngestDrawer}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-900 hover:bg-zinc-800/90 text-zinc-200 border border-zinc-700/70 transition-all hover:border-zinc-600 disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5 text-emerald-400" />
              <span>Ingest Code / Upload Files</span>
            </button>

            {/* Download Technical KT PDF (Primary CTA) */}
            <button
              onClick={onDownloadPdf}
              disabled={isDownloadingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className={`h-3.5 w-3.5 ${isDownloadingPdf ? 'animate-bounce' : ''}`} />
              <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download Technical KT & Blueprint PDF'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Gemini API Key Configuration</h3>
                  <p className="text-xs text-zinc-400">Direct integration via @google/genai SDK</p>
                </div>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-300">
                Gemini API Key (Supporting Standard & <code className="text-blue-400">AQ.</code> Keys)
              </label>
              <input
                type="password"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder="AIza... or AQ.xxx..."
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[11px] text-zinc-500">
                Supports any standard Gemini key or AQ prefix with zero regex blocking. Can also be set in{' '}
                <code className="text-zinc-400 font-mono">GEMINI_API_KEY</code> environment variable.
              </p>
            </div>

            <div className="rounded-lg bg-zinc-950/60 border border-zinc-800/80 p-3 text-xs text-zinc-400 space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Deterministic Fallback Cache Included</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                If no key is configured or you are offline, CodeLense AI smoothly executes using the verified 4-file banking forensic cache.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-3 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleKeySave}
                className="px-4 py-1.5 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-600/30"
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
