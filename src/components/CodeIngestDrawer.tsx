'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileCode,
  FileArchive,
  Trash2,
  Sparkles,
  ClipboardPaste,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { CodeFile } from '@/types/legacy';
import { ingestUploadedFiles, parsePastedFiles } from '@/lib/fileIngestor';
import { SAMPLE_LEGACY_REPO } from '@/data/sampleLegacyRepo';

interface CodeIngestDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  files: CodeFile[];
  onUpdateFiles: (newFiles: CodeFile[]) => void;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
}

export const CodeIngestDrawer: React.FC<CodeIngestDrawerProps> = ({
  isOpen,
  onClose,
  files,
  onUpdateFiles,
  onRunAnalysis,
  isAnalyzing,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'manage'>('upload');
  const [pastedCode, setPastedCode] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [ingestMessage, setIngestMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      const ingested = await ingestUploadedFiles(e.target.files);
      if (ingested.length > 0) {
        onUpdateFiles([...files, ...ingested]);
        setIngestMessage(`Successfully ingested ${ingested.length} files (including zip extraction).`);
        setActiveTab('manage');
      }
    } catch (err: any) {
      setIngestMessage(`Error processing files: ${err.message}`);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    try {
      const ingested = await ingestUploadedFiles(e.dataTransfer.files);
      if (ingested.length > 0) {
        onUpdateFiles([...files, ...ingested]);
        setIngestMessage(`Successfully ingested ${ingested.length} files from drag & drop.`);
        setActiveTab('manage');
      }
    } catch (err: any) {
      setIngestMessage(`Drop error: ${err.message}`);
    }
  };

  const handlePastedParse = () => {
    if (!pastedCode.trim()) return;
    const parsed = parsePastedFiles(pastedCode);
    if (parsed.length > 0) {
      onUpdateFiles([...files, ...parsed]);
      setPastedCode('');
      setIngestMessage(`Parsed and added ${parsed.length} file block(s).`);
      setActiveTab('manage');
    }
  };

  const handleRemoveFile = (id: string) => {
    onUpdateFiles(files.filter((f) => f.id !== id));
  };

  const handleResetToSample = () => {
    onUpdateFiles(SAMPLE_LEGACY_REPO);
    setIngestMessage('Reset workspace to the 4 tightly-coupled legacy banking files.');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl bg-zinc-950 border-l border-zinc-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Ingest Legacy Codebase</h2>
              <p className="text-xs text-zinc-400">
                Multi-file upload, .zip extraction, or multi-block code paste
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-6 pt-3 border-b border-zinc-800/80 bg-zinc-950 flex gap-4">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileArchive className="h-4 w-4" />
            Upload Files / .Zip Archive
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'paste'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ClipboardPaste className="h-4 w-4" />
            Paste Code Blocks
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`pb-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'manage'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCode className="h-4 w-4" />
            Indexed Files ({files.length})
          </button>
        </div>

        {/* Feedback message */}
        {ingestMessage && (
          <div className="mx-6 mt-3 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
              {ingestMessage}
            </span>
            <button
              onClick={() => setIngestMessage(null)}
              className="text-zinc-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-zinc-700/80 hover:border-zinc-600 bg-zinc-900/40 hover:bg-zinc-900/70'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".java,.py,.ts,.tsx,.js,.jsx,.sql,.cs,.txt,.json,.md,.zip"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-full bg-zinc-800 text-blue-400">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">
                      Click to browse or drag & drop files / .zip here
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Supports Java, SQL, Python, TypeScript, C#, text docs, or compressed zip archives
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-zinc-900/70 border border-zinc-800 p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Client-Side Ingestion Guarantee
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Files and .zip packages are unpacked entirely in your browser using JSZip and native FileReader. No server upload occurs until you trigger the live Gemini 2.5 Flash analysis.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-300">
                    Paste Multi-File Source Code
                  </span>
                  <span className="text-zinc-500 font-mono text-[11px]">
                    Use === FILE: Name === delimiters
                  </span>
                </div>
                <textarea
                  value={pastedCode}
                  onChange={(e) => setPastedCode(e.target.value)}
                  placeholder={`=== FILE: OrderProcessing.java ===\npublic class OrderProcessing {\n    // code here...\n}\n\n=== FILE: OrderSchema.sql ===\nCREATE TABLE tbl_orders (\n    order_id BIGINT PRIMARY KEY\n);`}
                  rows={14}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 font-mono text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={handlePastedParse}
                  disabled={!pastedCode.trim()}
                  className="px-4 py-2 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-all shadow-sm shadow-blue-600/30"
                >
                  Parse & Ingest Blocks
                </button>
              </div>
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Currently Indexed Code Files ({files.length})
                </h3>
                <button
                  onClick={handleResetToSample}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  Reload 4-File Sample Repo
                </button>
              </div>

              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/70 hover:border-zinc-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <FileCode className="h-4 w-4 text-zinc-400" />
                      <div>
                        <div className="text-xs font-medium text-zinc-200">{file.name}</div>
                        <div className="text-[11px] text-zinc-500 font-mono">
                          {file.path} • {file.lineCount} lines • {(file.sizeBytes / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 uppercase">
                        {file.language}
                      </span>
                      <button
                        onClick={() => handleRemoveFile(file.id)}
                        className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                        title="Remove file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer CTA */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div className="text-xs text-zinc-400 font-mono">
            {files.length} Files Ready for Analysis
          </div>
          <button
            onClick={() => {
              onRunAnalysis();
              onClose();
            }}
            disabled={isAnalyzing || files.length === 0}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
          >
            <Sparkles className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing Codebase...' : 'Run Live X-Ray Analysis'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
