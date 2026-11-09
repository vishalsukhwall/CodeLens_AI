'use client';

import React, { useState } from 'react';
import {
  DeadCodeReport,
  DeadCodeItem,
} from '@/types/legacy';
import {
  Trash2,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  Layers,
  Code2,
} from 'lucide-react';

interface DeadCodeAuditViewProps {
  deadCodeReport: DeadCodeReport;
  onJumpToCitation: (file: string, lineStart: number, lineEnd: number) => void;
}

export const DeadCodeAuditView: React.FC<DeadCodeAuditViewProps> = ({
  deadCodeReport,
  onJumpToCitation,
}) => {
  const [showPurgePreview, setShowPurgePreview] = useState(false);

  return (
    <div className="w-full h-full p-6 space-y-6 overflow-y-auto bg-blueprint-950">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blueprint-800">
        <div>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white font-mono">
              Dead Code & Circular Coupling Audit
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              {deadCodeReport.summary.totalDeadLines} Lines Reclaimable
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Static forensic triage of orphaned functions, ghost columns, and high-risk tangled dependencies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-blueprint-900 border border-blueprint-800 text-xs font-mono text-zinc-300">
            Coupling Index: <span className="text-amber-400 font-bold">{deadCodeReport.summary.overallCouplingIndex}/100</span>
          </div>

          <button
            onClick={() => setShowPurgePreview(!showPurgePreview)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>{showPurgePreview ? 'Hide Purge Diff' : 'Safe Purge Preview'}</span>
          </button>
        </div>
      </div>

      {/* Recommended First Action Banner */}
      <div className="p-3.5 rounded-xl bg-blueprint-900/60 border border-blueprint-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="text-zinc-200">
            <strong className="text-emerald-400">Recommended Action:</strong>{' '}
            {deadCodeReport.summary.recommendedFirstAction}
          </span>
        </div>
      </div>

      {/* Safe Purge Diff Preview Modal/Box */}
      {showPurgePreview && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 font-mono">
              <Code2 className="h-4 w-4" />
              <span>Safe-to-Purge Diff Extraction (28 Lines in MonthlyBillingBatch.java)</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded font-bold">
              0 Side-Effects
            </span>
          </div>

          <pre className="p-3 rounded bg-blueprint-950 border border-blueprint-800 text-xs font-mono text-rose-300/80 leading-relaxed overflow-x-auto">
{`-    @Deprecated
-    public List<String> reconcileLegacyTapeBatch(String tapeDriveMountPath, int blockSequence) {
-        LOGGER.warning("CRITICAL: Executing obsolete magnetic tape reconciliation routine: " + tapeDriveMountPath);
-        List<String> reconciliationLogs = new ArrayList<>();
-        if (tapeDriveMountPath == null || tapeDriveMountPath.isEmpty()) {
-            reconciliationLogs.add("ERR_MOUNT_FAILED: Tape drive path was null or empty.");
-            return reconciliationLogs;
-        }
-        for (int i = 0; i < blockSequence; i++) {
-            reconciliationLogs.add("VERIFIED_BLOCK_" + i + "_CRC32_CHECK_PASSED");
-        }
-        reconciliationLogs.add("STATUS: TAPE RECONCILIATION COMPLETED WITH 0 ERRORS.");
-        return reconciliationLogs;
-    }`}
          </pre>
        </div>
      )}

      {/* Visual 3-Column Architectural Audit Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Safe-to-Retire Dead Code (Emerald) */}
        <div className="rounded-xl border border-emerald-500/30 bg-blueprint-900/40 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 font-mono">
              <CheckCircle2 className="h-4 w-4" />
              SAFE TO RETIRE (0 CALLERS)
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              {deadCodeReport.safeToRetire.length} Blocks
            </span>
          </div>

          <div className="space-y-3">
            {deadCodeReport.safeToRetire.map((item) => (
              <div
                key={item.id}
                className="rounded-lg bg-blueprint-950 border border-emerald-500/20 p-3 space-y-2 hover:border-emerald-500/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => onJumpToCitation(item.file, item.lineStart, item.lineEnd)}
                    className="font-mono text-xs font-bold text-emerald-300 hover:text-emerald-200 flex items-center gap-1"
                  >
                    <span>{item.file}:{item.lineStart}</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </button>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                    {item.safetyScore}% Safe
                  </span>
                </div>

                <div className="font-mono text-xs text-zinc-200 font-semibold truncate">
                  {item.symbol}
                </div>

                <p className="text-[11px] text-zinc-400 leading-snug">
                  {item.reason}
                </p>

                {item.linesSaved && (
                  <div className="text-[10px] font-mono text-emerald-400">
                    + Reclaims {item.linesSaved} lines
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: High-Risk Tangled / Circular Dependencies (Amber) */}
        <div className="rounded-xl border border-amber-500/30 bg-blueprint-900/40 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 font-mono">
              <AlertTriangle className="h-4 w-4" />
              TANGLED / CIRCULAR DEPS
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
              {deadCodeReport.tangledDependencies.length} Blocks
            </span>
          </div>

          <div className="space-y-3">
            {deadCodeReport.tangledDependencies.map((item) => (
              <div
                key={item.id}
                className="rounded-lg bg-blueprint-950 border border-amber-500/20 p-3 space-y-2 hover:border-amber-500/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => onJumpToCitation(item.file, item.lineStart, item.lineEnd)}
                    className="font-mono text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1"
                  >
                    <span>{item.file}:{item.lineStart}</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </button>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                    {item.safetyScore}% Caution
                  </span>
                </div>

                <div className="font-mono text-xs text-zinc-200 font-semibold truncate">
                  {item.symbol}
                </div>

                <p className="text-[11px] text-zinc-400 leading-snug">
                  {item.reason}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Active Critical Path (Rose) */}
        <div className="rounded-xl border border-rose-500/30 bg-blueprint-900/40 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 font-mono">
              <ShieldAlert className="h-4 w-4" />
              ACTIVE CRITICAL PATH (DO NOT DELETE)
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
              {deadCodeReport.activeCriticalPath.length} Blocks
            </span>
          </div>

          <div className="space-y-3">
            {deadCodeReport.activeCriticalPath.map((item) => (
              <div
                key={item.id}
                className="rounded-lg bg-blueprint-950 border border-rose-500/20 p-3 space-y-2 hover:border-rose-500/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => onJumpToCitation(item.file, item.lineStart, item.lineEnd)}
                    className="font-mono text-xs font-bold text-rose-300 hover:text-rose-200 flex items-center gap-1"
                  >
                    <span>{item.file}:{item.lineStart}</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </button>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">
                    0% (Protected)
                  </span>
                </div>

                <div className="font-mono text-xs text-zinc-200 font-semibold truncate">
                  {item.symbol}
                </div>

                <p className="text-[11px] text-zinc-400 leading-snug">
                  {item.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
