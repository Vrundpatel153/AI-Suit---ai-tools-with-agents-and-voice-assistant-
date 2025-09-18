# AiSuite Backend (Firebase + Firestore)

Minimal, secure Firebase backend for AiSuite. No API keys are stored in this repo. Functions default to offline-friendly mocks and only call external APIs when explicitly enabled via Functions Config and when running on a project with Blaze billing.

## 1) Firebase Console Setup (manual)

1. Create a Firebase project in the Firebase Console.
2. Add a Web App to get the Web SDK config (firebaseConfig). Paste it into a client file (do NOT commit secrets) and into `src/firebaseConfig.example.js` as guidance.
3. Enable Authentication → Sign-in method → Google provider (and add your authorized domains).
4. Enable Firestore (Native mode).
5. (Optional, required for calling external APIs from Cloud Functions) Enable Billing (Blaze plan).

## 2) Local development with Firebase Emulator

Prerequisites:
- Node.js 18+
- Firebase CLI: `npm i -g firebase-tools`

Commands:

- Install deps:
  - At backend root:
    - `npm install` (this also runs `npm install` in `functions/` via postinstall)

- Initialize Firebase (first time only):
  - `npx firebase login`
  - `npx firebase init` (choose Firestore, Functions, Emulators; use existing project or a placeholder; Node 18; JavaScript)

- Start emulators:
  - `npm run dev`
  - Open Emulator UI: http://localhost:4000

This runs Auth, Firestore, and Functions locally.

## 3) Functions config and secrets

Use Functions Config for any secrets. Do not hardcode keys.

Examples:

```
# Allow external API calls (only on Blaze!)
firebase functions:config:set app.allow_external_api="true"

# Gemini API key
firebase functions:config:set gemini.key="YOUR_GEMINI_API_KEY"

# Google OAuth (server-side exchanges)
firebase functions:config:set google.client_id="YOUR_GOOGLE_CLIENT_ID" google.client_secret="YOUR_GOOGLE_CLIENT_SECRET"
```

For local emulator, you can create `functions/.runtimeconfig.json` (not committed) or copy from `functions/.runtimeconfig.example.json` and fill values.

## 4) Firestore data model

Collections and fields:

- users/{uid}
  - uid (string)
  - email (string)
  - displayName (string)
  - photoURL (string)
  - createdAt (timestamp)
  - lastLogin (timestamp)
  - preferences (object)
  - connectedAgents (object: { calendar: bool, gmail: bool })

- toolRuns/{runId}
  - userId (string)
  - tool (string)
  - input (any)
  - result (object)
  - status (string)
  - createdAt (timestamp)

- events/{eventId}
  - userId (string)
  - title (string)
  - start (timestamp|string)
  - end (timestamp|string)
  - attendees (array)
  - meta (object)
  - createdAt (timestamp)

- history/{userId}/entries/{entryId} (optional)
  - any per-user history entries for quick lookup

See `scripts/seedData.js` for a basic seeding example for the emulator.

## 5) Firestore security rules

See `firestore.rules`. Summary:

- `/users/{uid}`: allow read/write only if `request.auth.uid == uid`.
- `/toolRuns/{runId}`: allow create if `request.auth.uid == request.resource.data.userId`; allow read if `request.auth.uid == resource.data.userId`.
- `/events/{eventId}`: same rule as toolRuns.

Test with the emulator UI or Shell. Start emulators with `npm run dev` and use the Emulator UI at http://localhost:4000.

## 6) Cloud Functions implemented

- onUserCreate (Auth trigger): Creates a `users/{uid}` doc when a user signs up.
- saveToolRun (callable): Saves a tool run; returns the new doc id.
- saveEventDemo (callable): Saves an event to `events` (no Google Calendar call).
- oauthCallback (HTTPS): Stub to receive Google OAuth callback; external token exchange is disabled unless `app.allow_external_api === true` and secrets set.
- parseEventServer (callable): If external API allowed and `gemini.key` present, would call Gemini; otherwise uses deterministic regex parser fallback.
- agentOrchestrator (callable): Writes a job in `agentJobs`, runs local mock pipeline or calls external services if allowed; writes a result.

All functions validate `request.auth` when needed, use try/catch, and log via `functions.logger`.

## 7) Example client usage

Using the Firebase Web SDK and Functions (Callable APIs):

```js
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

// Save tool run
await httpsCallable(functions, 'saveToolRun')({ userId, tool, input });

// Save event (demo only, no Google Calendar)
await httpsCallable(functions, 'saveEventDemo')({ event });

// Parse event server-side (falls back to local parser)
const parsed = await httpsCallable(functions, 'parseEventServer')({ text: "Meet Sam tomorrow 3pm" });

// Agent orchestrator (mock)
await httpsCallable(functions, 'agentOrchestrator')({ agentId: 'scheduler', input: 'Schedule...', userId });
```

If calling plain HTTPS endpoints (like `oauthCallback`), include the Firebase Auth ID token in the Authorization header if your endpoint requires it (this stub does not by default).

## 8) Security notes & best practices

- Never store refresh tokens in plaintext. Use KMS or encrypted storage. At minimum, rely on Functions Config and encrypt before persisting.
- Enable Blaze billing only after testing locally; understand cost implications.
- Consider Firestore TTL/retention to limit long-term storage costs.
- Do not commit `.runtimeconfig.json` with secrets; use the provided example file for local setup only.

## 9) Scripts

- `npm run dev`: Start emulators for auth, firestore, and functions.
- `npm run seed`: Seed emulator with a demo user and events.
- `npm run deploy:functions`: Deploy functions only.
- `npm run deploy`: Deploy rules and functions.

---

### Firebase Web Config (client)

Place your Firebase Web config in your frontend app and initialize the SDK. This repo includes `src/firebaseConfig.example.js` (in backend) as a placeholder showing where to paste your web config for local testing. Do not commit real secrets where not required.
