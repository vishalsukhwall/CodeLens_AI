'use client';

import React, { useState } from 'react';
import {
  CodeFile,
  CharacterizationTestSuite,
} from '@/types/legacy';
import {
  ShieldCheck,
  Copy,
  Check,
  Sparkles,
  Code2,
  FileCode,
  ExternalLink,
  Zap,
} from 'lucide-react';

interface TestGuardViewProps {
  files: CodeFile[];
  testSuite: CharacterizationTestSuite;
  onGenerateTests: (targetFile: string, targetUnit: string, framework: string) => void;
  isGeneratingTests: boolean;
  onJumpToCitation: (file: string, lineStart: number, lineEnd: number) => void;
}

export const TestGuardView: React.FC<TestGuardViewProps> = ({
  files,
  testSuite,
  onGenerateTests,
  isGeneratingTests,
  onJumpToCitation,
}) => {
  const [selectedFile, setSelectedFile] = useState(testSuite.file || 'LoanInterestEngine.java');
  const [targetUnit, setTargetUnit] = useState(
    testSuite.targetUnit || 'calculateAnnualYield & calculateNetWithholdingTax'
  );
  const [framework, setFramework] = useState(testSuite.framework || 'JUnit 5');
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(testSuite.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerateTests(selectedFile, targetUnit, framework);
  };

  const currentFileObj = files.find((f) => f.name === selectedFile) || files[0];

  return (
    <div className="w-full h-full flex flex-col bg-blueprint-950 overflow-hidden select-none">
      {/* Test Studio Header */}
      <div className="p-4 border-b border-blueprint-800 bg-blueprint-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white font-mono">
              TestGuard — Characterization Test Studio
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              Michael Feathers Armor
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Lock in existing production legacy behavior (edge cases, rate concessions, hardcoded tax rules) prior to refactoring.
          </p>
        </div>

        {/* Generator Controls */}
        <form onSubmit={handleGenerate} className="flex flex-wrap items-center gap-2">
          <select
            value={selectedFile}
            onChange={(e) => setSelectedFile(e.target.value)}
            className="rounded border border-blueprint-700 bg-blueprint-950 px-2 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-indigo-500"
          >
            {files.map((f) => (
              <option key={f.id} value={f.name}>
                {f.name}
              </option>
            ))}
          </select>

          <select
            value={framework}
            onChange={(e) => setFramework(e.target.value as any)}
            className="rounded border border-blueprint-700 bg-blueprint-950 px-2 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="JUnit 5">JUnit 5 (Java)</option>
            <option value="Jest">Jest (TS/JS)</option>
            <option value="PyTest">PyTest (Python)</option>
            <option value="NUnit">NUnit (C#)</option>
          </select>

          <button
            type="submit"
            disabled={isGeneratingTests}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 disabled:opacity-50 transition-all"
          >
            <Sparkles className={`h-3.5 w-3.5 ${isGeneratingTests ? 'animate-spin' : ''}`} />
            <span>{isGeneratingTests ? 'Arming...' : 'Generate Suite'}</span>
          </button>
        </form>
      </div>

      {/* Split Studio Body */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-blueprint-800 overflow-hidden">
        {/* Left Pane: Target Code & Detected Edge Cases (5 cols) */}
        <div className="md:col-span-5 h-full flex flex-col bg-blueprint-950 overflow-hidden">
          <div className="px-4 py-2 border-b border-blueprint-800 bg-blueprint-900/60 flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-300 font-bold flex items-center gap-1.5">
              <FileCode className="h-4 w-4 text-indigo-400" />
              Source Inspection: {currentFileObj.name}
            </span>
            <span className="text-zinc-500">{currentFileObj.lineCount}L</span>
          </div>

          {/* Test Coverage Pills */}
          <div className="p-3 border-b border-blueprint-800 bg-blueprint-900/20 space-y-2">
            <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider block">
              Characterized Edge Cases ({testSuite.tests.length}):
            </span>
            <div className="grid grid-cols-2 gap-2">
              {testSuite.tests.map((test) => (
                <div
                  key={test.id}
                  className="p-2 rounded bg-blueprint-900/70 border border-blueprint-800 space-y-1 text-[11px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                      {test.category}
                    </span>
                    <button
                      onClick={() => {
                        const parts = test.targetLineCitation.split(':');
                        const file = parts[0];
                        const line = parseInt(parts[1] || '1', 10);
                        onJumpToCitation(file, line, line + 2);
                      }}
                      className="text-[9px] font-mono text-indigo-400 hover:text-white flex items-center gap-0.5"
                    >
                      <span>L{test.targetLineCitation.split(':')[1]}</span>
                      <ExternalLink className="h-2 w-2" />
                    </button>
                  </div>
                  <div className="font-semibold text-zinc-200 text-xs truncate">
                    {test.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Source Code Snippet View */}
          <div className="flex-1 overflow-y-auto p-3 font-mono text-xs bg-blueprint-950 text-zinc-300 select-text leading-5">
            <pre className="whitespace-pre overflow-x-visible">
              {currentFileObj.content}
            </pre>
          </div>
        </div>

        {/* Right Pane: Generated Executable Test Suite (7 cols) */}
        <div className="md:col-span-7 h-full flex flex-col bg-blueprint-950 overflow-hidden">
          <div className="px-4 py-2 border-b border-blueprint-800 bg-blueprint-900/60 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-emerald-400" />
              <span className="text-zinc-200 font-bold">
                Executable {testSuite.framework} Harness
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] font-mono text-zinc-300 hover:text-white bg-blueprint-800 hover:bg-blueprint-700 px-2.5 py-1 rounded transition-colors"
            >
              {copiedCode ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copiedCode ? 'Copied' : 'Copy Test Suite'}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-zinc-200 bg-blueprint-950 leading-relaxed select-text">
            <pre className="whitespace-pre overflow-x-visible">
              {testSuite.code}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
