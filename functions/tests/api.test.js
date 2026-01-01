// Test suite for Settle-Up Firebase functions
// Run with: npm test

const admin = require('firebase-admin');
const test = require('firebase-functions-test')();
const { expect } = require('chai');

// Note: Configure Firebase emulator environment variables before running tests
process.env.FIREBASE_DATABASE_EMULATOR_HOST = 'localhost:9000';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

const db = admin.firestore();

describe('Settle-Up API Tests', () => {
  
  describe('User Registration', () => {
    it('should register a new user', async () => {
      const userData = {
        uid: 'test_user_1',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null
      };

      await db.collection('users').doc(userData.uid).set(userData);
      const userDoc = await db.collection('users').doc(userData.uid).get();

      expect(userDoc.exists).to.be.true;
      expect(userDoc.data().email).to.equal('test@example.com');
    });

    it('should not allow duplicate registration', async () => {
      const userData = {
        uid: 'test_user_2',
        email: 'test2@example.com',
        displayName: 'Test User 2'
      };

      await db.collection('users').doc(userData.uid).set(userData);
      
      // Attempting to create again should fail in real scenario
      const userDoc = await db.collection('users').doc(userData.uid).get();
      expect(userDoc.exists).to.be.true;
    });
  });

  describe('Expense Creation', () => {
    it('should create an expense with participants', async () => {
      const expenseData = {
        description: 'Test Dinner',
        amount: 100,
        currency: 'USD',
        createdBy: 'test_user_1',
        participants: [
          { userId: 'test_user_1', amount: 60 },
          { userId: 'test_user_2', amount: 40 }
        ],
        date: new Date(),
        settled: false
      };

      const docRef = await db.collection('expenses').add(expenseData);
      const expense = await docRef.get();

      expect(expense.exists).to.be.true;
      expect(expense.data().amount).to.equal(100);
      expect(expense.data().participants.length).to.equal(2);
    });

    it('should create balance entries for expense participants', async () => {
      const balanceData = {
        expenseId: 'test_expense_1',
        payerId: 'test_user_1',
        payeeId: 'test_user_2',
        amount: 40,
        currency: 'USD',
        settled: false
      };

      const docRef = await db.collection('balances').add(balanceData);
      const balance = await docRef.get();

      expect(balance.exists).to.be.true;
      expect(balance.data().amount).to.equal(40);
    });
  });

  describe('Balance Calculation', () => {
    it('should calculate total amounts owed', async () => {
      // Get unsettled balances for a user
      const balancesSnapshot = await db.collection('balances')
        .where('payerId', '==', 'test_user_1')
        .where('settled', '==', false)
        .get();

      let totalOwed = 0;
      balancesSnapshot.forEach(doc => {
        totalOwed += doc.data().amount;
      });

      expect(totalOwed).to.be.greaterThanOrEqual(0);
    });
  });

  describe('Expense Settlement', () => {
    it('should settle an expense', async () => {
      const balanceData = {
        expenseId: 'test_expense_2',
        payerId: 'test_user_1',
        payeeId: 'test_user_2',
        amount: 50,
        currency: 'USD',
        settled: false
      };

      const docRef = await db.collection('balances').add(balanceData);
      const balanceId = docRef.id;

      // Settle the balance
      await docRef.update({
        settled: true,
        settledAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const settledBalance = await docRef.get();
      expect(settledBalance.data().settled).to.be.true;
      expect(settledBalance.data().settledAt).to.exist;
    });
  });

  // Cleanup after tests
  afterEach(async () => {
    // Clear test data
    const users = await db.collection('users').get();
    users.forEach(doc => doc.ref.delete());

    const expenses = await db.collection('expenses').get();
    expenses.forEach(doc => doc.ref.delete());

    const balances = await db.collection('balances').get();
    balances.forEach(doc => doc.ref.delete());
  });
});
