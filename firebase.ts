// Import the functions you need from the SDKs you need
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { setPersistence, browserLocalPersistence } from 'firebase/auth';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const AGENT_LOG_URL = import.meta.env.VITE_AGENT_LOG_URL;

type AgentLogPayload = Record<string, unknown>;

const logAgent = (payload: AgentLogPayload) => {
  if (!AGENT_LOG_URL) return;
  fetch(AGENT_LOG_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => { });
};

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAJr5z0XiOL-SRHA6hgM3V2NHJbN3BolPQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "kurchi-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "kurchi-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "kurchi-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "140677067488",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:140677067488:web:803d5ec5f091bdfc015685",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-1D13ZD3C2F"
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | undefined = undefined;

if (!DEMO_MODE) {
  // Only initialize Firebase if NOT in demo mode
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);

    // Configure Auth Persistence
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error('Error setting auth persistence:', error);
    });

    // Initialize Analytics only if in a browser environment
    if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
      analytics = getAnalytics(app);
    }
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.log('🔥 Demo mode enabled - Firebase initialization skipped. Using mock authentication.');
}

export { app, analytics, db, auth, storage, logAgent };
