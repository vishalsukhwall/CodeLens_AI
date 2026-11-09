'use client';

import React, { useState } from 'react';
import {
  CodeFile,
  CharacterizationTestSuite,
  FullAnalysisResult,
  BlastRadiusSimulation,
} from '@/types/legacy';
import {
  ShieldCheck,
  Download,
  Copy,
  Check,
  Sparkles,
  FileText,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { generateTechnicalKtPdf } from '@/lib/ktPdfGenerator';

interface TestGuardExportTabProps {
  files: CodeFile[];
  testSuite: CharacterizationTestSuite;
  onGenerateTests: (targetFile: string, targetUnit: string, framework: string) => void;
  isGeneratingTests: boolean;
  analysis: FullAnalysisResult;
  simulation: BlastRadiusSimulation;
  onJumpToCodeCitation: (file: string, lineStart: number, lineEnd: number) => void;
}

export const TestGuardExportTab: React.FC<TestGuardExportTabProps> = ({
  files,
  testSuite,
  onGenerateTests,
  isGeneratingTests,
  analysis,
  simulation,
  onJumpToCodeCitation,
}) => {
  const [selectedFile, setSelectedFile] = useState(testSuite.file || 'LoanInterestEngine.java');
  const [targetUnit, setTargetUnit] = useState(
    testSuite.targetUnit || 'calculateAnnualYield & calculateNetWithholdingTax'
  );
  const [framework, setFramework] = useState(testSuite.framework || 'JUnit 5');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(testSuite.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerateTests(selectedFile, targetUnit, framework);
  };

  const handleDownloadDossierPdf = () => {
    setIsExportingPdf(true);
    try {
      const doc = generateTechnicalKtPdf({
        analysis,
        testSuite,
        simulation,
      });
      doc.save(`CodeLense_Architecture_KT_Blueprint_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* ================================================================= */}
      {/* SECTION 1: Automated Legacy-to-TestGuard Characterization Suite */}
      {/* ================================================================= */}
      <div className="rounded-xl border border-zinc-800/90 bg-zinc-950 p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                Legacy-to-TestGuard — Automated Characterization Suite
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                /api/tests
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Michael Feathers characterization testing harness capturing verbatim legacy behavior, boundary edge cases, and hardcoded tax rules.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
              Coverage: {testSuite.tests.length} Edge Cases Verified
            </span>
          </div>
        </div>

        {/* Generator Controls Form */}
        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4 space-y-1">
            <label className="text-xs font-medium text-zinc-300">Target File to Arm</label>
            <select
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-200 focus:border-blue-500 focus:outline-none"
            >
              {files.map((f) => (
                <option key={f.id} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4 space-y-1">
            <label className="text-xs font-medium text-zinc-300">Target Unit / Function</label>
            <input
              type="text"
              value={targetUnit}
              onChange={(e) => setTargetUnit(e.target.value)}
              placeholder="e.g. calculateAnnualYield"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-200 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-medium text-zinc-300">Framework</label>
            <select
              value={framework}
              onChange={(e) => setFramework(e.target.value as any)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="JUnit 5">JUnit 5 (Java)</option>
              <option value="Jest">Jest (TS/JS)</option>
              <option value="PyTest">PyTest (Python)</option>
              <option value="NUnit">NUnit (C#)</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={isGeneratingTests}
              className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 disabled:opacity-50 transition-all"
            >
              <Sparkles className={`h-3.5 w-3.5 ${isGeneratingTests ? 'animate-spin' : ''}`} />
              <span>{isGeneratingTests ? 'Arming...' : 'Generate Suite'}</span>
            </button>
          </div>
        </form>

        {/* Test Matrix Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {testSuite.tests.map((test) => (
            <div
              key={test.id}
              className="rounded-lg bg-zinc-900/80 border border-zinc-800 p-3 space-y-1.5 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                  {test.category}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">{test.id}</span>
              </div>
              <h4 className="text-xs font-semibold text-zinc-200 leading-snug">
                {test.name}
              </h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {test.description}
              </p>
              <div className="pt-1">
                <button
                  onClick={() => {
                    const parts = test.targetLineCitation.split(':');
                    const file = parts[0];
                    const line = parseInt(parts[1] || '1', 10);
                    onJumpToCodeCitation(file, line, line + 2);
                  }}
                  className="text-[10px] font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <span>Cites: {test.targetLineCitation}</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Code Snippet Box */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-zinc-200">
                {testSuite.framework} Harness — {testSuite.file}
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1 rounded text-xs text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="text-[11px] font-mono">{copiedCode ? 'Copied' : 'Copy Harness'}</span>
            </button>
          </div>

          <pre className="p-4 overflow-x-auto text-xs font-mono text-zinc-200 bg-zinc-950 leading-relaxed max-h-[360px]">
            {testSuite.code}
          </pre>
        </div>
      </div>

      {/* ================================================================= */}
      {/* SECTION 2: 4-Page Technical KT & Architecture Blueprint PDF Export */}
      {/* ================================================================= */}
      <div className="rounded-xl border border-zinc-800/90 bg-zinc-950 p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-blue-400" />
              <h2 className="text-base font-bold text-white">
                Download 4-Page Technical KT & Architecture Blueprint PDF
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Vector Rendered
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Executive dossier built with jsPDF & AutoTable containing vector dependency diagrams, I/O tables, and refactoring roadmaps.
            </p>
          </div>

          <button
            onClick={handleDownloadDossierPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className={`h-4 w-4 ${isExportingPdf ? 'animate-bounce' : ''}`} />
            <span>{isExportingPdf ? 'Rendering PDF...' : 'Download Technical KT & Blueprint PDF'}</span>
          </button>
        </div>

        {/* Visual 4-Page Dossier Outline Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Page 1 */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2.5 hover:border-blue-500/50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold">
                PAGE 1
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Vector Graph</span>
            </div>
            <h4 className="text-xs font-bold text-white">
              System Architecture & Vector Dependency Flow
            </h4>
            <p className="text-[11px] text-zinc-400 leading-snug">
              Executive scorecards, tech debt index, and native vector flowchart rendered directly onto PDF canvas.
            </p>
          </div>

          {/* Page 2 */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2.5 hover:border-blue-500/50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold">
                PAGE 2
              </span>
              <span className="text-[10px] font-mono text-zinc-500">AutoTable Matrix</span>
            </div>
            <h4 className="text-xs font-bold text-white">
              I/O Contracts & Extracted Business Rules
            </h4>
            <p className="text-[11px] text-zinc-400 leading-snug">
              Structured catalog of all hardcoded constants, withholding rates (18.5%), and method signatures with line citations.
            </p>
          </div>

          {/* Page 3 */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2.5 hover:border-blue-500/50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold">
                PAGE 3
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Audit & Roadmap</span>
            </div>
            <h4 className="text-xs font-bold text-white">
              Dead Code Audit & Strangler-Fig Plan
            </h4>
            <p className="text-[11px] text-zinc-400 leading-snug">
              Safe-to-retire inventory (reconcileLegacyTapeBatch & ghost columns) plus phased decoupling roadmap with risk ratings.
            </p>
          </div>

          {/* Page 4 */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2.5 hover:border-blue-500/50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold">
                PAGE 4
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Regression Armor</span>
            </div>
            <h4 className="text-xs font-bold text-white">
              Characterization Test Matrix & Sign-Off
            </h4>
            <p className="text-[11px] text-zinc-400 leading-snug">
              Complete edge-case test matrix, executable code snippets, and formal governance signoff block.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
