import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BsX, BsCalendarEvent, BsPerson } from 'react-icons/bs';
import '../styles/ExpenseDetailsModal.css';
import { formatDate } from '../utils/dateUtils';

function ExpenseDetailsModal({ isOpen, onClose, expenseId, apiBase }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && expenseId) {
      fetchDetails();
    } else {
      setDetails(null); // Reset when closed
    }
  }, [isOpen, expenseId]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiBase}/expense?expenseId=${expenseId}`);
      if (response.data.success) {
        setDetails(response.data.expense);
      }
    } catch (err) {
      console.error('Error fetching expense details:', err);
      setError('Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <BsX size={24} />
        </button>

        {loading ? (
          <div className="loading-spinner">Loading details...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : details ? (
          <>
            <div className="modal-header">
              <h2 className="modal-title">{details.description}</h2>
              <div className="modal-amount">
                {details.currency} {details.amount}
              </div>
              <div className="modal-date">
                <BsCalendarEvent /> 
                {(() => {
                  if (!details.date) return '';
                  // Handle Firestore Timestamp (both _seconds and seconds)
                  const seconds = details.date._seconds || details.date.seconds;
                  if (seconds) {
                    return formatDate(new Date(seconds * 1000));
                  }
                  // Handle standard Date string/object
                  return formatDate(new Date(details.date));
                })()}
              </div>
            </div>

            <div className="modal-section">
              <h3 className="modal-section-title">Paid By</h3>
              <div className="audit-item">
                <div className="audit-user">
                  {details.createdByPhoto ? (
                    <img src={details.createdByPhoto} alt="" className="audit-avatar" />
                  ) : (
                    <div className="audit-avatar">
                      <BsPerson />
                    </div>
                  )}
                  <div className="audit-details">
                    <span className="audit-name">{details.createdByName}</span>
                    <span className="audit-role">Payer</span>
                  </div>
                </div>
                <span className="audit-amount paid">
                  Paid {details.currency} {details.amount}
                </span>
              </div>
            </div>

            <div className="modal-section">
              <h3 className="modal-section-title">Split Details</h3>
              <div className="audit-list">
                {details.splits && details.splits.length > 0 ? (
                  details.splits.map(split => (
                    <div key={split.id} className="audit-item">
                      <div className="audit-user">
                        <div className="audit-avatar">
                          {split.payeeName ? split.payeeName.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="audit-details">
                          <span className="audit-name">{split.payeeName}</span>
                          <span className="audit-role">Owes {split.payerName}</span>
                        </div>
                      </div>
                      <span className="audit-amount owe">
                        {split.currency} {split.amount}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No split details available</div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default ExpenseDetailsModal;
