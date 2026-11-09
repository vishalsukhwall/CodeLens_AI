'use client';

import React, { useState, useEffect } from 'react';
import {
  CodeFile,
  FullAnalysisResult,
  BlastRadiusSimulation,
  CharacterizationTestSuite,
  ForensicChatMessage,
} from '@/types/legacy';
import { SAMPLE_LEGACY_REPO } from '@/data/sampleLegacyRepo';
import {
  FALLBACK_ANALYSIS,
  FALLBACK_SIMULATION,
  FALLBACK_TEST_SUITE,
  FALLBACK_CHAT_RESPONSES,
} from '@/lib/fallbackCache';
import { generateTechnicalKtPdf } from '@/lib/ktPdfGenerator';

import { IdeTopToolbar } from '@/components/IdeTopToolbar';
import { RepoExplorerPane } from '@/components/RepoExplorerPane';
import { BlueprintCanvas } from '@/components/BlueprintCanvas';
import { SplitCodeXRay } from '@/components/SplitCodeXRay';
import { RightCopilotDrawer } from '@/components/RightCopilotDrawer';
import { DeadCodeAuditView } from '@/components/DeadCodeAuditView';
import { TestGuardView } from '@/components/TestGuardView';
import { CodeIngestModal } from '@/components/CodeIngestModal';

