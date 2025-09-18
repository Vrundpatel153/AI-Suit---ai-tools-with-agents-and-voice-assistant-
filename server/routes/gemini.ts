import { Router } from 'express';
import { callGemini } from '../lib/geminiClient';

const router = Router();

router.post('/generate', async (req, res) => {
  try {
    const { prompt, messages, model } = req.body || {};
    const mergedPrompt = messages ? messages.map((m: any) => m.content).join('\n') + '\n' + (prompt||'') : (prompt || '');
    const text = await callGemini(mergedPrompt, { model });
    res.json({ ok: true, text });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;