import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import geminiRouter from './routes/gemini';
import agentRouter from './routes/agent';
import eventRouter from './routes/event';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();
app.use(cors({ origin: '*'}));
app.use(express.json({ limit: '1mb' }));

// Health
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'assistant-backend', ts: Date.now() });
});

app.use('/api/gemini', geminiRouter);
app.use('/api/agent', agentRouter);
app.use('/api/agent', eventRouter); // parseEvent shares /api/agent namespace

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ ok: false, error: 'internal_error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[assistant-backend] listening on port ${PORT}`);
});
