import { Router } from 'express';
import { callGemini, extractJsonBlock } from '../lib/geminiClient';
import { taskExtractorPrompt } from '../lib/prompts';

const router = Router();

router.post('/parseEvent', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text) return res.status(400).json({ ok: false, error: 'missing_text' });

    const raw = await callGemini(`${taskExtractorPrompt}\nUSER_INPUT:\n${text}`, { json: true });
    let parsed = extractJsonBlock(raw) || {};

    if (parsed.clarify) {
      return res.json({ ok: true, type: 'clarify', question: parsed.question || 'Need more details.' });
    }

    // Validate minimal structure
    const event = {
      title: parsed.title || null,
      date: parsed.date || null,
      time: parsed.time || null,
      durationMinutes: parsed.durationMinutes || null,
      attendees: Array.isArray(parsed.attendees) ? parsed.attendees : [],
      notes: parsed.notes || null
    };

    if (!event.title || !event.date) {
      return res.json({ ok: true, type: 'clarify', question: 'Please provide a title and date.' });
    }

    res.json({ ok: true, type: 'action', action: 'create_event', event });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;