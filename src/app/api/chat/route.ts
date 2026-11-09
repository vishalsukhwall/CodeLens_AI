import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { CodeFile, ForensicChatMessage, Citation } from '@/types/legacy';
import { FALLBACK_CHAT_RESPONSES } from '@/lib/fallbackCache';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const files: CodeFile[] = body.files || [];
    const question: string = body.question || '';
    const history: ForensicChatMessage[] = body.history || [];
    const clientKey = req.headers.get('x-gemini-key') || body.apiKey || '';
    const apiKey = (clientKey || process.env.GEMINI_API_KEY || '').trim();

    if (!question.trim()) {
      return NextResponse.json({ error: 'Question cannot be empty' }, { status: 400 });
    }

    // Keyword fallback matcher for offline / demo mode
    const getFallbackAnswer = (q: string): ForensicChatMessage => {
      const lower = q.toLowerCase();
      if (lower.includes('tax') || lower.includes('withhold') || lower.includes('18.5') || lower.includes('12')) {
        return FALLBACK_CHAT_RESPONSES.tax;
      }
      if (lower.includes('service') || lower.includes('break') || lower.includes('userauth') || lower.includes('tier')) {
        return FALLBACK_CHAT_RESPONSES.services;
      }
      if (lower.includes('dead') || lower.includes('tape') || lower.includes('ghost') || lower.includes('retire')) {
        return FALLBACK_CHAT_RESPONSES.dead;
      }
      return FALLBACK_CHAT_RESPONSES.default;
    };

    if (!apiKey) {
      console.warn('[LegacyLens AI] No GEMINI_API_KEY; using offline forensic answer.');
      const fallbackMsg = getFallbackAnswer(question);
      return NextResponse.json({
        source: 'fallback',
        statusMessage: 'Offline grounded response (GEMINI_API_KEY not configured)',
        data: fallbackMsg,
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

    const systemInstruction = `You are the Lead Forensic Architecture Copilot for a critical enterprise legacy system.
Your mission is to provide 100% grounded, forensic answers strictly based on the provided codebase lines.

STRICT GROUNDING RULES:
1. Cite EVERY claim using the exact markdown format: [FileName.ext:LineStart-LineEnd] (e.g., [LoanInterestEngine.java:84-88] or [MonthlyBillingBatch.java:94-96]).
2. ZERO HALLUCINATIONS: If a class, table, column, function, or concept is not present in the ingested code, you MUST explicitly state that it does not exist in the indexed codebase.
3. Highlight discrepancies between architecture notes and actual running code (e.g. tax rate drift).
4. Return your output in strict JSON format containing both formatted markdown text and structured citation objects.`;

    const prompt = `Ingested Codebase Context:
${codebaseContext}

User Forensic Question:
"${question}"

Respond with strict JSON adhering to this schema:
{
  "text": string, // Formatted markdown answer with [FileName:LineStart-LineEnd] citation pills
  "citations": [
    {
      "file": string,
      "lineStart": number,
      "lineEnd": number,
      "snippet": string // short relevant code line or snippet
    }
  ],
  "confidence": "High" | "Medium" | "Low"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');

    const resultMessage: ForensicChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: parsed.text || 'No response generated.',
      timestamp: Date.now(),
      citations: parsed.citations || [],
      confidence: parsed.confidence || 'High',
    };

    return NextResponse.json({
      source: 'gemini',
      statusMessage: 'Live Gemini 2.5 Flash grounded response',
      data: resultMessage,
    });
  } catch (err: any) {
    console.error('[LegacyLens AI /api/chat error]:', err);
    const fallbackMsg = FALLBACK_CHAT_RESPONSES.default;
    return NextResponse.json({
      source: 'fallback',
      statusMessage: `Live Gemini API error: ${err.message || 'Unknown'}. Using cached grounded response.`,
      error: err.message,
      data: fallbackMsg,
    });
  }
}
