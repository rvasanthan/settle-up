const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Calculate balances between users
 * Consolidates multiple payments to optimize settlement
 */
async function calculateUserBalances(userId) {
  try {
    const balances = {};

    // Get all unsettled balances involving this user
    const owesSnapshot = await db.collection('balances')
      .where('payerId', '==', userId)
      .where('settled', '==', false)
      .get();

    const owed_snapshot = await db.collection('balances')
      .where('payeeId', '==', userId)
      .where('settled', '==', false)
      .get();

    // Calculate amounts owed to each person
    owesSnapshot.forEach(doc => {
      const data = doc.data();
      const otherUser = data.payeeId;
      if (!balances[otherUser]) {
        balances[otherUser] = 0;
      }
      balances[otherUser] -= data.amount; // negative = owes
    });

    // Calculate amounts owed from each person
    owed_snapshot.forEach(doc => {
      const data = doc.data();
      const otherUser = data.payerId;
      if (!balances[otherUser]) {
        balances[otherUser] = 0;
      }
      balances[otherUser] += data.amount; // positive = owed
    });

    return balances;
  } catch (error) {
    console.error('Error calculating balances:', error);
    throw error;
  }
}

/**
 * Calculate balanced transactions using graph algorithm
 * Minimizes the number of transactions needed to settle all debts
 */
function simplifyTransactions(balances) {
  const transactions = [];

  // Convert balances object to array for processing
  const users = Object.keys(balances);
  const amounts = users.map(user => balances[user]);

  while (amounts.some(amount => Math.abs(amount) > 0.01)) {
    // Find user who owes the most and who is owed the most
    let maxDebtorIndex = 0;
    let maxCreditorIndex = 0;

    for (let i = 0; i < amounts.length; i++) {
      if (amounts[i] < amounts[maxDebtorIndex]) {
        maxDebtorIndex = i;
      }
      if (amounts[i] > amounts[maxCreditorIndex]) {
        maxCreditorIndex = i;
      }
    }

    // Calculate transaction amount
    const transactionAmount = Math.min(
      Math.abs(amounts[maxDebtorIndex]),
      amounts[maxCreditorIndex]
    );

    // Record transaction
    transactions.push({
      from: users[maxDebtorIndex],
      to: users[maxCreditorIndex],
      amount: transactionAmount
    });

    // Update amounts
    amounts[maxDebtorIndex] += transactionAmount;
    amounts[maxCreditorIndex] -= transactionAmount;
  }

  return transactions;
}

module.exports = { calculateUserBalances, simplifyTransactions };
