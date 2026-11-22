import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyATHr_CwS86BZs6RQEc5tj1yExycTuHXrA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "restaurant-d12fc.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "restaurant-d12fc",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "restaurant-d12fc.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "407489906970",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:407489906970:web:b0bdc8a2bfdf9c0547c4a3",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-27EWC16EBK"
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "your_api_key_here" &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== "your_project_id"
);

let app = null;
let auth = null;
let db = null;
let storage = null;

if (isFirebaseConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log("Firebase initialized successfully with project:", firebaseConfig.projectId);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.info("Firebase environment variables not detected or incomplete. Running in Local/Demo Hybrid mode with full client capabilities.");
}

export { app, auth, db, storage };
