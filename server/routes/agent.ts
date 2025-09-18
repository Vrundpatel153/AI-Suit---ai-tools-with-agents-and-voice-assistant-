import { Router } from 'express';
import { callGemini, extractJsonBlock, getGeminiStatus } from '../lib/geminiClient';
import { intentRouterPrompt, codeExplainPrompt, summarizerPrompt, codeGeneratePrompt } from '../lib/prompts';

const router = Router();

// In-memory lightweight recent action log (non-persistent) to prevent rapid duplicate actions
const recentActions: { key: string; ts: number }[] = [];
function isDuplicateAction(key: string, windowMs = 15000) {
  const now = Date.now();
  // Purge old
  for (let i = recentActions.length - 1; i >= 0; i--) {
    if (now - recentActions[i].ts > windowMs) recentActions.splice(i,1);
  }
  const existing = recentActions.find(r => r.key === key);
  if (existing) return true;
  recentActions.push({ key, ts: now });
  return false;
}

interface RouteIntentResult {
  type: 'reply' | 'open_tool' | 'open_url' | 'action' | 'clarify';
  text?: string;
  toolId?: string;
  url?: string;
  payload?: any;
  question?: string;
  action?: string;
}

function sanitizeUrl(url: string | undefined) {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString();
  } catch {}
  return undefined;
}

