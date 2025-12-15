<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Make My Office - Internal Management System

**Internal team application** for managing projects, leads, teams, and operations.

This is the **backend/internal** system that connects to the [Office Dream Builder](./office-dream-builder) client-facing application.

## 🔗 Connected Applications

This workspace contains **TWO** interconnected applications:

1. **MMO-Team** (This app) - Internal management system for team members
2. **[Office Dream Builder](./office-dream-builder)** - Client-facing website and workspace builder

Both applications share the same Firebase backend and data.

📚 **See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** for complete integration documentation  
📚 **See [CONNECTION_REFERENCE.md](./CONNECTION_REFERENCE.md)** for connection points and data flow

## 🚀 Quick Start

### Run This App Only

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key (optional)

3. Run the app:
   ```bash
   npm run dev
   ```

4. Open http://localhost:5173

### Run Both Applications

Use the provided scripts to run both apps simultaneously:

**Windows (Batch):**
```bash
start-both-apps.bat
```

**Windows (PowerShell):**
```powershell
.\start-both-apps.ps1
```

**Manual:**
```bash
# Terminal 1 - Internal App
npm run dev

# Terminal 2 - Client App
cd office-dream-builder
npm run dev
```

## 📦 What's Included

- **Role-based dashboards** for different team members
- **Team management** system
- **Project tracking** and oversight
- **Lead management** with assignment
- **Communication hub** for internal messaging
- **Reports & Analytics** for performance tracking
- **AI Integration** with Gemini API

## 🔐 User Roles

- Super Admin
- Sales General Manager
- Sales Team Member
- Drawing Team
- Quotation Team
- Site Engineer
- Procurement Team
- Execution Team
- Accounts Team

## 🛠️ Tech Stack

- React 19.2.0
- TypeScript 5.8.2
- Vite 6.2.0
- Firebase 12.4.0
- Google Gemini AI

## 📖 Documentation

- [Integration Guide](./INTEGRATION_GUIDE.md) - Complete integration documentation
- [Connection Reference](./CONNECTION_REFERENCE.md) - Data flow and connection points
- [AI Studio](https://ai.studio/apps/drive/1MJYuS3qfjsdawerGoOORg0XNNsG7Kboa) - Original AI Studio app

## 🔥 Firebase Setup

Both applications use Firebase for:
- Authentication (when implemented)
- Firestore Database
- Cloud Storage
- Analytics

**Project ID:** `kurchi-app`

⚠️ **Note:** Currently using open Firestore rules for development. See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md#security-considerations) for production security recommendations.

## 📁 Project Structure

```
MMO-Team/
├── components/              # UI Components
│   ├── shared/             # Shared components
│   ├── dashboard/          # Dashboard components
│   └── icons/              # Icon components
├── context/                # React contexts (Auth, Theme)
├── hooks/                  # Custom React hooks
├── office-dream-builder/   # Client-facing application
├── App.tsx                 # Main application
├── firebase.ts             # Firebase configuration
├── types.ts                # TypeScript definitions
├── start-both-apps.bat     # Launch script (Windows)
├── start-both-apps.ps1     # Launch script (PowerShell)
├── INTEGRATION_GUIDE.md    # Integration documentation
└── CONNECTION_REFERENCE.md # Connection reference
```

## 🤝 Contributing

This is an internal project for The Real V Developers team.

## 📄 License

Private - Internal Use Only
