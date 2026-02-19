const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getStorage, ref, uploadBytes, getDownloadURL, listAll, uploadString } = require('firebase/storage');

// Firebase configuration (from initStaff.cjs)
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
const auth = getAuth(app);
const storage = getStorage(app);

console.log('Using Storage Bucket:', storage.app.options.storageBucket);

// Use a known case ID from the logs: pYH3ycrFlM4L2uV14O2y
// Or a test one. Let's use the one from logs to be closer to repro.
const CASE_ID = 'pYH3ycrFlM4L2uV14O2y';
const FILE_PATH = `cases/${CASE_ID}/documents/repro_test.txt`;

async function run() {
    console.log('--- Starting Storage Upload Test ---');

    // 1. Authenticate (Create new user to avoid rate limits)
    try {
        console.log('Creating temp user...');
        const randomId = Math.floor(Math.random() * 10000);
        const email = `testuser${randomId}@example.com`;
        const password = 'password123!';

        const { createUserWithEmailAndPassword } = require('firebase/auth');
        await createUserWithEmailAndPassword(auth, email, password);
        console.log(`✅ Authenticated as new user: ${email}`);
    } catch (e) {
        console.error('❌ Auth failed:', e.message);
        process.exit(1);
    }


    // 2. Test List Files in Case
    try {
        console.log(`Attempting to list files in cases/${CASE_ID}/documents...`);
        const caseRef = ref(storage, `cases/${CASE_ID}/documents`);
        const res = await listAll(caseRef);
        console.log('✅ List Case successful. Items:', res.items.map(i => i.name));
    } catch (error) {
        console.error('❌ List Case failed:', error.code, error.message);
    }

    // 3. Upload to User Folder (Auth Check)
    try {
        const user = auth.currentUser;
        if (user) {
            const userPath = `users/${user.uid}/avatar/test.txt`;
            console.log(`Attempting upload to user path: ${userPath}`);
            const storageRef = ref(storage, userPath);
            const fileContent = Buffer.from('User upload test.');
            const snapshot = await uploadBytes(storageRef, fileContent);
            console.log('✅ User Upload successful!');
        } else {
            console.error('❌ No current user to test user upload');
        }
    } catch (error) {
        console.error('❌ User Upload failed:', error.code, error.message);
        console.error('Full Error:', JSON.stringify(error, null, 2));
    }

    // 4. Upload Case File again with full logging
    try {
        console.log(`Attempting to upload to: ${FILE_PATH}`);
        const storageRef = ref(storage, FILE_PATH);
        const fileContent = Buffer.from('Re-try upload.');
        const snapshot = await uploadBytes(storageRef, fileContent);
        console.log('✅ Upload successful!');
    } catch (error) {
        console.error('❌ Upload failed:', error.code, error.message);
        console.error('Full Error:', JSON.stringify(error, null, 2));
    }

    // 5. Upload String (Alternative)
    try {
        console.log(`Attempting uploadString to: ${FILE_PATH}`);
        const storageRef = ref(storage, FILE_PATH);
        const snapshot = await uploadString(storageRef, 'Hello World', 'raw', {
            contentType: 'text/plain'
        });
        console.log('✅ UploadString successful!');
    } catch (error) {
        console.error('❌ UploadString failed:', error.code, error.message);
        console.error('Full Error:', JSON.stringify(error, null, 2));
    }
    // 6. Test Forbidden Path
    try {
        console.log('Attempting upload to forbidden path: forbidden_path/test.txt');
        const storageRef = ref(storage, 'forbidden_path/test.txt');
        const snapshot = await uploadString(storageRef, 'Should fail with 403');
        console.log('❌ Forbidden Upload UNEXPECTEDLY SUCCEEDED!');
    } catch (error) {
        console.log(`✅ Forbidden Upload failed as expected. Code: ${error.code}, Status: ${error.customData?.status_ || '?'}`);
        if (error.code !== 'storage/unauthorized') {
            console.error('⚠️  WARNING: Expected 403/unauthorized, but got:', error.code);
        }
    }
    // 7. Test Raw REST API Upload
    try {
        console.log('Attempting Raw REST API upload...');
        const token = await auth.currentUser.getIdToken();
        const url = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o?name=raw_rest_test.txt`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'text/plain'
            },
            body: 'Raw REST test content'
        });

        if (response.ok) {
            console.log('✅ Raw REST Upload successful!');
            const data = await response.json();
            console.log('Response:', data);
        } else {
            console.error(`❌ Raw REST Upload failed: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error('Error Body:', errorText);
        }
    } catch (error) {
        console.error('❌ Raw REST request error:', error.message);
    }
    // 8. Test Public Upload (No Auth)
    try {
        console.log('Attempting Public Upload to repro_public/test.txt...');
        const url = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o?name=repro_public%2Ftest.txt`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: 'Public upload test content'
        });

        if (response.ok) {
            console.log('✅ Public Upload successful!');
            const data = await response.json();
            console.log('Response:', data);
        } else {
            console.error(`❌ Public Upload failed: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error('Error Body:', errorText);
        }
    } catch (error) {
        console.error('❌ Public request error:', error.message);
    }
}

run();