router.post('/routeIntent', async (req, res) => {
  try {
    const { text, context } = req.body || {};
    if (!text) return res.status(400).json({ ok: false, error: 'missing_text' });

    // Build short conversation context string (last few messages)
    let contextSnippet = '';
    if (Array.isArray(context?.recent)) {
      const recent = context.recent.slice(-6)
        .map((m: any) => `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.text}`)
        .join('\n');
      contextSnippet = `Recent Conversation (for reference, do not echo verbatim):\n${recent}\n---`;    
    }

    // Attempt follow-up expansion: if current message is very short (<=3 words) and previous user message looked like a knowledge query, build an expanded synthetic query
    let expandedText = text;
    if (Array.isArray(context?.recent)) {
      const recentUserMessages = [...context.recent].filter((m: any) => m.role === 'user');
      const lastUser = recentUserMessages[recentUserMessages.length - 2]; // previous user message
      const currentLower = text.trim().toLowerCase();
      const wordCount = currentLower.split(/\s+/).filter(Boolean).length;
      const knowledgePattern = /(what|who|why|how|when|where|explain|define|difference|overview|tell me about|generation|microprocessors?)/i;
      if (lastUser && wordCount > 0 && wordCount <= 3 && knowledgePattern.test(lastUser.text || '')) {
        expandedText = `In the context of: ${lastUser.text} -> Please elaborate specifically on: ${text}`;
      }
    }

    const prompt = `${intentRouterPrompt}\n${contextSnippet}\nUser: ${expandedText}`;
    let raw: string = '';
    try {
      raw = await callGemini(prompt, { json: true, temperature: 0.55 });
    } catch (modelErr: any) {
      // If quota error bubble up (handled below); otherwise degrade to simple reply without crashing
      if (typeof modelErr?.message === 'string' && modelErr.message.startsWith('quota_exhausted_retry_after:')) throw modelErr;
      if (typeof modelErr?.message === 'string' && modelErr.message.startsWith('model_unavailable_retry_after:')) {
        const ms = parseInt(modelErr.message.split(':')[1] || '0', 10) || 0;
        return res.status(503).json({ ok: false, error: 'model_unavailable', retryAfterMs: ms });
      }
      console.error('[routeIntent] primary model error', modelErr?.message);
      return res.json({ ok: true, type: 'reply', text: 'I had a temporary issue reaching the model. Please rephrase or try again in a moment.' });
    }
    let parsed = extractJsonBlock(raw) || {};

    // Heuristic fallback if model responded with plain suggestion
    if (!parsed.type) {
      if (/http(s)?:\/\//i.test(raw)) {
        parsed = { type: 'open_url', url: sanitizeUrl(raw.match(/https?:\/\/\S+/)?.[0]) };
      } else {
        parsed = { type: 'reply', text: raw.trim() };
      }
    }

    // Validate types
    const out: RouteIntentResult = {
      type: parsed.type || 'reply',
      text: parsed.text,
      toolId: parsed.toolId,
      payload: parsed.payload,
      url: sanitizeUrl(parsed.url),
      question: parsed.question,
      action: parsed.action
    };

      // Guard: only allow open_tool if user explicitly asked to open/launch/use that tool by name
      if (out.type === 'open_tool') {
        const toolId = out.toolId || '';
        const lowerMsg = text.toLowerCase();
        const explicit = new RegExp(`(open|launch|use|start|activate) (the )?${toolId.replace(/-/g,'[ -]')}`).test(lowerMsg) || lowerMsg.includes(toolId);
        const knowledgeTool = toolId === 'knowledge-agent';
        // If it's the knowledge agent but the pattern is a pure definition query, downgrade to reply
        const pureDefinitionQuery = /^(what\s+is|what\s+are|define|explain)\b/.test(lowerMsg) && lowerMsg.split(/\s+/).length <= 6;
        if (!explicit || (knowledgeTool && pureDefinitionQuery)) {
          out.type = 'reply';
          // keep any text provided; if absent, will be enriched below
        }
      }

    if (out.type === 'open_url' && !out.url) {
      out.type = 'clarify';
      out.question = 'Which URL should I open?';
    }

    // Duplicate suppression for open_url / open_tool
    if (out.type === 'open_url' && out.url) {
      if (isDuplicateAction(`url:${out.url}`)) {
        out.type = 'reply';
        out.text = `Already opened recently. Let me know if you need something else about ${out.url}.`;
      }
    }
    if (out.type === 'open_tool' && out.toolId) {
      if (isDuplicateAction(`tool:${out.toolId}`)) {
        out.type = 'reply';
        out.text = `The ${out.toolId} is already active recently. Ask your question directly or specify another tool.`;
      }
    }

    // Additional simple intent shortcuts with guard to not override pure knowledge queries like "what is kubernetes"
    const lower = text.toLowerCase();
    const pureDefinitionQuery = /^(what\s+is|what\s+are|define|explain)\b/.test(lower) && lower.split(/\s+/).length <= 6;
    const explicitOpenYoutube = /(open|launch|go to) (youtube|yt)\b/.test(lower) && !pureDefinitionQuery;
    if (explicitOpenYoutube) {
      out.type = 'open_url';
      out.url = 'https://www.youtube.com';
    } else if (/^(search|find) (.+) on youtube/.test(lower)) {
      const q = lower.replace(/^(search|find) /,'').replace(/ on youtube.*/,'').trim();
      const encoded = encodeURIComponent(q);
      out.type = 'open_url';
      out.url = `https://www.youtube.com/results?search_query=${encoded}`;
    } else if (/youtube/.test(lower) && /\b(for|about|regarding)\b/.test(lower) && !pureDefinitionQuery) {
      if (out.type === 'reply') {
        out.type = 'clarify';
        out.question = 'Do you want me to search that on YouTube?';
      }
    }

    if (/explain code/i.test(text)) {
      const code = text.replace(/.*explain code/i, '').trim();
      try {
        const explainRaw = await callGemini(`${codeExplainPrompt}\n\nCODE:\n${code}`);
        out.type = 'reply';
        out.text = explainRaw || 'Here is an explanation.';
      } catch (err: any) {
        console.error('[routeIntent] code explain error', err?.message);
        out.type = 'reply';
        out.text = 'I could not explain that code right now.';
      }
    }

    if (/summari(s|z)e/i.test(text)) {
      try {
        const summaryRaw = await callGemini(`${summarizerPrompt}\n\nTEXT:\n${text}`);
        out.type = 'reply';
        out.text = summaryRaw || 'Summary unavailable.';
      } catch (err: any) {
        console.error('[routeIntent] summarizer error', err?.message);
        out.type = 'reply';
        out.text = 'I could not summarize that right now.';
      }
    }

    // Simple code generation heuristic
    if (/\b(code|program|script)\b/i.test(text) && /(give|show|write|example)/i.test(text) && /( in [a-zA-Z+#]+|javascript|python|c\b|c\+\+|java|rust|go)/i.test(text)) {
      try {
        const genRaw = await callGemini(`${codeGeneratePrompt}\n\nREQUEST: ${text}`, { temperature: 0.7 });
        out.type = 'reply';
        out.text = genRaw || 'Here is a minimal example.';
      } catch (err: any) {
        console.error('[routeIntent] code generate error', err?.message);
        out.type = 'reply';
        out.text = 'I was unable to generate code just now.';
      }
    }

    // Detect knowledge-style question (informational) early to shape enrichment
    const knowledgeLike = /(what|who|why|how|when|where|explain|define|difference|overview|tell me about)\b/i.test(text) || /\?$/.test(text.trim());
    if (knowledgeLike && out.type === 'open_url' && /^(https?:\/\/)?(www\.)?(kubernetes\.io|django(project)?\.com)/i.test(out.url || '')) {
      // Reclassify to reply; user wants explanation, not site open
      out.type = 'reply';
      out.text = undefined; // force enrichment below
    }

    // If it's a plain conversational question and reply text is short or low-info, enrich it
    if (out.type === 'reply') {
      const rawText = out.text?.trim() || '';
      const lowInfo = !rawText || /^\.*$/.test(rawText) || rawText.length < 8;
      if (lowInfo) {
        try {
          const enriched = await callGemini(
            `You are a helpful, concise assistant. Provide a clear, friendly answer (max 140 words) and avoid repeating earlier phrasing.${knowledgeLike ? ' Use this structure: **Definition** (1 line)\n**Key Points:** bullet list of 3-5 terse bullets\n**Common Use Cases:** 2-3 short bullets\n**Why it matters:** 1 sentence. If very broad, emphasize scope.' : ''} Question: ${text}`,
            { temperature: 0.65 }
          );
          out.text = enriched || 'I am here to help.';
        } catch (err: any) {
          console.error('[routeIntent] enrichment error', err?.message);
          out.text = out.text || 'I am here to help.';
        }
      }
      else if (knowledgeLike && rawText.length < 400 && !/\bKey Points:/i.test(rawText)) {
        // Light post-processing hint instead of site opening
        out.text = rawText + '\n\nFollow-up suggestions: ask for examples, architecture, or comparisons.';
      }
    }

    // Convert clarify to reply for broad definition queries to reduce friction
    if (out.type === 'clarify') {
      const trimmed = text.trim();
      const simpleDef = /^(what\s+is|what\s+are|define|explain)\b/i.test(trimmed);
      const tokens = trimmed.split(/\s+/);
      const looksBroad = simpleDef && tokens.length >= 3; // e.g. what are microprocessors
      if (simpleDef || looksBroad) {
        try {
          const directAnswer = await callGemini(
            'Provide a direct, concise explanation (max 140 words). If plural, include a short classification. Question: ' + text,
            { temperature: 0.55 }
          );
          out.type = 'reply';
          out.text = directAnswer || 'Here is a concise explanation.';
        } catch (err: any) {
          console.error('[routeIntent] clarify->reply enrichment error', err?.message);
          out.type = 'reply';
          out.text = out.text || 'Here is a concise explanation.';
        }
        out.question = undefined;
      }
    }

    res.json({ ok: true, ...out });
  } catch (error: any) {
    // Quota exhaustion special handling
    if (typeof error.message === 'string' && error.message.startsWith('quota_exhausted_retry_after:')) {
      const ms = parseInt(error.message.split(':')[1] || '0', 10) || 0;
      return res.status(429).json({ ok: false, error: 'quota_exhausted', retryAfterMs: ms });
    }
    console.error('[routeIntent] fatal error', error?.message);
    // Always respond JSON to avoid client json() crash
    try {
      return res.status(500).json({ ok: false, error: error.message || 'internal_error' });
    } catch {
      return res.status(500).send('{"ok":false,"error":"internal_error"}');
    }
  }
});

// Diagnostics: returns whether API key present and current rate-limit block
router.get('/diagnostics', (_req, res) => {
  try {
    const status = getGeminiStatus();
    res.json({ ok: true, ...status });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'diagnostics_error' });
  }
});

export default router;