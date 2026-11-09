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
} from 'lucide-react';
import { CodeFile } from '@/types/legacy';
import { ingestUploadedFiles, parsePastedFiles } from '@/lib/fileIngestor';
import { SAMPLE_LEGACY_REPO } from '@/data/sampleLegacyRepo';

interface CodeIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: CodeFile[];
  onUpdateFiles: (newFiles: CodeFile[]) => void;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
}

export const CodeIngestModal: React.FC<CodeIngestModalProps> = ({
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
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      const ingested = await ingestUploadedFiles(e.target.files);
      if (ingested.length > 0) {
        onUpdateFiles([...files, ...ingested]);
        setStatusMessage(`Ingested ${ingested.length} file(s) (including any zip archives).`);
        setActiveTab('manage');
      }
    } catch (err: any) {
      setStatusMessage(`Upload failed: ${err.message}`);
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
        setStatusMessage(`Ingested ${ingested.length} file(s) from drag-and-drop.`);
        setActiveTab('manage');
      }
    } catch (err: any) {
      setStatusMessage(`Drop failed: ${err.message}`);
    }
  };

  const handlePastedParse = () => {
    if (!pastedCode.trim()) return;
    const parsed = parsePastedFiles(pastedCode);
    if (parsed.length > 0) {
      onUpdateFiles([...files, ...parsed]);
      setPastedCode('');
      setStatusMessage(`Parsed and indexed ${parsed.length} code block(s).`);
      setActiveTab('manage');
    }
  };

  const handleRemoveFile = (id: string) => {
    onUpdateFiles(files.filter((f) => f.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-2xl bg-blueprint-950 border border-blueprint-800 rounded-2xl flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-blueprint-800 bg-blueprint-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono">
                Ingest Legacy Codebase
              </h2>
              <p className="text-xs text-zinc-400">
                Multi-file upload, .zip extraction, or === FILE: Name === blocks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-blueprint-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Headers */}
        <div className="px-6 pt-3 border-b border-blueprint-800 bg-blueprint-950 flex gap-4 text-xs font-mono">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 border-b-2 font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileArchive className="h-4 w-4" />
            Upload Files / .Zip
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 border-b-2 font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'paste'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ClipboardPaste className="h-4 w-4" />
            Paste Code Blocks
          </button>

          <button
            onClick={() => setActiveTab('manage')}
            className={`pb-2.5 border-b-2 font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'manage'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCode className="h-4 w-4" />
            Files ({files.length})
          </button>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div className="mx-6 mt-3 p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-indigo-400" />
              {statusMessage}
            </span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-zinc-400 hover:text-white font-bold text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 max-h-[380px] overflow-y-auto space-y-4">
          {activeTab === 'upload' && (
            <div className="space-y-3">
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
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-blueprint-700 hover:border-blueprint-600 bg-blueprint-900/40 hover:bg-blueprint-900/70'
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
                <div className="flex flex-col items-center gap-2.5">
                  <div className="p-3 rounded-full bg-blueprint-850 text-indigo-400">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-semibold text-zinc-100">
                    Click to browse or drag & drop files / .zip archive here
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Supports Java, SQL, Python, TypeScript, C#, text docs, or compressed zip archives
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="text-[11px] text-zinc-400 font-mono">
                Paste multi-file code with <code className="text-indigo-400">=== FILE: Name ===</code> delimiters:
              </div>
              <textarea
                value={pastedCode}
                onChange={(e) => setPastedCode(e.target.value)}
                placeholder={`=== FILE: OrderEngine.java ===\npublic class OrderEngine {\n    // source...\n}\n\n=== FILE: OrderSchema.sql ===\nCREATE TABLE tbl_orders (\n    order_id BIGINT PRIMARY KEY\n);`}
                rows={10}
                className="w-full rounded-lg border border-blueprint-700 bg-blueprint-950 p-3 font-mono text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={handlePastedParse}
                  disabled={!pastedCode.trim()}
                  className="px-4 py-1.5 rounded-md text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  Parse & Ingest Blocks
                </button>
              </div>
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-blueprint-800 bg-blueprint-900/60"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className="h-4 w-4 text-zinc-400 shrink-0" />
                    <span className="text-xs font-mono font-medium text-zinc-200 truncate">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      ({file.lineCount}L)
                    </span>
                  </div>

                  <button
                    onClick={() => handleRemoveFile(file.id)}
                    className="p-1 rounded text-zinc-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-blueprint-800 bg-blueprint-900/60 flex items-center justify-between">
          <span className="text-xs font-mono text-zinc-400">
            {files.length} Files Ready for Analysis
          </span>

          <button
            onClick={() => {
              onRunAnalysis();
              onClose();
            }}
            disabled={isAnalyzing || files.length === 0}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            <Sparkles className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing...' : 'Run Live X-Ray Analysis'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
