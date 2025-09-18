import * as functions from 'firebase-functions';
import admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';

// Initialize Admin SDK once
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Helpers
const requireAuth = (context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication is required.');
  }
  return context.auth.uid;
};

// Auth trigger: create a user doc on sign up
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const userDoc = db.collection('users').doc(user.uid);
  const data = {
    uid: user.uid,
    email: user.email || null,
    displayName: user.displayName || null,
    photoURL: user.photoURL || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    role: 'user',
  };
  await userDoc.set(data, { merge: true });
});

// Callable: save a tool run
export const saveToolRun = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const { tool, input, output, status = 'success', metadata = {} } = data || {};
  if (!tool) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required field: tool');
  }
  const doc = {
    userId: uid,
    tool,
    input: input ?? null,
    output: output ?? null,
    status,
    metadata,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  const ref = await db.collection('toolRuns').add(doc);
  return { id: ref.id };
});

// Callable: save a demo event
export const saveEventDemo = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const { type = 'demo', payload = {} } = data || {};
  const doc = {
    userId: uid,
    type,
    payload,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  const ref = await db.collection('events').add(doc);
  return { id: ref.id };
});

// HTTPS: OAuth callback stub (no external calls by default)
export const oauthCallback = functions.https.onRequest(async (req, res) => {
  // This is a stub. By default, external API calls are disabled for safety.
  // To enable, set functions config: app.allow_external_api=true
  const allowExternal = functions.config().app?.allow_external_api === 'true';
  if (!allowExternal) {
    return res.status(501).json({ message: 'External OAuth is disabled in this environment.' });
  }
  return res.status(200).json({ ok: true });
});

// Callable: parse an event using guarded external API, or local fallback
export const parseEventServer = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const { text } = data || {};
  if (!text || typeof text !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'text is required');
  }

  const allowExternal = functions.config().app?.allow_external_api === 'true';
  // Local deterministic parser fallback
  const fallbackParse = (t) => {
    // Very naive example: extract words in quotes as title and rest as notes
    const titleMatch = t.match(/\"([^\"]+)\"/);
    const title = titleMatch ? titleMatch[1] : t.slice(0, 40);
    return { userId: uid, title, notes: t, parsedAt: Date.now(), source: 'fallback' };
  };

  if (!allowExternal) {
    return fallbackParse(text);
  }

  // If enabled, you could call an LLM here using an API key stored in functions config
  // Example (pseudo): const key = functions.config().gemini?.key; if (!key) throw new HttpsError('failed-precondition', 'Missing gemini.key');
  // For now, return fallback to avoid networking in default setup
  return fallbackParse(text);
});

// Callable: simple agent orchestrator stub
export const agentOrchestrator = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const { eventText } = data || {};
  if (!eventText) {
    throw new functions.https.HttpsError('invalid-argument', 'eventText is required');
  }

  // Write a job record
  const job = {
    userId: uid,
    eventText,
    status: 'processing',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  const jobRef = await db.collection('agentJobs').add(job);

  // Parse event using local parser (external disabled by default)
  const titleMatch = eventText.match(/\"([^\"]+)\"/);
  const parsed = {
    userId: uid,
    title: titleMatch ? titleMatch[1] : eventText.slice(0, 40),
    notes: eventText,
    parsedAt: Date.now(),
    source: 'agent-orchestrator-inline',
  };

  // Update job with result
  await jobRef.set({ status: 'done', result: parsed, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

  return { jobId: jobRef.id, result: parsed };
});
