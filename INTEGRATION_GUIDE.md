# 🔗 Application Integration Guide

## Overview

This workspace contains two interconnected applications for the **Make My Office** business:

### 1. **MMO-Team (Internal Management System)** 
**Location:** `c:\Users\pc\OneDrive\Documents\MMO-Team`  
**Purpose:** Backend/Internal team application  
**Access:** Internal team members only

### 2. **Office Dream Builder (Client-Facing Application)**
**Location:** `c:\Users\pc\OneDrive\Documents\MMO-Team\office-dream-builder`  
**Purpose:** Frontend application for external clients  
**Access:** Public website + Internal portal

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Firebase Backend                       │
│              (kurchi-app.firebaseapp.com)               │
│                                                          │
│  • Authentication  • Firestore  • Storage  • Analytics  │
└─────────────────────────────────────────────────────────┘
                 ▲                           ▲
                 │                           │
                 │                           │
    ─────────────┴─────────────   ──────────┴──────────────
    │                         │   │                        │
┌───▼─────────────────────┐  │   │  ┌─────────────────────▼────┐
│   MMO-Team (Internal)   │  │   │  │ Office Dream Builder     │
│  Management System      │  │   │  │  (Client-Facing)         │
├─────────────────────────┤  │   │  ├──────────────────────────┤
│ • Role-based dashboards │  │   │  │ • Public website         │
│ • Team management       │  │   │  │ • 3D workspace builder   │
│ • Project tracking      │  │   │  │ • Portfolio showcase     │
│ • Lead management       │  │   │  │ • Contact forms          │
│ • Communication hub     │  │   │  │ • Internal dashboard     │
│ • Reports & Analytics   │  │   │  │ • Team collaboration     │
└─────────────────────────┘  │   │  └──────────────────────────┘
                             │   │
                    Shared Data Layer
