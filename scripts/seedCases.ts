/**
 * Seed Cases (Leads & Projects) - Populates database with sample data
 * Run with: npx ts-node scripts/seedCases.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp, connectFirestoreEmulator, collection } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Use your actual Firebase config or emulator
const firebaseConfig = {
  apiKey: "AIzaSyAJr5z0XiOL-SRHA6hgM3V2NHJbN3BolPQ",
  authDomain: "kurchi-app.firebaseapp.com",
  projectId: "kurchi-app",
  storageBucket: "kurchi-app.firebasestorage.app",
  messagingSenderId: "140677067488",
  appId: "1:140677067488:web:803d5ec5f091bdfc015685"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Comment these lines if you want to use production Firebase instead of emulator
// connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
// connectFirestoreEmulator(db, '127.0.0.1', 8080);

const ORG_ID = 'org-test';

// Sample Leads (Cases with isProject = false)
const sampleLeads = [
  {
    id: 'lead-1',
    title: 'Tech Office Interior Design',
    clientName: 'TechCorp Solutions',
    clientContact: { name: 'John Smith', phone: '+91-9876543210', email: 'john@techcorp.com' },
    clientAddress: 'Sector 18, Noida, UP',
    status: 'LEAD',
    priority: 'HIGH',
    isProject: false,
    assignedSales: 'user-sales',
    createdBy: 'user-admin',
    budget: { totalBudget: 2500000, approvedBudget: 0, spentAmount: 0 },
    workflow: {
      currentStage: 'LEAD',
      siteVisitDone: false,
      drawingDone: false,
      boqDone: false,
      quotationDone: false,
      paymentVerified: false,
      executionApproved: false
    },
    history: [
      {
        action: 'Lead created',
        by: 'user-admin',
        byName: 'Admin User',
        timestamp: new Date('2026-02-01T10:00:00'),
        notes: 'Initial inquiry received via website'
      }
    ]
  },
  {
    id: 'lead-2',
    title: 'Retail Showroom Fitout',
    clientName: 'Fashion Hub India',
    clientContact: { name: 'Priya Sharma', phone: '+91-9988776655', email: 'priya@fashionhub.in' },
    clientAddress: 'Saket, New Delhi',
    status: 'SITE_VISIT',
    priority: 'MEDIUM',
    isProject: false,
    assignedSales: 'user-sales',
    createdBy: 'user-admin',
    budget: { totalBudget: 1800000, approvedBudget: 0, spentAmount: 0 },
    workflow: {
      currentStage: 'SITE_VISIT',
      siteVisitDone: false,
      drawingDone: false,
      boqDone: false,
      quotationDone: false,
      paymentVerified: false,
      executionApproved: false
    },
    siteVisitDate: new Date('2026-02-10'),
    history: [
      {
        action: 'Lead created',
        by: 'user-admin',
        byName: 'Admin User',
        timestamp: new Date('2026-01-28T14:30:00'),
        notes: 'Client called directly'
      },
      {
        action: 'Site visit scheduled',
        by: 'user-sales',
        byName: 'Sales User',
        timestamp: new Date('2026-02-02T11:15:00'),
        notes: 'Scheduled for Feb 10, 2026'
      }
    ]
  },
  {
    id: 'lead-3',
    title: 'Restaurant Interior Design',
    clientName: 'Spice Garden',
    clientContact: { name: 'Rahul Gupta', phone: '+91-9123456789', email: 'rahul@spicegarden.com' },
    clientAddress: 'Connaught Place, Delhi',
    status: 'DRAWING',
    priority: 'HIGH',
    isProject: false,
    assignedSales: 'user-sales',
    createdBy: 'user-admin',
    budget: { totalBudget: 3200000, approvedBudget: 0, spentAmount: 0 },
    workflow: {
      currentStage: 'DRAWING',
      siteVisitDone: true,
      drawingDone: false,
      boqDone: false,
      quotationDone: false,
      paymentVerified: false,
      executionApproved: false
    },
    history: [
      {
        action: 'Lead created',
        by: 'user-admin',
        byName: 'Admin User',
        timestamp: new Date('2026-01-25T09:00:00'),
        notes: 'Referred by existing client'
      },
      {
        action: 'Site visit completed',
        by: 'user-engineer',
        byName: 'Site Engineer',
        timestamp: new Date('2026-01-30T16:00:00'),
        notes: 'Measurements taken, photos captured'
      },
      {
        action: 'Drawing started',
        by: 'user-drawing',
        byName: 'Drawing User',
        timestamp: new Date('2026-02-03T10:30:00'),
        notes: 'Initial sketches in progress'
      }
    ]
  }
];

// Sample Projects (Cases with isProject = true)
const sampleProjects = [
  {
    id: 'project-1',
    title: 'Corporate Office Interior - Phase 1',
    clientName: 'Nexus Technologies',
    clientContact: { name: 'Amit Kumar', phone: '+91-9871234567', email: 'amit@nexustech.com' },
    clientAddress: 'Gurgaon Cyber City, Haryana',
    status: 'EXECUTION',
    priority: 'HIGH',
    isProject: true,
    assignedSales: 'user-sales',
    projectHead: 'user-engineer',
    createdBy: 'user-admin',
    budget: { totalBudget: 5500000, approvedBudget: 5500000, spentAmount: 1200000 },
    workflow: {
      currentStage: 'EXECUTION',
      siteVisitDone: true,
      drawingDone: true,
      boqDone: true,
      quotationDone: true,
      paymentVerified: true,
      executionApproved: true
    },
    progress: 35,
    startDate: new Date('2026-01-15'),
    expectedEndDate: new Date('2026-04-15'),
    history: [
      {
        action: 'Project initiated',
        by: 'user-admin',
        byName: 'Admin User',
        timestamp: new Date('2026-01-15T09:00:00'),
        notes: 'Advance payment received, execution started'
      },
      {
        action: 'Milestone 1 completed',
        by: 'user-engineer',
        byName: 'Site Engineer',
        timestamp: new Date('2026-01-25T15:30:00'),
        notes: 'Demolition and false ceiling work completed'
      }
    ]
  },
  {
    id: 'project-2',
    title: 'Co-working Space Design',
    clientName: 'WorkHub India',
    clientContact: { name: 'Sneha Verma', phone: '+91-9765432109', email: 'sneha@workhub.in' },
    clientAddress: 'Koramangala, Bangalore',
    status: 'EXECUTION',
    priority: 'MEDIUM',
    isProject: true,
    assignedSales: 'user-sales',
    projectHead: 'user-engineer',
    createdBy: 'user-admin',
    budget: { totalBudget: 4200000, approvedBudget: 4200000, spentAmount: 2800000 },
    workflow: {
      currentStage: 'EXECUTION',
      siteVisitDone: true,
      drawingDone: true,
      boqDone: true,
      quotationDone: true,
      paymentVerified: true,
      executionApproved: true
    },
    progress: 65,
    startDate: new Date('2026-01-05'),
    expectedEndDate: new Date('2026-03-20'),
    history: [
      {
        action: 'Project started',
        by: 'user-admin',
        byName: 'Admin User',
        timestamp: new Date('2026-01-05T10:00:00'),
        notes: 'Full payment plan approved'
      },
      {
        action: 'Milestone 2 completed',
        by: 'user-engineer',
        byName: 'Site Engineer',
        timestamp: new Date('2026-02-01T14:00:00'),
        notes: 'Electrical and plumbing work done'
      }
    ]
  }
];

async function seedCases() {
  console.log('🌱 Starting case seeding for organization:', ORG_ID);

  try {
    // Ensure organization exists
    await setDoc(doc(db, 'organizations', ORG_ID), {
      name: 'Test Organization',
      createdAt: serverTimestamp(),
    }, { merge: true });
    console.log('✅ Organization ensured');

    // Seed Leads
    console.log('\n📝 Seeding Leads...');
    for (const lead of sampleLeads) {
      const caseRef = doc(db, 'organizations', ORG_ID, 'cases', lead.id);
      await setDoc(caseRef, {
        ...lead,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log(`  ✅ Lead: ${lead.title} (${lead.status})`);
    }

    // Seed Projects
    console.log('\n🏗️  Seeding Projects...');
    for (const project of sampleProjects) {
      const caseRef = doc(db, 'organizations', ORG_ID, 'cases', project.id);
      await setDoc(caseRef, {
        ...project,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log(`  ✅ Project: ${project.title} (${project.progress}% complete)`);
    }

    console.log('\n✅ Case seeding complete!');
    console.log(`\n📊 Summary:`);
    console.log(`  - Leads: ${sampleLeads.length}`);
    console.log(`  - Projects: ${sampleProjects.length}`);
    console.log(`  - Total Cases: ${sampleLeads.length + sampleProjects.length}`);
    
  } catch (error: any) {
    console.error('❌ Error seeding cases:', error);
    throw error;
  }
  
  process.exit(0);
}

seedCases();
