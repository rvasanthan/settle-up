import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyANbuDjfpRpr79lSVCyXmkeRnH01NECBEk",
  authDomain: "settle-up-161e5.firebaseapp.com",
  projectId: "settle-up-161e5",
  storageBucket: "settle-up-161e5.firebasestorage.app",
  messagingSenderId: "949718995442",
  appId: "1:949718995442:web:ea0f9a465b215517f95b6b",
  measurementId: "G-J8QCN32BXK"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
