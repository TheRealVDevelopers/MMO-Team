/**
 * Migration Script: Migrate All Leads and Projects to Cases Collection
 * 
 * This script will:
 * 1. Read all documents from 'leads' collection
 * 2. Read all documents from 'projects' collection
 * 3. Convert them to Case format
 * 4. Save to 'cases' collection
 * 5. Keep original documents intact (no deletion)
 */

import { db } from '../firebase';
import {
    collection,
    getDocs,
    doc,
    setDoc,
    Timestamp
} from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../constants';

// Helper function to safely convert Firestore Timestamp to Date
const safeToDate = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (timestamp?.toDate) return timestamp.toDate();
    if (timestamp?.seconds) return new Date(timestamp.seconds * 1000);
    return new Date();
};

// Helper function to remove undefined fields (Firestore doesn't allow undefined)
const removeUndefinedFields = (obj: any): any => {
    const cleaned: any = {};
    
    for (const key in obj) {
        if (obj[key] !== undefined) {
            if (obj[key] && typeof obj[key] === 'object' && !(obj[key] instanceof Date) && !(obj[key] instanceof Timestamp)) {
                // Recursively clean nested objects
                if (Array.isArray(obj[key])) {
                    cleaned[key] = obj[key];
                } else {
                    cleaned[key] = removeUndefinedFields(obj[key]);
                }
            } else {
                cleaned[key] = obj[key];
            }
        }
    }
    
    return cleaned;
};

// Convert Lead to Case
const leadToCase = (leadData: any, id: string): any => {
    const caseData: any = {
        id: id,
        isProject: false, // Lead
        
        // Core Info
        clientName: leadData.clientName || 'Unknown Client',
        projectName: leadData.projectName || 'Unnamed Project',
        organizationId: leadData.organizationId || '',
        contact: {
            name: leadData.clientName || '',
            phone: leadData.clientMobile || leadData.contact?.phone || '',
            email: leadData.clientEmail || leadData.contact?.email || ''
        },
        
        // Status
        status: leadData.status || 'NEW_NOT_CONTACTED',
        priority: leadData.priority || 'Medium',
        
        // Lead-specific fields
        value: leadData.value || 0,
        source: leadData.source || '',
        assignedTo: leadData.assignedTo || leadData.salespersonId || '',
        inquiryDate: safeToDate(leadData.inquiryDate),
        lastContacted: leadData.lastContacted || '',
        clientEmail: leadData.clientEmail || '',
        reminders: leadData.reminders || [],
        tasks: leadData.tasks || {},
        currentStage: leadData.currentStage || '',
        communicationMessages: leadData.communicationMessages || [],
        files: leadData.files || [],
        
        // Metadata
        createdBy: leadData.createdBy || leadData.salespersonId || 'system',
        createdAt: safeToDate(leadData.inquiryDate || leadData.createdAt),
        updatedAt: safeToDate(leadData.updatedAt),
        history: leadData.history || [],
        
        // Additional fields
        quotationStatus: 'NONE',
        notes: leadData.notes || ''
    };
    
    // Only add deadline if it exists
    if (leadData.deadline) {
        caseData.deadline = safeToDate(leadData.deadline);
    }
    
    return caseData;
};

// Convert Project to Case
const projectToCase = (projectData: any, id: string): any => {
    const caseData: any = {
        id: id,
        isProject: true, // Project
        
        // Core Info
        clientName: projectData.clientName || 'Unknown Client',
        projectName: projectData.projectName || 'Unnamed Project',
        organizationId: projectData.organizationId || '',
        contact: {
            name: projectData.clientContact?.name || projectData.clientName || '',
            phone: projectData.clientContact?.phone || '',
            email: projectData.clientContact?.email || ''
        },
        
        // Status
        status: projectData.status || 'SITE_VISIT_PENDING',
        priority: projectData.priority || 'Medium',
        
        // Project-specific fields
        budget: projectData.budget || 0,
        advancePaid: projectData.advancePaid || 0,
        progress: projectData.progress || 0,
        assignedTeam: projectData.assignedTeam || {},
        milestones: projectData.milestones || [],
        stages: projectData.stages || [],
        
        // Shared from lead
        value: projectData.budget || 0,
        inquiryDate: projectData.startDate ? safeToDate(projectData.startDate) : new Date(),
        
        // Metadata
        createdBy: projectData.createdBy || 'system',
        createdAt: safeToDate(projectData.createdAt || projectData.startDate),
        updatedAt: safeToDate(projectData.updatedAt),
        history: projectData.history || [],
        
        // Additional fields
        quotationStatus: projectData.quotationStatus || 'NONE',
        clientAddress: projectData.clientAddress || '',
        items: projectData.items || [],
        notes: projectData.notes || ''
    };
    
    // Only add optional date fields if they exist
    if (projectData.startDate) {
        caseData.startDate = safeToDate(projectData.startDate);
    }
    if (projectData.endDate) {
        caseData.endDate = safeToDate(projectData.endDate);
    }
    if (projectData.deadline) {
        caseData.deadline = safeToDate(projectData.deadline);
    } else if (projectData.endDate) {
        caseData.deadline = safeToDate(projectData.endDate);
    }
    
    return caseData;
};

