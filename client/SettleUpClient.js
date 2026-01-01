// Example client-side integration for Settle-Up API
// This demonstrates how to use the Firebase backend from a frontend application

const BASE_URL = 'https://your-region-your-project.cloudfunctions.net';

class SettleUpClient {
  constructor(firebaseConfig, googleAuth) {
    this.firebaseConfig = firebaseConfig;
    this.googleAuth = googleAuth;
    this.currentUser = null;
  }

  // ========== Authentication ==========

  /**
   * Sign in with Google and register/get user
   */
  async signInWithGoogle() {
    try {
      const result = await this.googleAuth.signIn();
      const profile = result.getBasicProfile();

      // Register or get user
      const response = await fetch(`${BASE_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: profile.getId(),
          email: profile.getEmail(),
          displayName: profile.getName(),
          photoURL: profile.getImageUrl()
        })
      });

      const data = await response.json();
      if (data.success) {
        this.currentUser = data.user;
        return this.currentUser;
      } else {
        console.error('Registration failed:', data.error);
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  async getUserProfile(userId) {
    const response = await fetch(`${BASE_URL}/auth?uid=${userId}`);
    const data = await response.json();
    return data.success ? data.user : null;
  }

  // ========== Expense Management ==========

  /**
   * Create a new expense
   */
  async createExpense(expense) {
    const response = await fetch(`${BASE_URL}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense)
    });

    const data = await response.json();
    return data.success ? data.expenseId : null;
  }

  /**
   * Get user's expenses
   */
  async getExpenses(userId, groupId = null) {
    let url = `${BASE_URL}/expenses?userId=${userId}`;
    if (groupId) url += `&groupId=${groupId}`;

    const response = await fetch(url);
    const data = await response.json();
    return data.success ? data.expenses : [];
  }

  /**
   * Delete an expense
   */
  async deleteExpense(expenseId, userId) {
    const response = await fetch(
      `${BASE_URL}/expenses?expenseId=${expenseId}&userId=${userId}`,
      { method: 'DELETE' }
    );

    const data = await response.json();
    return data.success;
  }

  /**
   * Settle an expense (mark as paid)
   */
  async settleExpense(balanceId, userId) {
    const response = await fetch(`${BASE_URL}/settleExpense`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ balanceId, userId })
    });

    const data = await response.json();
    return data.success;
  }

  // ========== Dashboard ==========

  /**
   * Get user dashboard with balances
   */
  async getDashboard(userId) {
    const response = await fetch(`${BASE_URL}/dashboard?userId=${userId}`);
    const data = await response.json();
    return data.success ? data.dashboard : null;
  }
}

// ========== Usage Example ==========

// Initialize client (in your app's init function)
// const client = new SettleUpClient(firebaseConfig, gapi.auth2);

// Sign in
// const user = await client.signInWithGoogle();

// Create expense
// const expenseId = await client.createExpense({
//   description: "Dinner at restaurant",
//   amount: 100,
//   currency: "USD",
//   createdBy: user.uid,
//   date: new Date().toISOString(),
//   participants: [
//     { userId: user.uid, amount: 60 },
//     { userId: "friend_uid", amount: 40 }
//   ]
// });

// Get dashboard
// const dashboard = await client.getDashboard(user.uid);
// console.log("You owe:", dashboard.summary.totalYouOwe);
// console.log("You are owed:", dashboard.summary.totalYouAreOwed);

export default SettleUpClient;
