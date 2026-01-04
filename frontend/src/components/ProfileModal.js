import React, { useState } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { BsPersonCircle } from 'react-icons/bs';
import '../styles/ProfileModal.css';

function ProfileModal({ user, onClose, onUpdate }) {
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Basic validation
      if (phoneNumber && phoneNumber.length < 8) {
        throw new Error('Please enter a valid phone number');
      }
      
      // Ensure phone number has + prefix if not present
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : '+' + phoneNumber;

      await onUpdate(formattedPhone);
      setSuccess('Profile updated successfully');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content profile-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2><BsPersonCircle /> Profile Settings</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="profile-header">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName} className="profile-avatar" />
          ) : (
            <div className="profile-avatar-placeholder">
              {user.displayName.charAt(0)}
            </div>
          )}
          <div className="profile-info">
            <h3>{user.displayName}</h3>
            <p>{user.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>Phone Number</label>
            <PhoneInput
              country={'us'}
              value={phoneNumber}
              onChange={phone => setPhoneNumber(phone)}
              inputStyle={{ 
                width: '100%', 
                height: '42px',
                fontSize: '1rem',
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
            <small className="helper-text">Add your phone number so friends can find you easily.</small>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfileModal;
