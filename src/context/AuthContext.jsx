import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as fbSignOut, 
  sendPasswordResetEmail,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Check if demo admin was stored
    const saved = localStorage.getItem('qr_restaurant_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
          const userData = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || 'Restaurant Staff',
            restaurantId: 'naachi-cafe',
            role: 'admin',
            isDemo: false
          };
          setUser(userData);
          localStorage.setItem('qr_restaurant_admin_user', JSON.stringify(userData));
        } else {
          // If not signed in via Firebase, check if demo admin was set
          const saved = localStorage.getItem('qr_restaurant_admin_user');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.isDemo) {
              setUser(parsed);
            } else {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Demo / Local mode
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    setLoading(true);

    try {
      // 1. Try real Firebase Auth first when configured
      if (isFirebaseConfigured && auth) {
        try {
          const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
          const userData = {
            uid: cred.user.uid,
            email: cred.user.email,
            displayName: cred.user.displayName || 'Naachi Café Manager',
            restaurantId: 'naachi-cafe',
            role: 'admin',
            isDemo: false
          };
          setUser(userData);
          localStorage.setItem('qr_restaurant_admin_user', JSON.stringify(userData));
          setLoading(false);
          return { success: true, user: userData };
        } catch (firebaseErr) {
          console.warn('Firebase signIn notice:', firebaseErr.code, firebaseErr.message);
          // If password was wrong or auth error, don't fall back to demo unless it matches standard demo credentials
        }
      }

      // 2. Demo Admin Credentials fallback
      if (
        (email.toLowerCase() === 'admin@naachicafe.com' && password === 'admin123') ||
        (email.toLowerCase() === 'admin@restaurant.com' && password === 'admin123') ||
        (email.toLowerCase() === 'staff@naachicafe.com' && password === 'staff123')
      ) {
        const demoUser = {
          uid: 'admin-naachi-cafe-001',
          email: email.toLowerCase(),
          displayName: 'Naachi Café Manager',
          restaurantId: 'naachi-cafe',
          role: 'admin',
          isDemo: true
        };
        setUser(demoUser);
        localStorage.setItem('qr_restaurant_admin_user', JSON.stringify(demoUser));
        setLoading(false);
        return { success: true, user: demoUser };
      }

      // If credentials didn't match demo and Firebase is not configured
      throw new Error('Invalid email or password. Use account: admin@naachicafe.com / admin123.');
    } catch (err) {
      setLoading(false);
      const msg = err.code ? getFirebaseErrorMessage(err.code) : err.message;
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await fbSignOut(auth);
      } catch (e) {
        console.warn('Firebase signout error:', e);
      }
    }
    setUser(null);
    localStorage.removeItem('qr_restaurant_admin_user');
  };

  const resetPassword = async (email) => {
    if (!email) throw new Error('Please enter your email address');
    if (isFirebaseConfigured && auth) {
      await sendPasswordResetEmail(auth, email);
      return true;
    } else {
      // In demo mode
      return true;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      authError,
      setAuthError,
      login,
      logout,
      resetPassword,
      isAuthenticated: Boolean(user)
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

function getFirebaseErrorMessage(code) {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This staff account has been deactivated.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please try again later.';
    default:
      return 'Authentication failed. Please verify your credentials.';
  }
}
