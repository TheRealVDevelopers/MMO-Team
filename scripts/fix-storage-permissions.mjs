/**
 * Fix Firebase Storage bucket-level permissions.
 * Reads firebase-tools' stored auth token to call the GCS IAM API.
 */

import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const BUCKET = 'kurchi-app.firebasestorage.app';
const PROJECT_NUMBER = '140677067488';
const SA = `service-${PROJECT_NUMBER}@gcp-sa-firebasestorage.iam.gserviceaccount.com`;

async function getFirebaseToken() {
    const configPath = join(homedir(), '.config', 'configstore', 'firebase-tools.json');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    const tokens = config.tokens;

    if (!tokens?.refresh_token) throw new Error('No refresh token found');

    // Refresh the access token using Firebase CLI's client ID
    const resp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
            client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
            refresh_token: tokens.refresh_token,
            grant_type: 'refresh_token',
        }),
    });

    const data = await resp.json();
    if (!data.access_token) throw new Error('Failed to refresh token: ' + JSON.stringify(data));
    return data.access_token;
}

async function fixPermissions(accessToken) {
    console.log(`📋 Bucket: ${BUCKET}`);
    console.log(`📋 Service account: ${SA}\n`);

    // Get current IAM policy
    console.log('1️⃣  Getting current bucket IAM policy...');
    const getPolicyResp = await fetch(
        `https://storage.googleapis.com/storage/v1/b/${BUCKET}/iam`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    if (!getPolicyResp.ok) {
        const errBody = await getPolicyResp.text();
        console.error(`❌ Failed (${getPolicyResp.status}): ${errBody}`);
        return false;
    }

    const policy = await getPolicyResp.json();
    console.log('   Current bindings:', policy.bindings?.map(b => `${b.role} → ${b.members?.length} members`).join(', '));

    // Add roles
    const rolesToGrant = [
        'roles/firebasestorage.serviceAgent',
        'roles/storage.objectAdmin'
    ];

    for (const role of rolesToGrant) {
        const binding = policy.bindings?.find(b => b.role === role);
        if (binding) {
            if (!binding.members.includes(`serviceAccount:${SA}`)) {
                binding.members.push(`serviceAccount:${SA}`);
                console.log(`   ➕ Added SA to ${role}`);
            } else {
                console.log(`   ✓ SA already has ${role}`);
            }
        } else {
            if (!policy.bindings) policy.bindings = [];
            policy.bindings.push({ role, members: [`serviceAccount:${SA}`] });
            console.log(`   ➕ Created ${role} binding`);
        }
    }

    // Set updated policy
    console.log('\n2️⃣  Setting updated policy...');
    const setPolicyResp = await fetch(
        `https://storage.googleapis.com/storage/v1/b/${BUCKET}/iam`,
        {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(policy),
        }
    );

    if (!setPolicyResp.ok) {
        const errBody = await setPolicyResp.text();
        console.error(`❌ Failed (${setPolicyResp.status}): ${errBody}`);
        return false;
    }

    console.log('✅ IAM policy updated!');
    console.log('\n⏳ Wait 1-2 minutes, then try uploading again.');
    return true;
}

console.log('=== Firebase Storage Permission Fix ===\n');
try {
    console.log('🔑 Refreshing access token...');
    const token = await getFirebaseToken();
    console.log('✅ Got access token\n');
    await fixPermissions(token);
} catch (e) {
    console.error('❌', e.message);
}
