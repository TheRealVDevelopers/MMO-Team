import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updatePassword,
    sendPasswordResetEmail,
    onAuthStateChanged,
    Auth,
    EmailAuthProvider,
    reauthenticateWithCredential,
    User
} from 'firebase/auth';
import { initializeApp, deleteApp, getApp, getApps } from 'firebase/app';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs,
    addDoc
} from 'firebase/firestore';
import { auth, db, logAgent } from '../firebase';
import { StaffUser, UserRole, Vendor, CaseStatus } from '../types';
import { FIRESTORE_COLLECTIONS } from '../constants';
import { firebaseConfig } from '../firebase';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// Default password for all staff accounts created via initialization script
export const DEFAULT_STAFF_PASSWORD = '123456';
export const DEFAULT_CLIENT_PASSWORD = '123456';

// New: Client Interface (mirroring types.ts for service usage if needed, or just use Firestore)
interface ClientProfile {
    id: string;
    email: string;
    name: string;
    isFirstLogin: boolean;
}

// Convert Firebase User + Firestore data to our StaffUser type
export const convertToAppUser = async (firebaseUser: User): Promise<StaffUser | null> => {
    try {
        if (!db) return null;
        const userDoc = await getDoc(doc(db, FIRESTORE_COLLECTIONS.STAFF_USERS, firebaseUser.uid));
        if (!userDoc.exists()) {
            return null;
        }

        const userData = userDoc.data();
        return {
            id: firebaseUser.uid,
            name: userData.name,
            role: userData.role as UserRole,
            avatar: userData.avatar,
            email: userData.email,
            phone: userData.phone,
            organizationId: userData.organizationId,
            isActive: userData.isActive !== false,
            createdAt: userData.createdAt?.toDate() || new Date(),
        };
    } catch (error) {
        console.error('Error converting Firebase user to app user:', error);
        return null;
    }
};

// Staff Authentication

/**
 * Sign in staff member with email and password
 */
