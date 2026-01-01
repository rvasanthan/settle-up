const admin = require('firebase-admin');
const { calculateUserBalances } = require('../utils/balanceCalculator');

const db = admin.firestore();

/**
 * Get user dashboard with balance information
 * GET /dashboard?userId=userId
 */
async function getDashboard(req, res) {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get user info
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get all balances for this user
    // balancesSnapshot: User is the payerId (person who paid) - they are OWED this amount
    const balancesSnapshot = await db.collection('balances')
      .where('payerId', '==', userId)
      .where('settled', '==', false)
      .get();

    // owesSnapshot: User is the payeeId (person who owes) - they OWE this amount
    const owesSnapshot = await db.collection('balances')
      .where('payeeId', '==', userId)
      .where('settled', '==', false)
      .get();

    // Process balances
    const youOwe = [];
    const youAreOwed = [];
    let totalYouOwe = 0;
    let totalYouAreOwed = 0;

    // User OWES (they are the payeeId)
    for (const doc of owesSnapshot.docs) {
      const balance = doc.data();
      const payerDoc = await db.collection('users').doc(balance.payerId).get();
      const payerData = payerDoc.data();

      youOwe.push({
        id: doc.id,
        amount: balance.amount,
        currency: balance.currency,
        to: {
          uid: balance.payerId,
          name: payerData ? payerData.displayName : 'Unknown User',
          email: payerData ? payerData.email : 'unknown'
        },
        description: balance.description || 'Expense share',
        createdAt: balance.createdAt
      });
      totalYouOwe += balance.amount;
    }

    // User IS OWED (they are the payerId - the payer)
    for (const doc of balancesSnapshot.docs) {
      const balance = doc.data();
      const payeeDoc = await db.collection('users').doc(balance.payeeId).get();
      const payeeData = payeeDoc.data();

      youAreOwed.push({
        id: doc.id,
        amount: balance.amount,
        currency: balance.currency,
        from: {
          uid: balance.payeeId,
          name: payeeData ? payeeData.displayName : 'Unknown User',
          email: payeeData ? payeeData.email : 'unknown'
        },
        description: balance.description || 'Expense share',
        createdAt: balance.createdAt
      });
      totalYouAreOwed += balance.amount;
    }

    // Calculate net balance
    const netBalance = totalYouAreOwed - totalYouOwe;

    res.status(200).json({
      success: true,
      dashboard: {
        user: {
          uid: userDoc.id,
          displayName: userDoc.data().displayName,
          email: userDoc.data().email,
          photoURL: userDoc.data().photoURL
        },
        summary: {
          totalYouOwe,
          totalYouAreOwed,
          netBalance, // positive = you are owed, negative = you owe
          currency: 'USD' // default, should be configurable
        },
        youOwe,
        youAreOwed
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = { getDashboard };
