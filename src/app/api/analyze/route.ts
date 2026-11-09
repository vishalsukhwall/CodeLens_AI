import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { CodeFile, FullAnalysisResult } from '@/types/legacy';
import { FALLBACK_ANALYSIS } from '@/lib/fallbackCache';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const files: CodeFile[] = body.files || [];
    const clientKey = req.headers.get('x-gemini-key') || body.apiKey || '';
    const apiKey = (clientKey || process.env.GEMINI_API_KEY || '').trim();

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided for analysis' }, { status: 400 });
    }

    if (!apiKey) {
      console.warn('[LegacyLens AI] No GEMINI_API_KEY provided; utilizing offline deterministic cache.');
      return NextResponse.json({
        source: 'fallback',
        statusMessage: 'Offline deterministic cache active (GEMINI_API_KEY not configured)',
        data: FALLBACK_ANALYSIS,
      });
    }

    // Initialize Google GenAI client (zero prefix regex check)
    const ai = new GoogleGenAI({ apiKey });

    // Format files into context with numbered lines
    const codebaseContext = files
      .map((f) => {
        const numberedLines = f.content
          .split('\n')
          .map((line, idx) => `${idx + 1}: ${line}`)
          .join('\n');
        return `=== FILE: ${f.name} (Path: ${f.path}, Language: ${f.language}) ===\n${numberedLines}\n=== END FILE: ${f.name} ===`;
      })
      .join('\n\n');

    const systemInstruction = `You are a Principal Full-Stack Architect and Staff Static-Analysis Engineer.
Analyze the provided multi-file legacy repository with extreme precision. Extract:
1. Architectural nodes (services, database schemas, batches, docs) with upstream/downstream connections and risk scores (0-100).
2. Directional edges (call, query, dependency, implicit) with severity ('low', 'medium', 'high') and exact line numbers.
3. Every hardcoded business rule, formula, rate, fee, or threshold with exact File:Line citations.
4. I/O contracts for critical functions with inputs, outputs, and side effects.
5. Dead code and ghost dependencies in 3 strict buckets:
   - activeCriticalPath (safetyScore 0-10)
   - tangledDependencies (safetyScore 20-60)
   - safeToRetire (safetyScore 80-100, zero callers, dead magnetic tapes, unused columns like legacy_fax_optin)
6. Executive summary highlighting architectural drift and hidden couplings.

CRITICAL: Return strictly valid JSON adhering to the required structure.`;

    const prompt = `Perform complete static analysis on this multi-file legacy repository:

${codebaseContext}

Respond ONLY with a JSON object in this exact schema:
{
  "telemetry": {
    "totalFiles": number,
    "totalLines": number,
    "techDebtScore": number, // 0-100
    "hardcodedRulesCount": number,
    "criticalCouplingHotspots": number,
    "deadCodeLines": number
  },
  "executiveSummary": string,
  "nodes": [
    {
      "id": string,
      "name": string,
      "type": "database" | "service" | "batch" | "docs" | "utility",
      "description": string,
      "file": string,
      "lines": string,
      "upstreamIds": string[],
      "downstreamIds": string[],
      "status": "healthy" | "warning" | "deprecated" | "critical",
      "metrics": {
        "lines": number,
        "complexity": "Low" | "Medium" | "High" | "Severe",
        "riskScore": number
      },
      "contracts": string[],
      "plainEnglishLogic": string[]
    }
  ],
  "edges": [
    {
      "id": string,
      "source": string,
      "target": string,
      "label": string,
      "type": "call" | "query" | "dependency" | "implicit",
      "severity": "low" | "medium" | "high"
    }
  ],
  "businessRules": [
    {
      "id": string,
      "name": string,
      "category": "Taxation" | "Interest" | "Eligibility" | "Compliance" | "Billing",
      "description": string,
      "hardcodedValue": string,
      "file": string,
      "lineStart": number,
      "lineEnd": number,
      "riskLevel": "low" | "medium" | "high",
      "rationale": string
    }
  ],
  "ioContracts": [
    {
      "id": string,
      "module": string,
      "file": string,
      "functionName": string,
      "inputs": [
        { "name": string, "type": string, "required": boolean, "description": string }
      ],
      "outputs": {
        "type": string,
        "description": string
      },
      "sideEffects": string[],
      "lineStart": number,
      "lineEnd": number
    }
  ],
  "deadCode": {
    "activeCriticalPath": [
      {
        "id": string,
        "file": string,
        "symbol": string,
        "lineStart": number,
        "lineEnd": number,
        "reason": string,
        "safetyScore": number,
        "category": "active"
      }
    ],
    "tangledDependencies": [
      {
        "id": string,
        "file": string,
        "symbol": string,
        "lineStart": number,
        "lineEnd": number,
        "reason": string,
        "safetyScore": number,
        "category": "tangled"
      }
    ],
    "safeToRetire": [
      {
        "id": string,
        "file": string,
        "symbol": string,
        "lineStart": number,
        "lineEnd": number,
        "reason": string,
        "safetyScore": number,
        "linesSaved": number,
        "category": "dead"
      }
    ],
    "summary": {
      "totalDeadLines": number,
      "overallCouplingIndex": number,
      "recommendedFirstAction": string
    }
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const textOutput = response.text || '';
    const parsedData: FullAnalysisResult = JSON.parse(textOutput);

    return NextResponse.json({
      source: 'gemini',
      statusMessage: 'Live Gemini 2.5 Flash analysis complete',
      data: parsedData,
    });
  } catch (err: any) {
    console.error('[LegacyLens AI /api/analyze error]:', err);
    return NextResponse.json({
      source: 'fallback',
      statusMessage: `Live Gemini API error: ${err.message || 'Unknown error'}. Falling back to cached analysis.`,
      error: err.message,
      data: FALLBACK_ANALYSIS,
    });
  }
}
