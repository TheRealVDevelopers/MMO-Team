# 🔐 Authentication Setup Guide

This guide explains how to set up and use authentication in your MMO Team application.

## 📋 Prerequisites

1. **Firebase Project Setup**
   - Create a Firebase project at https://console.firebase.google.com/
   - Enable Firebase Authentication (Email/Password provider)
   - Enable Firestore Database
   - Copy your Firebase config values to `.env` file

2. **Environment Variables**
   - Ensure `.env` file exists with all Firebase credentials (see `env.example`)
   - Required variables:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`

## 🚀 Step-by-Step Setup

### Step 1: Initialize Staff Users

Run the initialization script **ONCE** to create all staff accounts:

```bash
npx ts-node scripts/initializeStaffUsers.ts
```

This creates 10 staff accounts with default password `123456`:
- `admin@makemyoffice.com` - Super Admin
- `sarah.m@makemyoffice.com` - Sales Manager
- `john.s@makemyoffice.com` - Sales Team
- `emily.d@makemyoffice.com` - Drawing Team
- `mike.q@makemyoffice.com` - Quotation Team
- `david.e@makemyoffice.com` - Site Engineer
- `anna.p@makemyoffice.com` - Procurement Team
- `chris.e@makemyoffice.com` - Execution Team
- `olivia.a@makemyoffice.com` - Accounts Team
- `jane.d@makemyoffice.com` - Sales Team

**Note:** If you see "Email already in use" errors, the accounts already exist. You're good to go!

### Step 2: Restart Development Server

After creating the `.env` file or updating Firebase credentials:

```bash
# Stop your current dev server (Ctrl+C)
# Then restart:
npm run dev
```

Vite needs to restart to load new environment variables.

### Step 3: Login as Staff

1. Open your application in the browser
2. Click "Staff Login" or navigate to the login page
3. Enter credentials:
   - **Email:** `admin@makemyoffice.com` (or any staff email)
   - **Password:** `123456`
4. Click "Access Dashboard"

## 🔑 Authentication Types

### 1. Staff Authentication

**How it works:**
- Uses Firebase Authentication (Email/Password)
- Staff accounts stored in Firestore `staffUsers` collection
- Role-based access control

**Login:**
```typescript
import { signInStaff } from './services/authService';

const user = await signInStaff('admin@makemyoffice.com', '123456');
```

**Logout:**
```typescript
import { signOutStaff } from './services/authService';

await signOutStaff();
```

**Change Password:**
```typescript
import { changeStaffPassword } from './services/authService';

await changeStaffPassword('123456', 'newPassword123');
```

### 2. Client Authentication

**How it works:**
- Uses Project ID + Password stored in Firestore
- No Firebase Auth required (simpler for clients)
- Clients can only access their own project data

**Verify Credentials:**
```typescript
import { verifyClientCredentials } from './services/authService';

const isValid = await verifyClientCredentials('client@example.com', '123456');
```

**Change Password:**
```typescript
import { changeClientPassword } from './services/authService';

await changeClientPassword('project-id', 'oldPassword', 'newPassword');
```

### 3. Vendor Authentication

**Status:** Currently in development
- Vendor login will use Firebase Auth similar to staff
- Check `services/authService.ts` for updates

## 🛠️ Troubleshooting

### "Missing Firebase env var" Error

**Problem:** Firebase environment variables not loaded

**Solution:**
1. Check that `.env` file exists in project root
2. Verify all `VITE_FIREBASE_*` variables are set
3. Restart your development server
4. Check that variables don't have quotes around values

### "User not found" Error

**Problem:** Staff user doesn't exist in Firestore

**Solution:**
1. Run the initialization script: `npx ts-node scripts/initializeStaffUsers.ts`
2. Check Firebase Console → Firestore → `staffUsers` collection
3. Verify user document exists with correct email

### "Invalid credentials" Error

**Problem:** Wrong email or password

**Solution:**
1. Default password is `123456` for all initialized accounts
2. Check email format: `[name]@makemyoffice.com`
3. Try logging in as `admin@makemyoffice.com` / `123456`
4. If password was changed, use the new password

### "Permission denied" Error

**Problem:** Firestore security rules blocking access

**Solution:**
1. Verify user is authenticated (logged in)
2. Check user's role matches required permission
3. Review `firestore.rules` file
4. Ensure rules are deployed: `firebase deploy --only firestore:rules`

### Authentication Not Working

**Checklist:**
- ✅ Firebase Auth enabled in Firebase Console
- ✅ Email/Password provider enabled
- ✅ `.env` file exists with correct values
- ✅ Development server restarted after `.env` changes
- ✅ Staff users initialized (run script)
- ✅ Browser console shows no errors

## 📚 Code Examples

### Using AuthContext in Components

```typescript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { currentUser, loading, logout } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!currentUser) return <div>Please login</div>;

  return (
    <div>
      <p>Welcome, {currentUser.name}!</p>
      <p>Role: {currentUser.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Monitoring Auth State

```typescript
import { onAuthStateChange } from './services/authService';

const unsubscribe = onAuthStateChange((user) => {
  if (user) {
    console.log('User logged in:', user.name);
  } else {
    console.log('User logged out');
  }
});

// Cleanup when done
unsubscribe();
```

## 🔒 Security Notes

1. **Default Password:** All initialized accounts use `123456` - users should change it after first login
2. **Production:** Set `VITE_DEMO_MODE=false` in `.env` for production
3. **Firestore Rules:** Already deployed with role-based access control
4. **Password Storage:** Staff passwords stored securely in Firebase Auth (not in Firestore)

## 📖 Additional Resources

- `README_FIREBASE_SETUP.md` - Quick Firebase setup reference
- `DEPLOYMENT_GUIDE.md` - Detailed deployment instructions
- `FIREBASE_INTEGRATION_PLAN.md` - Complete integration roadmap
- Firebase Console: https://console.firebase.google.com/

## ✅ Quick Test

After setup, test authentication:

1. **Staff Login Test:**
   ```
   Email: admin@makemyoffice.com
   Password: 123456
   Expected: Redirects to Super Admin Dashboard
   ```

2. **Client Login Test:**
   ```
   Email: [client email from project]
   Password: 123456 (or project password)
   Expected: Redirects to Client Portal
   ```

3. **Logout Test:**
   - Click logout button
   - Expected: Returns to landing page

---

**Need Help?** Check the browser console for detailed error messages and review the troubleshooting section above.

