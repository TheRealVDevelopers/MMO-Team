import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updatePassword,
    User as FirebaseUser,
    EmailAuthProvider,
    reauthenticateWithCredential
} from 'firebase/auth';
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
import { User, UserRole, Vendor, ApprovalRequestType } from '../types';
import { USERS, VENDORS } from '../constants';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// Default password for all staff accounts created via initialization script
export const DEFAULT_STAFF_PASSWORD = '123456';
export const DEFAULT_CLIENT_PASSWORD = '123456';

// Convert Firebase User + Firestore data to our User type
export const convertToAppUser = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    try {
        if (!db) return null;
        const userDoc = await getDoc(doc(db, 'staffUsers', firebaseUser.uid));
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
            region: userData.region,
            currentTask: userData.currentTask || '',
            lastUpdateTimestamp: userData.lastUpdateTimestamp?.toDate() || new Date(),
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
export const signInStaff = async (email: string, password: string): Promise<User | null> => {
    // Simplified Auth for Development - REMOVED
    // Check if the email exists in our USERS constant for mock login - REMOVED
    // const mockUser = USERS.find(u => u.email === email);

    // if (mockUser && password === '123456') {
    //     console.log(`Simplified staff login for ${mockUser.name} (${mockUser.role})`);
    //     return {
    //         ...mockUser,
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

        // Create Firebase Auth account
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        // Create Firestore document
        await setDoc(doc(db, 'staffUsers', userCredential.user.uid), {
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
        return userCredential.user.uid;
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

        // Create an approval request notification for admins about the new staff member
        try {
            await addDoc(collection(db, 'approvalRequests'), {
                requestType: 'OTHER',
                requesterId: userCredential.user.uid,
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

        return userCredential.user.uid;
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
                where('requestType', '==', ApprovalRequestType.STAFF_REGISTRATION),
                where('status', '==', 'Pending')
            )
        );

        const hasPendingRequest = pendingRequestCheck.docs.some(
            doc => doc.data().email === email
        );

        if (hasPendingRequest) {
            throw new Error('A registration request with this email is already pending approval.');
        }

        // Create approval request (account NOT created yet)
        const requestDoc = await addDoc(collection(db, 'approvalRequests'), {
            requestType: ApprovalRequestType.STAFF_REGISTRATION,
            requesterId: 'pending', // No user ID yet
            requesterName: name,
            requesterRole: requestedRole || UserRole.SALES_TEAM_MEMBER,
            title: `Staff Registration Request: ${name}`,
            description: `New staff registration request from "${name}". Email: ${email}, Phone: ${phone}, Requested Role: ${requestedRole || 'Not specified'}, Region: ${region || 'N/A'}.`,
            status: 'Pending', // Requires admin approval
            requestedAt: serverTimestamp(),
            priority: 'High',
            attachments: [],
            // Store registration data for later account creation
            email: email,
            password: password, // Store securely (will be used when creating account)
            phone: phone,
            region: region || '',
            requestedRole: requestedRole,
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
 */
export const changeStaffPassword = async (
    currentPassword: string,
    newPassword: string
): Promise<void> => {
    try {
        if (!auth || !db) throw new Error("Firebase not initialized");
        const user = auth.currentUser;
        if (!user || !user.email) {
            throw new Error('No authenticated user');
        }

        // Re-authenticate user
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        // Update password
        await updatePassword(user, newPassword);

        // Update last password change in Firestore
        await updateDoc(doc(db, 'staffUsers', user.uid), {
            lastPasswordChange: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
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
    updates: Partial<User>
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
export const getStaffMember = async (userId: string): Promise<User | null> => {
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
export const getAllStaff = async (): Promise<User[]> => {
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
 */
export const verifyClientCredentials = async (
    email: string,
    password: string
): Promise<boolean> => {
    // Simplified Auth for Development - Default client credentials - REMOVED
    // if (email === 'client@makemyoffice.com' && password === '123456') {
    //     return true;
    // }

    try {
        if (!db) return false;
        const projectsRef = collection(db, 'clientProjects');
        const q = query(projectsRef, where('clientEmail', '==', email));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return false;
        }

        const projectDoc = snapshot.docs[0];
        const projectData = projectDoc.data();

        return projectData.password === password;
    } catch (error) {
        console.error('Error verifying client credentials:', error);
        return false;
    }
};

/**
 * Create a new client account/project (Registration)
 */
export const createClientAccount = async (
    email: string,
    password: string,
    clientName: string
): Promise<void> => {
    try {
        if (!db) throw new Error("Firebase not initialized");

        // Check if email already exists
        const projectsRef = collection(db, 'clientProjects');
        const q = query(projectsRef, where('clientEmail', '==', email));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            throw new Error('An account with this email already exists.');
        }

        // Create a basic clientProject document
        // In a real app, this would have more fields, but for now we follow createDemoProject structure
        const now = new Date();
        const projectId = email; // Using email as ID for simplicity as seen in ClientDashboardPage

        await setDoc(doc(db, 'clientProjects', email), {
            projectId: email,
            clientEmail: email,
            password: password,
            clientName: clientName,
            projectName: `${clientName}'s Project`,
            projectType: 'Office Interior',
            status: 'in-progress',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            // Minimum required for dashboard if it were real data
            area: 'To be surveyed',
            budget: 'To be finalized',
            startDate: serverTimestamp(),
        });
    } catch (error: any) {
        console.error('Error creating client account:', error);
        throw new Error(error.message || 'Failed to create account');
    }
};

/**
 * Change client project password
 */
export const changeClientPassword = async (
    projectId: string,
    currentPassword: string,
    newPassword: string
): Promise<void> => {
    try {
        if (!db) throw new Error("Firebase not initialized");
        // First verify current password
        const isValid = await verifyClientCredentials(projectId, currentPassword);
        if (!isValid) {
            throw new Error('Current password is incorrect');
        }

        // Update password
        const projectsRef = collection(db, 'clientProjects');
        const q = query(projectsRef, where('projectId', '==', projectId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            throw new Error('Project not found');
        }

        const projectDoc = snapshot.docs[0];
        await updateDoc(doc(db, 'clientProjects', projectDoc.id), {
            password: newPassword,
            updatedAt: serverTimestamp(),
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
