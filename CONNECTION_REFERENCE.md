# 🔗 Connection Reference: MMO-Team ↔ Office Dream Builder

## Quick Overview

Both applications are **already connected** through Firebase! They share the same backend, which means:
- ✅ Data created in one app is accessible in the other
- ✅ User authentication can be shared (if implemented)
- ✅ Real-time updates across both platforms
- ✅ Single source of truth for business data

---

## 🔥 Firebase Connection Points

### 1. Firestore Database Collections (Shared)

Both applications can read/write to these collections:

| Collection | Used By | Purpose |
|------------|---------|---------|
| `projects` | Both | Store client projects and internal tracking |
| `leads` | Both | Lead management and client inquiries |
| `users` | Both | User profiles (clients + internal team) |
| `designs` | Both | 3D workspace designs from clients |
| `quotes` | Both | Quotations for projects |
| `siteVisits` | Internal | Site visit schedules |
| `tasks` | Internal | Task assignments for teams |
| `communication` | Both | Messages and notifications |
| `reports` | Internal | Analytics and performance reports |

### 2. Firebase Authentication

```typescript
// Both apps use the same auth instance
import { getAuth } from 'firebase/auth';

const auth = getAuth(app);
// Users authenticated in one app are recognized in the other
```

### 3. Firebase Storage

```typescript
// Shared file storage for:
// - Project files
// - Design assets
// - User uploads
// - Documents

import { getStorage } from 'firebase/storage';
const storage = getStorage(app);
```

---

## 🔄 Data Flow Examples

### Example 1: Client Submits Contact Form

```
Office Dream Builder (Client)
    ↓
User fills contact form on website
    ↓
Data saved to Firestore → leads collection
    ↓
MMO-Team (Internal)
    ↓
Sales team sees new lead in dashboard
    ↓
Sales manager assigns to team member
    ↓
Team member contacts client
```

**Code Reference:**

**Client Side (Office Dream Builder):**
```typescript
// src/pages/Contact.tsx or similar
import { db } from '@/config/firebase';
import { collection, addDoc } from 'firebase/firestore';

const submitContactForm = async (formData) => {
  await addDoc(collection(db, 'leads'), {
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    message: formData.message,
    status: 'new',
    source: 'website_contact_form',
    createdAt: new Date(),
  });
};
```

**Internal Side (MMO-Team):**
```typescript
// components/dashboard/LeadsTable.tsx or similar
import { db } from './firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';

// Real-time listener for new leads
const leadsRef = collection(db, 'leads');
const q = query(leadsRef, where('status', '==', 'new'));

onSnapshot(q, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') {
      console.log('New lead:', change.doc.data());
      // Update UI, send notification, etc.
    }
  });
});
```

---

### Example 2: Client Creates Office Design

```
Office Dream Builder
    ↓
Client uses 3D workspace builder
    ↓
Design saved to Firestore → designs collection
    ↓
Screenshot saved to Firebase Storage
    ↓
MMO-Team
    ↓
Drawing team views design request
    ↓
Quotation team prepares estimate
    ↓
Quote sent back to client
```

**Code Reference:**

**Client Side:**
```typescript
// Workspace.tsx
import { db, storage } from '@/config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const saveDesign = async (designData, screenshot) => {
  // Upload screenshot
  const imageRef = ref(storage, `designs/${Date.now()}.png`);
  await uploadBytes(imageRef, screenshot);
  const imageUrl = await getDownloadURL(imageRef);
  
  // Save design data
  const docRef = await addDoc(collection(db, 'designs'), {
    userId: currentUser.uid,
    designData: designData,
    screenshot: imageUrl,
    status: 'pending_review',
    createdAt: new Date(),
  });
  
  return docRef.id;
};
```

**Internal Side:**
```typescript
// components/dashboard/DesignRequests.tsx
import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const fetchPendingDesigns = async () => {
  const q = query(
    collection(db, 'designs'),
    where('status', '==', 'pending_review')
  );
  
  const querySnapshot = await getDocs(q);
  const designs = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  return designs;
};
```

---

### Example 3: Internal Team Updates Project Status

```
MMO-Team
    ↓
Project manager updates project status
    ↓
Data updated in Firestore → projects collection
    ↓
Office Dream Builder
    ↓
Client sees real-time update in their dashboard
    ↓
Notification sent to client
```

**Code Reference:**

**Internal Side:**
```typescript
// components/projects/ProjectManager.tsx
import { db } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';

const updateProjectStatus = async (projectId, newStatus) => {
  const projectRef = doc(db, 'projects', projectId);
  
  await updateDoc(projectRef, {
    status: newStatus,
    updatedAt: new Date(),
    lastUpdatedBy: currentUser.uid,
  });
};
```

**Client Side:**
```typescript
// src/pages/Dashboard.tsx
import { db } from '@/config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// Real-time listener for project updates
const projectRef = doc(db, 'projects', projectId);

onSnapshot(projectRef, (doc) => {
  if (doc.exists()) {
    const projectData = doc.data();
    console.log('Project updated:', projectData.status);
    // Update UI, show notification
  }
});
```

---

## 🎯 Integration Points Summary

### Shared Resources

| Resource | Location | Purpose |
|----------|----------|---------|
| **Firebase Config** | `firebase.ts` (both apps) | Authentication, database, storage |
| **API Keys** | Firebase project settings | Access to Firebase services |
| **Database** | Firestore cloud | Central data storage |
| **Storage** | Firebase Storage | File uploads (images, docs) |
| **Analytics** | Firebase Analytics | Usage tracking |

