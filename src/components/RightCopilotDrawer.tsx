'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  CodeFile,
  BlastRadiusSimulation,
  ForensicChatMessage,
  Citation,
} from '@/types/legacy';
import {
  Flame,
  MessageSquare,
  Sparkles,
  Send,
  AlertTriangle,
  ShieldAlert,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface RightCopilotDrawerProps {
  files: CodeFile[];
  simulation: BlastRadiusSimulation;
  onSimulateImpact: (
    targetFile: string,
    targetSymbol: string,
    proposedChange: string
  ) => void;
  isSimulating: boolean;
  chatHistory: ForensicChatMessage[];
  onSendMessage: (question: string) => void;
  isChatLoading: boolean;
  onJumpToCitation: (file: string, lineStart: number, lineEnd: number) => void;
}

export const RightCopilotDrawer: React.FC<RightCopilotDrawerProps> = ({
  files,
  simulation,
  onSimulateImpact,
  isSimulating,
  chatHistory,
  onSendMessage,
  isChatLoading,
  onJumpToCitation,
}) => {
  const [activeTool, setActiveTool] = useState<'simulator' | 'copilot'>('simulator');

  // Simulator Form State
  const [targetFile, setTargetFile] = useState(simulation.targetFile || 'UserAuthSchema.sql');
  const [targetSymbol, setTargetSymbol] = useState(simulation.targetSymbol || 'customer_tier');
  const [proposedChange, setProposedChange] = useState(
    simulation.proposedChange || 'Rename customer_tier to account_level in UserAuthSchema.sql'
  );

  // Chat Form State
  const [chatQuestion, setChatQuestion] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTool === 'copilot') {
      chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isChatLoading, activeTool]);

  const changePresets = [
    {
      label: 'Rename customer_tier column',
      file: 'UserAuthSchema.sql',
      symbol: 'customer_tier',
      change: 'Rename customer_tier column to account_level in UserAuthSchema.sql:13',
    },
    {
      label: 'Update Tax 18.5% -> 12.0%',
      file: 'LoanInterestEngine.java',
      symbol: 'calculateNetWithholdingTax',
      change: 'Modify withholding tax rate from 18.5% to 12.0% in LoanInterestEngine.java:84',
    },
    {
      label: 'Drop legacy_fax_optin',
      file: 'UserAuthSchema.sql',
      symbol: 'legacy_fax_optin',
      change: 'Drop legacy_fax_optin column in UserAuthSchema.sql:18 (unused since 2009)',
    },
  ];

  const promptChips = [
    { label: 'Where is tax hardcoded?', prompt: 'Where is the interest withholding tax rule hardcoded?' },
    { label: 'What breaks if schema changes?', prompt: 'Which services break if UserAuthSchema changes?' },
    { label: 'Explain dead code in MonthlyBillingBatch', prompt: 'Explain the dead code in MonthlyBillingBatch.java' },
    { label: 'OAuth2 check (Zero Hallucination)', prompt: 'Does this repo have an OAuth2 or JWT provider?' },
  ];

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSimulateImpact(targetFile, targetSymbol, proposedChange);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuestion.trim() || isChatLoading) return;
    onSendMessage(chatQuestion);
    setChatQuestion('');
  };

  // Helper to parse citations in markdown e.g. [FileName.java:84-88]
  const renderMessageContent = (text: string) => {
    const citationRegex = /\[([a-zA-Z0-9_\-\.]+\.(?:java|sql|txt|py|ts|js|cs)):(\d+)(?:-(\d+))?\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = citationRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const fileName = match[1];
      const lineStart = parseInt(match[2], 10);
      const lineEnd = match[3] ? parseInt(match[3], 10) : lineStart;

      parts.push(
        <button
          key={`${match.index}-${fileName}-${lineStart}`}
          onClick={() => onJumpToCitation(fileName, lineStart, lineEnd)}
          className="inline-flex items-center gap-1 font-mono text-xs font-bold text-indigo-300 hover:text-white bg-indigo-500/20 hover:bg-indigo-500/30 px-2 py-0.5 rounded border border-indigo-500/40 mx-0.5 transition-colors align-baseline"
          title={`Click to jump and highlight ${fileName}:${lineStart}`}
        >
          <span>{fileName}:{lineStart}</span>
          <ArrowUpRight className="h-3 w-3" />
        </button>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return (
      <div className="whitespace-pre-wrap leading-relaxed text-xs">
        {parts.map((p, idx) => (typeof p === 'string' ? <span key={idx}>{p}</span> : p))}
      </div>
    );
  };

  return (
    <aside className="w-full h-full flex flex-col bg-blueprint-950 border-l border-blueprint-800 overflow-hidden select-none min-w-[340px]">
      {/* Tool Switcher Tabs Header (Single Line Without Wrapping) */}
      <div className="h-12 px-4 border-b border-blueprint-800 bg-blueprint-900/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTool('simulator')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTool === 'simulator'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-blueprint-850'
            }`}
          >
            <Flame className="h-4 w-4 text-rose-400" />
            <span>Blast Simulator</span>
          </button>

          <button
            onClick={() => setActiveTool('copilot')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTool === 'copilot'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-blueprint-850'
            }`}
          >
            <MessageSquare className="h-4 w-4 text-indigo-400" />
            <span>Forensic Copilot</span>
          </button>
        </div>

        <span className="text-xs font-mono text-zinc-400 font-medium px-2 py-0.5 rounded bg-blueprint-850 border border-blueprint-800 hidden sm:inline">
          Live Gemini
        </span>
      </div>

      {/* Tool 1: Blast-Radius Simulator */}
      {activeTool === 'simulator' && (
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Quick Presets */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-zinc-400 font-bold uppercase tracking-wider block">
              1-Click Change Scenarios:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {changePresets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTargetFile(p.file);
                    setTargetSymbol(p.symbol);
                    setProposedChange(p.change);
                  }}
                  className="text-xs font-mono px-2.5 py-1 rounded-md bg-blueprint-850 hover:bg-blueprint-800 text-zinc-300 border border-blueprint-700 transition-colors shadow-sm"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form with P-4 and Space-y-3.5 */}
          <form onSubmit={handleSimulateSubmit} className="space-y-3.5 rounded-xl border border-blueprint-800 bg-blueprint-900/50 p-4 shadow-sm">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Target Legacy File</label>
              <select
                value={targetFile}
                onChange={(e) => setTargetFile(e.target.value)}
                className="w-full rounded-lg border border-blueprint-700 bg-blueprint-950 px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-rose-500"
              >
                {files.map((f) => (
                  <option key={f.id} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Symbol / Column</label>
              <input
                type="text"
                value={targetSymbol}
                onChange={(e) => setTargetSymbol(e.target.value)}
                className="w-full rounded-lg border border-blueprint-700 bg-blueprint-950 px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Proposed Change</label>
              <textarea
                value={proposedChange}
                onChange={(e) => setProposedChange(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-blueprint-700 bg-blueprint-950 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-rose-500 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={isSimulating}
              className="w-full py-2.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-2 shadow-md shadow-rose-600/30 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              <Sparkles className={`h-4 w-4 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Simulating Impact...' : 'Simulate Blast Radius'}</span>
            </button>
          </form>

          {/* Results Summary & Gauge with P-4 and Space-y-4 */}
          <div className="rounded-xl border border-blueprint-800 bg-blueprint-900/60 p-4 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-blueprint-800">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-mono font-bold text-rose-400">
                  {simulation.blastRadiusScore}%
                </span>
                <div>
                  <div className="text-xs font-mono uppercase font-bold text-rose-400">
                    {simulation.severity} RISK
                  </div>
                  <div className="text-xs text-zinc-400">Cross-File Ripple</div>
                </div>
              </div>

              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {simulation.affectedModules.length} Broken Sites
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {simulation.summary}
            </p>

            {/* Broken downstream lines */}
            <div className="space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                Broken Downstream Sites:
              </span>
              {simulation.affectedModules.map((mod, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-blueprint-950 border border-blueprint-800 space-y-1.5 text-xs shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => onJumpToCitation(mod.file, mod.line, mod.line + 2)}
                      className="font-mono text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1.5"
                    >
                      <span>{mod.file}:{mod.line}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/20">
                      {mod.impactType}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-xs leading-relaxed">
                    {mod.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Refactoring Steps */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                Refactoring Roadmap:
              </span>
              {simulation.refactoringChecklist.map((step) => (
                <div key={step.step} className="flex items-start gap-2 text-xs text-zinc-300 bg-blueprint-950 p-2.5 rounded-lg border border-blueprint-800/80">
                  <span className="font-mono font-bold text-indigo-400 shrink-0">#{step.step}</span>
                  <span className="text-xs leading-snug">{step.task}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tool 2: Forensic Copilot Chat */}
      {activeTool === 'copilot' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Prompt Chips */}
          <div className="p-3 border-b border-blueprint-800 bg-blueprint-900/40 flex flex-wrap gap-1.5 shrink-0">
            {promptChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => onSendMessage(chip.prompt)}
                disabled={isChatLoading}
                className="text-xs font-mono px-2.5 py-1 rounded bg-blueprint-850 hover:bg-blueprint-800 text-zinc-300 border border-blueprint-700 transition-colors disabled:opacity-50"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Chat Stream with P-4 and Space-y-4 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[95%] rounded-xl p-3.5 space-y-2 shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-blueprint-900/80 border border-blueprint-800 text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono opacity-70 border-b border-white/10 pb-1">
                    <span>{msg.sender === 'user' ? 'You' : 'Gemini 2.5 Flash'}</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {renderMessageContent(msg.text)}

                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2 border-t border-blueprint-800 mt-2 flex flex-wrap gap-1.5">
                      {msg.citations.map((cite, cidx) => (
                        <button
                          key={cidx}
                          onClick={() => onJumpToCitation(cite.file, cite.lineStart, cite.lineEnd)}
                          className="text-xs font-mono font-semibold text-indigo-300 hover:text-white bg-indigo-500/15 px-2 py-0.5 rounded border border-indigo-500/30 flex items-center gap-1 transition-colors"
                        >
                          <span>{cite.file}:{cite.lineStart}</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isChatLoading && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blueprint-900/80 border border-blueprint-800 text-xs text-zinc-400">
                <Sparkles className="h-4 w-4 text-indigo-400 animate-spin" />
                <span>Forensic analysis in progress...</span>
              </div>
            )}

            <div ref={chatScrollRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleChatSubmit} className="p-3 border-t border-blueprint-800 bg-blueprint-950 shrink-0">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Ask about formulas, files, or rules..."
                value={chatQuestion}
                onChange={(e) => setChatQuestion(e.target.value)}
                disabled={isChatLoading}
                className="w-full rounded-lg border border-blueprint-700 bg-blueprint-900/80 pl-3 pr-10 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!chatQuestion.trim() || isChatLoading}
                className="absolute right-2 p-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </aside>
  );
};
