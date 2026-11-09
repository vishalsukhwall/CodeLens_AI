import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { CodeFile, CharacterizationTestSuite } from '@/types/legacy';
import { FALLBACK_TEST_SUITE } from '@/lib/fallbackCache';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const files: CodeFile[] = body.files || [];
    const targetFile: string = body.targetFile || 'LoanInterestEngine.java';
    const targetUnit: string = body.targetUnit || 'calculateAnnualYield & calculateNetWithholdingTax';
    const framework: any = body.framework || 'JUnit 5';
    const clientKey = req.headers.get('x-gemini-key') || body.apiKey || '';
    const apiKey = (clientKey || process.env.GEMINI_API_KEY || '').trim();

    if (!apiKey) {
      console.warn('[LegacyLens AI] No GEMINI_API_KEY; returning deterministic characterization test suite.');
      return NextResponse.json({
        source: 'fallback',
        statusMessage: 'Offline deterministic tests (GEMINI_API_KEY not configured)',
        data: FALLBACK_TEST_SUITE,
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

    const systemInstruction = `You are a Principal Test Automation Architect specializing in Legacy Characterization Testing (Michael Feathers methodology).
Generate a bulletproof, runnable, and copyable unit/integration test suite that captures existing legacy behavior verbatim—locking in edge cases, boundary conditions, hardcoded tax rates, and defensive legacy traps before any refactoring begins.

Return ONLY strict JSON matching the schema.`;

    const prompt = `Codebase Context:
${codebaseContext}

Target File: ${targetFile}
Target Method/Unit: ${targetUnit}
Target Framework: ${framework}

Generate characterization tests and return ONLY a JSON object:
{
  "file": string,
  "targetUnit": string,
  "framework": "JUnit 5" | "Jest" | "PyTest" | "NUnit",
  "rationale": string,
  "code": string, // Full runnable test file source code
  "tests": [
    {
      "id": string,
      "name": string,
      "category": "Happy Path" | "Boundary/Null" | "Hardcoded Rule Verification" | "Defensive Legacy Trap",
      "description": string,
      "targetLineCitation": string,
      "status": "verified" | "recommended"
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

    const parsedData: CharacterizationTestSuite = JSON.parse(response.text || '{}');

    return NextResponse.json({
      source: 'gemini',
      statusMessage: 'Live Gemini 2.5 Flash test suite generated',
      data: parsedData,
    });
  } catch (err: any) {
    console.error('[LegacyLens AI /api/tests error]:', err);
    return NextResponse.json({
      source: 'fallback',
      statusMessage: `Live Gemini API error: ${err.message || 'Unknown'}. Using cached test harness.`,
      error: err.message,
      data: FALLBACK_TEST_SUITE,
    });
  }
}