### Communication Patterns

1. **One-Way: Client → Internal**
   - Contact forms
   - Design requests
   - Quote requests
   - Support tickets

2. **One-Way: Internal → Client**
   - Project updates
   - Quote delivery
   - Status notifications
   - Messages from team

3. **Two-Way**
   - Chat/messaging
   - Project collaboration
   - Design revisions
   - Feedback loops

---

## 🛠️ How to Test the Connection

### Test 1: Create a Lead
1. Open **Office Dream Builder** → Contact page
2. Submit a contact form
3. Open **MMO-Team** → Leads dashboard
4. Verify the new lead appears

### Test 2: Update Project Status
1. Open **MMO-Team** → Projects
2. Update a project status
3. Open **Office Dream Builder** → Client dashboard (if logged in)
4. Verify status change appears

### Test 3: Real-time Sync
1. Open both apps side-by-side
2. Create/update data in one app
3. Watch it appear in the other app in real-time

---

## 🔐 Security Notes

### Current Setup
⚠️ Both apps currently have **open access** to Firebase (development mode)

### What Needs to Be Added

1. **Authentication Flow**
```typescript
// Example: Separate client vs internal authentication

// Client users (Office Dream Builder)
const signUpClient = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Add custom claims
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    role: 'client',
    type: 'customer',
    createdAt: new Date(),
  });
};

// Internal users (MMO-Team)
const signInInternal = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
  // Verify internal role
  const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
  const userData = userDoc.data();
  
  if (userData?.type !== 'internal') {
    throw new Error('Access denied: Internal access only');
  }
  
  return userCredential;
};
```

2. **Firestore Security Rules**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isInternalUser() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.type == 'internal';
    }
    
    function isClient() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.type == 'client';
    }
    
    // Leads - clients can create, internal can read/update
    match /leads/{leadId} {
      allow create: if isAuthenticated();
      allow read, update, delete: if isInternalUser();
    }
    
    // Projects - both can read, internal can update
    match /projects/{projectId} {
      allow read: if isAuthenticated();
      allow write: if isInternalUser();
    }
    
    // Designs - clients own theirs, internal can see all
    match /designs/{designId} {
      allow create: if isClient();
      allow read: if isAuthenticated();
      allow update, delete: if isInternalUser() || 
                              (isClient() && resource.data.userId == request.auth.uid);
    }
    
    // Internal collections - only internal access
    match /siteVisits/{visitId} {
      allow read, write: if isInternalUser();
    }
    
    match /tasks/{taskId} {
      allow read, write: if isInternalUser();
    }
  }
}
```

---

## 📊 Data Schema Examples

### Lead Schema
```typescript
interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  source: 'website_contact_form' | 'phone' | 'referral' | 'other';
  assignedTo?: string; // User ID of assigned sales person
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Project Schema
```typescript
interface Project {
  id: string;
  clientId: string;
  name: string;
  description: string;
  status: 'planning' | 'design' | 'quotation' | 'negotiation' | 'execution' | 'completed';
  designId?: string; // Reference to design document
  quoteId?: string; // Reference to quote document
  assignedTeam: {
    sales?: string;
    design?: string;
    quotation?: string;
    execution?: string;
  };
  budget?: number;
  timeline?: {
    start: Timestamp;
    end: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Design Schema
```typescript
interface Design {
  id: string;
  userId: string; // Client who created it
  projectId?: string;
  designData: {
    furniture: Array<FurnitureItem>;
    layout: LayoutData;
    dimensions: Dimensions;
  };
  screenshot: string; // URL to Firebase Storage
  status: 'draft' | 'pending_review' | 'approved' | 'quoted';
  reviewedBy?: string; // Internal user ID
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 🚀 Quick Start Commands

```bash
# Clone both repos (if not already done)
cd c:\Users\pc\OneDrive\Documents\MMO-Team
git clone https://github.com/TheRealVDevelopers/office-dream-builder.git

# Install dependencies
npm install
cd office-dream-builder && npm install

# Run both apps (Option 1 - Batch file)
start-both-apps.bat

# Run both apps (Option 2 - PowerShell)
.\start-both-apps.ps1

# Run individually
# Terminal 1: Internal App
npm run dev

# Terminal 2: Client App
cd office-dream-builder && npm run dev
```

---

## ✅ Verification Checklist

- [ ] Both apps can connect to Firebase
- [ ] Data created in one app appears in the other
- [ ] Real-time updates work between apps
- [ ] File uploads work from both apps
- [ ] Authentication works (if implemented)
- [ ] Security rules are properly configured (for production)
- [ ] Environment variables are set correctly
- [ ] Both apps can run simultaneously

---

## 📞 Troubleshooting

### "Firebase permission denied"
- Check Firestore rules in Firebase Console
- Ensure rules allow access for your use case
- For development, use the open rules temporarily

### "Data not syncing"
- Verify both apps use the same Firebase project ID
- Check collection and document names match exactly
- Look for typos in field names

### "Port already in use"
- Close other Vite dev servers
- Change port in `vite.config.ts`
- Kill process using the port

### "Authentication failed"
- Ensure Firebase Auth is enabled in console
- Check email/password auth method is activated
- Verify user exists in Firebase Auth users list

---

**For detailed integration guide, see:** [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)

**Last Updated:** November 10, 2024
