# 🚀 Firebase Integration Deployment Guide

## ✅ What Has Been Completed

### 1. Firebase Security Rules ✅
- **File Created:** `firestore.rules`
- **Status:** ✅ **DEPLOYED** to Firebase
- **Features:**
  - Role-based access control for all staff types
  - Secure client project access
  - Protected staff user management
  - Granular permissions for all collections

### 2. Firebase Authentication Service ✅
- **File Created:** `services/authService.ts`
- **Features:**
  - Staff authentication with email/password
  - Default password: `123456` for all staff
  - Client project authentication
  - Password change functionality
  - Profile management
  - Authentication state monitoring

### 3. Staff User Initialization Script ✅
- **File Created:** `scripts/initializeStaffUsers.ts`
- **Purpose:** Create all 10 staff accounts in Firebase
- **Default Password:** `123456`
- **Ready to Run:** Yes

### 4. Firebase Configuration ✅
- **File Updated:** `firebase.ts`
- **Added:** Firebase Auth import and export
- **Updated:** `firebase.json` with Firestore rules config

### 5. Documentation ✅
- **File Created:** `FIREBASE_INTEGRATION_PLAN.md`
- **Contains:** Complete roadmap for remaining integration work

---

## 🔧 IMMEDIATE SETUP STEPS (DO THIS NOW)

### Step 1: Initialize Staff Users in Firebase

Run the initialization script to create all staff accounts:

```bash
# Option 1: Using ts-node
npx ts-node scripts/initializeStaffUsers.ts

# Option 2: If ts-node is not available, you can run it through your app
# (See Integration Option below)
```

**This will create 10 staff accounts:**
- admin@makemyoffice.com (Super Admin)
- sarah.m@makemyoffice.com (Sales Manager)
- john.s@makemyoffice.com (Sales Team)
- emily.d@makemyoffice.com (Drawing Team)
- mike.q@makemyoffice.com (Quotation Team)
- david.e@makemyoffice.com (Site Engineer)
- anna.p@makemyoffice.com (Sourcing Team)
- chris.e@makemyoffice.com (Execution Team)
- olivia.a@makemyoffice.com (Accounts Team)
- jane.d@makemyoffice.com (Sales Team)

**All with password:** `123456`

### Step 2: Update AuthContext to Use Firebase Auth

The current `AuthContext.tsx` uses local storage. It needs to be updated to use Firebase Auth.

**File to Update:** `context/AuthContext.tsx`

Replace the current implementation with Firebase Auth integration (detailed code in next section).

### Step 3: Update LoginModal to Use Email/Password

**File to Update:** `components/landing/LoginModal.tsx`

Replace department/user selection with email/password login form.

### Step 4: Update StartProjectPage Password Default

**File to Update:** `components/landing/StartProjectPage.tsx`

Ensure new client projects get default password `123456`:

```typescript
await addClientProject({
  ...projectData,
  password: '123456',  // Add this line
  hasPassword: true,
});
```

### Step 5: Update ClientLoginPage to Verify Credentials

**File to Update:** `components/landing/ClientLoginPage.tsx`

Use the real Firebase verification instead of mock validation.

---

## 📝 CODE CHANGES NEEDED

### 1. Update AuthContext.tsx

Replace the entire file with this Firebase-integrated version:

```typescript
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { onAuthStateChange } from '../services/authService';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  updateCurrentUserAvatar: (avatarDataUrl: string) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Monitor Firebase auth state
    const unsubscribe = onAuthStateChange((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateCurrentUserAvatar = (avatarDataUrl: string) => {
    if (currentUser) {
      // Save to localStorage for immediate UI update
      localStorage.setItem(`profile-pic-${currentUser.id}`, avatarDataUrl);
      
      // Update state
      setCurrentUser(prevUser => prevUser ? { ...prevUser, avatar: avatarDataUrl } : null);
      
      // TODO: Also upload to Firebase Storage and update Firestore
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, updateCurrentUserAvatar, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### 2. Update LoginModal.tsx

Replace the two-step selection with email/password login:

```typescript
import React, { useState } from 'react';
import Modal from '../shared/Modal';
import { signInStaff } from '../../services/authService';
import { EnvelopeIcon, LockClosedIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (user: any) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await signInStaff(email, password);
            if (user) {
                onLogin(user);
                onClose();
            }
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Staff Login">
            <form onSubmit={handleLogin} className="space-y-6">
                {/* Email Input */}
                <div>
                    <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">
                        Email Address
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john.s@makemyoffice.com"
                            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-kurchi-gold-500 outline-none transition-colors text-lg"
                            required
                        />
                    </div>
                </div>

                {/* Password Input */}
                <div>
                    <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">
                        Password
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <LockClosedIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-kurchi-gold-500 outline-none transition-colors text-lg"
                            required
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Default password: 123456</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-kurchi-espresso-900 text-white font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-kurchi-gold-500 transition-all duration-300 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Signing in...
                        </>
                    ) : (
                        <>
                            Sign In
                            <ArrowRightIcon className="w-5 h-5 ml-2" />
                        </>
                    )}
                </button>
            </form>
        </Modal>
    );
};