export default function CodeLenseIdeApp() {
  // Primary Repository & Analysis State
  const [files, setFiles] = useState<CodeFile[]>(SAMPLE_LEGACY_REPO);
  const [analysis, setAnalysis] = useState<FullAnalysisResult>(FALLBACK_ANALYSIS);
  const [simulation, setSimulation] = useState<BlastRadiusSimulation>(FALLBACK_SIMULATION);
  const [testSuite, setTestSuite] = useState<CharacterizationTestSuite>(FALLBACK_TEST_SUITE);

  // Active View Switcher: 'xray' | 'deadcode' | 'testguard'
  const [activeView, setActiveView] = useState<'xray' | 'deadcode' | 'testguard'>('xray');

  // Canvas Mode: 'split' | 'canvas' | 'xray'
  const [canvasMode, setCanvasMode] = useState<'split' | 'canvas' | 'xray'>('split');

  // Active Selected File for Code X-Ray
  const [selectedFile, setSelectedFile] = useState<CodeFile>(SAMPLE_LEGACY_REPO[1]); // LoanInterestEngine.java
  const [highlightedLineRange, setHighlightedLineRange] = useState<{ start: number; end: number } | null>({
    start: 84,
    end: 88,
  });

  // Chat Copilot State
  const [chatHistory, setChatHistory] = useState<ForensicChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `Welcome to **CodeLense AI Forensic Copilot**. I have indexed all 4 repository files.

**Key Forensic Insights Identified:**
1. \`UserAuthSchema.sql:13\` defines \`customer_tier\`, tightly coupled via raw JDBC query to \`MonthlyBillingBatch.java:94\`.
2. \`LoanInterestEngine.java:84\` hardcodes statutory withholding tax at **18.5%**, directly conflicting with \`legacy_arch_notes_2016.txt:28\` (mandating 12.0%).
3. \`MonthlyBillingBatch.java:165-192\` contains 28 dead lines of obsolete magnetic tape reconciliation.

Click any citation pill to inspect the source lines in the center X-Ray or select a prompt chip below.`,
      timestamp: Date.now(),
      citations: [
        { file: 'UserAuthSchema.sql', lineStart: 13, lineEnd: 15 },
        { file: 'MonthlyBillingBatch.java', lineStart: 94, lineEnd: 98 },
        { file: 'LoanInterestEngine.java', lineStart: 84, lineEnd: 88 },
        { file: 'MonthlyBillingBatch.java', lineStart: 165, lineEnd: 192 },
      ],
    },
  ]);

  // Operational & API status state
  const [engineStatus, setEngineStatus] = useState<'live' | 'analyzing' | 'fallback'>('fallback');
  const [engineStatusMessage, setEngineStatusMessage] = useState<string>('Ready');
  const [userApiKey, setUserApiKey] = useState<string>('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isGeneratingTests, setIsGeneratingTests] = useState<boolean>(false);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  // Restore API key from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey =
        localStorage.getItem('codelense_gemini_key') ||
        localStorage.getItem('legacylens_gemini_key') ||
        '';
      if (savedKey) {
        setUserApiKey(savedKey);
      }
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    setUserApiKey(key);
    if (typeof window !== 'undefined') {
      localStorage.setItem('codelense_gemini_key', key);
    }
  };

  // Jump to code citation across any pane or view
  const handleJumpToCitation = (
    fileName: string,
    lineStart: number,
    lineEnd: number
  ) => {
    const matchedFile =
      files.find((f) => f.name.toLowerCase() === fileName.toLowerCase()) ||
      files.find((f) => f.path.toLowerCase().includes(fileName.toLowerCase())) ||
      files[0];

    setSelectedFile(matchedFile);
    setHighlightedLineRange({ start: lineStart, end: lineEnd });
    setActiveView('xray');
    // Ensure X-Ray drawer is visible if canvas was maximized
    if (canvasMode === 'canvas') {
      setCanvasMode('split');
    }
  };

  // Run live analysis via /api/analyze
  const runLiveAnalysis = async (filesToAnalyze = files) => {
    setIsAnalyzing(true);
    setEngineStatus('analyzing');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userApiKey ? { 'x-gemini-key': userApiKey } : {}),
        },
        body: JSON.stringify({
          files: filesToAnalyze,
          apiKey: userApiKey,
        }),
      });

      const data = await res.json();
      if (data.data) {
        setAnalysis(data.data);
      }

      if (data.source === 'gemini') {
        setEngineStatus('live');
        setEngineStatusMessage('Live Gemini 2.5 Flash');
      } else {
        setEngineStatus('fallback');
        setEngineStatusMessage(data.statusMessage || 'Fallback active');
      }
    } catch (err) {
      console.error('Failed to analyze repository:', err);
      setEngineStatus('fallback');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reload 4-file sample banking repo
  const handleLoadSampleRepo = () => {
    setFiles(SAMPLE_LEGACY_REPO);
    setSelectedFile(SAMPLE_LEGACY_REPO[1]);
    setHighlightedLineRange({ start: 84, end: 88 });
    runLiveAnalysis(SAMPLE_LEGACY_REPO);
  };

  // Run live blast-radius simulation via /api/impact
  const handleSimulateImpact = async (
    targetFile: string,
    targetSymbol: string,
    proposedChange: string
  ) => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/impact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userApiKey ? { 'x-gemini-key': userApiKey } : {}),
        },
        body: JSON.stringify({
          files,
          targetFile,
          targetSymbol,
          proposedChange,
          apiKey: userApiKey,
        }),
      });

      const data = await res.json();
      if (data.data) {
        setSimulation(data.data);
      }
      if (data.source === 'gemini') {
        setEngineStatus('live');
      }
    } catch (err) {
      console.error('Failed simulation:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Run live test generation via /api/tests
  const handleGenerateTests = async (
    targetFile: string,
    targetUnit: string,
    framework: string
  ) => {
    setIsGeneratingTests(true);
    try {
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userApiKey ? { 'x-gemini-key': userApiKey } : {}),
        },
        body: JSON.stringify({
          files,
          targetFile,
          targetUnit,
          framework,
          apiKey: userApiKey,
        }),
      });

      const data = await res.json();
      if (data.data) {
        setTestSuite(data.data);
      }
      if (data.source === 'gemini') {
        setEngineStatus('live');
      }
    } catch (err) {
      console.error('Failed to generate tests:', err);
    } finally {
      setIsGeneratingTests(false);
    }
  };

  // Send message to Forensic Copilot via /api/chat
  const handleSendMessage = async (question: string) => {
    const userMessage: ForensicChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: question,
      timestamp: Date.now(),
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userApiKey ? { 'x-gemini-key': userApiKey } : {}),
        },
        body: JSON.stringify({
          files,
          question,
          history: chatHistory,
          apiKey: userApiKey,
        }),
      });

      const data = await res.json();
      if (data.data) {
        setChatHistory((prev) => [...prev, data.data]);
      }
      if (data.source === 'gemini') {
        setEngineStatus('live');
      }
    } catch (err) {
      console.error('Failed chat query:', err);
      setChatHistory((prev) => [
        ...prev,
        {
          id: `fallback-${Date.now()}`,
          sender: 'assistant',
          text: FALLBACK_CHAT_RESPONSES.default.text,
          timestamp: Date.now(),
          citations: FALLBACK_CHAT_RESPONSES.default.citations,
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Download 4-Page Technical KT PDF
  const handleDownloadPdf = () => {
    setIsDownloadingPdf(true);
    try {
      const doc = generateTechnicalKtPdf({
        analysis,
        testSuite,
        simulation,
      });
      doc.save(
        `CodeLense_Technical_KT_Blueprint_${new Date().toISOString().slice(0, 10)}.pdf`
      );
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-blueprint-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. Top IDE Toolbar with Health Bar and PDF CTA */}
      <IdeTopToolbar
        activeView={activeView}
        onSelectView={setActiveView}
        engineStatus={engineStatus}
        engineStatusMessage={engineStatusMessage}
        telemetry={analysis.telemetry}
        onDownloadPdf={handleDownloadPdf}
        isDownloadingPdf={isDownloadingPdf}
        userApiKey={userApiKey}
        onSaveApiKey={handleSaveApiKey}
      />

      {/* 2. Main IDE Workspace Stage */}
      <main className="flex-1 w-full h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* VIEW 1: Signature 3-Pane Architecture & Code X-Ray Layout (19% / 52% / 29%) */}
        {activeView === 'xray' && (
          <div className="w-full h-full flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-blueprint-800 overflow-hidden">
            {/* Left Pane (19% width / min-w-[240px]): Collapsible VS Code Repository Explorer */}
            <div className="w-full md:w-[19%] md:min-w-[240px] md:max-w-[280px] h-full overflow-hidden shrink-0">
              <RepoExplorerPane
                files={files}
                selectedFile={selectedFile}
                onSelectFile={(f) => {
                  setSelectedFile(f);
                  setHighlightedLineRange(null);
                }}
                businessRules={analysis.businessRules}
                onLoadSampleRepo={handleLoadSampleRepo}
                onOpenUploadModal={() => setIsUploadModalOpen(true)}
                isAnalyzing={isAnalyzing}
              />
            </div>

            {/* Center Stage (52% width / flex-1 / min-w-[500px]): Interactive Blueprint Canvas + Split Code X-Ray */}
            <div className="flex-1 h-full flex flex-col overflow-hidden min-w-0">
              {/* Top Half: Visual Architecture Flow Stage */}
              <div
                className={`${
                  canvasMode === 'canvas'
                    ? 'h-full'
                    : canvasMode === 'xray'
                    ? 'hidden'
                    : 'h-[48%] min-h-[340px]'
                } w-full overflow-hidden transition-all duration-300`}
              >
                <BlueprintCanvas
                  nodes={analysis.nodes}
                  edges={analysis.edges}
                  selectedFile={selectedFile}
                  onSelectNode={(nodeId, fileName) => {
                    const f = files.find(
                      (file) => file.name.toLowerCase() === fileName.toLowerCase()
                    );
                    if (f) setSelectedFile(f);
                  }}
                  simulation={simulation}
                  isExpanded={canvasMode === 'canvas'}
                  onToggleExpand={() =>
                    setCanvasMode(canvasMode === 'canvas' ? 'split' : 'canvas')
                  }
                />
              </div>

              {/* Bottom Half: Side-by-Side Split Code X-Ray Drawer */}
              <div
                className={`${
                  canvasMode === 'xray'
                    ? 'h-full'
                    : canvasMode === 'canvas'
                    ? 'hidden'
                    : 'h-[52%] min-h-[360px]'
                } w-full overflow-hidden transition-all duration-300`}
              >
                <SplitCodeXRay
                  file={selectedFile}
                  highlightedLineRange={highlightedLineRange}
                  businessRules={analysis.businessRules}
                  ioContracts={analysis.ioContracts}
                />
              </div>
            </div>

            {/* Right Pane (29% width / min-w-[340px]): Docked Blast-Radius & Forensic Copilot Drawer */}
            <div className="w-full md:w-[29%] md:min-w-[340px] md:max-w-[420px] h-full overflow-hidden shrink-0">
              <RightCopilotDrawer
                files={files}
                simulation={simulation}
                onSimulateImpact={handleSimulateImpact}
                isSimulating={isSimulating}
                chatHistory={chatHistory}
                onSendMessage={handleSendMessage}
                isChatLoading={isChatLoading}
                onJumpToCitation={handleJumpToCitation}
              />
            </div>
          </div>
        )}

        {/* VIEW 2: Dead Code & Circular Coupling Audit (Focused Full-Stage View) */}
        {activeView === 'deadcode' && (
          <DeadCodeAuditView
            deadCodeReport={analysis.deadCode}
            onJumpToCitation={handleJumpToCitation}
          />
        )}

        {/* VIEW 3: TestGuard Characterization Test Studio */}
        {activeView === 'testguard' && (
          <TestGuardView
            files={files}
            testSuite={testSuite}
            onGenerateTests={handleGenerateTests}
            isGeneratingTests={isGeneratingTests}
            onJumpToCitation={handleJumpToCitation}
          />
        )}
      </main>

      {/* Code Ingestion Modal */}
      <CodeIngestModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        files={files}
        onUpdateFiles={(newFiles) => {
          setFiles(newFiles);
          if (newFiles.length > 0) setSelectedFile(newFiles[0]);
        }}
        onRunAnalysis={() => runLiveAnalysis(files)}
        isAnalyzing={isAnalyzing}
      />
    </div>
  );
}
