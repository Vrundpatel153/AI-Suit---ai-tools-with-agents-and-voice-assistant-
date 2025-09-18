import fetch from 'node-fetch';

export interface GeminiCallOptions {
  model?: string;
  systemPrompt?: string;
  json?: boolean;
  temperature?: number;
  maxOutputTokens?: number;
}

export async function callGemini(prompt: string, opts: GeminiCallOptions = {}) {
  return safeGeminiCall(prompt, opts);
}

// --- Quota Handling, Caching, and Backoff Layer ---
const knowledgeCache = new Map<string, string>();
let blockedUntil = 0; // timestamp ms until which we should not call API due to 429

export function getGeminiStatus() {
  return {
    geminiKeyPresent: Boolean(process.env.GEMINI_API_KEY),
    blockedUntil,
    now: Date.now()
  };
}

interface SafeResult { text: string; cached?: boolean; quota?: boolean }

function normalizeKnowledgeKey(p: string) {
  return p.toLowerCase().trim().replace(/\s+/g,' ');
}

async function safeGeminiCall(prompt: string, opts: GeminiCallOptions): Promise<string> {
  const now = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Offline fallback: return synthetic lightweight response so upstream logic can proceed.
    const offlineNote = '(offline model)';
    if (opts.json) {
      // Provide minimal intent router style JSON reply.
      const safeSnippet = prompt.slice(0,80).replace(/"/g,'').replace(/\n/g,' ');
      return `{"type":"reply","text":"${offlineNote} ${safeSnippet}..."}`;
    }
    return `${offlineNote} I cannot reach the model right now, but you can retry after configuring GEMINI_API_KEY.`;
  }
  const model = opts.model || 'gemini-1.5-flash';

  // Detect simple knowledge definition prompts to apply cache
  const knowledgeLike = /\b(what is|what are|define|explain|overview of)\b/i.test(prompt.split('\n')[0] || '') || /Definition\*\*/i.test(prompt);
  if (knowledgeLike) {
    const key = normalizeKnowledgeKey(prompt.slice(0,200));
    if (knowledgeCache.has(key)) {
      return knowledgeCache.get(key)! + ' \n\n_(cached)_';
    }
  }

  if (now < blockedUntil) {
    // Return a synthetic response indicating quota exhausted; caller can decide UX
    throw new Error(`quota_exhausted_retry_after:${blockedUntil - now}`);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const contents: any[] = [];
  if (opts.systemPrompt) {
    contents.push({ role: 'user', parts: [{ text: opts.systemPrompt + '\n---' }] });
  }
  contents.push({ role: 'user', parts: [{ text: prompt }] });

  const body = {
    contents,
    generationConfig: {
      temperature: opts.temperature ?? 0.4,
      maxOutputTokens: opts.maxOutputTokens ?? 512,
      responseMimeType: opts.json ? 'application/json' : 'text/plain'
    }
  };

  let resp: any;
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (networkErr: any) {
    throw new Error('Gemini network error: ' + networkErr.message);
  }

  if (!resp.ok) {
    const text = await resp.text();
    if (resp.status === 429) {
      // Attempt to parse retry delay seconds
      const retryMatch = text.match(/retry.*?(\d+(?:\.\d+)?)s/i);
      const retrySeconds = retryMatch ? parseFloat(retryMatch[1]) : 20;
      blockedUntil = Date.now() + retrySeconds * 1000;
      throw new Error(`quota_exhausted_retry_after:${retrySeconds * 1000}`);
    }
    if (resp.status === 503) {
      // Service UNAVAILABLE / model overloaded. Apply a shorter backoff with jitter.
      let retryMs = 8000; // base 8s
      try {
        const maybeJson = JSON.parse(text);
        // If the API returns a suggested backoff we can honor it (not standard, but future-proof)
        const msg: string | undefined = maybeJson?.error?.message || maybeJson?.message;
        const secMatch = msg?.match(/(\d+(?:\.\d+)?)s/);
        if (secMatch) retryMs = Math.max(3000, Math.min(15000, parseFloat(secMatch[1]) * 1000));
      } catch { /* non-json body ignored */ }
      // Add jitter +/- 25%
      const jitter = retryMs * (Math.random() * 0.5 - 0.25);
      retryMs = Math.round(retryMs + jitter);
      blockedUntil = Date.now() + retryMs;

      // Optional fallback model attempt if configured and different
      const fallbackModel = process.env.GEMINI_FALLBACK_MODEL;
      if (fallbackModel && fallbackModel !== model) {
        try {
          const alt = await safeGeminiCall(prompt, { ...opts, model: fallbackModel });
          return alt + '\n\n_(fallback model)_';
        } catch (fallbackErr) {
          // Swallow and proceed to throw structured error
          console.warn('[geminiClient] fallback model failed after 503 primary', (fallbackErr as any)?.message);
        }
      }
      throw new Error(`model_unavailable_retry_after:${retryMs}`);
    }
    throw new Error(`Gemini API error ${resp.status}: ${text}`);
  }
  const data: any = await resp.json();
  const out = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
  if (knowledgeLike) {
    const key = normalizeKnowledgeKey(prompt.slice(0,200));
    // Basic size cap to prevent memory growth
    if (knowledgeCache.size > 200) {
      const firstIter = knowledgeCache.keys().next();
      if (!firstIter.done && firstIter.value) {
        knowledgeCache.delete(firstIter.value as string);
      }
    }
    knowledgeCache.set(key, out);
  }
  return out;
}

export function extractJsonBlock(raw: string): any | null {
  // Try code fence first
  const fenceMatch = raw.match(/```(?:json)?\n([\s\S]*?)```/i);
  let jsonText = fenceMatch ? fenceMatch[1] : raw;
  // Fallback: first { ... } block
  const braceMatch = jsonText.match(/\{[\s\S]*\}/);
  if (braceMatch) jsonText = braceMatch[0];
  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}
