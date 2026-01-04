import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BsCheckLg, BsLightbulb } from 'react-icons/bs';
import '../styles/ExpenseForm.css';

function ExpenseForm({ userId, apiBase, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    participants: [userId],
    payer: userId,
    date: new Date().toISOString().split('T')[0]
  });
  
  // Store full user objects for display: { uid, displayName, email }
  const [participantsData, setParticipantsData] = useState([]);
  const [payerSearchText, setPayerSearchText] = useState('You');
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Participant Search State
  const [participantSearchText, setParticipantSearchText] = useState('');
  const [participantSearchResults, setParticipantSearchResults] = useState([]);
  const [showParticipantSuggestions, setShowParticipantSuggestions] = useState(false);
  const participantSearchTimeoutRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Split Logic State
  const [splitMethod, setSplitMethod] = useState('equal'); // 'equal', 'amount', 'percentage'
  const [splitValues, setSplitValues] = useState({}); // { uid: value }

  // Fetch current user details on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get(`${apiBase}/auth?uid=${userId}`);
        if (res.data.success) {
          const user = res.data.user;
          setParticipantsData([user]);
          setPayerSearchText(user.displayName || 'You');
        }
      } catch (err) {
        console.error("Failed to fetch current user", err);
        setParticipantsData([{ uid: userId, displayName: 'You', email: '' }]);
      }
    };
    fetchCurrentUser();
  }, [userId, apiBase]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Search Users Logic
  const handlePayerSearch = (e) => {
    const query = e.target.value;
    setPayerSearchText(query);
    setShowSuggestions(true);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(`${apiBase}/searchUsers?q=${query}`);
        if (res.data.success) {
          setSearchResults(res.data.users);
        }
      } catch (err) {
        console.error("Search failed", err);
      }
    }, 300);
  };

  const selectPayer = (user) => {
    setFormData(prev => ({
      ...prev,
      payer: user.uid,
      // Add to participants if not present
      participants: prev.participants.includes(user.uid) 
        ? prev.participants 
        : [...prev.participants, user.uid]
    }));
    
    // Update participants data if new
    if (!participantsData.find(p => p.uid === user.uid)) {
      setParticipantsData(prev => [...prev, user]);
    }

    setPayerSearchText(user.displayName);
    setShowSuggestions(false);
  };

  const handleParticipantSearch = (e) => {
    const query = e.target.value;
    setParticipantSearchText(query);
    setShowParticipantSuggestions(true);

    if (participantSearchTimeoutRef.current) clearTimeout(participantSearchTimeoutRef.current);

    if (query.length < 2) {
      setParticipantSearchResults([]);
      return;
    }

    participantSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(`${apiBase}/searchUsers?q=${query}`);
        if (res.data.success) {
          setParticipantSearchResults(res.data.users);
        }
      } catch (err) {
        console.error("Search failed", err);
      }
    }, 300);
  };

  const selectParticipant = (user) => {
    if (formData.participants.includes(user.uid)) {
      setParticipantSearchText('');
      setShowParticipantSuggestions(false);
      return;
    }

    setFormData(prev => ({
      ...prev,
      participants: [...prev.participants, user.uid]
    }));
    
    if (!participantsData.find(p => p.uid === user.uid)) {
      setParticipantsData(prev => [...prev, user]);
    }

    setParticipantSearchText('');
    setShowParticipantSuggestions(false);
  };

  const handleRemoveParticipant = (uid) => {
    if (uid === formData.payer) {
      alert('The payer cannot be removed. Change payer first.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p !== uid)
    }));
    // We don't necessarily need to remove from participantsData, but we can
  };

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.description || !formData.amount || formData.participants.length < 2) {
      setError('Please fill in all required fields and add at least one other participant.');
      return;
    }

    const totalAmount = parseFloat(formData.amount);
    let finalParticipants = [];

    if (splitMethod === 'equal') {
      // Equal split logic
      const splitAmount = totalAmount / formData.participants.length;
      finalParticipants = formData.participants.map(uid => ({
        userId: uid,
        amount: parseFloat(splitAmount.toFixed(2))
      }));
    } else if (splitMethod === 'amount') {
      // Exact amount logic
      let currentSum = 0;
      finalParticipants = formData.participants.map(uid => {
        const val = parseFloat(splitValues[uid] || 0);
        currentSum += val;
        return { userId: uid, amount: val };
      });

      if (Math.abs(currentSum - totalAmount) > 0.1) {
        setError(`Total split amount ($${currentSum.toFixed(2)}) does not match expense amount ($${totalAmount.toFixed(2)})`);
        return;
      }
    } else if (splitMethod === 'percentage') {
      // Percentage logic
      let currentPercent = 0;
      finalParticipants = formData.participants.map(uid => {
        const pct = parseFloat(splitValues[uid] || 0);
        currentPercent += pct;
        return { 
          userId: uid, 
          amount: parseFloat((totalAmount * (pct / 100)).toFixed(2)) 
        };
      });

      if (Math.abs(currentPercent - 100) > 0.1) {
        setError(`Total percentage (${currentPercent}%) must equal 100%`);
        return;
      }
    }

    setLoading(true);

    try {
      const response = await axios.post(`${apiBase}/expenses`, {
        ...formData,
        createdBy: formData.payer, // Map payer to createdBy for backend
        amount: totalAmount,
        currency: 'USD',
        participants: finalParticipants
      });

      if (response.data.success) {
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error('Expense creation error:', err);
      setError(err.response?.data?.error || 'Failed to create expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="expense-form-container">
      <div className="expense-form-card">
        <button className="close-modal-btn" onClick={onCancel} aria-label="Close">×</button>
        <h2>➕ Add New Expense</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <input
              type="text"
              id="description"
              name="description"
              placeholder="e.g., Dinner, Movie tickets, Gas"
              value={formData.description}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount (USD) *</label>
            <input
              type="number"
              id="amount"
              name="amount"
              placeholder="0.00"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="date">Date *</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group relative">
            <label htmlFor="payer">Paid By *</label>
            <div className="autocomplete-wrapper">
              <input
                type="text"
                value={payerSearchText}
                onChange={handlePayerSearch}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search by name or email"
                className="autocomplete-input"
              />
              {showSuggestions && (
                <ul className="suggestions-list">
                  {/* Show current participants first */}
                  {participantsData.length > 0 && (
                    <li className="suggestion-header">Participants</li>
                  )}
                  {participantsData.map(user => (
                    <li key={user.uid} onClick={() => selectPayer(user)}>
                      <strong>{user.displayName}</strong> {user.uid === userId ? '(You)' : ''}
                    </li>
                  ))}
                  
                  {/* Show search results */}
                  {searchResults.length > 0 && (
                    <li className="suggestion-header">Search Results</li>
                  )}
                  {searchResults.map(user => (
                    // Filter out if already in participants list to avoid duplicates in UI
                    !participantsData.find(p => p.uid === user.uid) && (
                      <li key={user.uid} onClick={() => selectPayer(user)}>
                        <strong>{user.displayName}</strong> <small>({user.email})</small>
                      </li>
                    )
                  ))}
                  
                  {searchResults.length === 0 && payerSearchText.length >= 2 && (
                    <li className="no-results">No users found</li>
                  )}
                </ul>
              )}
            </div>
            {/* Overlay to close suggestions when clicking outside */}
            {showSuggestions && (
              <div className="suggestion-overlay" onClick={() => setShowSuggestions(false)}></div>
            )}
          </div>

          <div className="form-group">
            <label>Split Method</label>
            <div className="split-method-selector">
              <button 
                type="button" 
                className={`split-btn ${splitMethod === 'equal' ? 'active' : ''}`}
                onClick={() => setSplitMethod('equal')}
              >
                = Equal
              </button>
              <button 
                type="button" 
                className={`split-btn ${splitMethod === 'amount' ? 'active' : ''}`}
                onClick={() => setSplitMethod('amount')}
              >
                $ Amount
              </button>
              <button 
                type="button" 
                className={`split-btn ${splitMethod === 'percentage' ? 'active' : ''}`}
                onClick={() => setSplitMethod('percentage')}
              >
                % Percent
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Participants *</label>
            <div className="participants-section">
              <div className="autocomplete-wrapper" style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  value={participantSearchText}
                  onChange={handleParticipantSearch}
                  onFocus={() => setShowParticipantSuggestions(true)}
                  placeholder="Search to add participant..."
                  className="autocomplete-input"
                />
                {showParticipantSuggestions && participantSearchText.length >= 2 && (
                  <ul className="suggestions-list">
                    {participantSearchResults.length > 0 ? (
                      participantSearchResults.map(user => (
                        !formData.participants.includes(user.uid) && (
                          <li key={user.uid} onClick={() => selectParticipant(user)}>
                            <strong>{user.displayName}</strong> <small>({user.email})</small>
                          </li>
                        )
                      ))
                    ) : (
                      <li className="no-results">No users found</li>
                    )}
                  </ul>
                )}
                {showParticipantSuggestions && (
                  <div className="suggestion-overlay" onClick={() => setShowParticipantSuggestions(false)}></div>
                )}
              </div>

              <div className="participants-list">
                {formData.participants.map((uid) => {
                  const user = participantsData.find(p => p.uid === uid);
                  const displayName = user ? user.displayName : uid;
                  return (
                    <div key={uid} className="participant-row">
                      <div className="participant-tag">
                        <span>
                          {uid === userId ? `${displayName} (You)` : displayName}
                          {uid === formData.payer ? ' (Payer)' : ''}
                        </span>
                        {uid !== formData.payer && (
                          <button
                            type="button"
                            onClick={() => handleRemoveParticipant(uid)}
                            className="remove-btn"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      
                      {splitMethod !== 'equal' && (
                        <div className="split-input-container">
                          <input
                            type="number"
                            placeholder={splitMethod === 'amount' ? '0.00' : '0'}
                            value={splitValues[uid] || ''}
                            onChange={(e) => setSplitValues(prev => ({
                              ...prev,
                              [uid]: e.target.value
                            }))}
                            className="split-input"
                          />
                          <span className="split-unit">
                            {splitMethod === 'amount' ? '$' : '%'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="helper-text">
                {splitMethod === 'equal' 
                  ? `${formData.payer === userId ? 'You' : (participantsData.find(p => p.uid === formData.payer)?.displayName || formData.payer)} paid. Amount split equally among all ${formData.participants.length} participants.`
                  : 'Enter the share for each person.'}
              </p>

              {splitMethod !== 'equal' && (() => {
                const total = Object.values(splitValues).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
                let message = null;
                let isError = false;

                if (splitMethod === 'amount') {
                  const expenseAmount = parseFloat(formData.amount) || 0;
                  const diff = expenseAmount - total;
                  if (Math.abs(diff) > 0.01) {
                    isError = true;
                    message = `Total: $${total.toFixed(2)} / $${expenseAmount.toFixed(2)} (${diff > 0 ? 'Left: $' + diff.toFixed(2) : 'Over: $' + Math.abs(diff).toFixed(2)})`;
                  }
                } else {
                  const diff = 100 - total;
                  if (Math.abs(diff) > 0.1) {
                    isError = true;
                    message = `Total: ${total.toFixed(1)}% / 100% (${diff > 0 ? 'Left: ' + diff.toFixed(1) + '%' : 'Over: ' + Math.abs(diff).toFixed(1) + '%'})`;
                  }
                }

                return message ? (
                  <div className="validation-message" style={{ color: isError ? '#ef4444' : '#10b981', marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: '500', textAlign: 'right' }}>
                    {message}
                  </div>
                ) : null;
              })()}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Creating...' : <><BsCheckLg /> Create Expense</>}
            </button>
          </div>
        </form>

        <div className="form-help">
          <h4><BsLightbulb /> How it works:</h4>
          <ul>
            <li>Select who paid the expense ("Paid By")</li>
            <li>Add all participants involved</li>
            <li>Amount is divided equally among non-payers</li>
            <li>The payer is owed their share by others</li>
            <li>Example: Alice paid $60 for lunch with Bob & Charlie → Bob & Charlie each owe Alice $30</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ExpenseForm;
