/**
 * Simple script to initialize staff users in Firebase Auth and Firestore
 * This script creates all staff members with default password "123456"
 */

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signOut } = require('firebase/auth');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration
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

// Default password for all new staff accounts
const DEFAULT_STAFF_PASSWORD = '123456';

// Staff members data
const STAFF_MEMBERS = [
    {
        email: 'admin@makemyoffice.com',
        name: 'Admin',
        role: 'Super Admin',
        avatar: 'https://i.pravatar.cc/150?u=user-1',
        phone: '+91 98765 43210',
    },
    {
        email: 'sarah.m@makemyoffice.com',
        name: 'Sarah Manager',
        role: 'Sales General Manager',
        avatar: 'https://i.pravatar.cc/150?u=user-2',
        phone: '+91 98765 43211',
    },
    {
        email: 'john.s@makemyoffice.com',
        name: 'John Sales',
        role: 'Sales Team Member',
        avatar: 'https://i.pravatar.cc/150?u=user-3',
        phone: '+91 98765 43212',
        region: 'North',
    },
    {
        email: 'emily.d@makemyoffice.com',
        name: 'Emily Designer',
        role: 'Drawing Team',
        avatar: 'https://i.pravatar.cc/150?u=user-4',
        phone: '+91 98765 43213',
    },
    {
        email: 'mike.q@makemyoffice.com',
        name: 'Mike Quote',
        role: 'Quotation Team',
        avatar: 'https://i.pravatar.cc/150?u=user-5',
        phone: '+91 98765 43214',
    },
    {
        email: 'david.e@makemyoffice.com',
        name: 'David Engineer',
        role: 'Site Engineer',
        avatar: 'https://i.pravatar.cc/150?u=user-6',
        phone: '+91 98765 43215',
    },
    {
        email: 'anna.p@makemyoffice.com',
        name: 'Anna Procurement',
        role: 'Procurement Team',
        avatar: 'https://i.pravatar.cc/150?u=user-7',
        phone: '+91 98765 43216',
    },
    {
        email: 'chris.e@makemyoffice.com',
        name: 'Chris Executor',
        role: 'Execution Team',
        avatar: 'https://i.pravatar.cc/150?u=user-8',
        phone: '+91 98765 43217',
    },
    {
        email: 'olivia.a@makemyoffice.com',
        name: 'Olivia Accounts',
        role: 'Accounts Team',
        avatar: 'https://i.pravatar.cc/150?u=user-9',
        phone: '+91 98765 43218',
    },
    {
        email: 'jane.d@makemyoffice.com',
        name: 'Jane Doe',
        role: 'Sales Team Member',
        avatar: 'https://i.pravatar.cc/150?u=user-10',
        phone: '+91 98765 43219',
        region: 'South',
    },
];

async function createStaffAccount(email, name, role, avatar, phone, region) {
    try {
        // Create Firebase Auth account
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            DEFAULT_STAFF_PASSWORD
        );

        // Create Firestore document
        await setDoc(doc(db, 'staffUsers', userCredential.user.uid), {
            email,
            name,
            role,
            avatar,
            phone,
            region: region || null,
            currentTask: '',
            lastUpdateTimestamp: serverTimestamp(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return userCredential.user.uid;
    } catch (error) {
        console.error('Error creating staff account:', error);
        throw error;
    }
}

async function initializeAllStaffUsers() {
    console.log('🔄 Starting staff user initialization...');
    console.log(`📝 Creating ${STAFF_MEMBERS.length} staff accounts with password: ${DEFAULT_STAFF_PASSWORD}\n`);

    const results = {
        success: [],
        failed: [],
    };

    for (const member of STAFF_MEMBERS) {
        try {
            console.log(`Creating account for: ${member.name} (${member.email})...`);
            
            const userId = await createStaffAccount(
                member.email,
                member.name,
                member.role,
                member.avatar,
                member.phone,
                member.region
            );

            // Sign out after each creation to allow creating the next user
            await signOut(auth);

            results.success.push(member.email);
            console.log(`✅ Successfully created: ${member.name}\n`);
        } catch (error) {
            const errorMessage = error.message || 'Unknown error';
            results.failed.push({ email: member.email, error: errorMessage });
            console.error(`❌ Failed to create ${member.email}: ${errorMessage}\n`);
            
            // Sign out even on failure to reset state
            try {
                await signOut(auth);
            } catch (e) {
                // Ignore sign out errors
            }
        }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 INITIALIZATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully created: ${results.success.length} accounts`);
    console.log(`❌ Failed: ${results.failed.length} accounts`);

    if (results.success.length > 0) {
        console.log('\n✅ Successful accounts:');
        results.success.forEach(email => console.log(`   - ${email}`));
    }

    if (results.failed.length > 0) {
        console.log('\n❌ Failed accounts:');
        results.failed.forEach(({ email, error }) => {
            console.log(`   - ${email}: ${error}`);
        });
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🔑 Default password for all accounts: ${DEFAULT_STAFF_PASSWORD}`);
    console.log('💡 Users should change their password after first login');
    console.log('='.repeat(60));

    return results;
}

// Run the initialization
initializeAllStaffUsers()
    .then(() => {
        console.log('\n✅ Initialization complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Initialization failed:', error);
        process.exit(1);
    });