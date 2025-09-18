// Seed Firestore emulator with a demo user and some docs
const admin = require('firebase-admin');

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  // Default to local emulator host if not set
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  console.log('FIRESTORE_EMULATOR_HOST not set. Defaulting to localhost:8080');
}

if (!admin.apps.length) {
  admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'demo-project' });
}
const db = admin.firestore();

async function run() {
  const demoUid = 'demo-user-uid';
  const userRef = db.collection('users').doc(demoUid);
  await userRef.set({
    uid: demoUid,
    email: 'demo@example.com',
    displayName: 'Demo User',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  const runRef = await db.collection('toolRuns').add({
    userId: demoUid,
    tool: 'text-summarizer',
    input: { text: 'This is a long piece of text...' },
    output: { summary: 'Short summary' },
    status: 'success',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('Seeded toolRuns:', runRef.id);

  const evtRef = await db.collection('events').add({
    userId: demoUid,
    type: 'note',
    payload: { text: 'Meeting at 5pm' },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('Seeded events:', evtRef.id);

  console.log('Seeding complete.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
