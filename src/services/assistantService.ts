interface RouteIntentResponse {
  ok: boolean;
  type?: string;
  text?: string;
  toolId?: string;
  url?: string;
  question?: string;
  action?: string;
  payload?: any;
  event?: any;
  error?: string;
}

const API_BASE = '';// same origin proxy; adjust if backend on different host

export async function sendToAssistant(text: string, context?: any): Promise<RouteIntentResponse> {
  try {
    const resp = await fetch('/api/agent/routeIntent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, context })
    });
    let data: any;
    try {
      data = await resp.json();
    } catch (parseErr: any) {
      return { ok: false, error: 'invalid_json_response' } as any;
    }
    if (!resp.ok && resp.status === 429 && data?.error === 'quota_exhausted') {
      return { ok: false, error: 'quota_exhausted', ...(data.retryAfterMs ? { retryAfterMs: data.retryAfterMs } : {}) } as any;
    }
    if (!resp.ok && resp.status === 503 && data?.error === 'model_unavailable') {
      return { ok: false, error: 'model_unavailable', ...(data.retryAfterMs ? { retryAfterMs: data.retryAfterMs } : {}) } as any;
    }
    return data;
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function parseEvent(text: string): Promise<RouteIntentResponse> {
  try {
    const resp = await fetch('/api/agent/parseEvent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    return await resp.json();
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}