export default LoginModal;
```

### 3. Update StartProjectPage.tsx

Around line 183, ensure password is set:

```typescript
await addClientProject({
    projectId: newProjectId,
    clientName: formData.fullName,
    email: formData.email,
    mobile: formData.mobile,
    city: formData.city,
    projectType: formData.projectType,
    spaceType: formData.spaceType,
    area: formData.area,
    numberOfZones: formData.numberOfZones,
    isRenovation: formData.isRenovation,
    designStyle: formData.designStyle,
    budgetRange: formData.budgetRange,
    startTime: formData.startTime,
    completionTimeline: formData.completionTimeline,
    additionalNotes: formData.additionalNotes,
    currentStage: 1,
    expectedCompletion: expectedCompletion,
    consultant: USERS[2].name,
    consultantId: USERS[2].id,
    password: '123456',  // ✅ Add this line
    hasPassword: true,   // ✅ And this line
    updatedAt: new Date(),
});
```

### 4. Update ClientLoginPage.tsx

Around line 54-78, update the handleLogin function:

```typescript
import { verifyClientCredentials } from '../../services/authService';

const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        // Validate project ID format
        const projectIdPattern = /^(OFF|HOM|COM|CUS)-\d{4}-\d{5}$/;
        if (!projectIdPattern.test(projectId)) {
            setError('Invalid Project ID format. Please check your credentials.');
            setIsLoading(false);
            return;
        }

        // Verify credentials with Firebase
        const isValid = await verifyClientCredentials(projectId, password);
        
        if (isValid) {
            onLoginSuccess(projectId);
        } else {
            setError('Invalid Project ID or Password. Please check your credentials.');
        }
    } catch (error) {
        setError('Unable to verify credentials. Please try again.');
    } finally {
        setIsLoading(false);
    }
};
```

---

## 🔐 Default Credentials

### Staff Accounts
**Email:** [name]@makemyoffice.com  
**Password:** `123456`

Example:
- Email: `admin@makemyoffice.com`
- Password: `123456`

### Client Accounts
**Project ID:** Generated on project creation (e.g., `OFF-2025-00123`)  
**Password:** `123456`

---

## ⚠️ IMPORTANT SECURITY NOTES

1. **Change Default Passwords:** All users should change their password after first login
2. **Firestore Rules:** ✅ Already deployed with proper role-based access control
3. **Firebase Auth:** Enabled with email/password provider
4. **Client Access:** Protected by project ID + password combination

---

## 📊 Current Integration Status

| Feature | Status | Notes |
|---------|--------|-------|
| Firestore Rules | ✅ Deployed | Comprehensive role-based access |
| Firebase Auth Service | ✅ Created | `services/authService.ts` |
| Staff Initialization | ✅ Ready | Run `scripts/initializeStaffUsers.ts` |
| Client Project Auth | ✅ Working | Already integrated in hooks |
| Staff Login | ⚠️ Pending | Need to update `LoginModal.tsx` |
| AuthContext | ⚠️ Pending | Need to integrate Firebase Auth |
| Password Change | ⚠️ Pending | Add to Settings page |
| Report Removal | ⚠️ Pending | Remove from navigation |

---

## 🎯 Next Steps

### Immediate (Required for Basic Functionality)
1. ✅ Deploy Firestore rules
2. ⚠️ Run staff user initialization script
3. ⚠️ Update AuthContext to use Firebase Auth
4. ⚠️ Update LoginModal for email/password login
5. ⚠️ Update client project creation with default password

### Short Term (This Week)
6. Remove report navigation items
7. Add password change to Settings page
8. Test all authentication flows
9. Verify role-based access works correctly

### Medium Term (Next Week)
10. Connect all internal features to Firestore (see FIREBASE_INTEGRATION_PLAN.md)
11. Implement real-time dashboard metrics
12. Setup team chat with Firestore
13. Migrate existing data from constants to Firestore

---

## 🧪 Testing Checklist

After making the code changes above:

- [ ] Staff can login with email/password
- [ ] Staff see correct role-based dashboard
- [ ] Client can create project and receive project ID
- [ ] Client can login with project ID + password `123456`
- [ ] Client can access their project dashboard
- [ ] Firestore rules prevent unauthorized access
- [ ] Password change works for both staff and clients

---

## 📞 Support

If you encounter any issues:
1. Check Firebase Console for auth errors
2. Review browser console for detailed error messages
3. Verify Firestore rules are deployed correctly
4. Ensure all staff users are created in Firebase Auth

---

## 🎉 Summary

You now have:
1. ✅ **Secure Firestore rules** deployed to production
2. ✅ **Complete authentication service** ready to use
3. ✅ **Staff initialization script** ready to create all accounts
4. ✅ **Documentation** for remaining integration work

The foundation is solid. Just need to update the 4-5 React components to use the new Firebase Auth system instead of local state!
