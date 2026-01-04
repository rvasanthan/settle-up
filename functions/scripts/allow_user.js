const admin = require('firebase-admin');
const path = require('path');

// Try to load service account key
let serviceAccount;
try {
  serviceAccount = require('../serviceAccountKey.json');
} catch (e) {
  console.error('Error: serviceAccountKey.json not found in functions directory.');
  console.error('Please ensure serviceAccountKey.json is present in the functions folder.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/allow_user.js <email>');
  process.exit(1);
}

async function allowUser(email) {
  try {
    console.log(`Adding ${email} to allowed_users...`);
    await db.collection('allowed_users').doc(email).set({
      email: email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      addedBy: 'admin-script'
    });
    console.log(`✅ Successfully added ${email} to allowed_users.`);
  } catch (error) {
    console.error('Error adding user:', error);
    process.exit(1);
  }
}

allowUser(email);
