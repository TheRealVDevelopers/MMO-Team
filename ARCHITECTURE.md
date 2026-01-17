# 🏗️ System Architecture

## High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          MAKE MY OFFICE ECOSYSTEM                           │
└────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────┐    ┌─────────────────────────────────┐
│   EXTERNAL USERS (Clients)      │    │  INTERNAL TEAM MEMBERS          │
│                                  │    │                                 │
│  • Browse website                │    │  • Super Admin                  │
│  • View portfolio                │    │  • Sales Managers               │
│  • Create workspace designs      │    │  • Sales Team                   │
│  • Submit inquiries              │    │  • Drawing Team                 │
│  • Track projects                │    │  • Quotation Team               │
│  • View quotes                   │    │  • Site Engineers               │
│                                  │    │  • Procurement Team             │
│                                  │    │  • Execution Team               │
│                                  │    │  • Accounts Team                │
└──────────────┬──────────────────┘    └──────────────┬──────────────────┘
               │                                      │
               │                                      │
               ▼                                      ▼
┌──────────────────────────────────┐    ┌─────────────────────────────────┐
│  OFFICE DREAM BUILDER            │    │  MMO-TEAM                       │
│  (Client-Facing Application)     │    │  (Internal Management)          │
├──────────────────────────────────┤    ├─────────────────────────────────┤
│                                  │    │                                 │
│  Frontend Routes:                │    │  Features:                      │
│  • / (Homepage)                  │    │  • Role-based dashboards        │
│  • /workspace (3D Builder)       │    │  • Team management              │
│  • /portfolio                    │    │  • Project tracking             │
│  • /about                        │    │  • Lead assignment              │
│  • /contact                      │    │  • Communication hub            │
│  • /team                         │    │  • Task management              │
│                                  │    │  • Reports & Analytics          │
│  Internal Portal:                │    │  • Performance tracking         │
│  • /dashboard/*                  │    │  • AI-powered features          │
│  • /internal/*                   │    │                                 │
│                                  │    │                                 │
│  Tech Stack:                     │    │  Tech Stack:                    │
│  • React + TypeScript            │    │  • React 19 + TypeScript        │
│  • React Router                  │    │  • Custom routing               │
│  • Three.js (3D graphics)        │    │  • Gemini AI integration        │
│  • shadcn/ui + Radix UI          │    │  • Custom UI components         │
│  • TailwindCSS                   │    │                                 │
│  • Vite build                    │    │  • Vite build                   │
│                                  │    │                                 │
│  Port: 5174                      │    │  Port: 5173                     │
└──────────────┬───────────────────┘    └──────────────┬──────────────────┘
               │                                        │
               │         ┌──────────────────┐          │
               └────────►│  FIREBASE BACKEND│◄─────────┘
                         │   (Shared Layer) │
                         └──────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  FIREBASE     │     │   FIRESTORE      │     │  FIREBASE       │
│  AUTH         │     │   DATABASE       │     │  STORAGE        │
├───────────────┤     ├──────────────────┤     ├─────────────────┤
│               │     │                  │     │                 │
│ • User mgmt   │     │ Collections:     │     │ Folders:        │
│ • Sessions    │     │  • projects      │     │  • designs/     │
│ • Roles       │     │  • leads         │     │  • documents/   │
│ (Future)      │     │  • users         │     │  • images/      │
│               │     │  • designs       │     │  • uploads/     │
│               │     │  • quotes        │     │                 │
│               │     │  • tasks         │     │                 │
│               │     │  • siteVisits    │     │                 │
│               │     │  • communication │     │                 │
│               │     │  • reports       │     │                 │
└───────────────┘     └──────────────────┘     └─────────────────┘
```

---

## Data Flow Architecture

### 1. Client Journey Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT INTERACTION FLOW                     │
└─────────────────────────────────────────────────────────────────┘

Step 1: Discovery
    Client visits website (Office Dream Builder)
    ↓
    Browses portfolio and services
    ↓

Step 2: Engagement  
    Fills contact form OR uses 3D workspace builder
    ↓
    Data saved to Firestore:
    • Contact → leads collection
    • Design → designs collection
    ↓

Step 3: Internal Processing
    MMO-Team system receives notification
    ↓
    Lead assigned to sales team member
    ↓
    Sales contacts client
    ↓

Step 4: Project Creation
    Drawing team reviews design
    ↓
    Quotation team prepares estimate
    ↓
    Quote saved to Firestore → quotes collection
    ↓

Step 5: Client Review
    Client receives quote notification
    ↓
    Views quote in their dashboard (Office Dream Builder)
    ↓
    Approves or requests changes
    ↓

Step 6: Execution
    MMO-Team tracks project progress
    ↓
    Updates synced to client dashboard
    ↓
    Site engineers execute work
    ↓

Step 7: Completion
    Project marked complete
    ↓
    Client receives final delivery
    ↓
    Payment processed through accounts team
```

---

### 2. Internal Team Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTERNAL TEAM WORKFLOW                        │
└─────────────────────────────────────────────────────────────────┘

SUPER ADMIN
    ↓
    Manages entire system
    • Creates team members
    • Assigns roles
    • Views all reports
    • Monitors performance
    ↓

SALES GENERAL MANAGER
    ↓
    Oversees sales operations
    • Views all leads
    • Assigns leads to team
    • Tracks team performance
    • Reviews reports
    ↓

SALES TEAM MEMBER
    ↓
    Works on assigned leads
    • Contacts potential clients
    • Schedules site visits
    • Creates project entries
    • Requests quotes
    ↓
    └──────────────────────────────┐
                                   ↓
    ┌──────────────────────────────┴────────────────────────────┐
    │                                                            │
    ▼                              ▼                            ▼
DRAWING TEAM                 QUOTATION TEAM              SITE ENGINEER
    │                              │                            │
    • Reviews design             • Prepares quotes           • Visits sites
    • Creates 2D/3D              • Uses item catalog         • Takes measurements
    • Provides layouts           • Calculates pricing        • Provides feedback
    │                              │                            │
    └──────────────────────────────┴────────────────────────────┘
                                   │
                                   ▼
                            PROJECT APPROVED
                                   │
    ┌──────────────────────────────┴────────────────────────────┐
    │                              │                            │
    ▼                              ▼                            ▼
PROCUREMENT TEAM            EXECUTION TEAM               ACCOUNTS TEAM
    │                              │                            │
    • Orders materials            • Manages workers           • Tracks payments
    • Vendor management           • Executes project          • Generates invoices
    • Quality check               • Site supervision          • Expense claims
    │                              │                            │
    └──────────────────────────────┴────────────────────────────┘
                                   │
                                   ▼
                          PROJECT COMPLETION
```

---

## Component Architecture

### Office Dream Builder Structure

```
office-dream-builder/
│
├── src/
│   │
│   ├── pages/                    # Route Components
│   │   ├── Index.tsx            # Landing page with hero, features
│   │   ├── Workspace.tsx        # 3D office builder (Three.js)
│   │   ├── Portfolio.tsx        # Project showcase
│   │   ├── About.tsx            # Company information
│   │   ├── Team.tsx             # Team members display
│   │   ├── Contact.tsx          # Contact form
│   │   ├── Dashboard.tsx        # Main dashboard (internal)
│   │   └── dashboard/           # Dashboard sub-pages
│   │       ├── TeamManagement.tsx
│   │       ├── AllProjects.tsx
│   │       ├── Leads.tsx
│   │       ├── Designs.tsx
│   │       ├── Quotes.tsx
│   │       └── ... (more)
│   │
│   ├── components/              # Reusable Components
│   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ... (50+ components)
│   │   │
│   │   └── internal/           # Internal-only components
│   │       └── admin/
│   │           └── UserManagement.tsx
│   │
│   ├── contexts/               # React Contexts
│   │   ├── AuthContext.tsx    # Authentication state
│   │   ├── ThemeContext.tsx   # Dark/Light mode
│   │   └── ChatContext.tsx    # Chat functionality
│   │
│   ├── config/
│   │   └── firebase.ts        # Firebase initialization
│   │
│   └── App.tsx                # Main app with routing
│
└── public/                    # Static assets
```

### MMO-Team Structure

```
MMO-Team/
│
├── components/
│   │
│   ├── dashboard/             # Dashboard Components
│   │   ├── Dashboard.tsx     # Main dashboard view
│   │   ├── Overview.tsx      # Overview widgets
│   │   ├── TeamView.tsx      # Team management
│   │   ├── ProjectsView.tsx  # Projects listing
│   │   ├── LeadsView.tsx     # Leads management
│   │   └── ... (role-specific views)
│   │
│   ├── shared/               # Shared Components
│   │   ├── Header.tsx       # Top navigation
│   │   ├── Sidebar.tsx      # Side navigation
│   │   ├── Modal.tsx        # Modal dialogs
│   │   └── ... (utilities)
│   │
│   ├── settings/            # Settings Components
│   │   └── SettingsPage.tsx
│   │
│   └── icons/               # Icon Components
│       └── IconComponents.tsx
│
├── context/                 # React Contexts
│   ├── AuthContext.tsx     # Authentication & user roles
│   └── ThemeContext.tsx    # Theme management
│
├── hooks/                  # Custom Hooks
│   └── ... (custom React hooks)
│
├── App.tsx                 # Main application
├── firebase.ts             # Firebase configuration
├── constants.ts            # Application constants
├── types.ts                # TypeScript definitions
└── index.tsx               # Entry point
```

---

## Security Architecture

### Current State (Development)

```
┌─────────────────────────────────────────────────────────────┐
│              ⚠️  DEVELOPMENT MODE - OPEN ACCESS             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Firestore Rules:                                           │
│    allow read, write: if true;                              │
│                                                              │
│  Impact:                                                     │
│    • Anyone can read/write to database                      │
│    • No authentication required                             │
│    • No role-based access control                           │
│                                                              │
│  ⚠️ ONLY FOR DEVELOPMENT - DO NOT USE IN PRODUCTION         │
└─────────────────────────────────────────────────────────────┘
```

### Recommended Production Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  PRODUCTION SECURITY LAYERS                  │
└─────────────────────────────────────────────────────────────┘

Layer 1: AUTHENTICATION
┌──────────────────────────────────────────────────────┐
│  Firebase Authentication                              │
│  • Email/Password                                     │
│  • OAuth (Google, Microsoft)                          │
│  • Session management                                 │
│  • Token validation                                   │
└──────────────────────────────────────────────────────┘
                         ↓
Layer 2: AUTHORIZATION
┌──────────────────────────────────────────────────────┐
│  Custom Claims & Roles                                │
│  • Internal users: role-based access                  │
│  • Client users: project-based access                 │
│  • Admin users: full access                           │
└──────────────────────────────────────────────────────┘
                         ↓
Layer 3: FIRESTORE RULES
┌──────────────────────────────────────────────────────┐
│  Database Security Rules                              │
│  • Read/Write permissions by role                     │
│  • Data validation                                    │
│  • Field-level security                               │
└──────────────────────────────────────────────────────┘
                         ↓
Layer 4: STORAGE RULES
┌──────────────────────────────────────────────────────┐
│  File Upload Security                                 │
│  • Size limits                                        │
│  • File type validation                               │
│  • User-specific folders                              │
└──────────────────────────────────────────────────────┘
                         ↓
Layer 5: API SECURITY
┌──────────────────────────────────────────────────────┐
│  Cloud Functions (Optional)                           │
│  • Server-side validation                             │
│  • Business logic enforcement                         │
│  • Rate limiting                                      │
│  • Sensitive operations                               │
└──────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

### Development Environment

```
┌────────────────────┐         ┌────────────────────┐
│  Local Machine     │         │  Local Machine     │
│                    │         │                    │
│  MMO-Team         │         │  Office Dream      │
│  localhost:5173   │         │  Builder           │
│                    │         │  localhost:5174    │
└─────────┬──────────┘         └──────────┬─────────┘
          │                               │
          └───────────────┬───────────────┘
                          ↓
                  ┌───────────────┐
                  │   Firebase    │
                  │   (Dev)       │
                  │ kurchi-app    │
                  └───────────────┘
```

### Production Environment (Recommended)

```
┌──────────────────────────────────────────────────────────────┐
│                     INTERNET                                  │
└──────────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┴────────────────┐
          │                                │
          ▼                                ▼
┌─────────────────────┐        ┌────────────────────────┐
│  Client App         │        │  Internal App          │
│  (Public Access)    │        │  (Protected Access)    │
├─────────────────────┤        ├────────────────────────┤
│                     │        │                        │
│  Hosting:           │        │  Hosting:              │
│  • Netlify          │        │  • Private Hosting     │
│  • Vercel           │        │  • VPN Required        │
│  • Firebase Hosting │        │  • IP Whitelist        │
│                     │        │                        │
│  Domain:            │        │  Domain:               │
│  officedream.com    │        │  internal.company.com  │
│                     │        │                        │
│  SSL: Auto          │        │  SSL: Required         │
└──────────┬──────────┘        └───────────┬────────────┘
           │                               │
           └───────────────┬───────────────┘
                           ↓
                  ┌─────────────────┐
                  │  Cloud Functions │
                  │  (Optional API)  │
                  └────────┬─────────┘
                           ↓
                  ┌─────────────────┐
                  │   Firebase      │
                  │   (Production)  │
                  ├─────────────────┤
                  │ • Firestore     │
                  │ • Auth          │
                  │ • Storage       │
                  │ • Analytics     │
                  └─────────────────┘
```

---

## Performance Optimization

### Caching Strategy

```
Browser Cache
    ↓
Service Worker (PWA)
    ↓
React Query Cache (Client App)
    ↓
Firestore Local Persistence
    ↓
Firebase CDN
    ↓
Firestore Database
```

### Code Splitting

```
Office Dream Builder:
    • Route-based splitting
    • Component lazy loading
    • Three.js dynamic import
    • UI components on-demand

MMO-Team:
    • Role-based dashboard splitting
    • Feature-based chunks
    • Icon lazy loading
```

---

## Monitoring & Analytics

```
┌─────────────────────────────────────────────────────────┐
│                   MONITORING STACK                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Firebase Analytics                                      │
│  • User engagement                                       │
│  • Feature usage                                         │
│  • Conversion tracking                                   │
│                                                          │
│  Firestore Monitoring                                    │
│  • Read/Write operations                                 │
│  • Query performance                                     │
│  • Storage usage                                         │
│                                                          │
│  Application Performance Monitoring (Future)             │
│  • Page load times                                       │
│  • API response times                                    │
│  • Error tracking                                        │
│  • User session recording                                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Scalability Considerations

### Horizontal Scaling

```
Current: Single Firebase project
    ↓
Future: Microservices approach
    ↓
┌─────────────────────────────────────────────────────┐
│                                                      │
│  Client App → API Gateway → Microservices           │
│                               ↓                      │
│                          ┌────────────┐             │
│                          │ Auth       │             │
│                          │ Service    │             │
│                          └────────────┘             │
│                          ┌────────────┐             │
│                          │ Project    │             │
│                          │ Service    │             │
│                          └────────────┘             │
│                          ┌────────────┐             │
│                          │ Quote      │             │
│                          │ Service    │             │
│                          └────────────┘             │
│                               ↓                      │
│                          Shared Database            │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

**For implementation details, see:**
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- [CONNECTION_REFERENCE.md](./CONNECTION_REFERENCE.md)
