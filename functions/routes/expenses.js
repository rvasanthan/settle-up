const admin = require('firebase-admin');
const { calculateBalances } = require('../utils/balanceCalculator');
const { sendExpenseNotification } = require('./notifications');

const db = admin.firestore();

/**
 * Create a new expense and split it among users
 * POST /expenses
 * Body: {
 *   description, amount, currency, 
 *   createdBy (user ID), 
 *   participants: [{ userId, amount }],
 *   date (optional)
 * }
 */
async function createExpense(req, res) {
  try {
    const { description, amount, currency, createdBy, participants, date } = req.body;

    // Validate required fields
    if (!description || !amount || !currency || !createdBy || !participants || participants.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: description, amount, currency, createdBy, participants'
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
      });
    }

    // Normalize participants: convert string array to objects with split amounts
    // IMPORTANT: Only OTHER participants (not the payer) need to pay back their share
    let normalizedParticipants = participants;
    if (Array.isArray(participants) && participants.length > 0) {
      if (typeof participants[0] === 'string') {
        // Filter out the payer from the split calculation
        const otherParticipants = participants.filter(p => p !== createdBy);
        
        if (otherParticipants.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Expense must include at least one other person besides the payer'
          });
        }

        // Split amount equally among OTHER participants only (not the payer)
        const splitAmount = amount / otherParticipants.length;
        normalizedParticipants = otherParticipants.map(userId => ({
          userId,
          amount: parseFloat(splitAmount.toFixed(2))
        }));
      } else {
        // If objects are provided, use them as is (allows payer to be included in split)
        normalizedParticipants = participants;
        
        if (normalizedParticipants.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Expense must include at least one participant'
          });
        }
      }
    }

    // Validate participant amounts sum
    const participantSum = normalizedParticipants.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(participantSum - amount) > 0.1) { // Increased tolerance slightly
      return res.status(400).json({
        success: false,
        error: `Participant amounts (${participantSum}) must sum to total amount (${amount})`
      });
    }

    // Create expense document
    // Store all participants including payer for reference
    // If normalizedParticipants contains objects, map to IDs. 
    // If it was string array (legacy), it was handled above.
    // We need a consistent list of User IDs for the 'participants' field in Firestore.
    const participantIds = normalizedParticipants.map(p => p.userId);
    // Ensure payer is in the list (if not already)
    const allParticipants = [...new Set([createdBy, ...participantIds])];

    const expenseData = {
      description,
      amount,
      currency,
      createdBy, // The person who paid
      participants: allParticipants, 
      date: date ? new Date(date) : new Date(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      settled: false
    };

    const expenseRef = await db.collection('expenses').add(expenseData);

    // Create balance entries ONLY for other participants (they owe the payer)
    // The payer doesn't owe anything
    for (const participant of normalizedParticipants) {
      // Skip if the participant is the payer (they don't owe themselves)
      if (participant.userId === createdBy) continue;

      const balanceData = {
        expenseId: expenseRef.id,
        payerId: createdBy, // The person who paid
        payeeId: participant.userId, // The person who owes
        amount: participant.amount, // How much they owe
        currency,
        settled: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('balances').add(balanceData);
    }

    // Send notifications asynchronously (don't block response)
    // We need to fetch user details for notifications
    try {
      const userDocs = await Promise.all(allParticipants.map(uid => db.collection('users').doc(uid).get()));
      const users = userDocs.map(doc => ({ uid: doc.id, ...doc.data() }));
      const creator = users.find(u => u.uid === createdBy);
      
      if (creator) {
        sendExpenseNotification(expenseData, creator, users).catch(err => 
          console.error('Notification error:', err)
        );
      }
    } catch (notifyErr) {
      console.error('Error preparing notifications:', notifyErr);
    }

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      expenseId: expenseRef.id,
      expense: { id: expenseRef.id, ...expenseData }
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Get expenses for a user
 * GET /expenses?userId=userId&groupId=groupId(optional)
 */
async function getExpenses(req, res) {
  try {
    const { userId, groupId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Pull expenses where the user participates; optionally filter by group
    let query = db.collection('expenses').where('participants', 'array-contains', userId);
    if (groupId) {
      query = query.where('groupId', '==', groupId);
    }

    const expensesSnapshot = await query.get();

    const expenses = [];
    const userIds = new Set();

    expensesSnapshot.forEach(doc => {
      const data = doc.data();
      expenses.push({ id: doc.id, ...data });
      if (data.createdBy) {
        userIds.add(data.createdBy);
      }
    });

    // Sort by date desc in memory
    expenses.sort((a, b) => {
      const dateA = a.date && a.date.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date && b.date.toDate ? b.date.toDate() : new Date(b.date);
      return dateB - dateA;
    });

    // Fetch user details to get display names
    const userMap = {};
    if (userIds.size > 0) {
      const uniqueUserIds = Array.from(userIds);
      // Fetch users in batches or individually. For simplicity, using Promise.all
      const userDocs = await Promise.all(uniqueUserIds.map(uid => db.collection('users').doc(uid).get()));
      
      userDocs.forEach(doc => {
        if (doc.exists) {
          const userData = doc.data();
          userMap[doc.id] = {
            displayName: userData.displayName,
            photoURL: userData.photoURL
          };
        }
      });
    }

    // Attach creator names and photos
    const expensesWithNames = expenses.map(expense => ({
      ...expense,
      createdByName: userMap[expense.createdBy]?.displayName || 'Unknown User',
      createdByPhoto: userMap[expense.createdBy]?.photoURL || null
    }));

    res.status(200).json({
      success: true,
      expenses: expensesWithNames
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Delete an expense
 * DELETE /expenses?expenseId=expenseId&userId=userId
 */
async function deleteExpense(req, res) {
  try {
    const { expenseId, userId } = req.query;

    if (!expenseId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Expense ID and User ID are required'
      });
    }

    const expenseDoc = await db.collection('expenses').doc(expenseId).get();

    if (!expenseDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    // Only creator can delete
    if (expenseDoc.data().createdBy !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only expense creator can delete'
      });
    }

    // Delete associated balance entries
    const balancesSnapshot = await db.collection('balances')
      .where('expenseId', '==', expenseId)
      .get();

    const batch = db.batch();
    
    balancesSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete expense
    const expenseRef = db.collection('expenses').doc(expenseId);
    batch.delete(expenseRef);

    await batch.commit();

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Settle an expense (mark as paid)
 * POST /settleExpense
 * Body: { balanceId, userId }
 */
async function settleExpense(req, res) {
  try {
    const { balanceId, userId } = req.body;

    if (!balanceId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Balance ID and User ID are required'
      });
    }

    const balanceDoc = await db.collection('balances').doc(balanceId).get();

    if (!balanceDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Balance not found'
      });
    }

    const balance = balanceDoc.data();

    // Prevent double-settlement
    if (balance.settled) {
      return res.status(400).json({
        success: false,
        error: 'This balance is already settled'
      });
    }

    // Allow either payer (who is owed) or payee (who owes) to mark as settled
    if (balance.payerId !== userId && balance.payeeId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only participants of this expense can settle it'
      });
    }

    // Update balance
    await db.collection('balances').doc(balanceId).update({
      settled: true,
      settledAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({
      success: true,
      message: 'Expense settled successfully'
    });
  } catch (error) {
    console.error('Settle expense error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Get single expense details with audit trail
 * GET /expense?expenseId=expenseId
 */
async function getExpense(req, res) {
  try {
    const { expenseId } = req.query;

    if (!expenseId) {
      return res.status(400).json({
        success: false,
        error: 'Expense ID is required'
      });
    }

    // Get expense document
    const expenseDoc = await db.collection('expenses').doc(expenseId).get();
    if (!expenseDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    const expenseData = expenseDoc.data();
    
    // Get balances (splits) for this expense
    const balancesSnapshot = await db.collection('balances')
      .where('expenseId', '==', expenseId)
      .get();

    const splits = [];
    const userIds = new Set();
    
    // Add creator
    if (expenseData.createdBy) userIds.add(expenseData.createdBy);

    balancesSnapshot.forEach(doc => {
      const data = doc.data();
      splits.push({ id: doc.id, ...data });
      if (data.payeeId) userIds.add(data.payeeId);
      if (data.payerId) userIds.add(data.payerId);
    });

    // Fetch user details
    const userMap = {};
    if (userIds.size > 0) {
      const uniqueUserIds = Array.from(userIds);
      const userDocs = await Promise.all(uniqueUserIds.map(uid => db.collection('users').doc(uid).get()));
      
      userDocs.forEach(doc => {
        if (doc.exists) {
          const userData = doc.data();
          userMap[doc.id] = {
            displayName: userData.displayName,
            photoURL: userData.photoURL,
            email: userData.email
          };
        }
      });
    }

    // Format response
    const response = {
      id: expenseDoc.id,
      ...expenseData,
      createdByName: userMap[expenseData.createdBy]?.displayName || 'Unknown',
      createdByPhoto: userMap[expenseData.createdBy]?.photoURL || null,
      splits: splits.map(split => ({
        ...split,
        payerName: userMap[split.payerId]?.displayName || 'Unknown',
        payeeName: userMap[split.payeeId]?.displayName || 'Unknown',
      }))
    };

    res.status(200).json({
      success: true,
      expense: response
    });

  } catch (error) {
    console.error('Get expense details error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = { createExpense, getExpenses, getExpense, deleteExpense, settleExpense };
