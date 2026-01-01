const admin = require('firebase-admin');
const db = admin.firestore();

async function resetDatabase(req, res) {
  try {
    // 1. Delete all expenses
    const expensesSnapshot = await db.collection('expenses').get();
    const expenseBatch = db.batch();
    expensesSnapshot.docs.forEach(doc => {
      expenseBatch.delete(doc.ref);
    });
    await expenseBatch.commit();
    console.log(`Deleted ${expensesSnapshot.size} expenses`);

    // 2. Delete all balances
    const balancesSnapshot = await db.collection('balances').get();
    // Batches can only handle 500 ops. If more, we need chunks. 
    // For now assuming < 500 for testing.
    const balanceBatch = db.batch();
    balancesSnapshot.docs.forEach(doc => {
      balanceBatch.delete(doc.ref);
    });
    await balanceBatch.commit();
    console.log(`Deleted ${balancesSnapshot.size} balances`);

    // 3. Create/Update Users
    const users = [
      {
        uid: 'user-alice-001',
        email: 'alice@example.com',
        displayName: 'Alice',
        photoURL: 'https://via.placeholder.com/150?text=Alice'
      },
      {
        uid: 'user-bob-001',
        email: 'bob@example.com',
        displayName: 'Bob',
        photoURL: 'https://via.placeholder.com/150?text=Bob'
      },
      {
        uid: 'user-charlie-001',
        email: 'charlie@example.com',
        displayName: 'Charlie',
        photoURL: 'https://via.placeholder.com/150?text=Charlie'
      }
    ];

    const userBatch = db.batch();
    for (const user of users) {
      const userRef = db.collection('users').doc(user.uid);
      userBatch.set(userRef, user, { merge: true });
    }
    await userBatch.commit();
    console.log('Users created/updated');

    res.status(200).json({
      success: true,
      message: 'Database reset successfully',
      stats: {
        expensesDeleted: expensesSnapshot.size,
        balancesDeleted: balancesSnapshot.size,
        usersCreated: users.length
      }
    });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = { resetDatabase };
