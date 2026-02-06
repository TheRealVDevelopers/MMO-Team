import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, doc, setDoc, connectFirestoreEmulator } from 'firebase/firestore';

const app = initializeApp({
  apiKey: "demo-key",
  projectId: "kurchi-app",
});

const auth = getAuth(app);
const db = getFirestore(app);

connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
connectFirestoreEmulator(db, '127.0.0.1', 8080);

async function seed() {
  console.log('Creating admin user...');
  
  try {
    const userCred = await createUserWithEmailAndPassword(auth, 'admin@test.com', '123456');
    console.log('✅ Auth user created:', userCred.user.uid);
    
    await setDoc(doc(db, 'staffUsers', userCred.user.uid), {
      name: 'Admin User',
      email: 'admin@test.com',
      role: 'Super Admin',
      organizationId: 'org-test',
      isActive: true,
      createdAt: new Date(),
    });
    
    console.log('✅ Firestore document created');
    
    await setDoc(doc(db, 'organizations', 'org-test'), {
      name: 'Test Organization',
      createdAt: new Date(),
    });
    
    console.log('✅ Organization created');
    console.log('\nLogin with: admin@test.com / 123456');
    
  } catch (err: any) {
    if (err.code === 'auth/email-already-in-use') {
      console.log('⚠️  User already exists - try logging in');
    } else {
      console.error('❌ Error:', err.message);
    }
  }
  
  process.exit(0);
}

seed();
