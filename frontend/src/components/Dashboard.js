import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Dashboard.css';

function Dashboard({ userId, apiBase, refreshTrigger }) {
  const [dashboard, setDashboard] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, apiBase, refreshTrigger]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${apiBase}/dashboard?userId=${userId}`
      );
      if (response.data.success) {
        setDashboard(response.data.dashboard);
        setError(null);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const response = await axios.get(`${apiBase}/expenses?userId=${userId}`);
      if (response.data.success) {
        setExpenses(response.data.expenses);
      }
    } catch (err) {
      console.error('Expenses fetch error:', err);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await axios.delete(`${apiBase}/expenses?expenseId=${expenseId}&userId=${userId}`);
      if (response.data.success) {
        // Refresh data
        await Promise.all([fetchDashboard(), fetchExpenses()]);
      }
    } catch (err) {
      console.error('Delete expense error:', err);
      alert('Failed to delete expense: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading && !dashboard) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error && !dashboard) {
    return <div className="error">{error}</div>;
  }

  const data = dashboard || {};
  const summary = data.summary || {};

  return (
        <div className="dashboard">
      <div className="dashboard-header">
        <h2>Your Expenses</h2>
      </div>

      <div className="summary-cards">
        <div className="summary-card you-owe">
          <h3>You Owe</h3>
          <p className="amount">
            ${summary.totalYouOwe?.toFixed(2) || '0.00'}
          </p>
          <p className="label">{summary.currency || 'USD'}</p>
        </div>

        <div className="summary-card you-are-owed">
          <h3>You Are Owed</h3>
          <p className="amount">
            ${summary.totalYouAreOwed?.toFixed(2) || '0.00'}
          </p>
          <p className="label">{summary.currency || 'USD'}</p>
        </div>

        <div className={`summary-card net-balance ${summary.netBalance > 0 ? 'positive' : summary.netBalance < 0 ? 'negative' : 'neutral'}`}>
          <h3>Net Balance</h3>
          <p className="amount">
            ${Math.abs(summary.netBalance || 0).toFixed(2)}
          </p>
          <p className="label">
            {summary.netBalance > 0 ? 'You are owed' : summary.netBalance < 0 ? 'You owe' : 'All settled'}
          </p>
        </div>
      </div>

      <div className="transactions">
        {data.youOwe && data.youOwe.length > 0 && (
          <div className="transaction-group">
            <h3>💸 You Owe</h3>
            {data.youOwe.map((transaction, idx) => (
              <div key={idx} className="transaction-item owe">
                <div className="transaction-info">
                  <p className="transaction-name">{transaction.personName}</p>
                  <p className="transaction-description">{transaction.description}</p>
                </div>
                <div className="transaction-amount">
                  <p className="amount">${transaction.amount.toFixed(2)}</p>
                  <button className="settle-btn" onClick={() => settleTransaction(transaction)}>
                    Settle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {data.youAreOwed && data.youAreOwed.length > 0 && (
          <div className="transaction-group">
            <h3>💰 You Are Owed</h3>
            {data.youAreOwed.map((transaction, idx) => (
              <div key={idx} className="transaction-item owed">
                <div className="transaction-info">
                  <p className="transaction-name">{transaction.personName}</p>
                  <p className="transaction-description">{transaction.description}</p>
                </div>
                <div className="transaction-amount">
                  <p className="amount">${transaction.amount.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {(!data.youOwe || data.youOwe.length === 0) &&
          (!data.youAreOwed || data.youAreOwed.length === 0) && (
            <div className="empty-state">
              <p>🎉 All settled up!</p>
              <p>No pending balances</p>
            </div>
          )}
      </div>

      {expenses.length > 0 && (
        <div className="recent-expenses-section">
          <h3>Recent Expenses</h3>
          <div className="expenses-horizontal-scroll">
            {expenses.map((expense) => (
              <div key={expense.id} className="expense-thumbnail-card">
                {expense.createdBy === userId && !expense.settled && (
                  <button 
                    className="card-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteExpense(expense.id);
                    }}
                    title="Delete Expense"
                  >
                    🗑
                  </button>
                )}
                
                <div className="card-avatar">
                  {expense.createdByPhoto ? (
                    <img src={expense.createdByPhoto} alt="User" className="user-avatar-medium" />
                  ) : (
                    <div className="user-avatar-placeholder-medium">
                      {(expense.createdByName || 'U').charAt(0)}
                    </div>
                  )}
                </div>
                
                <div className="card-content">
                  <div className="card-amount">${expense.amount.toFixed(2)}</div>
                  <div className="card-desc" title={expense.description}>{expense.description}</div>
                  <div className="card-meta">
                    {expense.createdBy === userId ? 'Paid by You' : `Paid by ${(expense.createdByName || expense.createdBy).split(' ')[0]}`}
                  </div>
                  <div className="card-split">
                    For {expense.participants?.length || 0} people
                  </div>
                  <div className="card-date">
                    {(() => {
                      try {
                        const dateVal = expense.date;
                        if (dateVal && typeof dateVal === 'object' && dateVal._seconds) {
                          return new Date(dateVal._seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                        }
                        return new Date(dateVal).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                      } catch (e) {
                        return '';
                      }
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  function settleTransaction(transaction) {
    console.log('Settling transaction:', transaction);
    // This would call the settle endpoint
  }
}

export default Dashboard;
