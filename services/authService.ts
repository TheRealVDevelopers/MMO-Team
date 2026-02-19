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
import { auth, db, logAgent, firebaseConfig } from '../firebase';
import {
    StaffUser, UserRole, Vendor, CaseStatus, B2IClient,
    B2I_PARENT
} from '../types';
import { FIRESTORE_COLLECTIONS, DEFAULT_ORGANIZATION_ID } from '../constants';

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
        const staffUser = await convertToAppUser(userCredential.user);

        // Block B2I Parent users from staff login — they should use Client Login
        if (staffUser && staffUser.role === UserRole.B2I_PARENT) {
            await signOut(auth);
            throw new Error('B2I Parent accounts must use the Client Login portal. Please click "Client Login" to access your dashboard.');
        }

        return staffUser;
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
    organizationId?: string,
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

        // Create Firestore document (no undefined - Firestore rejects undefined)
        const staffData: Record<string, unknown> = {
            email,
            name,
            role,
            organizationId: organizationId || DEFAULT_ORGANIZATION_ID,
            isActive: true, // New staff accounts should be active by default
            avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
            phone: phone ?? '',
            region: region ?? null,
            currentTask: '',
            lastUpdateTimestamp: serverTimestamp(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        await setDoc(doc(db, 'staffUsers', newUserUid), staffData);

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
    region?: string,
    organizationId?: string
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

        // Create Firestore document (no undefined - Firestore rejects undefined)
        const staffData: Record<string, unknown> = {
            email,
            name,
            role,
            organizationId: organizationId || DEFAULT_ORGANIZATION_ID,
            isActive: true,
            avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
            phone: phone ?? '',
            region: region ?? null,
            currentTask: '',
            lastUpdateTimestamp: serverTimestamp(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        await setDoc(doc(db, 'staffUsers', newUserUid), staffData);

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

        const pendingRequestCheck = await getDocs(
            query(
                collection(db, 'approvalRequests'),
                where('requestType', '==', 'STAFF_REGISTRATION'),
                where('status', '==', 'pending')
            )
        );

        const hasPendingRequest = pendingRequestCheck.docs.some(
            (d) => d.data().email === email
        );

        if (hasPendingRequest) {
            throw new Error('A registration request with this email is already pending approval.');
        }

        // Create approval request (account NOT created until admin approves; do not store password)
        const requestDoc = await addDoc(collection(db, 'approvalRequests'), {
            requestType: 'STAFF_REGISTRATION',
            requesterId: 'pending',
            requesterName: name,
            requesterRole: requestedRole || UserRole.SALES_TEAM_MEMBER,
            title: `Staff Registration Request: ${name}`,
            description: `New staff registration request from "${name}". Email: ${email}, Phone: ${phone}, Requested Role: ${requestedRole || 'Not specified'}, Region: ${region || 'N/A'}.`,
            status: 'pending',
            requestedAt: serverTimestamp(),
            priority: 'High',
            attachments: [],
            email,
            phone: phone ?? '',
            region: region ?? '',
            requestedRole: requestedRole || UserRole.SALES_TEAM_MEMBER,
        });

        console.log(`Staff registration request submitted for: ${name}`);
        return requestDoc.id;
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
            organizationId: userData.organizationId || DEFAULT_ORGANIZATION_ID,
            avatar: userData.avatar,
            email: userData.email,
            phone: userData.phone,
            region: userData.region,
            isActive: userData.isActive !== false,
            createdAt: userData.createdAt?.toDate() || new Date(),
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
                organizationId: data.organizationId || DEFAULT_ORGANIZATION_ID,
                avatar: data.avatar,
                email: data.email,
                phone: data.phone,
                region: data.region,
                isActive: data.isActive !== false,
                createdAt: data.createdAt?.toDate() || new Date(),
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
 * Create a vendor account with Firebase Auth + staffUsers doc (role: VENDOR)
 * Default password: 123456, isFirstLogin: true
 */
export const createVendorAccount = async (opts: {
    email: string;
    name: string;
    vendorId: string;
    organizationId?: string; // optional – vendors are a separate branch, not tied to org
    phone?: string;
}): Promise<string> => {
    const { email, name, vendorId, organizationId, phone } = opts;
    if (!auth || !db) throw new Error("Firebase not initialized");

    // Use default auth so the user is created in the same Auth context used at sign-in.
    // Side effect: current user (e.g. procurement) will be signed out; we sign out the new vendor after so no one is logged in.
    const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        DEFAULT_STAFF_PASSWORD
    );
    const uid = userCredential.user.uid;
    await signOut(auth);

    // Create staffUsers doc with role VENDOR + vendorId + isFirstLogin flag (no organizationId – vendors are separate)
    const staffData: Record<string, unknown> = {
        email,
        name,
        role: UserRole.VENDOR,
        vendorId,
        isActive: true,
        phone: phone ?? '',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        isFirstLogin: true,
        currentTask: '',
        lastUpdateTimestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    if (organizationId != null && organizationId !== '') {
        staffData.organizationId = organizationId;
    }
    await setDoc(doc(db, FIRESTORE_COLLECTIONS.STAFF_USERS, uid), staffData);

    console.log(`Vendor account created: ${name} (${email}), vendorId: ${vendorId}`);
    return uid;
};

/**
 * Sign in vendor with email and password
 * Vendors use the same staffUsers collection with role: VENDOR
 */
export const signInVendor = async (email: string, password: string): Promise<Vendor | null> => {
    try {
        if (!auth || !db) throw new Error("Firebase not initialized");

        // Sign in via Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Fetch staffUsers doc and verify it's a vendor
        const userDoc = await getDoc(doc(db, FIRESTORE_COLLECTIONS.STAFF_USERS, uid));
        if (!userDoc.exists()) {
            await signOut(auth);
            return null;
        }

        const userData = userDoc.data();
        if (userData.role !== UserRole.VENDOR) {
            // Not a vendor account
            await signOut(auth);
            return null;
        }

        // Return vendor info (matching Vendor type from types.ts)
        return {
            id: uid,
            name: userData.name || '',
            phone: userData.phone,
            email: userData.email,
            category: userData.category || 'General',
            gstNumber: userData.gstNumber,
        };
    } catch (error: any) {
        console.error('Vendor sign-in error:', error);
        return null;
    }
};

// Client Authentication

const CLIENTS_COLLECTION = 'clients';

/**
 * First-time client login: email only. Looks up client by email in cases (clientEmail);
 * if found, creates Firebase Auth account + client profile and signs them in.
 * Next time they must use "Already have account" with password.
 */
export const signInClientFirstTime = async (
    email: string
): Promise<{ user: any; isFirstLogin: boolean } | null> => {
    try {
        if (!auth || !db) throw new Error("Firebase not initialized");

        const trimmedEmail = email.trim();
        if (!trimmedEmail) return null;
        const normalizedEmail = trimmedEmail.toLowerCase();

        // 1. Check if client already has an account (clients doc with this email)
        const clientsRef = collection(db, CLIENTS_COLLECTION);
        const q = query(clientsRef, where('email', '==', normalizedEmail));
        const existingClients = await getDocs(q);
        if (!existingClients.empty) {
            throw new Error('ALREADY_HAVE_ACCOUNT');
        }

        // 2. Find a case with this client email (match as stored – try both trimmed and lowercase for robustness)
        const casesRef = collection(db, FIRESTORE_COLLECTIONS.CASES);
        const caseQ = query(casesRef, where('clientEmail', '==', trimmedEmail));
        let caseSnap = await getDocs(caseQ);
        if (caseSnap.empty && trimmedEmail !== normalizedEmail) {
            const caseQ2 = query(casesRef, where('clientEmail', '==', normalizedEmail));
            caseSnap = await getDocs(caseQ2);
        }
        if (caseSnap.empty) {
            throw new Error('No project found for this email. Use the email registered with your project.');
        }

        const firstCase = caseSnap.docs[0];
        const caseData = firstCase.data();
        const clientName = caseData.clientName || 'Client';
        const caseId = firstCase.id;

        // 3. Create Firebase Auth user with a one-time random password (user never sees it)
        const randomPassword = `MMO${Date.now()}${Math.random().toString(36).slice(2, 10)}!`;
        const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, randomPassword);
        const user = userCredential.user;

        // 4. Create client profile (store email lowercase for "already have account" lookup)
        await setDoc(doc(db, CLIENTS_COLLECTION, user.uid), {
            id: user.uid,
            name: clientName,
            email: normalizedEmail,
            isFirstLogin: true,
            caseId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return { user, isFirstLogin: true };
    } catch (error: any) {
        if (error.message === 'ALREADY_HAVE_ACCOUNT') throw error;
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('ALREADY_HAVE_ACCOUNT');
        }
        console.error('Error in first-time client sign-in:', error);
        throw error;
    }
};

/**
 * Existing client login: email + password. Returns user and isFirstLogin (for password change prompt).
 * Also returns isB2IParent and b2iId if the client is a B2I parent.
 */
export const signInClient = async (
    email: string,
    password: string
): Promise<{ user: any; isFirstLogin: boolean; isB2IParent?: boolean; b2iId?: string } | null> => {
    try {
        if (!auth || !db) throw new Error("Firebase not initialized");

        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;

        const clientDoc = await getDoc(doc(db, CLIENTS_COLLECTION, user.uid));
        let isFirstLogin = false;
        let isB2IParent = false;
        let b2iId: string | undefined;
        if (clientDoc.exists()) {
            const data = clientDoc.data();
            isFirstLogin = data.isFirstLogin === true;
            isB2IParent = data.isB2IParent === true;
            b2iId = data.b2iId;
        } else {
            try {
                await setDoc(doc(db, CLIENTS_COLLECTION, user.uid), {
                    id: user.uid,
                    name: user.displayName || 'Valued Client',
                    email: user.email,
                    isFirstLogin: true,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                isFirstLogin = true;
            } catch (err) {
                console.error("Failed to auto-create client profile:", err);
            }
        }

        return { user, isFirstLogin, isB2IParent, b2iId };
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

        // Create Firestore Client Profile (no undefined - Firestore rejects undefined)
        const clientData: Record<string, unknown> = {
            id: newUserUid,
            name: clientName,
            email,
            isFirstLogin: true,
            caseId: caseId ?? null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        await setDoc(doc(db, CLIENTS_COLLECTION, newUserUid), clientData);

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
        await updateDoc(doc(db, CLIENTS_COLLECTION, user.uid), {
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
export const onAuthStateChange = (callback: (user: StaffUser | null) => void) => {
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

/**
 * Create a B2I Parent Account (B2I_PARENT role).
 * Creates Auth User + Staff User (Role: B2I_PARENT).
 * NOTE: Does NOT link to B2I Client doc here; that should be done by the caller (B2IClientsPage) 
 * or we can pass b2iId to link it.
 * Actually, the plan says: update B2IClientsPage to call this.
 * This function handles the Auth + StaffUser creation.
 */
export const createB2IParentAccount = async (
    email: string,
    name: string,
    phone: string,
    b2iId: string
): Promise<string> => {
    try {
        if (!auth || !db) throw new Error("Firebase not initialized");
        const password = DEFAULT_STAFF_PASSWORD; // Default '123456'

        // Initialize a secondary Firebase app to create the user without logging out the admin
        let secondaryApp;
        let secondaryAuth;
        let newUserUid;

        try {
            const appName = `SecondaryApp-B2I-${Date.now()}`;
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
            throw authError; // Pass up
        } finally {
            if (secondaryApp) {
                await deleteApp(secondaryApp);
            }
        }

        // Create Staff User Document
        const staffData: StaffUser = {
            id: newUserUid,
            name: name,
            email: email,
            role: UserRole.B2I_PARENT,
            organizationId: 'B2I_GLOBAL', // Placeholder or specific B2I Org ID if applicable
            isActive: true,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
            phone: phone || '',
            createdAt: new Date(),
            currentTask: '',
            lastUpdateTimestamp: new Date(),
            mustChangePassword: true, // Specific field we added
            b2iId: b2iId, // Link to B2I Client Doc
            region: 'Global',
        } as StaffUser;

        // Use setDoc
        await setDoc(doc(db, FIRESTORE_COLLECTIONS.STAFF_USERS, newUserUid), {
            ...staffData,
            createdAt: serverTimestamp(),
            lastUpdateTimestamp: serverTimestamp(),
        });

        // Also create a clients collection record so B2I parent can login via Client Login
        await setDoc(doc(db, CLIENTS_COLLECTION, newUserUid), {
            id: newUserUid,
            name: name,
            email: email,
            isFirstLogin: true,
            isB2IParent: true,
            b2iId: b2iId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        console.log(`B2I Parent account created (staff + client): ${name} (${email})`);
        return newUserUid;

    } catch (error: any) {
        console.error('Error creating B2I parent account:', error);
        throw new Error(error.message || 'Failed to create B2I parent account');
    }
};
