const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors');

admin.initializeApp();

// Import route handlers
const userRoutes = require('./routes/users');
const expenseRoutes = require('./routes/expenses');
const dashboardRoutes = require('./routes/dashboard');
const resetRoutes = require('./routes/reset');

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
