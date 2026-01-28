// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

<<<<<<< HEAD
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const AGENT_LOG_URL = import.meta.env.VITE_AGENT_LOG_URL;

type AgentLogPayload = Record<string, unknown>;

const logAgent = (payload: AgentLogPayload) => {
  if (!AGENT_LOG_URL) return;
  fetch(AGENT_LOG_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
};

// Production: Firebase config must come from environment variables (Vite exposes VITE_*).
logAgent({
  location: 'firebase.ts:12',
  message: 'Checking demo mode and env vars',
  data: {
    demoMode: DEMO_MODE,
    apiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: !!import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: !!import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: !!import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: !!import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  },
  timestamp: Date.now(),
  sessionId: 'debug-session',
  runId: 'run1',
  hypothesisId: 'A',
});
=======
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAJr5z0XiOL-SRHA6hgM3V2NHJbN3BolPQ",
  authDomain: "kurchi-app.firebaseapp.com",
  projectId: "kurchi-app",
  storageBucket: "kurchi-app.firebasestorage.app",
  messagingSenderId: "140677067488",
  appId: "1:140677067488:web:803d5ec5f091bdfc015685",
  measurementId: "G-1D13ZD3C2F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
>>>>>>> parent of eab59cb (Resolve merge conflict in AccountsTeamDashboard, unify handleVerifyPayment logic, and use toast notifications)

// Configure Auth Persistence - Keep users logged in across sessions
import { setPersistence, browserLocalPersistence } from 'firebase/auth';
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error setting auth persistence:', error);
});

// Initialize Analytics only if in a browser environment
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : undefined;

export { app, analytics, db, auth, storage };

<<<<<<< HEAD
  logAgent({
    location: 'firebase.ts:31',
    message: 'Before validation loop',
    data: {
      configValues: Object.fromEntries(
        requiredKeys.map((k) => [
          k,
          firebaseConfig[k] ? String(firebaseConfig[k]).substring(0, 10) + '...' : 'undefined',
        ]),
      ),
      requiredKeysCount: requiredKeys.length,
    },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'run1',
    hypothesisId: 'B',
  });
  for (const key of requiredKeys) {
    logAgent({
      location: 'firebase.ts:35',
      message: 'Validating key',
      data: {
        key,
        value: firebaseConfig[key] ? String(firebaseConfig[key]).substring(0, 10) + '...' : 'undefined',
        isEmpty: !firebaseConfig[key],
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'C',
    });
    if (!firebaseConfig[key]) {
      logAgent({
        location: 'firebase.ts:37',
        message: 'Missing key detected, throwing error',
        data: {
          missingKey: key,
          allEnvKeys: Object.keys(import.meta.env).filter((k) => k.startsWith('VITE_')),
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'D',
      });
      const envVarName = `VITE_FIREBASE_${key === 'apiKey' ? 'API_KEY' : key === 'authDomain' ? 'AUTH_DOMAIN' : key === 'projectId' ? 'PROJECT_ID' : key === 'storageBucket' ? 'STORAGE_BUCKET' : key === 'messagingSenderId' ? 'MESSAGING_SENDER_ID' : key === 'appId' ? 'APP_ID' : key.toUpperCase()}`;

      throw new Error(
        `Missing Firebase environment variable: ${envVarName}\n\n` +
        `To fix this:\n` +
        `1. Create a .env file in the project root (copy from env.example)\n` +
        `2. Add your Firebase credentials from: https://console.firebase.google.com/\n` +
        `3. Restart your development server\n\n` +
        `Or enable demo mode by setting VITE_DEMO_MODE=true in .env to use mock authentication.\n\n` +
        `Required variables:\n` +
        `- VITE_FIREBASE_API_KEY\n` +
        `- VITE_FIREBASE_AUTH_DOMAIN\n` +
        `- VITE_FIREBASE_PROJECT_ID\n` +
        `- VITE_FIREBASE_STORAGE_BUCKET\n` +
        `- VITE_FIREBASE_MESSAGING_SENDER_ID\n` +
        `- VITE_FIREBASE_APP_ID`
      );
    }
  }

  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);

  // Configure Auth Persistence - Keep users logged in across sessions
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error('Error setting auth persistence:', error);
  });

  // Initialize Analytics only if in a browser environment and measurementId is provided
  analytics =
    typeof window !== 'undefined' && firebaseConfig.measurementId ? getAnalytics(app) : undefined;
} else {
  logAgent({
    location: 'firebase.ts:80',
    message: 'Demo mode enabled, skipping Firebase initialization',
    data: { demoMode: true },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'run1',
    hypothesisId: 'E',
  });

  console.log('🔥 Demo mode enabled - Firebase initialization skipped. Using mock authentication.');
}

export { app, analytics, db, auth, storage, logAgent };
=======
/*
ACTION REQUIRED: How to fix "Missing or insufficient permissions" errors.

This demo app is getting blocked by Firestore's default security rules.
Because the app does not have user authentication, you must open your database
for public access for the demo to work.

1. Go to your Firebase Project Console.
2. Navigate to Firestore Database > Rules.
3. Replace the entire content of the rules editor with the following:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}

CRITICAL SECURITY WARNING: The rules above make your database publicly accessible.
This is ONLY for short-term demos. DO NOT use these rules in a production app.
*/
>>>>>>> parent of eab59cb (Resolve merge conflict in AccountsTeamDashboard, unify handleVerifyPayment logic, and use toast notifications)
