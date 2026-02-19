/**
 * Quick diagnostic: test Firebase Storage upload via REST API
 * Run with: node scripts/test-storage-upload.mjs
 */

const BUCKET = 'kurchi-app.firebasestorage.app';
const TEST_PATH = 'repro_public/test-upload.txt';  // uses the public rules path
const FILE_CONTENT = 'Hello from diagnostic script ' + Date.now();

async function testUpload() {
    const url = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o?name=${encodeURIComponent(TEST_PATH)}`;

    console.log('📤 Testing upload to:', url);
    console.log('   Path:', TEST_PATH);
    console.log('   Bucket:', BUCKET);
    console.log();

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: FILE_CONTENT,
        });

        console.log('📡 Response status:', response.status, response.statusText);
        console.log('📡 Response headers:');
        for (const [key, value] of response.headers.entries()) {
            console.log(`   ${key}: ${value}`);
        }

        const body = await response.text();
        console.log('📡 Response body:', body);

        if (response.status === 412) {
            console.log();
            console.log('🚨 412 Precondition Failed detected!');
            console.log('   This usually means one of:');
            console.log('   1. Firebase App Check is ENFORCED for Storage in Firebase Console');
            console.log('   2. The Firebase Storage service account is missing permissions');
            console.log('   3. Billing issues on the Firebase project');
            console.log();
            console.log('   ➡️  Fix: Go to Firebase Console → App Check → APIs');
            console.log('      Check if "Cloud Storage" enforcement is ON. If so, turn it OFF or add App Check to the client.');
        } else if (response.ok) {
            console.log();
            console.log('✅ Upload succeeded! Storage is working.');
        }
    } catch (error) {
        console.error('❌ Fetch error:', error.message);
    }
}

testUpload();
