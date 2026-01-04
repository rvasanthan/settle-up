import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BsPlusLg, BsBoxArrowRight, BsPersonCircle } from 'react-icons/bs';
import './App.css';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ExpenseForm from './components/ExpenseForm';
import PhoneNumberModal from './components/PhoneNumberModal';
import ProfileModal from './components/ProfileModal';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const API_BASE = 'https://us-central1-settle-up-161e5.cloudfunctions.net';

  // Initialize user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('settleUpUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        // Fetch latest profile to check for phone number
        fetchUserProfile(user.uid);
      } catch (e) {
        localStorage.removeItem('settleUpUser');
      }
    }
  }, []);

  const fetchUserProfile = async (uid) => {
    try {
      const res = await axios.get(`${API_BASE}/auth?uid=${uid}`);
      if (res.data.success) {
        const userData = res.data.user;
        setCurrentUser(userData);
        localStorage.setItem('settleUpUser', JSON.stringify(userData));
        
        if (!userData.phoneNumber) {
          setShowPhoneModal(true);
        }
      }
    } catch (err) {
      console.error("Failed to fetch user profile", err);
    }
  };

  const handleLogin = async (user) => {
    try {
      setLoading(true);
      // Register user with backend
      const response = await axios.post(`${API_BASE}/auth`, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      });

      if (response.data.success) {
        const userData = response.data.user;
        setCurrentUser(userData);
        localStorage.setItem('settleUpUser', JSON.stringify(userData));
        
        if (!userData.phoneNumber) {
          setShowPhoneModal(true);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || error.message;
      alert(errorMessage);
      
      // If access denied, sign out from Firebase immediately
      if (error.response?.status === 403) {
        import('./firebase').then(({ auth }) => {
          auth.signOut();
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (phoneNumber) => {
    try {
      const res = await axios.put(`${API_BASE}/auth`, {
        uid: currentUser.uid,
        phoneNumber
      });
      
      if (res.data.success) {
        const updatedUser = res.data.user;
        setCurrentUser(updatedUser);
        localStorage.setItem('settleUpUser', JSON.stringify(updatedUser));
        return updatedUser;
      }
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to update profile');
    }
  };

  const handlePhoneSubmit = async (phoneNumber) => {
    await updateUserProfile(phoneNumber);
    setShowPhoneModal(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('settleUpUser');
  };

  const handleExpenseCreated = () => {
    setShowAddExpense(false);
    setRefreshTrigger(prev => prev + 1);
  };

  if (!currentUser) {
    return <Auth onLogin={handleLogin} loading={loading} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo-container">
          <img src="/logo.svg" alt="Settle Up Logo" className="app-logo" />
          <h1>Settle-Up</h1>
        </div>
        <div 
          className="user-info" 
          onClick={() => setShowProfileModal(true)} 
          style={{ cursor: 'pointer' }}
          title="Click to edit profile"
        >
          {currentUser.photoURL ? (
            <img src={currentUser.photoURL} alt={currentUser.displayName} className="user-avatar" />
          ) : (
            <BsPersonCircle className="user-avatar-icon" />
          )}
          <div>
            <p className="user-name">{currentUser.displayName}</p>
            <p className="user-email">{currentUser.email}</p>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); handleLogout(); }} 
            className="logout-btn"
            title="Logout"
          >
            <BsBoxArrowRight />
          </button>
        </div>
      </header>

      <main className="app-content">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Dashboard</h2>
            <button 
              className="add-expense-fab" 
              onClick={() => setShowAddExpense(true)}
            >
              <BsPlusLg /> Add Expense
            </button>
          </div>
          <Dashboard 
            userId={currentUser.uid} 
            apiBase={API_BASE} 
            refreshTrigger={refreshTrigger} 
          />
        </div>
      </main>

      {showAddExpense && (
        <div className="modal-overlay">
          <div className="modal-content">
            <ExpenseForm 
              userId={currentUser.uid} 
              apiBase={API_BASE} 
              onSuccess={handleExpenseCreated}
              onCancel={() => setShowAddExpense(false)}
            />
          </div>
        </div>
      )}

      {showPhoneModal && (
        <PhoneNumberModal 
          onSubmit={handlePhoneSubmit}
          onCancel={() => setShowPhoneModal(false)}
        />
      )}

      {showProfileModal && (
        <ProfileModal 
          user={currentUser}
          onUpdate={updateUserProfile}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
}

export default App;
