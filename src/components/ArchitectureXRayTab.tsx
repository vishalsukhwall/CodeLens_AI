'use client';

import React, { useState } from 'react';
import {
  FullAnalysisResult,
  BusinessRule,
} from '@/types/legacy';
import { InteractiveFlowGraph } from './InteractiveFlowGraph';
import {
  Search,
  Zap,
  Filter,
  ExternalLink,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

interface ArchitectureXRayTabProps {
  analysis: FullAnalysisResult;
  onJumpToCodeCitation: (file: string, lineStart: number, lineEnd: number) => void;
}

export const ArchitectureXRayTab: React.FC<ArchitectureXRayTabProps> = ({
  analysis,
  onJumpToCodeCitation,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    'All',
    'Taxation',
    'Interest',
    'Eligibility',
    'Compliance',
    'Billing',
  ];

  const filteredRules = analysis.businessRules.filter((rule) => {
    const matchesCategory =
      selectedCategory === 'All' || rule.category === selectedCategory;
    const matchesSearch =
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.hardcodedValue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.file.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Interactive Dependency Flow Diagram Component */}
      <InteractiveFlowGraph
        nodes={analysis.nodes}
        edges={analysis.edges}
        onSelectCitation={onJumpToCodeCitation}
      />

      {/* Business Rules & Hardcoded Logic Table */}
      <div className="rounded-xl border border-zinc-800/90 bg-zinc-950 p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">
                Extracted Business Rules & Hardcoded Logic
              </h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {filteredRules.length} Detected
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Static forensic inventory of regulatory formulas, constants, and concession boundaries with exact line citations.
            </p>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search formulas, rates, files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 sm:w-60 pl-8 pr-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Structured Table */}
        <div className="overflow-x-auto rounded-lg border border-zinc-800/80">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/70 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Rule Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-4">Hardcoded Value</th>
                <th className="py-3 px-4">File:Line Citation</th>
                <th className="py-3 px-4">Risk</th>
                <th className="py-3 px-4">Plain-English Forensic Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-zinc-950">
              {filteredRules.map((rule) => (
                <tr
                  key={rule.id}
                  className="hover:bg-zinc-900/50 transition-colors group"
                >
                  {/* Rule Name */}
                  <td className="py-3.5 px-4 font-semibold text-zinc-100">
                    {rule.name}
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                      {rule.category}
                    </span>
                  </td>

                  {/* Hardcoded Value */}
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-rose-400 px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20">
                      {rule.hardcodedValue}
                    </span>
                  </td>

                  {/* File:Line Citation Pill */}
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() =>
                        onJumpToCodeCitation(rule.file, rule.lineStart, rule.lineEnd)
                      }
                      className="flex items-center gap-1 font-mono text-[11px] text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded border border-blue-500/20 transition-colors"
                      title="Click to jump and highlight in Forensic Code Viewer"
                    >
                      <span>
                        {rule.file}:{rule.lineStart}
                      </span>
                      <ArrowUpRight className="h-3 w-3 opacity-70" />
                    </button>
                  </td>

                  {/* Risk Badge */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${
                        rule.riskLevel === 'high'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : rule.riskLevel === 'medium'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {rule.riskLevel}
                    </span>
                  </td>

                  {/* Rationale (max 2 lines) */}
                  <td className="py-3.5 px-4 text-zinc-300 max-w-md leading-relaxed">
                    {rule.rationale}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
