'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  CodeFile,
  BusinessRule,
  IOContract,
} from '@/types/legacy';
import {
  FileCode,
  Zap,
  ArrowRight,
  Copy,
  Check,
  AlertTriangle,
  Info,
  Maximize2,
  Minimize2,
  ChevronDown,
  Layers,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';

interface SplitCodeXRayProps {
  file: CodeFile;
  highlightedLineRange: { start: number; end: number } | null;
  businessRules: BusinessRule[];
  ioContracts: IOContract[];
  onSelectLineRange?: (start: number, end: number) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const SplitCodeXRay: React.FC<SplitCodeXRayProps> = ({
  file,
  highlightedLineRange,
  businessRules,
  ioContracts,
  onSelectLineRange,
  isExpanded = false,
  onToggleExpand,
}) => {
  const [copied, setCopied] = useState(false);
  const codeContainerRef = useRef<HTMLDivElement>(null);

  // Filter business rules and I/O contracts belonging to this file
  const fileRules = businessRules.filter(
    (r) => r.file.toLowerCase() === file.name.toLowerCase()
  );
  const fileContracts = ioContracts.filter(
    (c) => c.file.toLowerCase() === file.name.toLowerCase()
  );

  const lines = file.content.split('\n');

  // Hardcoded rule lines map for gutter markers
  const ruleLinesMap = new Set<number>();
  fileRules.forEach((r) => {
    for (let l = r.lineStart; l <= r.lineEnd; l++) {
      ruleLinesMap.add(l);
    }
  });

  // Smooth scroll to highlighted line on change
  useEffect(() => {
    if (highlightedLineRange && codeContainerRef.current) {
      const lineEl = document.getElementById(`xray-line-${highlightedLineRange.start}`);
      if (lineEl) {
        lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedLineRange, file]);

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRuleClick = (start: number, end: number) => {
    if (onSelectLineRange) {
      onSelectLineRange(start, end);
    }
    const lineEl = document.getElementById(`xray-line-${start}`);
    if (lineEl) {
      lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-blueprint-900/90 border-t border-blueprint-800 overflow-hidden select-none min-h-[360px]">
      {/* Drawer Header with Comfortable Spacing & Control Pills */}
      <div className="h-11 px-5 border-b border-blueprint-800 bg-blueprint-950 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <FileCode className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
          <span className="font-mono font-bold text-zinc-100 text-sm truncate">{file.name}</span>
          <span className="text-xs font-mono text-zinc-400 shrink-0">({file.lineCount} Lines)</span>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-blueprint-850 text-indigo-300 border border-blueprint-700 font-medium hidden sm:inline-block shrink-0">
            Side-by-Side Plain-English X-Ray
          </span>
          {highlightedLineRange && (
            <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse shrink-0">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>Target L{highlightedLineRange.start}-{highlightedLineRange.end}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-mono text-zinc-300 hover:text-white px-3 py-1 rounded-md bg-blueprint-850 hover:bg-blueprint-800 border border-blueprint-700/80 transition-colors shadow-sm"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy Source'}</span>
          </button>

          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="flex items-center gap-1.5 text-xs font-mono text-zinc-300 hover:text-white px-2.5 py-1 rounded-md bg-blueprint-850 hover:bg-blueprint-800 border border-blueprint-700/80 transition-colors shadow-sm"
              title={isExpanded ? 'Restore Split View' : 'Maximize Code X-Ray'}
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="hidden md:inline">Split View</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="hidden md:inline">Maximize</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Side-by-Side Split Body with Generous Gap & Padding */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-blueprint-800 overflow-hidden">
        {/* Left Split: Line-Numbered Code Viewer (Readable text-xs leading-6) */}
        <div
          ref={codeContainerRef}
          className="h-full overflow-y-auto overflow-x-auto p-4 font-mono text-xs bg-blueprint-950 text-zinc-200 select-text"
        >
          {lines.map((lineText, idx) => {
            const lineNum = idx + 1;
            const isRuleLine = ruleLinesMap.has(lineNum);
            const isHighlighted =
              highlightedLineRange &&
              lineNum >= highlightedLineRange.start &&
              lineNum <= highlightedLineRange.end;
            const isFirstHighlightedLine =
              highlightedLineRange && lineNum === highlightedLineRange.start;

            return (
              <div
                key={lineNum}
                id={`xray-line-${lineNum}`}
                className={`flex items-start transition-colors group px-2 py-0.5 rounded ${
                  isHighlighted
                    ? 'bg-rose-500/20 border-l-4 border-rose-500 text-white font-semibold shadow-inner'
                    : isRuleLine
                    ? 'bg-amber-500/15 border-l-2 border-amber-400'
                    : 'hover:bg-blueprint-900/60'
                }`}
              >
                {/* Gutter with line number & amber/rose marker */}
                <div className="w-12 shrink-0 select-none text-right pr-4 text-xs font-mono flex items-center justify-end gap-1.5">
                  {isHighlighted ? (
                    <span
                      className="h-2 w-2 rounded-full bg-rose-400 shadow-sm shadow-rose-400/80 animate-ping"
                      title="Simulated Impact / Citation Target"
                    />
                  ) : isRuleLine ? (
                    <span
                      className="h-2 w-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"
                      title="Hardcoded Legacy Rule at this line"
                    />
                  ) : null}
                  <span
                    className={
                      isHighlighted
                        ? 'text-rose-300 font-bold'
                        : isRuleLine
                        ? 'text-amber-400 font-semibold'
                        : 'text-zinc-600 group-hover:text-zinc-400'
                    }
                  >
                    {lineNum}
                  </span>
                </div>

                {/* Code line with comfortable leading-6 and Impact Hotspot Pill */}
                <div className="flex-1 flex items-center min-w-0 pr-4">
                  {isFirstHighlightedLine && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 mr-2.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/30 text-rose-300 border border-rose-500/60 shrink-0 shadow-sm shadow-rose-500/30 animate-pulse">
                      <AlertTriangle className="h-3 w-3 text-rose-400" />
                      <span>Impact Hotspot</span>
                    </span>
                  )}
                  <pre className="whitespace-pre font-mono text-xs leading-6 overflow-visible">
                    {lineText || ' '}
                  </pre>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Split: Plain-English Translation & I/O Contracts with P-5 & Space-y-5 */}
        <div className="h-full overflow-y-auto p-5 space-y-5 bg-blueprint-900/40 text-xs">
          {/* Business Rules Header */}
          <div className="flex items-center justify-between pb-3 border-b border-blueprint-800">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 font-mono">
              <Zap className="h-4 w-4 text-amber-400" />
              Plain-English Business Rules ({fileRules.length})
            </span>
            <span className="text-xs font-mono text-zinc-400">Click to Inspect Line</span>
          </div>

          {fileRules.length > 0 ? (
            <div className="space-y-4">
              {fileRules.map((rule) => (
                <div
                  key={rule.id}
                  onClick={() => handleRuleClick(rule.lineStart, rule.lineEnd)}
                  className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-3 hover:border-amber-500/60 hover:bg-amber-950/30 transition-all cursor-pointer shadow-sm group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-amber-300 font-mono text-sm group-hover:text-amber-200">
                      {rule.name}
                    </span>
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                      {rule.hardcodedValue}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-zinc-400 flex items-center justify-between">
                    <span>
                      Source Citation:{' '}
                      <span className="text-indigo-400 font-semibold group-hover:underline">{rule.file}:{rule.lineStart}-{rule.lineEnd}</span>
                    </span>
                    <span className="text-[11px] text-amber-400/80 flex items-center gap-1 group-hover:text-amber-300 font-mono">
                      <span>Jump</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>

                  <p className="text-zinc-200 text-xs leading-relaxed">
                    {rule.rationale}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-blueprint-950 border border-blueprint-800 text-zinc-400 text-xs leading-relaxed">
              No hardcoded formulas found in this file. File acts as schema/batch coordinator.
            </div>
          )}

          {/* I/O Contracts Section */}
          <div className="pt-3 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-blueprint-800">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2 font-mono">
                <Layers className="h-4 w-4 text-indigo-400" />
                Input / Output Contracts & Signatures
              </span>
              <span className="text-xs font-mono text-zinc-400">Method Level</span>
            </div>

            {fileContracts.length > 0 ? (
              <div className="space-y-3">
                {fileContracts.map((contract) => (
                  <div
                    key={contract.id}
                    className="rounded-xl border border-blueprint-800 bg-blueprint-950 p-4 space-y-2 text-xs font-mono shadow-sm"
                  >
                    <div className="text-indigo-300 font-bold text-sm">
                      {contract.module}.{contract.functionName}()
                    </div>
                    <div className="text-xs text-zinc-300 leading-relaxed">
                      Returns: <span className="text-emerald-400 font-bold">{contract.outputs.type}</span> — {contract.outputs.description}
                    </div>
                    <div className="text-xs text-zinc-400 leading-relaxed">
                      Side Effects: {contract.sideEffects.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-blueprint-950 border border-blueprint-800 text-zinc-400 text-xs leading-relaxed">
                No exported method contracts for this module.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
