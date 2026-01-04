import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BsClockHistory, BsCurrencyDollar, BsCalendarEvent, BsPerson, BsPeople, BsTrash, BsReceipt } from 'react-icons/bs';
import '../styles/ExpenseList.css';
import { formatDate } from '../utils/dateUtils';
import ExpenseDetailsModal from './ExpenseDetailsModal';

function ExpenseList({ userId, apiBase, refreshTrigger }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleCardClick = (expenseId) => {
    setSelectedExpenseId(expenseId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedExpenseId(null);
  };

  if (loading) {
    return <div className="loading">Loading expenses...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="expense-list-container" style={{ marginTop: '2rem' }}>
      <div className="expense-list-header">
        <h2><BsClockHistory className="header-icon" /> Recent Activity</h2>
        <span className="total-count">{expenses.length} transaction{expenses.length !== 1 ? 's' : ''}</span>
      </div>

      {expenses.length > 0 ? (
        <div className="expenses-grid">
          {expenses.map((expense) => (
            <div 
              key={expense.id} 
              className="expense-card" 
              onClick={() => handleCardClick(expense.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="expense-header">
                <h3>{expense.description}</h3>
                <span className={`expense-status ${expense.settled ? 'settled' : 'pending'}`}>
                  {expense.settled ? 'Settled' : 'Pending'}
                </span>
              </div>
              
              <div className="expense-details">
                <div className="detail-row">
                  <span className="label"><BsCurrencyDollar /> Amount</span>
                  <span className="value">${expense.amount.toFixed(2)}</span>
                </div>
                <div className="detail-row">
                  <span className="label"><BsCalendarEvent /> Date</span>
                  <span className="value">{formatDate(expense.date)}</span>
                </div>
                <div className="detail-row">
                  <span className="label"><BsPerson /> Paid By</span>
                  <span className="value">
                    {expense.createdBy === userId ? 'You' : (expense.createdByName || 'Someone')}
                  </span>
                </div>
              </div>

              <div className="participants-info">
                <div className="participants-title"><BsPeople /> Split with</div>
                <div className="participants-mini">
                  {/* We might not have full participant details here, but we can show count or generic badges */}
                  <span className="participant-badge">
                    {expense.participants?.length || 0} people
                  </span>
                </div>
              </div>

              {expense.createdBy === userId && !expense.settled && (
                <button 
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteExpense(expense.id);
                  }}
                >
                  <BsTrash /> Delete
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon"><BsReceipt /></div>
          <p>No expenses yet. Add one to get started!</p>
        </div>
      )}

      <ExpenseDetailsModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        expenseId={selectedExpenseId}
        apiBase={apiBase}
      />
    </div>
  );
}

export default ExpenseList;
