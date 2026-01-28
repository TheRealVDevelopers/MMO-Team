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
    getDocs
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User, UserRole, Vendor } from '../types';
import { USERS, VENDORS } from '../constants';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// Default password for all staff accounts created via initialization script
export const DEFAULT_STAFF_PASSWORD = '123456';

// Convert Firebase User + Firestore data to our User type
export const convertToAppUser = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    try {
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
    // Demo-only simplified login (never enabled in production).
    if (DEMO_MODE) {
        const mockUser = USERS.find(u => u.email === email);
        if (mockUser && password === '123456') {
            return { ...mockUser, lastUpdateTimestamp: new Date() };
        }
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/331cbd8c-3af3-403a-970c-0264da8f26fd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authService.ts:61',message:'Attempting staff sign-in',data:{email,passwordLength:password.length,hasAuth:!!auth,demoMode:DEMO_MODE},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (!auth) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/331cbd8c-3af3-403a-970c-0264da8f26fd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authService.ts:71',message:'Firebase Auth not initialized',data:{email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        throw new Error('Firebase Auth is not initialized. Check your Firebase configuration.');
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/331cbd8c-3af3-403a-970c-0264da8f26fd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authService.ts:75',message:'Sign-in successful',data:{email,userId:userCredential.user.uid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        return await convertToAppUser(userCredential.user);
    } catch (error: any) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/331cbd8c-3af3-403a-970c-0264da8f26fd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authService.ts:79',message:'Sign-in failed',data:{email,errorCode:error.code,errorMessage:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        console.error('Staff sign-in error:', error);
        
        // Provide helpful error message for invalid credentials
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
            throw new Error(
                `Invalid credentials. The user "${email}" may not exist in Firebase Auth.\n\n` +
                `To create staff accounts (from Node using Firebase Admin), run:\n` +
                `  npm run seed:staff\n\n` +
                `Before running, set FIREBASE_SERVICE_ACCOUNT_PATH (or GOOGLE_APPLICATION_CREDENTIALS)\n` +
                `to a Firebase service account JSON key file.\n\n` +
                `Or enable demo mode by setting VITE_DEMO_MODE=true in .env`
            );
        }
        
        throw new Error(error.message || 'Failed to sign in');
    }
};

/**
 * Sign out current staff member
 */
export const signOutStaff = async (): Promise<void> => {
    if (DEMO_MODE) {
        // In demo mode, logout is handled by AuthContext
        return;
    }

    if (!auth) {
        throw new Error('Firebase Auth is not initialized. Check your Firebase configuration.');
    }

    try {
        await signOut(auth);
    } catch (error) {
        console.error('Sign out error:', error);
        throw error;
    }
};

/**
 * Create a new staff account (Super Admin only)
 */
export const createStaffAccount = async (
    email: string,
    name: string,
    role: UserRole,
    avatar: string,
    phone: string,
    region?: string
): Promise<string> => {
    if (DEMO_MODE) {
        throw new Error('Cannot create staff accounts in demo mode. Disable demo mode to use Firebase.');
    }

    if (!auth || !db) {
        throw new Error('Firebase is not initialized. Check your Firebase configuration and ensure VITE_DEMO_MODE=false.');
    }

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
    } catch (error: any) {
        console.error('Error creating staff account:', error);
        throw new Error(error.message || 'Failed to create staff account');
    }
};

/**
 * Change staff password
 */
export const changeStaffPassword = async (
    currentPassword: string,
    newPassword: string
): Promise<void> => {
    if (DEMO_MODE) {
        throw new Error('Password changes are not supported in demo mode.');
    }

    if (!auth || !db) {
        throw new Error('Firebase is not initialized. Check your Firebase configuration.');
    }

    try {
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
    // Demo-only simplified vendor login.
    if (DEMO_MODE) {
        const mockVendor = VENDORS.find(v => v.email === email);
        if (mockVendor && password === '123456') return mockVendor;
        return null;
    }

    // Production TODO: implement vendor auth via Firebase Auth + Firestore 'vendors' collection.
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
    // Demo-only default client credentials.
    if (DEMO_MODE && email === 'client@makemyoffice.com' && password === '123456') return true;

    if (!db) {
        throw new Error('Firebase is not initialized. Check your Firebase configuration.');
    }

    try {
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
 * Change client project password
 */
export const changeClientPassword = async (
    projectId: string,
    currentPassword: string,
    newPassword: string
): Promise<void> => {
    try {
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
    if (DEMO_MODE || !auth) {
        // In demo mode or if auth is not initialized, return a no-op unsubscribe function
        // AuthContext handles demo mode separately
        return () => {};
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
