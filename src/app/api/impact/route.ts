import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { CodeFile, BlastRadiusSimulation } from '@/types/legacy';
import { FALLBACK_SIMULATION } from '@/lib/fallbackCache';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const files: CodeFile[] = body.files || [];
    const targetFile: string = body.targetFile || '';
    const targetSymbol: string = body.targetSymbol || '';
    const proposedChange: string = body.proposedChange || '';
    const clientKey = req.headers.get('x-gemini-key') || body.apiKey || '';
    const apiKey = (clientKey || process.env.GEMINI_API_KEY || '').trim();

    if (!proposedChange) {
      return NextResponse.json({ error: 'Proposed change is required' }, { status: 400 });
    }

    if (!apiKey) {
      console.warn('[LegacyLens AI] No GEMINI_API_KEY; returning deterministic blast-radius simulation.');
      return NextResponse.json({
        source: 'fallback',
        statusMessage: 'Offline deterministic simulation (GEMINI_API_KEY not configured)',
        data: {
          ...FALLBACK_SIMULATION,
          proposedChange: proposedChange || FALLBACK_SIMULATION.proposedChange,
          targetSymbol: targetSymbol || FALLBACK_SIMULATION.targetSymbol,
          targetFile: targetFile || FALLBACK_SIMULATION.targetFile,
        },
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const codebaseContext = files
      .map((f) => {
        const numberedLines = f.content
          .split('\n')
          .map((line, idx) => `${idx + 1}: ${line}`)
          .join('\n');
        return `=== FILE: ${f.name} ===\n${numberedLines}\n=== END FILE ===`;
      })
      .join('\n\n');

    const systemInstruction = `You are a Principal Software Architect and Static-Analysis Blast-Radius Specialist.
Given a proposed code or schema modification in a legacy repository, simulate the exact ripple effect and cross-file blast radius.
Detect:
1. Every downstream line that will break, fail compilation, throw runtime SQLExceptions, or suffer silent precision drift.
2. The blast-radius risk score (0-100) and severity (LOW, MEDIUM, HIGH).
3. Runtime side effects (ledger corruption, batch crashes, deadlocks, delayed reconciliations).
4. A step-by-step decoupling and refactoring checklist to perform this change safely without downtime.

Return ONLY strict JSON matching the schema.`;

    const prompt = `Codebase Context:
${codebaseContext}

Proposed Change:
Target File: ${targetFile || 'UserAuthSchema.sql'}
Target Symbol / Column / Function: ${targetSymbol || 'customer_tier'}
Description of Change: "${proposedChange}"

Simulate the blast radius and return ONLY a JSON object:
{
  "targetSymbol": string,
  "targetFile": string,
  "proposedChange": string,
  "blastRadiusScore": number, // 0 to 100
  "severity": "LOW" | "MEDIUM" | "HIGH",
  "summary": string,
  "affectedModules": [
    {
      "file": string,
      "line": number,
      "symbol": string,
      "impactType": "Breaking API" | "Type Mismatch" | "Data Truncation" | "Implicit Dependency" | "Silent Failure",
      "description": string
    }
  ],
  "sideEffects": string[],
  "refactoringChecklist": [
    {
      "step": number,
      "task": string,
      "file": string,
      "estimatedRisk": "LOW" | "MEDIUM" | "HIGH"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const parsedData: BlastRadiusSimulation = JSON.parse(response.text || '{}');

    return NextResponse.json({
      source: 'gemini',
      statusMessage: 'Live Gemini 2.5 Flash blast-radius simulation complete',
      data: parsedData,
    });
  } catch (err: any) {
    console.error('[LegacyLens AI /api/impact error]:', err);
    return NextResponse.json({
      source: 'fallback',
      statusMessage: `Live Gemini API error: ${err.message || 'Unknown'}. Using cached simulation.`,
      error: err.message,
      data: FALLBACK_SIMULATION,
    });
  }
}
