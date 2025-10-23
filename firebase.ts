// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
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
// Initialize Analytics only if in a browser environment
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : undefined;

export { app, analytics };
