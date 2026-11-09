'use client';

import React from 'react';
import {
  CodeFile,
  BusinessRule,
} from '@/types/legacy';
import {
  Folder,
  FileCode,
  Database,
  Layers,
  Upload,
  RefreshCw,
  Plus,
  Flame,
  Zap,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface RepoExplorerPaneProps {
  files: CodeFile[];
  selectedFile: CodeFile;
  onSelectFile: (file: CodeFile) => void;
  businessRules: BusinessRule[];
  onLoadSampleRepo: () => void;
  onOpenUploadModal: () => void;
  isAnalyzing: boolean;
}

export const RepoExplorerPane: React.FC<RepoExplorerPaneProps> = ({
  files,
  selectedFile,
  onSelectFile,
  businessRules,
  onLoadSampleRepo,
  onOpenUploadModal,
  isAnalyzing,
}) => {
  // Count rules per file
  const getRuleCountForFile = (fileName: string) => {
    return businessRules.filter(
      (r) => r.file.toLowerCase() === fileName.toLowerCase()
    ).length;
  };

  const getFileBadgeColor = (lang: string) => {
    switch (lang) {
      case 'sql':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'java':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'typescript':
      case 'javascript':
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
      case 'python':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default:
        return 'text-zinc-300 bg-blueprint-800 border-blueprint-700';
    }
  };

  return (
    <aside className="w-full h-full flex flex-col bg-blueprint-950 border-r border-blueprint-800 select-none overflow-hidden">
      {/* Top Action Bar */}
      <div className="p-4 border-b border-blueprint-800 bg-blueprint-900/40 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400">
          <span className="flex items-center gap-2 font-mono">
            <Folder className="h-4 w-4 text-indigo-400" />
            Repository Explorer
          </span>
          <span className="font-mono text-zinc-400 text-xs px-2 py-0.5 rounded bg-blueprint-850 border border-blueprint-800">
            {files.length} Files
          </span>
        </div>

        {/* 1-Click Sample Repo Preset */}
        <button
          onClick={onLoadSampleRepo}
          disabled={isAnalyzing}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-blueprint-850 hover:bg-blueprint-800 text-zinc-100 border border-blueprint-700/80 transition-all hover:border-indigo-500/50 disabled:opacity-50 shadow-sm"
          title="Load 4 tightly-coupled legacy banking files"
        >
          <Database className={`h-3.5 w-3.5 text-indigo-400 ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>Load 4-File Banking Repo</span>
        </button>

        {/* Upload / Paste Button */}
        <button
          onClick={onOpenUploadModal}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 transition-all shadow-sm"
        >
          <Plus className="h-3.5 w-3.5 text-indigo-400" />
          <span>+ Upload / Paste Code</span>
        </button>
      </div>

      {/* Interactive File Tree with Space-y-3 and p-3.5 */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        <div className="px-1 text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
          Indexed Workspace
        </div>

        {files.map((file) => {
          const isSelected = selectedFile.id === file.id;
          const ruleCount = getRuleCountForFile(file.name);

          return (
            <button
              key={file.id}
              onClick={() => onSelectFile(file)}
              className={`w-full text-left flex flex-col p-3.5 rounded-xl transition-all group ${
                isSelected
                  ? 'bg-indigo-600/15 border-2 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                  : 'hover:bg-blueprint-900/60 border border-blueprint-800/80 text-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 truncate">
                  <FileCode
                    className={`h-4.5 w-4.5 shrink-0 ${
                      isSelected ? 'text-indigo-400' : 'text-zinc-400 group-hover:text-zinc-200'
                    }`}
                  />
                  <span className="font-mono text-xs font-bold truncate">
                    {file.name}
                  </span>
                </div>

                {/* Language Badge */}
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase border font-semibold shrink-0 ${getFileBadgeColor(
                    file.language
                  )}`}
                >
                  {file.language}
                </span>
              </div>

              {/* Sub-meta: Lines and Hardcoded Rules */}
              <div className="mt-2.5 flex items-center justify-between text-xs font-mono text-zinc-400 pl-7">
                <span>{file.lineCount} lines</span>
                {ruleCount > 0 ? (
                  <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    <Zap className="h-3 w-3" />
                    {ruleCount} {ruleCount === 1 ? 'Rule' : 'Rules'}
                  </span>
                ) : (
                  <span className="text-zinc-500">0 Rules</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Explorer Footer Status */}
      <div className="p-4 border-t border-blueprint-800 bg-blueprint-900/40 text-xs font-mono text-zinc-400 space-y-1.5">
        <div className="flex items-center justify-between text-zinc-200">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Static AST Indexed
          </span>
          <span className="text-indigo-400 font-bold">100% Ready</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Select any file to inspect code & live plain-English business rules.
        </p>
      </div>
    </aside>
  );
};
