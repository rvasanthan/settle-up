const admin = require('firebase-admin');
const serviceAccountKey = require('/Users/vasanth/data/settle-up/settle-up-161e5-firebase-adminsdk-q19n3-e3c99db67f.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
  projectId: 'settle-up-161e5'
});

const db = admin.firestore();

async function verifyUsers() {
  const userIds = ['user-alice-001', 'user-bob-001', 'user-charlie-001'];
  for (const uid of userIds) {
    const doc = await db.collection('users').doc(uid).get();
    if (doc.exists) {
      console.log(`✅ Found user: ${uid}, data:`, doc.data());
    } else {
      console.log(`❌ User not found: ${uid}`);
    }
  }
}

verifyUsers();