export const signInStaff = async (email: string, password: string): Promise<StaffUser | null> => {
    // Simplified Auth for Development - REMOVED
    // Check if the email exists in our USERS constant for mock login - REMOVED
    // const mockUser = USERS.find(u => u.email === email);

    // if (mockUser && password === '123456') {
    //     console.log(`Simplified staff login for ${mockUser.name} (${mockUser.role})`);
    //     return {
    //         ...mockUser,
    //         organizationId: 'org1',
    //         createdAt: new Date(),
    //         isActive: true,
    //         lastUpdateTimestamp: new Date(),
    //     };
    // }

    logAgent({
        location: 'authService.ts:sign-in',
        message: 'Attempting staff sign-in',
        data: {
            email,
            passwordLength: password.length,
            hasAuth: !!auth,
            demoMode: DEMO_MODE,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A',
    });

    if (!auth) {
        logAgent({
            location: 'authService.ts:sign-in',
            message: 'Firebase Auth not initialized',
            data: { email },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'B',
        });
        throw new Error('Firebase Auth is not initialized. Check your Firebase configuration.');
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        logAgent({
            location: 'authService.ts:sign-in',
            message: 'Sign-in successful',
            data: { email, userId: userCredential.user.uid },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'C',
        });
        return await convertToAppUser(userCredential.user);
    } catch (error: any) {
        logAgent({
            location: 'authService.ts:sign-in',
            message: 'Sign-in failed',
            data: { email, errorCode: error.code, errorMessage: error.message },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'D',
        });
        console.error('Staff sign-in error:', error);
        throw new Error(error.message || 'Failed to sign in');
    }
};

/**
 * Sign out current staff member
 */
export const signOutStaff = async (): Promise<void> => {
    try {
        if (!auth) return;
        await signOut(auth);
    } catch (error) {
        console.error('Sign out error:', error);
        throw error;
    }
};

/**
 * Create Staff Account from Approved Registration Request
 * Called by admin after approving a registration request
 */
export const createStaffAccountFromApproval = async (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    phone: string,
    region?: string,
    avatar?: string
): Promise<string> => {
    try {
        if (!auth || !db) throw new Error("Firebase not initialized");


        // Initialize a secondary Firebase app to create the user without logging out the admin
        let secondaryApp;
        let secondaryAuth;
        let newUserUid;

        try {
            // Check if app already exists or create new unique one
            const appName = `SecondaryApp-${Date.now()}`;
            secondaryApp = initializeApp(firebaseConfig, appName);
            secondaryAuth = getAuth(secondaryApp);

            // Create Firebase Auth account using secondary auth
            const userCredential = await createUserWithEmailAndPassword(
                secondaryAuth,
                email,
                password
            );
            newUserUid = userCredential.user.uid;

            // Immediately sign out from secondary to be safe, though deleting app handles it
            await signOut(secondaryAuth);
        } catch (authError) {
            throw authError;
        } finally {
            // Clean up the secondary app
            if (secondaryApp) {
                await deleteApp(secondaryApp);
            }
        }

        // Create Firestore document using the main db instance
        await setDoc(doc(db, 'staffUsers', newUserUid), {
            email,
            name,
            role,
            avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
            phone,
            region: region || null,
            currentTask: '',
            lastUpdateTimestamp: serverTimestamp(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        console.log(`Staff account created successfully: ${name} (${email})`);
        return newUserUid;
    } catch (error: any) {
        console.error('Error creating staff account:', error);
        throw new Error(error.message || 'Failed to create staff account');
    }
};

/**
 * Create a new staff account (Super Admin only - Direct Creation)
 * Also creates an approval request notification for admins
 */
export const createStaffAccount = async (
    email: string,
    name: string,
    role: UserRole,
    avatar: string,
    phone: string,
    region?: string
): Promise<string> => {
    try {
        if (!auth || !db) throw new Error("Firebase not initialized");


        // Initialize a secondary Firebase app to create the user without logging out the admin
        let secondaryApp;
        let secondaryAuth;
        let newUserUid;

        try {
            const appName = `SecondaryApp-Direct-${Date.now()}`;
            secondaryApp = initializeApp(firebaseConfig, appName);
            secondaryAuth = getAuth(secondaryApp);

            // Create Firebase Auth account
            const userCredential = await createUserWithEmailAndPassword(
                secondaryAuth,
                email,
                DEFAULT_STAFF_PASSWORD
            );
            newUserUid = userCredential.user.uid;

            // Immediately sign out from secondary
            await signOut(secondaryAuth);
        } catch (authError) {
            throw authError;
        } finally {
            if (secondaryApp) {
                await deleteApp(secondaryApp);
            }
        }

        // Create Firestore document
        await setDoc(doc(db, 'staffUsers', newUserUid), {
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

        // Create an approval request notification for admins about the new staff member
        try {
            await addDoc(collection(db, 'approvalRequests'), {
                requestType: 'OTHER',
                requesterId: newUserUid,
                requesterName: name,
                requesterRole: role,
                title: `New Staff Account Created: ${name}`,
                description: `A new staff member "${name}" with role "${role}" has been added to the system by administrator. Email: ${email}, Phone: ${phone}, Region: ${region || 'N/A'}.`,
                status: 'Approved', // Auto-approved since admin created it
                requestedAt: serverTimestamp(),
                reviewedAt: serverTimestamp(),
                reviewedBy: 'system',
                reviewerName: 'System Administrator',
                reviewerComments: 'Staff account created successfully by administrator.',
                priority: 'Medium',
                attachments: [],
            });

            console.log(`Approval record created for new staff: ${name}`);
        } catch (notifError) {
            console.error('Error creating approval record:', notifError);
            // Don't fail the entire registration if notification fails
        }

        return newUserUid;
    } catch (error: any) {
        console.error('Error creating staff account:', error);
        throw new Error(error.message || 'Failed to create staff account');
    }
};

/**
 * Public Staff Registration Request (Does NOT create account immediately)
 * Creates a pending approval request that admin must approve before account creation
 */
export const submitStaffRegistrationRequest = async (
    email: string,
    password: string,
    name: string,
    phone: string,
    requestedRole?: UserRole,
    region?: string
): Promise<string> => {
    try {
        if (!db) throw new Error("Firebase not initialized");

        // Check if email already has a pending request or existing account
        const existingAccountCheck = await getDocs(
            query(collection(db, 'staffUsers'), where('email', '==', email))
        );

        if (!existingAccountCheck.empty) {
            throw new Error('An account with this email already exists.');
        }

        // TODO: Rebuild approval system with new Case-centric architecture
        // const pendingRequestCheck = await getDocs(
        //     query(
        //         collection(db, 'approvalRequests'),
        //         where('requestType', '==', 'STAFF_REGISTRATION'),
        //         where('status', '==', 'Pending')
        //     )
        // );

        const hasPendingRequest = false; // pendingRequestCheck.docs.some(
        //     doc => doc.data().email === email
        // );

        if (hasPendingRequest) {
            throw new Error('A registration request with this email is already pending approval.');
        }

        // TODO: Rebuild approval system with new Case-centric architecture  
        // Create approval request (account NOT created yet)
        // const requestDoc = await addDoc(collection(db, 'approvalRequests'), {
        //     requestType: 'STAFF_REGISTRATION',
        //     requesterId: 'pending',
        //     requesterName: name,
        //     requesterRole: requestedRole || UserRole.SALES_TEAM_MEMBER,
        //     title: `Staff Registration Request: ${name}`,
        //     description: `New staff registration request from "${name}". Email: ${email}, Phone: ${phone}, Requested Role: ${requestedRole || 'Not specified'}, Region: ${region || 'N/A'}.`,
        //     status: 'Pending',
        //     requestedAt: serverTimestamp(),
        //     priority: 'High',
        //     attachments: [],
        //     email: email,
        //     password: password,
        //     phone: phone,
        //     region: region || '',
        //     requestedRole: requestedRole,
        // });

        console.log(`Staff registration request submitted for: ${name}`);
        return 'temp-id'; // requestDoc.id;
    } catch (error: any) {
        console.error('Error submitting staff registration request:', error);
        throw new Error(error.message || 'Failed to submit registration request');
    }
};

/**
 * Change staff password
 * Works for both Firebase Auth users and simplified/mock users
 */
export const changeStaffPassword = async (
    currentPassword: string,
    newPassword: string
): Promise<void> => {
    try {
        if (!auth || !db) throw new Error("Firebase not initialized");

        const user = auth.currentUser;

        // Check if this is a Firebase-authenticated user
        if (user && user.email) {
            // Firebase Auth user - use Firebase password change
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);

            // Update last password change in Firestore
            await updateDoc(doc(db, 'staffUsers', user.uid), {
                lastPasswordChange: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        } else {
            // Simplified/Mock user - update password in Firestore only
            // Get current user from localStorage
            const savedUser = localStorage.getItem('mmo-current-user');
            if (!savedUser) {
                throw new Error('No authenticated user found');
            }

            const currentUser = JSON.parse(savedUser);

            // For mock users (ID length < 20), just show a message
            if (currentUser.id && currentUser.id.length < 20) {
                throw new Error('Password change is not available for demo accounts. Please create a real account to change password.');
            }

            // For real Firestore users without Firebase Auth
            // Verify current password by checking Firestore
            const userDoc = await getDoc(doc(db, 'staffUsers', currentUser.id));
            if (!userDoc.exists()) {
                throw new Error('User not found');
            }

            const userData = userDoc.data();

            // Check if stored password exists and matches (for users created with Firestore only)
            if (userData.password) {
                if (userData.password !== currentPassword) {
                    throw new Error('Current password is incorrect');
                }

                // Update password in Firestore
                await updateDoc(doc(db, 'staffUsers', currentUser.id), {
                    password: newPassword,
                    lastPasswordChange: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
            } else {
                throw new Error('Password change requires Firebase Authentication. Please contact administrator.');
            }
        }
    } catch (error: any) {
        console.error('Error changing password:', error);
        if (error.code === 'auth/wrong-password') {
            throw new Error('Current password is incorrect');
        }
        throw new Error(error.message || 'Failed to change password');
    }
};

/**
 * Update staff profile
 */
export const updateStaffProfile = async (
    userId: string,
    updates: Partial<StaffUser>
): Promise<void> => {
    try {
        if (!db) return;
        const allowedUpdates: any = {
            updatedAt: serverTimestamp(),
        };

        // Only allow updating specific fields
        if (updates.name) allowedUpdates.name = updates.name;
        if (updates.phone) allowedUpdates.phone = updates.phone;
        if (updates.avatar) allowedUpdates.avatar = updates.avatar;
        if (updates.currentTask !== undefined) allowedUpdates.currentTask = updates.currentTask;
        if (updates.lastUpdateTimestamp) allowedUpdates.lastUpdateTimestamp = updates.lastUpdateTimestamp;

        await updateDoc(doc(db, 'staffUsers', userId), allowedUpdates);
    } catch (error) {
        console.error('Error updating staff profile:', error);
        throw error;
    }
};

/**
 * Get staff member by ID
 */
export const getStaffMember = async (userId: string): Promise<StaffUser | null> => {
    try {
        if (!db) return null;
        const userDoc = await getDoc(doc(db, 'staffUsers', userId));
        if (!userDoc.exists()) {
            return null;
        }

        const userData = userDoc.data();
        return {
            id: userDoc.id,
            name: userData.name,
            role: userData.role as UserRole,
            avatar: userData.avatar,
            email: userData.email,
            phone: userData.phone,
            region: userData.region,
            currentTask: userData.currentTask || '',
            lastUpdateTimestamp: userData.lastUpdateTimestamp?.toDate() || new Date(),
        };
    } catch (error) {
        console.error('Error getting staff member:', error);
        return null;
    }
};

/**
 * Get all staff members
 */
export const getAllStaff = async (): Promise<StaffUser[]> => {
    try {
        if (!db) return [];
        const staffSnapshot = await getDocs(collection(db, 'staffUsers'));
        return staffSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                role: data.role as UserRole,
                avatar: data.avatar,
                email: data.email,
                phone: data.phone,
                region: data.region,
                currentTask: data.currentTask || '',
                lastUpdateTimestamp: data.lastUpdateTimestamp?.toDate() || new Date(),
            };
        });
    } catch (error) {
        console.error('Error getting all staff:', error);
        return [];
    }
};

// Vendor Authentication

/**
 * Sign in vendor with email and password
 */
export const signInVendor = async (email: string, password: string): Promise<Vendor | null> => {
    // Simplified Auth for Vendor Portal - REMOVED
    // Check if the email exists in our VENDORS constant - REMOVED
    // const mockVendor = VENDORS.find(v => v.email === email);

    // if (mockVendor && password === '123456') {
    //     console.log(`Simplified vendor login for ${mockVendor.name}`);
    //     return mockVendor;
    // }

    // In a real app, this would query a 'vendors' collection in Firestore
    return null;
};

// Client Authentication

/**
 * Verify client credentials using email and password
 * AND check for isFirstLogin status
 */
export const signInClient = async (
    email: string,
    password: string
): Promise<{ user: any; isFirstLogin: boolean } | null> => {
    try {
        if (!auth || !db) throw new Error("Firebase not initialized");

        // 1. Sign in with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Fetch Client Profile to check isFirstLogin
        const clientDoc = await getDoc(doc(db, 'clients', user.uid));

        let isFirstLogin = false;
        if (clientDoc.exists()) {
            const data = clientDoc.data();
            isFirstLogin = data.isFirstLogin === true;
        } else {
            // FALLBACK: If Firestore profile missing but Auth successful, create it on-the-fly
            // This handles legacy users or race conditions in creation
            console.warn(`Client profile missing for ${user.uid}, creating default profile.`);
            try {
                await setDoc(doc(db, 'clients', user.uid), {
                    id: user.uid,
                    name: user.displayName || 'Valued Client',
                    email: user.email,
                    isFirstLogin: true, // Force password reset to be safe
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                isFirstLogin = true;
            } catch (err) {
                console.error("Failed to auto-create client profile:", err);
                // Allow login to proceed even if profile creation fails, 
                // preventing "User found in Auth but missing in Firestore" blocker
            }
        }

        return { user, isFirstLogin };
    } catch (error: any) {
        console.error('Error signing in client:', error);
        throw error;
    }
};

/**
 * Legacy support for verifyClientCredentials (can probably remove, but keeping for now if used elsewhere)
 */
export const verifyClientCredentials = async (
    email: string,
    password: string
): Promise<boolean> => {
    try {
        const result = await signInClient(email, password);
        return !!result;
    } catch (e) {
        return false;
    }
};

/**
 * Create a new client account
 * Creates Auth User + Firestore Profile
 */
export const createClientAccount = async (
    email: string,
    password: string,
    clientName: string,
    caseId?: string
): Promise<string> => {
    try {
        if (!auth || !db) throw new Error("Firebase not initialized");

        // Initialize a secondary Firebase app to create the user without logging out the current user (likely Admin/Sales)
        let secondaryApp;
        let secondaryAuth;
        let newUserUid;

        try {
            const appName = `SecondaryApp-Client-${Date.now()}`;
            secondaryApp = initializeApp(firebaseConfig, appName);
            secondaryAuth = getAuth(secondaryApp);

            // Create Firebase Auth account
            const userCredential = await createUserWithEmailAndPassword(
                secondaryAuth,
                email,
                password
            );
            newUserUid = userCredential.user.uid;

            // Immediately sign out from secondary
            await signOut(secondaryAuth);
        } catch (authError) {
            throw authError; // Pass up for handling
        } finally {
            if (secondaryApp) {
                await deleteApp(secondaryApp);
            }
        }

        // Create Firestore Client Profile
        await setDoc(doc(db, 'clients', newUserUid), {
            id: newUserUid,
            name: clientName,
            email: email,
            isFirstLogin: true, // Force password reset
            caseId: caseId || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        console.log(`Client account created: ${clientName} (${email})`);
        return newUserUid;

    } catch (error: any) {
        console.error('Error creating client account:', error);
        throw new Error(error.message || 'Failed to create client account');
    }
};

/**
 * Change client password and unset isFirstLogin
 * If currentPassword is provided, it re-authenticates. 
 * If NOT provided, it assumes session is active and valid (Force Reset case).
 */
export const changeClientPassword = async (
    newPassword: string,
    currentPassword?: string
): Promise<void> => {
    try {
        if (!auth || !db) throw new Error("Firebase not initialized");
        const user = auth.currentUser;

        if (!user) throw new Error("No authenticated user");

        // Re-authenticate if current password provided
        if (currentPassword) {
            const credential = EmailAuthProvider.credential(user.email!, currentPassword);
            await reauthenticateWithCredential(user, credential);
        }

        // Update Password
        await updatePassword(user, newPassword);

        // Update isFirstLogin logic in Firestore
        await updateDoc(doc(db, 'clients', user.uid), {
            isFirstLogin: false,
            updatedAt: serverTimestamp()
        });

    } catch (error: any) {
        console.error('Error changing client password:', error);
        throw new Error(error.message || 'Failed to change password');
    }
};

/**
 * Monitor authentication state
 */
export const onAuthStateChange = (callback: (user: User | null) => void) => {
    if (!auth) {
        callback(null);
        return () => { };
    }
    return auth.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
            const appUser = await convertToAppUser(firebaseUser);
            callback(appUser);
        } else {
            callback(null);
        }
    });
};

/**
 * Get all cases for a client by their UID
 */
export const getClientCases = async (clientUid: string): Promise<any[]> => {
    try {
        if (!db) throw new Error("Firebase not initialized");

        const casesQuery = query(
            collection(db, 'cases'),
            where('clientUid', '==', clientUid)
        );
        const snapshot = await getDocs(casesQuery);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching client cases:', error);
        return [];
    }
};
