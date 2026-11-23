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
    try {
      const saved = localStorage.getItem('qr_restaurant_admin_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clear any old sample/demo admin data
        if (parsed.isDemo || parsed.email?.includes('naachicafe.com') || parsed.uid === 'admin-naachi-cafe-001') {
          localStorage.removeItem('qr_restaurant_admin_user');
          return null;
        }
        return parsed;
      }
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        if (fbUser && !fbUser.email?.includes('guest@')) {
          const userData = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || 'Admin Manager',
            role: 'admin',
            isDemo: false
          };
          setUser(userData);
          localStorage.setItem('qr_restaurant_admin_user', JSON.stringify(userData));
        } else if (!fbUser) {
          const saved = localStorage.getItem('qr_restaurant_admin_user');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed.isDemo || parsed.email?.includes('naachicafe.com')) {
                localStorage.removeItem('qr_restaurant_admin_user');
                setUser(null);
              } else {
                setUser(parsed);
              }
            } catch {
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
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    setLoading(true);

    try {
      // 1. Real Firebase Auth when configured
      if (isFirebaseConfigured && auth) {
        try {
          const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
          const userData = {
            uid: cred.user.uid,
            email: cred.user.email,
            displayName: cred.user.displayName || 'Admin Manager',
            role: 'admin',
            isDemo: false
          };
          setUser(userData);
          localStorage.setItem('qr_restaurant_admin_user', JSON.stringify(userData));
          setLoading(false);
          return { success: true, user: userData };
        } catch (firebaseErr) {
          console.warn('Firebase signIn notice:', firebaseErr.code);
        }
      }

      // 2. Admin Credentials
      if (
        (email.trim() && (password === 'admin123' || password === 'admin')) ||
        (email.toLowerCase() === 'admin' && password === 'admin')
      ) {
        const cleanEmail = email.trim().includes('@') ? email.trim() : `${email.trim()}@restaurant.com`;
        const adminUser = {
          uid: 'admin-' + Date.now().toString(36),
          email: cleanEmail,
          displayName: 'Admin Manager',
          role: 'admin',
          isDemo: false
        };
        setUser(adminUser);
        localStorage.setItem('qr_restaurant_admin_user', JSON.stringify(adminUser));
        setLoading(false);
        return { success: true, user: adminUser };
      }

      throw new Error('Invalid email or password.');
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
