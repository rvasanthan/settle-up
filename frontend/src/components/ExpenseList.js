import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/ExpenseList.css';
import { formatDate } from '../utils/dateUtils';

function ExpenseList({ userId, apiBase, refreshTrigger }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, apiBase, refreshTrigger]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${apiBase}/expenses?userId=${userId}`
      );
      if (response.data.success) {
        setExpenses(response.data.expenses || []);
        setError(null);
      }
    } catch (err) {
      console.error('Expense fetch error:', err);
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      const response = await axios.delete(
        `${apiBase}/expenses?expenseId=${expenseId}&userId=${userId}`
      );
      if (response.data.success) {
        setExpenses(prev => prev.filter(e => e.id !== expenseId));
        alert('Expense deleted');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete expense');
    }
  };

  if (loading) {
    return <div className="loading">Loading expenses...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="activity-section" style={{ marginTop: '2rem' }}>
      {expenses.length > 0 ? (
        <div className="activity-list">
          {expenses.map((expense) => (
            <div key={expense.id} className="activity-item">
              <div className="activity-info">
                <div className="activity-main">
                  <span className="activity-desc">{expense.description}</span>
                  <span className="activity-amount">${expense.amount.toFixed(2)}</span>
                </div>
                <div className="activity-meta">
                  <span>
                    {expense.createdBy === userId ? 'You' : (expense.createdByName || expense.createdBy)} paid on {formatDate(expense.date)}
                  </span>
                </div>
              </div>
              {expense.createdBy === userId && !expense.settled && (
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteExpense(expense.id)}
                  title="Delete Expense"
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="no-activity">No recent activity</p>
      )}
    </div>
  );
}

export default ExpenseList;
