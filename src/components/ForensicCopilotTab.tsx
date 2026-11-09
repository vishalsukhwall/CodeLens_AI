'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  CodeFile,
  ForensicChatMessage,
  Citation,
} from '@/types/legacy';
import {
  Send,
  Sparkles,
  Search,
  Copy,
  Check,
  FileCode,
  MessageSquare,
  ShieldCheck,
  ArrowUpRight,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

interface ForensicCopilotTabProps {
  files: CodeFile[];
  activeFile: CodeFile;
  onSelectFile: (file: CodeFile) => void;
  highlightedLineRange: { start: number; end: number } | null;
  onClearHighlight: () => void;
  chatHistory: ForensicChatMessage[];
  onSendMessage: (question: string) => void;
  isChatLoading: boolean;
  onJumpToCodeCitation: (file: string, lineStart: number, lineEnd: number) => void;
}

export const ForensicCopilotTab: React.FC<ForensicCopilotTabProps> = ({
  files,
  activeFile,
  onSelectFile,
  highlightedLineRange,
  onClearHighlight,
  chatHistory,
  onSendMessage,
  isChatLoading,
  onJumpToCodeCitation,
}) => {
  const [inputQuestion, setInputQuestion] = useState('');
  const [searchInCode, setSearchInCode] = useState('');
  const [copied, setCopied] = useState(false);
  const codeViewerRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Quick 1-click prompts
  const promptChips = [
    { label: 'Where is tax rate hardcoded?', prompt: 'Where is the interest withholding tax rule hardcoded?' },
    { label: 'What breaks if UserAuthSchema changes?', prompt: 'Which services break if UserAuthSchema changes?' },
    { label: 'Explain dead code in MonthlyBillingBatch', prompt: 'Explain the dead code in MonthlyBillingBatch.java' },
    { label: 'Check OAuth2/JWT presence (Zero hallucination test)', prompt: 'Does this repo have an OAuth2 or JWT provider?' },
  ];

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatLoading]);

  // Scroll code viewer to highlighted line when it changes
  useEffect(() => {
    if (highlightedLineRange && codeViewerRef.current) {
      const targetElement = document.getElementById(`line-${highlightedLineRange.start}`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedLineRange, activeFile]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isChatLoading) return;
    onSendMessage(inputQuestion);
    setInputQuestion('');
  };

  const handleChipClick = (prompt: string) => {
    onSendMessage(prompt);
  };

  // Parse citations in markdown text e.g. [FileName.java:84-88]
  const renderMessageContent = (text: string) => {
    const citationRegex = /\[([a-zA-Z0-9_\-\.]+\.(?:java|sql|txt|py|ts|js|cs)):(\d+)(?:-(\d+))?\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = citationRegex.exec(text)) !== null) {
      // Push text before match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const fileName = match[1];
      const lineStart = parseInt(match[2], 10);
      const lineEnd = match[3] ? parseInt(match[3], 10) : lineStart;

      parts.push(
        <button
          key={`${match.index}-${fileName}-${lineStart}`}
          onClick={() => onJumpToCodeCitation(fileName, lineStart, lineEnd)}
          className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-blue-400 hover:text-blue-200 bg-blue-500/20 hover:bg-blue-500/30 px-1.5 py-0.5 rounded border border-blue-500/30 mx-1 transition-colors align-baseline"
          title={`Click to jump to ${fileName} line ${lineStart}`}
        >
          <span>{fileName}:{lineStart}{lineEnd !== lineStart ? `-${lineEnd}` : ''}</span>
          <ArrowUpRight className="h-3 w-3" />
        </button>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return (
      <div className="whitespace-pre-wrap leading-relaxed">
        {parts.map((p, idx) => (typeof p === 'string' ? <span key={idx}>{p}</span> : p))}
      </div>
    );
  };

  const codeLines = activeFile.content.split('\n');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
      {/* ================================================================= */}
      {/* LEFT PANE: Line-Numbered Forensic Code Viewer (7 cols) */}
      {/* ================================================================= */}
      <div className="lg:col-span-7 flex flex-col rounded-xl border border-zinc-800/90 bg-zinc-950 overflow-hidden shadow-xl">
        {/* File tabs bar */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-2 py-1.5 overflow-x-auto">
          <div className="flex items-center gap-1 overflow-x-auto">
            {files.map((file) => (
              <button
                key={file.id}
                onClick={() => {
                  onSelectFile(file);
                  onClearHighlight();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all whitespace-nowrap ${
                  activeFile.id === file.id
                    ? 'bg-zinc-800 text-blue-400 font-bold border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <FileCode className="h-3.5 w-3.5" />
                <span>{file.name}</span>
                <span className="text-[10px] text-zinc-500 font-normal">
                  ({file.lineCount}L)
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pl-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Copy current file contents"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="text-[11px] font-mono">{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Quick search inside file */}
        <div className="px-4 py-2 border-b border-zinc-800/70 bg-zinc-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="font-mono text-zinc-300 font-semibold">{activeFile.name}</span>
            <span>•</span>
            <span className="font-mono text-[11px] text-zinc-500">{activeFile.path}</span>
          </div>

          <div className="relative">
            <Search className="h-3 w-3 absolute left-2.5 top-2 text-zinc-500" />
            <input
              type="text"
              placeholder="Find in file..."
              value={searchInCode}
              onChange={(e) => setSearchInCode(e.target.value)}
              className="pl-7 pr-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-200 focus:outline-none focus:border-blue-500 w-36"
            />
          </div>
        </div>

        {/* Line-numbered Code Container */}
        <div
          ref={codeViewerRef}
          className="flex-1 overflow-y-auto overflow-x-auto p-2 font-mono text-xs bg-zinc-950 text-zinc-200 select-text"
        >
          {codeLines.map((lineText, idx) => {
            const lineNum = idx + 1;
            const isHighlighted =
              highlightedLineRange &&
              lineNum >= highlightedLineRange.start &&
              lineNum <= highlightedLineRange.end;

            const matchesSearch =
              searchInCode.trim() !== '' &&
              lineText.toLowerCase().includes(searchInCode.toLowerCase());

            return (
              <div
                key={lineNum}
                id={`line-${lineNum}`}
                className={`flex items-start transition-colors group ${
                  isHighlighted
                    ? 'bg-blue-500/20 border-l-4 border-blue-400 text-white font-medium py-0.5'
                    : matchesSearch
                    ? 'bg-amber-500/20 border-l-2 border-amber-400'
                    : 'hover:bg-zinc-900/60'
                }`}
              >
                {/* Line number gutter */}
                <span
                  className={`w-12 shrink-0 select-none text-right pr-4 text-[11px] font-mono ${
                    isHighlighted
                      ? 'text-blue-400 font-bold'
                      : 'text-zinc-600 group-hover:text-zinc-400'
                  }`}
                >
                  {lineNum}
                </span>

                {/* Line content */}
                <pre className="flex-1 whitespace-pre overflow-x-visible font-mono text-[12px] leading-5 pr-4">
                  {lineText || ' '}
                </pre>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================================================================= */}
      {/* RIGHT PANE: Grounded Forensic Q&A Copilot (5 cols) */}
      {/* ================================================================= */}
      <div className="lg:col-span-5 flex flex-col rounded-xl border border-zinc-800/90 bg-zinc-950 overflow-hidden shadow-xl">
        {/* Copilot Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                Forensic Architecture Copilot
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Grounded
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                100% code-grounded Q&A with clickable line-range citations
              </p>
            </div>
          </div>

          <span title="Zero Hallucination Protocol Active">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </span>
        </div>

        {/* 1-Click Prompt Chips */}
        <div className="p-3 border-b border-zinc-800/70 bg-zinc-950/60 flex flex-wrap gap-1.5">
          {promptChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleChipClick(chip.prompt)}
              disabled={isChatLoading}
              className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition-colors disabled:opacity-50"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Chat Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[90%] rounded-xl p-3.5 leading-relaxed space-y-2 ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                }`}
              >
                {/* Sender badge */}
                <div className="flex items-center justify-between text-[10px] font-mono opacity-70 border-b border-white/10 pb-1 mb-1">
                  <span>{msg.sender === 'user' ? 'You (Staff Engineer)' : 'Gemini 2.5 Flash'}</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {renderMessageContent(msg.text)}

                {/* Structured Citations Footnote */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2 border-t border-zinc-800/80 mt-2 space-y-1">
                    <span className="text-[10px] font-mono text-zinc-400 font-semibold block uppercase">
                      Forensic Line Citations:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.citations.map((cite, cidx) => (
                        <button
                          key={cidx}
                          onClick={() =>
                            onJumpToCodeCitation(cite.file, cite.lineStart, cite.lineEnd)
                          }
                          className="flex items-center gap-1 font-mono text-[10px] font-semibold text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30 transition-colors"
                        >
                          <span>
                            {cite.file}:{cite.lineStart}
                            {cite.lineEnd && cite.lineEnd !== cite.lineStart ? `-${cite.lineEnd}` : ''}
                          </span>
                          <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isChatLoading && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
              <Sparkles className="h-4 w-4 text-blue-400 animate-spin" />
              <span>Analyzing legacy AST & cross-file symbol graphs...</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 border-t border-zinc-800 bg-zinc-900/60">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Ask anything about the codebase (e.g. 'Where is tax rate computed?')..."
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              disabled={isChatLoading}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 pl-3 pr-10 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputQuestion.trim() || isChatLoading}
              className="absolute right-2 p-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