// Convert Case object to Firestore format (Dates to Timestamps)
const caseToFirestore = (caseData: any): any => {
    const firestoreData: any = { ...caseData };
    
    // Convert Date fields to Timestamp
    if (caseData.inquiryDate instanceof Date) {
        firestoreData.inquiryDate = Timestamp.fromDate(caseData.inquiryDate);
    }
    if (caseData.createdAt instanceof Date) {
        firestoreData.createdAt = Timestamp.fromDate(caseData.createdAt);
    }
    if (caseData.updatedAt instanceof Date) {
        firestoreData.updatedAt = Timestamp.fromDate(caseData.updatedAt);
    }
    if (caseData.startDate instanceof Date) {
        firestoreData.startDate = Timestamp.fromDate(caseData.startDate);
    }
    if (caseData.endDate instanceof Date) {
        firestoreData.endDate = Timestamp.fromDate(caseData.endDate);
    }
    if (caseData.deadline instanceof Date) {
        firestoreData.deadline = Timestamp.fromDate(caseData.deadline);
    }
    if (caseData.convertedToProjectAt instanceof Date) {
        firestoreData.convertedToProjectAt = Timestamp.fromDate(caseData.convertedToProjectAt);
    }
    
    // Remove any undefined fields (Firestore doesn't allow them)
    return removeUndefinedFields(firestoreData);
};

export const migrateAllToCases = async () => {
    console.log('🚀 Starting migration of leads and projects to cases collection...');
    
    let migratedLeads = 0;
    let migratedProjects = 0;
    let errors = 0;
    
    try {
        // Migrate Leads
        console.log('📋 Fetching leads...');
        const leadsSnapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.LEADS));
        console.log(`Found ${leadsSnapshot.size} leads to migrate`);
        
        for (const leadDoc of leadsSnapshot.docs) {
            try {
                const leadData = leadDoc.data();
                const caseData = leadToCase(leadData, leadDoc.id);
                const firestoreData = caseToFirestore(caseData);
                
                // Validate no undefined values before saving
                const hasUndefined = Object.entries(firestoreData).find(([key, value]) => value === undefined);
                if (hasUndefined) {
                    throw new Error(`Field "${hasUndefined[0]}" has undefined value`);
                }
                
                const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, leadDoc.id);
                await setDoc(caseRef, firestoreData);
                
                migratedLeads++;
                console.log(`✅ Migrated lead: ${leadDoc.id} - ${caseData.projectName}`);
            } catch (error) {
                console.error(`❌ Failed to migrate lead ${leadDoc.id}:`, error);
                errors++;
            }
        }
        
        // Migrate Projects
        console.log('📋 Fetching projects...');
        const projectsSnapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.PROJECTS));
        console.log(`Found ${projectsSnapshot.size} projects to migrate`);
        
        for (const projectDoc of projectsSnapshot.docs) {
            try {
                const projectData = projectDoc.data();
                const caseData = projectToCase(projectData, projectDoc.id);
                const firestoreData = caseToFirestore(caseData);
                
                // Validate no undefined values before saving
                const hasUndefined = Object.entries(firestoreData).find(([key, value]) => value === undefined);
                if (hasUndefined) {
                    throw new Error(`Field "${hasUndefined[0]}" has undefined value`);
                }
                
                const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, projectDoc.id);
                await setDoc(caseRef, firestoreData);
                
                migratedProjects++;
                console.log(`✅ Migrated project: ${projectDoc.id} - ${caseData.projectName}`);
            } catch (error) {
                console.error(`❌ Failed to migrate project ${projectDoc.id}:`, error);
                errors++;
            }
        }
        
        // Summary
        console.log('\n📊 Migration Summary:');
        console.log(`✅ Successfully migrated ${migratedLeads} leads`);
        console.log(`✅ Successfully migrated ${migratedProjects} projects`);
        if (errors > 0) {
            console.log(`❌ Errors: ${errors}`);
        }
        console.log(`📦 Total cases in database: ${migratedLeads + migratedProjects}`);
        
        if (errors === 0) {
            console.log('\n🎉 Migration completed successfully with no errors!');
        } else {
            console.log('\n⚠️ Migration completed with some errors. Check console for details.');
        }
        
        return {
            success: errors === 0,
            migratedLeads,
            migratedProjects,
            errors
        };
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        return {
            success: false,
            error
        };
    }
};

// Run migration if executed directly
if (typeof window !== 'undefined') {
    (window as any).migrateAllToCases = migrateAllToCases;
    console.log('💡 Migration function loaded. Run: window.migrateAllToCases()');
}
