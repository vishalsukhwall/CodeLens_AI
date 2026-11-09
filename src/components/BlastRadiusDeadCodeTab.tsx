'use client';

import React, { useState } from 'react';
import {
  CodeFile,
  BlastRadiusSimulation,
  DeadCodeReport,
  RefactoringStep,
} from '@/types/legacy';
import {
  Flame,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Play,
  RotateCw,
  Zap,
  ArrowUpRight,
  FileCode,
  Sparkles,
} from 'lucide-react';

interface BlastRadiusDeadCodeTabProps {
  files: CodeFile[];
  simulation: BlastRadiusSimulation;
  deadCodeReport: DeadCodeReport;
  onSimulateImpact: (
    targetFile: string,
    targetSymbol: string,
    proposedChange: string
  ) => void;
  isSimulating: boolean;
  onJumpToCodeCitation: (file: string, lineStart: number, lineEnd: number) => void;
}

export const BlastRadiusDeadCodeTab: React.FC<BlastRadiusDeadCodeTabProps> = ({
  files,
  simulation,
  deadCodeReport,
  onSimulateImpact,
  isSimulating,
  onJumpToCodeCitation,
}) => {
  const [selectedFile, setSelectedFile] = useState<string>(
    simulation.targetFile || files[0]?.name || 'UserAuthSchema.sql'
  );
  const [symbol, setSymbol] = useState<string>(simulation.targetSymbol || 'customer_tier');
  const [proposedChange, setProposedChange] = useState<string>(
    simulation.proposedChange || 'Rename customer_tier column to account_level in UserAuthSchema.sql'
  );

  const changePresets = [
    {
      label: 'Rename customer_tier to account_level',
      file: 'UserAuthSchema.sql',
      symbol: 'customer_tier',
      change: 'Rename customer_tier column to account_level in UserAuthSchema.sql:13',
    },
    {
      label: 'Reduce Tax 18.5% -> 12.0% per 2015 Reform',
      file: 'LoanInterestEngine.java',
      symbol: 'calculateNetWithholdingTax',
      change: 'Modify withholding tax rate from 18.5% to 12.0% in LoanInterestEngine.java:84',
    },
    {
      label: 'Drop legacy_fax_optin Ghost Column',
      file: 'UserAuthSchema.sql',
      symbol: 'legacy_fax_optin',
      change: 'Drop legacy_fax_optin column in UserAuthSchema.sql:18 (unused since 2009)',
    },
    {
      label: 'Purge reconcileLegacyTapeBatch Routine',
      file: 'MonthlyBillingBatch.java',
      symbol: 'reconcileLegacyTapeBatch',
      change: 'Remove deprecated reconcileLegacyTapeBatch() from MonthlyBillingBatch.java:165-192',
    },
  ];

  const applyPreset = (preset: typeof changePresets[0]) => {
    setSelectedFile(preset.file);
    setSymbol(preset.symbol);
    setProposedChange(preset.change);
  };

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    onSimulateImpact(selectedFile, symbol, proposedChange);
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'HIGH':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div className="space-y-10">
      {/* ================================================================= */}
      {/* TOP HALF: Live Cross-File Blast-Radius Risk Simulator */}
      {/* ================================================================= */}
      <div className="rounded-xl border border-zinc-800/90 bg-zinc-950 p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-rose-400" />
              <h2 className="text-base font-bold text-white">
                Live Cross-File Blast-Radius & Change-Impact Simulator
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                /api/impact
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Select any legacy function, SQL column, or constant to simulate downstream breakages, type mismatches, and silent errors.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-zinc-500 font-mono">1-Click Scenarios:</span>
            {changePresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(preset)}
                className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 transition-all hover:border-zinc-500"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSimulate} className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4 space-y-1">
            <label className="text-xs font-medium text-zinc-300">Target Legacy File</label>
            <select
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-200 focus:border-blue-500 focus:outline-none"
            >
              {files.map((f) => (
                <option key={f.id} value={f.name}>
                  {f.name} ({f.language})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className="text-xs font-medium text-zinc-300">Target Symbol / Column</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="e.g. customer_tier or taxRate"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-200 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-5 space-y-1">
            <label className="text-xs font-medium text-zinc-300">Proposed Change Specification</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={proposedChange}
                onChange={(e) => setProposedChange(e.target.value)}
                placeholder="Describe planned refactoring or schema edit..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSimulating}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-rose-600/30 disabled:opacity-50 transition-all"
              >
                <Sparkles className={`h-3.5 w-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                <span>{isSimulating ? 'Simulating...' : 'Simulate'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Simulation Output Dashboard */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-5">
          {/* Header Score & Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl font-mono font-bold text-lg border ${
                  simulation.blastRadiusScore >= 70
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : simulation.blastRadiusScore >= 40
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                }`}
              >
                {simulation.blastRadiusScore}%
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Blast Radius Score</span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${getSeverityBadge(
                      simulation.severity
                    )}`}
                  >
                    {simulation.severity} RISK
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Target: <code className="text-zinc-200 font-mono">{simulation.targetSymbol}</code> in{' '}
                  <code className="text-blue-400 font-mono">{simulation.targetFile}</code>
                </p>
              </div>
            </div>

            <div className="text-xs text-zinc-400 max-w-md bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 leading-relaxed">
              {simulation.summary}
            </div>
          </div>

          {/* Broken Downstream Files & Modules */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              Impacted Downstream Files & Broken Code Sites ({simulation.affectedModules.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {simulation.affectedModules.map((mod, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 p-3.5 space-y-2 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => onJumpToCodeCitation(mod.file, mod.line, mod.line + 4)}
                      className="font-mono text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <span>
                        {mod.file}:{mod.line}
                      </span>
                      <ArrowUpRight className="h-3 w-3 opacity-60" />
                    </button>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                      {mod.impactType}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-zinc-300 bg-zinc-900/80 p-1.5 rounded border border-zinc-800 truncate">
                    {mod.symbol}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {mod.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Refactoring Checklist & Side Effects (2 Cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
            {/* Step-by-Step Refactoring Checklist */}
            <div className="lg:col-span-7 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Zero-Downtime Decoupling & Refactoring Plan
              </h4>
              <div className="space-y-2">
                {simulation.refactoringChecklist.map((step) => (
                  <div
                    key={step.step}
                    className="flex items-start gap-3 p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 font-mono text-[11px] font-bold text-blue-400">
                      {step.step}
                    </span>
                    <div className="flex-1 space-y-1">
                      <p className="text-zinc-200 leading-snug">{step.task}</p>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                        <span>Target: {step.file}</span>
                        <span>•</span>
                        <span
                          className={`font-semibold ${
                            step.estimatedRisk === 'HIGH'
                              ? 'text-rose-400'
                              : step.estimatedRisk === 'MEDIUM'
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {step.estimatedRisk} RISK
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Runtime Side-Effect Cards */}
            <div className="lg:col-span-5 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Uncaught Runtime Side Effects
              </h4>
              <div className="space-y-2">
                {simulation.sideEffects.map((sideEffect, sidx) => (
                  <div
                    key={sidx}
                    className="p-3 rounded-lg bg-zinc-950 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2"
                  >
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{sideEffect}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* BOTTOM HALF: Dead Code & Ghost Dependency Hunter */}
      {/* ================================================================= */}
      <div className="rounded-xl border border-zinc-800/90 bg-zinc-950 p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                Dead Code & Ghost Dependency Hunter
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {deadCodeReport.summary.totalDeadLines} Lines Reclaimable
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Automated categorization into Safe-to-Retire, Tangled / Circular, and Active Critical Path with safety confidence scores.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-medium max-w-sm">
            💡 {deadCodeReport.summary.recommendedFirstAction}
          </div>
        </div>

        {/* 3 Color-Coded Buckets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Bucket 1: Safe to Retire (Emerald) */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                SAFE TO RETIRE (0 CALLERS)
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                {deadCodeReport.safeToRetire.length} Blocks
              </span>
            </div>

            <div className="space-y-2.5">
              {deadCodeReport.safeToRetire.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg bg-zinc-950/80 border border-emerald-500/20 p-3 space-y-1.5 hover:border-emerald-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => onJumpToCodeCitation(item.file, item.lineStart, item.lineEnd)}
                      className="font-mono text-xs font-semibold text-emerald-300 hover:text-emerald-200 flex items-center gap-1"
                    >
                      <span>
                        {item.file}:{item.lineStart}
                      </span>
                      <ArrowUpRight className="h-3 w-3 opacity-60" />
                    </button>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      {item.safetyScore}% Safe
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-zinc-300 font-semibold truncate">
                    {item.symbol}
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    {item.reason}
                  </p>
                  {item.linesSaved && (
                    <span className="inline-block text-[10px] font-mono text-emerald-400">
                      + Reclaims {item.linesSaved} lines
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bucket 2: Tangled / Circular (Amber) */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/10 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                TANGLED / CIRCULAR DEPS
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                {deadCodeReport.tangledDependencies.length} Blocks
              </span>
            </div>

            <div className="space-y-2.5">
              {deadCodeReport.tangledDependencies.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg bg-zinc-950/80 border border-amber-500/20 p-3 space-y-1.5 hover:border-amber-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => onJumpToCodeCitation(item.file, item.lineStart, item.lineEnd)}
                      className="font-mono text-xs font-semibold text-amber-300 hover:text-amber-200 flex items-center gap-1"
                    >
                      <span>
                        {item.file}:{item.lineStart}
                      </span>
                      <ArrowUpRight className="h-3 w-3 opacity-60" />
                    </button>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      {item.safetyScore}% Caution
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-zinc-300 font-semibold truncate">
                    {item.symbol}
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    {item.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Bucket 3: Active Critical Path (Rose) */}
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/10 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                <ShieldAlert className="h-4 w-4" />
                ACTIVE CRITICAL PATH (DO NOT DELETE)
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                {deadCodeReport.activeCriticalPath.length} Blocks
              </span>
            </div>

            <div className="space-y-2.5">
              {deadCodeReport.activeCriticalPath.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg bg-zinc-950/80 border border-rose-500/20 p-3 space-y-1.5 hover:border-rose-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => onJumpToCodeCitation(item.file, item.lineStart, item.lineEnd)}
                      className="font-mono text-xs font-semibold text-rose-300 hover:text-rose-200 flex items-center gap-1"
                    >
                      <span>
                        {item.file}:{item.lineStart}
                      </span>
                      <ArrowUpRight className="h-3 w-3 opacity-60" />
                    </button>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                      0% (Protected)
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-zinc-300 font-semibold truncate">
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
    </div>
  );
};
