const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors');

admin.initializeApp();

// Import route handlers
const userRoutes = require('./routes/users');
const expenseRoutes = require('./routes/expenses');
const dashboardRoutes = require('./routes/dashboard');
const resetRoutes = require('./routes/reset');
const notificationRoutes = require('./routes/notifications');

// CORS middleware
const corsHandler = cors({ origin: true });

// Test Helper: Reset Database
exports.reset = functions.https.onRequest((req, res) => {
  corsHandler(req, res, () => {
    if (req.method === 'POST') {
      resetRoutes.resetDatabase(req, res);
    } else {
      res.status(405).send('Method Not Allowed');
    }
  });
});

// User Registration & Profile Endpoints
exports.auth = functions.https.onRequest((req, res) => {
  corsHandler(req, res, () => {
    if (req.method === 'POST') {
      userRoutes.registerUser(req, res);
    } else if (req.method === 'GET') {
      userRoutes.getUser(req, res);
    } else if (req.method === 'PUT') {
      userRoutes.updateUser(req, res);
    } else {
      res.status(405).send('Method Not Allowed');
    }
  });
});

// User Search Endpoint
exports.searchUsers = functions.https.onRequest((req, res) => {
  corsHandler(req, res, () => {
    if (req.method === 'GET') {
      userRoutes.searchUsers(req, res);
    } else {
      res.status(405).send('Method Not Allowed');
    }
  });
});

// Expense Management Endpoints
exports.expenses = functions.https.onRequest((req, res) => {
  corsHandler(req, res, () => {
    if (req.method === 'POST') {
      expenseRoutes.createExpense(req, res);
    } else if (req.method === 'GET') {
      expenseRoutes.getExpenses(req, res);
    } else if (req.method === 'DELETE') {
      expenseRoutes.deleteExpense(req, res);
    } else {
      res.status(405).send('Method Not Allowed');
    }
  });
});

exports.expense = functions.https.onRequest((req, res) => {
  corsHandler(req, res, () => {
    if (req.method === 'GET') {
      expenseRoutes.getExpense(req, res);
    } else {
      res.status(405).send('Method Not Allowed');
    }
  });
});

// Dashboard Endpoints
exports.dashboard = functions.https.onRequest((req, res) => {
  corsHandler(req, res, () => {
    if (req.method === 'GET') {
      dashboardRoutes.getDashboard(req, res);
    } else {
      res.status(405).send('Method Not Allowed');
    }
  });
});

// Settle Expense Endpoint
exports.settleExpense = functions.https.onRequest((req, res) => {
  corsHandler(req, res, () => {
    if (req.method === 'POST') {
      expenseRoutes.settleExpense(req, res);
    } else {
      res.status(405).send('Method Not Allowed');
    }
  });
});

// Scheduled Weekly Reminder (Every Friday at 9:00 AM)
exports.weeklyExpenseReminder = functions.pubsub.schedule('every friday 09:00')
  .timeZone('America/New_York')
  .onRun((context) => {
    return notificationRoutes.sendWeeklyExpenseSummary();
  });

// Manual Trigger for Weekly Reminder (For Testing)
exports.triggerWeeklyReminder = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const result = await notificationRoutes.sendWeeklyExpenseSummary();
      res.status(200).json({ success: true, result });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
});
