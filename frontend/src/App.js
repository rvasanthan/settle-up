import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const API_BASE = 'https://us-central1-settle-up-161e5.cloudfunctions.net';

  // Initialize user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('settleUpUser');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('settleUpUser');
      }
    }
  }, []);

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
        setCurrentUser(user);
        localStorage.setItem('settleUpUser', JSON.stringify(user));
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
        <h1>💰 Settle-Up</h1>
        <div className="user-info">
          {currentUser.photoURL && (
            <img src={currentUser.photoURL} alt={currentUser.displayName} className="user-avatar" />
          )}
          <div>
            <p className="user-name">{currentUser.displayName}</p>
            <p className="user-email">{currentUser.email}</p>
          </div>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
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
              ➕ Add Expense
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
    </div>
  );
}

export default App;
