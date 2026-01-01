import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import '../styles/Auth.css';

function Auth({ onLogin, loading }) {
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Pass the user object to the parent component
      onLogin({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      });
    } catch (error) {
      console.error("Error signing in with Google", error);
      alert("Failed to sign in with Google: " + error.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-card">
          <div className="auth-header">
            <div className="logo-icon">💰</div>
            <h1>Settle-Up</h1>
            <p className="subtitle">Split expenses, settle debts, stress less.</p>
          </div>

          <div className="auth-content">
            <button
              className="google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <img 
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                alt="Google" 
                className="google-icon" 
              />
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="auth-features">
            <div className="feature-item">
              <div className="feature-icon">💵</div>
              <span>Track</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">👫</div>
              <span>Split</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🏡</div>
              <span>Settle</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="hero-illustration">
          <svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:'#4F46E5', stopOpacity:1}} />
                <stop offset="100%" style={{stopColor:'#7C3AED', stopOpacity:1}} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Background Circle */}
            <circle cx="400" cy="300" r="250" fill="#EEF2FF" opacity="0.5" />
            
            {/* Phone / App Interface */}
            <g className="anim-phone" transform="translate(300, 150)">
              <rect x="0" y="0" width="200" height="350" rx="20" fill="white" stroke="#E0E7FF" strokeWidth="4" />
              <rect x="20" y="40" width="160" height="100" rx="10" fill="#E0E7FF" />
              <rect x="20" y="160" width="160" height="30" rx="5" fill="#F3F4F6" />
              <rect x="20" y="200" width="120" height="30" rx="5" fill="#F3F4F6" />
              <rect x="20" y="240" width="140" height="30" rx="5" fill="#F3F4F6" />
              <circle cx="100" cy="310" r="15" fill="#4F46E5" opacity="0.2" />
            </g>

            {/* Friends / People */}
            <g className="anim-person-left" transform="translate(150, 250)">
              <circle cx="50" cy="50" r="40" fill="#FECACA" /> {/* Head */}
              <path d="M10,130 Q50,130 90,130 L90,180 L10,180 Z" fill="#F87171" /> {/* Body */}
            </g>

            <g className="anim-person-right" transform="translate(550, 280)">
              <circle cx="50" cy="50" r="40" fill="#A7F3D0" /> {/* Head */}
              <path d="M10,130 Q50,130 90,130 L90,180 L10,180 Z" fill="#34D399" /> {/* Body */}
            </g>

            {/* House / Family */}
            <g className="anim-house" transform="translate(350, 50)">
              <path d="M50,0 L100,40 L0,40 Z" fill="#60A5FA" />
              <rect x="10" y="40" width="80" height="60" fill="#93C5FD" />
              <rect x="35" y="60" width="30" height="40" fill="white" opacity="0.5" />
            </g>

            {/* Floating Coins */}
            <g className="anim-coin-1" transform="translate(250, 200)">
              <circle cx="25" cy="25" r="25" fill="#FCD34D" />
              <text x="25" y="35" textAnchor="middle" fill="#B45309" fontSize="24" fontWeight="bold">$</text>
            </g>
            <g className="anim-coin-2" transform="translate(500, 150)">
              <circle cx="20" cy="20" r="20" fill="#FCD34D" />
              <text x="20" y="28" textAnchor="middle" fill="#B45309" fontSize="20" fontWeight="bold">$</text>
            </g>

            {/* Chart */}
            <g className="anim-chart" transform="translate(500, 400)">
              <path d="M0,50 L30,20 L60,40 L90,10" fill="none" stroke="#8B5CF6" strokeWidth="4" />
              <circle cx="0" cy="50" r="4" fill="#8B5CF6" />
              <circle cx="30" cy="20" r="4" fill="#8B5CF6" />
              <circle cx="60" cy="40" r="4" fill="#8B5CF6" />
              <circle cx="90" cy="10" r="4" fill="#8B5CF6" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}

export default Auth;
