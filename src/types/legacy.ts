export type LanguageType = 'java' | 'sql' | 'python' | 'typescript' | 'javascript' | 'csharp' | 'text';

export interface CodeFile {
  id: string;
  name: string;
  path: string;
  language: LanguageType;
  content: string;
  lineCount: number;
  sizeBytes: number;
}

export interface ArchNode {
  id: string;
  name: string;
  type: 'database' | 'service' | 'batch' | 'docs' | 'utility';
  description: string;
  file: string;
  lines: string;
  upstreamIds: string[];
  downstreamIds: string[];
  status: 'healthy' | 'warning' | 'deprecated' | 'critical';
  metrics: {
    lines: number;
    complexity: 'Low' | 'Medium' | 'High' | 'Severe';
    riskScore: number; // 0-100
  };
  contracts?: string[];
  plainEnglishLogic?: string[];
}

export interface ArchEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: 'call' | 'query' | 'dependency' | 'implicit';
  severity: 'low' | 'medium' | 'high';
}

export interface BusinessRule {
  id: string;
  name: string;
  category: 'Taxation' | 'Interest' | 'Eligibility' | 'Compliance' | 'Billing';
  description: string;
  hardcodedValue: string;
  file: string;
  lineStart: number;
  lineEnd: number;
  riskLevel: 'low' | 'medium' | 'high';
  rationale: string;
}

export interface IOContract {
  id: string;
  module: string;
  file: string;
  functionName: string;
  inputs: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  outputs: {
    type: string;
    description: string;
  };
  sideEffects: string[];
  lineStart: number;
  lineEnd: number;
}

export interface BlastRadiusAffectedModule {
  file: string;
  line: number;
  symbol: string;
  impactType: 'Breaking API' | 'Type Mismatch' | 'Data Truncation' | 'Implicit Dependency' | 'Silent Failure';
  description: string;
}

export interface RefactoringStep {
  step: number;
  task: string;
  file: string;
  estimatedRisk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface BlastRadiusSimulation {
  targetSymbol: string;
  targetFile: string;
  proposedChange: string;
  blastRadiusScore: number; // 0-100
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
  affectedModules: BlastRadiusAffectedModule[];
  sideEffects: string[];
  refactoringChecklist: RefactoringStep[];
}

export interface DeadCodeItem {
  id: string;
  file: string;
  symbol: string;
  lineStart: number;
  lineEnd: number;
  reason: string;
  safetyScore: number; // 0-100
  linesSaved?: number;
  category: 'active' | 'tangled' | 'dead';
  circularWith?: string;
}

export interface DeadCodeReport {
  activeCriticalPath: DeadCodeItem[];
  tangledDependencies: DeadCodeItem[];
  safeToRetire: DeadCodeItem[];
  summary: {
    totalDeadLines: number;
    overallCouplingIndex: number;
    recommendedFirstAction: string;
  };
}

export interface TestCaseItem {
  id: string;
  name: string;
  category: 'Happy Path' | 'Boundary/Null' | 'Hardcoded Rule Verification' | 'Defensive Legacy Trap';
  description: string;
  targetLineCitation: string;
  status: 'verified' | 'recommended';
}

export interface CharacterizationTestSuite {
  file: string;
  targetUnit: string;
  framework: 'JUnit 5' | 'Jest' | 'PyTest' | 'NUnit';
  code: string;
  tests: TestCaseItem[];
  rationale: string;
}

export interface TelemetryMetrics {
  totalFiles: number;
  totalLines: number;
  techDebtScore: number; // 0-100
  hardcodedRulesCount: number;
  criticalCouplingHotspots: number;
  deadCodeLines: number;
}

export interface Citation {
  file: string;
  lineStart: number;
  lineEnd: number;
  snippet?: string;
}

export interface ForensicChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  citations?: Citation[];
  confidence?: 'High' | 'Medium' | 'Low';
}

export interface FullAnalysisResult {
  telemetry: TelemetryMetrics;
  nodes: ArchNode[];
  edges: ArchEdge[];
  businessRules: BusinessRule[];
  ioContracts: IOContract[];
  deadCode: DeadCodeReport;
  executiveSummary: string;
}
