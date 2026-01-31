/**
 * Script to update currentTask field for staff members
 * Run this script to populate project assignments for team members
 * 
 * Usage:
 * 1. Update the assignments object below with actual project info
 * 2. Run: npx ts-node scripts/updateCurrentTasks.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Firebase config - should match your firebase.ts
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Define project assignments for each staff member by name or email
// You can customize these assignments based on your actual projects
const assignments: Record<string, string> = {
  // Example assignments - update these with real project names
  'Likitha N': 'Office Renovation - Client ABC',
  'Jerome david': 'Corporate HQ Interior Design',
  'NIVETHIDHA R K': '3D Rendering - Residential Project',
  
  // Add more assignments as needed
  // 'Staff Name': 'Project Description',
};

async function updateCurrentTasks() {
  try {
    console.log('🔄 Fetching staff members from Firestore...\n');
    
    const staffSnapshot = await getDocs(collection(db, 'staffUsers'));
    let updatedCount = 0;
    let skippedCount = 0;

    for (const docSnap of staffSnapshot.docs) {
      const data = docSnap.data();
      const staffName = data.name;
      
      // Check if this staff member has an assignment
      if (assignments[staffName]) {
        await updateDoc(doc(db, 'staffUsers', docSnap.id), {
          currentTask: assignments[staffName]
        });
        console.log(`✅ Updated: ${staffName} → "${assignments[staffName]}"`);
        updatedCount++;
      } else {
        console.log(`⏭️  Skipped: ${staffName} (no assignment defined)`);
        skippedCount++;
      }
    }

    console.log(`\n✨ Update complete!`);
    console.log(`   Updated: ${updatedCount} staff members`);
    console.log(`   Skipped: ${skippedCount} staff members`);
    console.log(`\n💡 Tip: Edit the 'assignments' object in this script to add more project assignments.`);
    
  } catch (error) {
    console.error('❌ Error updating current tasks:', error);
  }
}

// Run the update
updateCurrentTasks()
  .then(() => {
    console.log('\n🎉 Script finished successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
