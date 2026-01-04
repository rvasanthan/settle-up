import React, { useState } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { BsPhone } from 'react-icons/bs';
import '../styles/PhoneNumberModal.css';

function PhoneNumberModal({ onSubmit, onCancel }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!phoneNumber || phoneNumber.length < 5) {
      setError('Phone number is required');
      return;
    }

    setLoading(true);
    try {
      // Ensure phone number has + prefix if not present
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : '+' + phoneNumber;
      await onSubmit(formattedPhone);
    } catch (err) {
      setError(err.message || 'Failed to update phone number');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content phone-modal">
        <h2><BsPhone /> Add Phone Number</h2>
        <p className="modal-desc">
          Please add your phone number to help friends find you easily.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Phone Number</label>
            <PhoneInput
              country={'us'}
              value={phoneNumber}
              onChange={(phone) => {
                setPhoneNumber(phone);
                setError('');
              }}
              inputStyle={{ 
                width: '100%', 
                height: '42px',
                fontSize: '1.1rem',
                paddingLeft: '48px',
                borderRadius: '6px',
                borderColor: '#ddd'
              }}
              buttonStyle={{
                borderRadius: '6px 0 0 6px',
                borderColor: '#ddd',
                backgroundColor: '#f8f9fa'
              }}
              dropdownStyle={{
                width: '300px'
              }}
            />
            {error && <span className="error-text">{error}</span>}
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={onCancel}
              disabled={loading}
            >
              Skip for now
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Number'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PhoneNumberModal;
