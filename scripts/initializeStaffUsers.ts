/**
 * Script to initialize staff users in Firebase Auth and Firestore
 * 
 * This script creates all staff members with default password "123456"
 * Run this ONCE to populate the database with initial staff accounts
 * 
 * Usage:
 * 1. Create a Firebase service account key JSON (Firebase Console → Project settings → Service accounts)
 * 2. Point to it via environment variable:
 *    - FIREBASE_SERVICE_ACCOUNT_PATH="C:\\path\\to\\serviceAccount.json"
 *    (or set GOOGLE_APPLICATION_CREDENTIALS to the same path)
 * 3. Run:
 *    - npm run seed:staff
 * 3. Or integrate into your app's initial setup
 */

import 'dotenv/config';
import admin from 'firebase-admin';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { UserRole } from '../types.ts';

// Default password for all staff accounts created via initialization script
export const DEFAULT_STAFF_PASSWORD = '123456';

interface StaffMember {
    email: string;
    name: string;
    role: UserRole;
    avatar: string;
    phone: string;
    region?: string;
}

const STAFF_MEMBERS: StaffMember[] = [
    {
        email: 'admin@makemyoffice.com',
        name: 'Admin',
        role: UserRole.SUPER_ADMIN,
        avatar: 'https://i.pravatar.cc/150?u=user-1',
        phone: '+91 98765 43210',
    },
    {
        email: 'sarah.m@makemyoffice.com',
        name: 'Sarah Manager',
        role: UserRole.SALES_GENERAL_MANAGER,
        avatar: 'https://i.pravatar.cc/150?u=user-2',
        phone: '+91 98765 43211',
    },
    {
        email: 'john.s@makemyoffice.com',
        name: 'John Sales',
        role: UserRole.SALES_TEAM_MEMBER,
        avatar: 'https://i.pravatar.cc/150?u=user-3',
        phone: '+91 98765 43212',
        region: 'North',
    },
    {
        email: 'emily.d@makemyoffice.com',
        name: 'Emily Designer',
        role: UserRole.DRAWING_TEAM,
        avatar: 'https://i.pravatar.cc/150?u=user-4',
        phone: '+91 98765 43213',
    },
    {
        email: 'mike.q@makemyoffice.com',
        name: 'Mike Quote',
        role: UserRole.QUOTATION_TEAM,
        avatar: 'https://i.pravatar.cc/150?u=user-5',
        phone: '+91 98765 43214',
    },
    {
        email: 'david.e@makemyoffice.com',
        name: 'David Engineer',
        role: UserRole.SITE_ENGINEER,
        avatar: 'https://i.pravatar.cc/150?u=user-6',
        phone: '+91 98765 43215',
    },
    {
        email: 'anna.p@makemyoffice.com',
        name: 'Anna Procurement',
        role: UserRole.PROCUREMENT_TEAM,
        avatar: 'https://i.pravatar.cc/150?u=user-7',
        phone: '+91 98765 43216',
    },
    {
        email: 'chris.e@makemyoffice.com',
        name: 'Chris Executor',
        role: UserRole.EXECUTION_TEAM,
        avatar: 'https://i.pravatar.cc/150?u=user-8',
        phone: '+91 98765 43217',
    },
    {
        email: 'olivia.a@makemyoffice.com',
        name: 'Olivia Accounts',
        role: UserRole.ACCOUNTS_TEAM,
        avatar: 'https://i.pravatar.cc/150?u=user-9',
        phone: '+91 98765 43218',
    },
    {
        email: 'jane.d@makemyoffice.com',
        name: 'Jane Doe',
        role: UserRole.SALES_TEAM_MEMBER,
        avatar: 'https://i.pravatar.cc/150?u=user-10',
        phone: '+91 98765 43219',
        region: 'South',
    },
];

function requireServiceAccountPath(): string {
    const p = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!p) {
        throw new Error(
            'Missing Firebase Admin credentials.\n\n' +
            'Set one of these environment variables to a Service Account JSON file path:\n' +
            '- FIREBASE_SERVICE_ACCOUNT_PATH\n' +
            '- GOOGLE_APPLICATION_CREDENTIALS\n\n' +
            'Example (PowerShell):\n' +
            '  $env:FIREBASE_SERVICE_ACCOUNT_PATH="C:\\\\secrets\\\\serviceAccount.json"\n' +
            '  npm run seed:staff'
        );
    }
    return p;
}

function initAdmin() {
    if (admin.apps.length) return;

    const serviceAccountPath = requireServiceAccountPath();
    const resolved = path.resolve(serviceAccountPath);
    const json = JSON.parse(fs.readFileSync(resolved, 'utf8')) as admin.ServiceAccount;

    admin.initializeApp({
        credential: admin.credential.cert(json),
    });
}

export const initializeAllStaffUsers = async () => {
    initAdmin();

    console.log('🔄 Starting staff user initialization (firebase-admin)...');
    console.log(`📝 Creating ${STAFF_MEMBERS.length} staff accounts with password: ${DEFAULT_STAFF_PASSWORD}\n`);

    const results = {
        success: [] as string[],
        failed: [] as { email: string; error: string }[],
        skipped: [] as string[],
    };

    for (const member of STAFF_MEMBERS) {
        try {
            console.log(`Creating account for: ${member.name} (${member.email})...`);

            let userRecord: admin.auth.UserRecord | null = null;

            try {
                userRecord = await admin.auth().getUserByEmail(member.email);
                results.skipped.push(member.email);
                console.log(`↩️  Already exists in Auth, skipping create: ${member.email}`);
            } catch (e: any) {
                if (e?.code !== 'auth/user-not-found') throw e;
            }

            if (!userRecord) {
                userRecord = await admin.auth().createUser({
                    email: member.email,
                    password: DEFAULT_STAFF_PASSWORD,
                    displayName: member.name,
                });
                results.success.push(member.email);
                console.log(`✅ Created Auth user: ${member.email}`);
            }

            // Upsert Firestore staff profile (app reads staffUsers/{uid})
            await admin.firestore().collection('staffUsers').doc(userRecord.uid).set(
                {
                    email: member.email,
                    name: member.name,
                    role: member.role,
                    avatar: member.avatar,
                    phone: member.phone,
                    region: member.region ?? null,
                    currentTask: '',
                    lastUpdateTimestamp: admin.firestore.FieldValue.serverTimestamp(),
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
            );

            console.log(`✅ Upserted Firestore staffUsers/${userRecord.uid}\n`);
        } catch (error: any) {
            const errorMessage = error.message || 'Unknown error';
            results.failed.push({ email: member.email, error: errorMessage });
            console.error(`❌ Failed to create ${member.email}: ${errorMessage}\n`);
        }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 INITIALIZATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Created in Auth: ${results.success.length} accounts`);
    console.log(`↩️  Already existed (skipped create): ${results.skipped.length} accounts`);
    console.log(`❌ Failed: ${results.failed.length} accounts`);

    if (results.success.length > 0) {
        console.log('\n✅ Created accounts:');
        results.success.forEach(email => console.log(`   - ${email}`));
    }

    if (results.skipped.length > 0) {
        console.log('\n↩️  Existing accounts:');
        results.skipped.forEach(email => console.log(`   - ${email}`));
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
};

// Export individual staff data for reference
export { STAFF_MEMBERS };

// If running directly (not imported) — works in ESM
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    initializeAllStaffUsers()
        .then(() => {
            console.log('\n✅ Initialization complete!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Initialization failed:', error);
            process.exit(1);
        });
}