```

---

## 🔥 Firebase Configuration

Both applications use the **same Firebase project**:

**Project ID:** `kurchi-app`  
**Auth Domain:** `kurchi-app.firebaseapp.com`

### Configuration Files:
- **MMO-Team:** `firebase.ts`
- **Office Dream Builder:** `src/config/firebase.ts`

### Shared Services:
- ✅ Authentication
- ✅ Firestore Database
- ✅ Cloud Storage
- ✅ Analytics

---

## 👥 User Roles & Access

### MMO-Team (Internal System)
Supports role-based access for:

1. **SUPER_ADMIN**
   - Full system access
   - Team management
   - Project oversight
   - Reports & analytics

2. **SALES_GENERAL_MANAGER**
   - Dashboard access
   - Lead management
   - Team performance tracking

3. **SALES_TEAM_MEMBER**
   - Personal workspace
   - Lead tracking
   - Site visits
   - Task management

4. **DRAWING_TEAM**
   - Design projects
   - Design board

5. **QUOTATION_TEAM**
   - Quotation management
   - Item catalog
   - Price analytics

6. **SITE_ENGINEER**
   - Site schedules
   - Expense claims
   - Field reports

7. **SOURCING_TEAM**
   - Material sourcing
   - Vendor management

8. **EXECUTION_TEAM**
   - Project execution
   - Work orders

9. **ACCOUNTS_TEAM**
   - Financial management
   - Payment tracking

### Office Dream Builder
- **Public Access:** Website, portfolio, contact
- **Client Access:** Workspace builder, project visualization
- **Internal Access:** Dashboard routes (`/dashboard/*`)

---

## 🚀 Running Both Applications

### Prerequisites
- Node.js (Latest LTS version)
- npm or bun package manager

### MMO-Team (Internal System)
```bash
cd c:\Users\pc\OneDrive\Documents\MMO-Team
npm install
npm run dev
```
**Default Port:** 5173 (Vite)

### Office Dream Builder (Client App)
```bash
cd c:\Users\pc\OneDrive\Documents\MMO-Team\office-dream-builder
npm install
npm run dev
```
**Default Port:** 5174 (Vite, auto-incremented)

### Running Both Simultaneously
Both applications can run at the same time on different ports, sharing the same Firebase backend.

---

## 🔐 Security Considerations

### Current Setup (Development)
⚠️ **WARNING:** Both applications currently have **open Firestore rules** for development:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Production Recommendations
Before deploying to production:

1. **Implement proper authentication**
   - Firebase Auth with email/password or OAuth
   - Role-based access control (RBAC)

2. **Secure Firestore rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Only authenticated users can read
       match /{document=**} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && hasValidRole();
       }
     }
   }
   ```

3. **Separate environment variables**
   - Development vs Production Firebase configs
   - API key protection
   - Environment-specific settings

4. **API Gateway (Optional)**
   - Consider adding a backend API layer for sensitive operations
   - Implement server-side validation
   - Add rate limiting

---

## 📦 Technology Stack

### MMO-Team (Internal)
- **Framework:** React 19.2.0
- **Build Tool:** Vite 6.2.0
- **Language:** TypeScript 5.8.2
- **Backend:** Firebase 12.4.0
- **AI Integration:** @google/genai 0.14.0

### Office Dream Builder (Client)
- **Framework:** React 18.3.1
- **Build Tool:** Vite 5.4.1
- **Language:** TypeScript 5.5.3
- **UI Components:** shadcn/ui + Radix UI
- **Styling:** TailwindCSS
- **3D Graphics:** Three.js + React Three Fiber
- **Routing:** React Router DOM 6.26.2
- **State Management:** TanStack Query
- **Backend:** Firebase 12.4.0

---

## 🔄 Data Flow

### Lead Management Example
```
Client submits contact form (Office Dream Builder)
         ↓
    Firestore Database
         ↓
Lead appears in MMO-Team dashboard
         ↓
Sales team assigns and tracks lead
         ↓
Updates sync back to client workspace (if applicable)
```

### Project Workflow Example
```
Client creates workspace design (Office Dream Builder)
         ↓
    Project saved to Firestore
         ↓
Internal team views project (MMO-Team)
         ↓
Drawing team → Quotation team → Sourcing team → Execution team
         ↓
Client receives updates in their workspace
```

---

## 📁 Project Structure

### MMO-Team
```
MMO-Team/
├── components/           # UI Components
│   ├── shared/          # Shared components
│   ├── dashboard/       # Dashboard components
│   ├── settings/        # Settings components
│   └── icons/           # Icon components
├── context/             # React contexts
│   ├── AuthContext.tsx  # Authentication
│   └── ThemeContext.tsx # Theme management
├── hooks/               # Custom React hooks
├── App.tsx              # Main application
├── firebase.ts          # Firebase configuration
├── constants.ts         # Application constants
├── types.ts             # TypeScript types
└── package.json         # Dependencies
```

### Office Dream Builder
```
office-dream-builder/
├── src/
│   ├── components/      # UI Components
│   │   ├── ui/         # shadcn/ui components
│   │   └── internal/   # Internal admin components
│   ├── contexts/        # React contexts
│   ├── pages/           # Route pages
│   │   ├── Index.tsx   # Landing page
│   │   ├── Workspace.tsx # 3D workspace builder
│   │   ├── Dashboard.tsx # Internal dashboard
│   │   └── dashboard/  # Dashboard sub-pages
│   ├── config/
│   │   └── firebase.ts # Firebase configuration
│   └── App.tsx         # Main application
├── public/             # Static assets
└── package.json        # Dependencies
```

---

## 🛠️ Development Workflow

### Making Changes to Shared Data Models
1. Update TypeScript types in both projects
2. Update Firestore security rules (if applicable)
3. Test data flow between both applications
4. Deploy changes to Firebase

### Adding New Features
1. Determine if feature is for:
   - **Internal team only** → Add to MMO-Team
   - **Clients only** → Add to Office Dream Builder
   - **Both** → Coordinate changes across both apps

2. Ensure Firebase collections/documents are properly structured
3. Update relevant components in both applications
4. Test integration end-to-end

### Git Workflow
```bash
# MMO-Team repository
cd c:\Users\pc\OneDrive\Documents\MMO-Team
git add .
git commit -m "feat: description"
git push

# Office Dream Builder repository
cd office-dream-builder
git add .
git commit -m "feat: description"
git push
```

---

## 🚨 Troubleshooting

### Common Issues

**Firebase Permission Errors**
- Verify Firestore rules are properly configured
- Check Firebase console for authentication status

**Port Conflicts**
- Change Vite port in `vite.config.ts`:
  ```typescript
  export default defineConfig({
    server: {
      port: 3000 // Your preferred port
    }
  })
  ```

**Data Not Syncing**
- Verify both apps use same Firebase project
- Check Firestore indexes for complex queries
- Ensure proper collection/document naming

**Build Errors**
- Clear node_modules and reinstall:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

---

## 📝 Next Steps

### Recommended Improvements

1. **Authentication System**
   - Implement Firebase Auth
   - Add role-based access control
   - Separate client vs internal user management

2. **API Layer**
   - Create Firebase Cloud Functions
   - Add business logic validation
   - Implement webhooks for notifications

3. **Testing**
   - Unit tests for critical components
   - Integration tests for Firebase operations
   - E2E tests for user workflows

4. **Documentation**
   - API documentation
   - Component library documentation
   - User guides for each role

5. **Deployment**
   - Set up CI/CD pipeline
   - Configure production Firebase project
   - Deploy to hosting (Netlify, Vercel, Firebase Hosting)

---

## 📞 Support

For questions or issues related to this integration:
- Check Firebase Console: https://console.firebase.google.com
- Review Firestore documentation: https://firebase.google.com/docs/firestore
- Contact the development team

---

**Last Updated:** November 10, 2024  
**Maintained By:** The Real V Developers
