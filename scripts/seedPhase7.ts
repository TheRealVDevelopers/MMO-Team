/**
 * Phase 7 Seed Script - MINIMUM DATA ONLY
 * Creates bare essentials for flow testing
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp, connectFirestoreEmulator } from 'firebase/firestore';
import { connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAJr5z0XiOL-SRHA6hgM3V2NHJbN3BolPQ",
  authDomain: "kurchi-app.firebaseapp.com",
  projectId: "kurchi-app",
  storageBucket: "kurchi-app.firebasestorage.app",
  messagingSenderId: "140677067488",
  appId: "1:140677067488:web:803d5ec5f091bdfc015685"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
connectFirestoreEmulator(db, '127.0.0.1', 8080);

const ORG_ID = 'org-test';
const PASSWORD = '123456';

const users = [
  { id: 'user-admin', name: 'Admin User', email: 'admin@test.com', role: 'Super Admin' },
  { id: 'user-sales', name: 'Sales User', email: 'sales@test.com', role: 'Sales Team Member' },
  { id: 'user-engineer', name: 'Site Engineer', email: 'engineer@test.com', role: 'Site Engineer' },
  { id: 'user-drawing', name: 'Drawing User', email: 'drawing@test.com', role: 'Drawing Team' },
  { id: 'user-quotation', name: 'Quotation User', email: 'quotation@test.com', role: 'Quotation Team' },
];

async function seed() {
  console.log('🌱 Starting Phase 7 seed...');

  // 1. Create Organization
  console.log('Creating organization...');
  await setDoc(doc(db, 'organizations', ORG_ID), {
    name: 'Test Organization',
    createdAt: serverTimestamp(),
  });
  console.log('✅ Organization created');

  // 2. Create Staff Users
  for (const user of users) {
    try {
      console.log(`Creating user: ${user.name}...`);
      
      // Create auth account
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, PASSWORD);
      const uid = userCredential.user.uid;
      
      // Create staffUser document with matching ID
      await setDoc(doc(db, 'staffUsers', uid), {
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: ORG_ID,
        isActive: true,
        createdAt: serverTimestamp(),
      });
      
      console.log(`✅ ${user.name} created (${uid})`);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️  ${user.name} already exists`);
      } else {
        console.error(`❌ Error creating ${user.name}:`, error.message);
      }
    }
  }

  console.log('\n✅ Phase 7 seed complete!');
  console.log('\n📋 Login Credentials:');
  users.forEach(u => console.log(`  ${u.role}: ${u.email} / ${PASSWORD}`));
  
  process.exit(0);
}

seed().catch(error => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
