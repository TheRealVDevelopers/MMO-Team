/**
 * Script to initialize staff users in Firebase Auth and Firestore
 * 
 * This script creates all staff members with default password "123456"
 * Run this ONCE to populate the database with initial staff accounts
 * 
 * Usage:
 * 1. Make sure Firebase is configured
 * 2. Run: npx ts-node scripts/initializeStaffUsers.ts
 * 3. Or integrate into your app's initial setup
 */

import { createStaffAccount, DEFAULT_STAFF_PASSWORD } from '../services/authService.ts';
import { UserRole } from '../types.ts';
import { auth } from '../firebase.ts';
import { signOut } from 'firebase/auth';

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
        name: 'Anna Sourcing',
        role: UserRole.SOURCING_TEAM,
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

export const initializeAllStaffUsers = async () => {
    console.log('🔄 Starting staff user initialization...');
    console.log(`📝 Creating ${STAFF_MEMBERS.length} staff accounts with password: ${DEFAULT_STAFF_PASSWORD}\n`);

    const results = {
        success: [] as string[],
        failed: [] as { email: string; error: string }[],
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
        } catch (error: any) {
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
};

// Export individual staff data for reference
export { STAFF_MEMBERS, DEFAULT_STAFF_PASSWORD };

// If running directly (not imported)
if (require.main === module) {
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
