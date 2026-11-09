'use client';

import React from 'react';
import { TelemetryMetrics, CodeFile } from '@/types/legacy';
import {
  FileText,
  AlertTriangle,
  Flame,
  Zap,
  Trash2,
  Code2,
} from 'lucide-react';

interface TelemetryStripProps {
  telemetry: TelemetryMetrics;
  files: CodeFile[];
}

export const TelemetryStrip: React.FC<TelemetryStripProps> = ({
  telemetry,
  files,
}) => {
  // Determine debt score color
  const getDebtBadgeColor = (score: number) => {
    if (score >= 80) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    if (score >= 50) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  // Group languages
  const languageCounts = files.reduce((acc, f) => {
    acc[f.language] = (acc[f.language] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="w-full bg-zinc-950 px-4 sm:px-6 py-4 border-b border-zinc-800/80">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* KPI 1: Files & Lines Indexed */}
        <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-3.5 hover:border-zinc-700/80 transition-all">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-1">
            <span className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-blue-400" />
              INDEXED REPOSITORY
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
              {files.length} Modules
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tracking-tight text-white">
              {telemetry.totalFiles} Files
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              / {telemetry.totalLines} Lines
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {Object.entries(languageCounts).map(([lang, count]) => (
              <span
                key={lang}
                className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800/70 text-zinc-300 border border-zinc-700/40 uppercase"
              >
                {lang}: {count}
              </span>
            ))}
          </div>
        </div>

        {/* KPI 2: Technical Debt Score */}
        <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-3.5 hover:border-zinc-700/80 transition-all">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-1">
            <span className="flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-rose-400" />
              TECHNICAL DEBT INDEX
            </span>
            <span
              className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${getDebtBadgeColor(
                telemetry.techDebtScore
              )}`}
            >
              {telemetry.techDebtScore >= 80 ? 'CRITICAL RISK' : 'ELEVATED'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tracking-tight text-rose-400">
              {telemetry.techDebtScore}
            </span>
            <span className="text-xs text-zinc-500 font-mono">/ 100</span>
          </div>
          {/* Progress bar */}
          <div className="mt-2.5 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(telemetry.techDebtScore, 100)}%` }}
            />
          </div>
        </div>

        {/* KPI 3: Hardcoded Business Rules */}
        <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-3.5 hover:border-zinc-700/80 transition-all">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-1">
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              HARDCODED BUSINESS RULES
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Line-Cited
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tracking-tight text-amber-400">
              {telemetry.hardcodedRulesCount}
            </span>
            <span className="text-xs text-zinc-400">Extracted Policies</span>
          </div>
          <p className="mt-2 text-[11px] text-zinc-400 truncate">
            Tax rates, overdraft constants, age boundaries
          </p>
        </div>

        {/* KPI 4: Critical Hotspots & Dead Code */}
        <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-3.5 hover:border-zinc-700/80 transition-all">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-1">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-emerald-400" />
              COUPLING & DEAD ARTIFACTS
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {telemetry.deadCodeLines}L Dead Code
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tracking-tight text-white">
              {telemetry.criticalCouplingHotspots}
            </span>
            <span className="text-xs text-zinc-400">Critical Hotspots</span>
          </div>
          <p className="mt-2 text-[11px] text-emerald-400/90 truncate flex items-center gap-1">
            <Trash2 className="h-3 w-3" />
            <span>28 lines safe to purge immediately</span>
          </p>
        </div>
      </div>
    </div>
  );
};
