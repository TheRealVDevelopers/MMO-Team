// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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

// Configure Auth Persistence - Keep users logged in across sessions
import { setPersistence, browserLocalPersistence } from 'firebase/auth';
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error setting auth persistence:', error);
});

// Initialize Analytics only if in a browser environment
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : undefined;

export { app, analytics, db, auth, storage };

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