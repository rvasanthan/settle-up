const admin = require('firebase-admin');
const serviceAccount = require('../functions/serviceAccountKey.json'); // Key is in functions folder

// Initialize Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function allowUser(email) {
  if (!email) {
    console.error('Please provide an email address.');
    process.exit(1);
  }

  try {
    await db.collection('allowed_users').doc(email).set({
      email: email,
      addedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✅ Successfully added ${email} to the allowlist.`);
  } catch (error) {
    console.error('Error adding user:', error);
  }
}

const email = process.argv[2];
allowUser(email);
