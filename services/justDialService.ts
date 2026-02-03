import { db } from '../firebase';
import { doc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { Lead, LeadPipelineStatus } from '../types';

// Just Dial API response interface (based on typical Just Dial API structure)
interface JustDialLead {
    id: string;
    company_name: string;
    contact_person: string;
    mobile: string;
    email?: string;
    category: string;
    city?: string;
    requirement?: string;
    budget?: string;
    source: string;
    created_at: string;
}

// Get Just Dial API key from Firestore
export const getJustDialApiKey = async (): Promise<string | null> => {
    try {
        const configRef = doc(db, 'systemConfig', 'justDial');
        const configSnap = await getDoc(configRef);
        
        if (configSnap.exists()) {
            return configSnap.data().apiKey || null;
        }
        return null;
    } catch (error) {
        console.error('Error fetching Just Dial API key:', error);
        return null;
    }
};

// Fetch leads from Just Dial API
export const fetchJustDialLeads = async (): Promise<JustDialLead[]> => {
    const apiKey = await getJustDialApiKey();
    
    if (!apiKey) {
        throw new Error('Just Dial API key not configured. Please contact system administrator.');
    }

    try {
        // NOTE: Replace with actual Just Dial API endpoint
        // This is a placeholder - you'll need to update with the actual Just Dial API URL
        const response = await fetch('https://api.justdial.com/v1/leads', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Invalid API key. Please check your Just Dial API credentials.');
            }
            throw new Error(`Failed to fetch leads: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Assuming the API returns { leads: [...] }
        // Adjust based on actual API response structure
        return data.leads || [];
    } catch (error: any) {
        console.error('Error fetching Just Dial leads:', error);
        throw error;
    }
};

// Convert Just Dial lead to our Lead type
export const convertJustDialLeadToLead = (justDialLead: JustDialLead, assignedTo?: string): Omit<Lead, 'id'> => {
    // Parse budget if available
    let budgetValue = 50000; // Default budget
    if (justDialLead.budget) {
        const budgetMatch = justDialLead.budget.match(/\d+/);
        if (budgetMatch) {
            budgetValue = parseInt(budgetMatch[0]);
        }
    }

    const lead: Omit<Lead, 'id'> = {
        clientName: justDialLead.company_name || justDialLead.contact_person || 'Unknown',
        projectName: `${justDialLead.category || 'General'} Project`,
        status: LeadPipelineStatus.NEW_NOT_CONTACTED,
        lastContacted: '',
        assignedTo: assignedTo || '', // Will be assigned later by sales manager
        inquiryDate: new Date(justDialLead.created_at || new Date()),
        value: budgetValue,
        source: 'Just Dial',
        history: [{
            action: 'Lead imported from Just Dial',
            user: 'System',
            timestamp: new Date(),
            notes: `Original Just Dial ID: ${justDialLead.id}`
        }],
        priority: 'Medium',
        clientEmail: justDialLead.email || '',
        clientMobile: justDialLead.mobile || '',
        communicationMessages: [],
        files: [],
        is_demo: false
    };

    return lead;
};

// Import Just Dial leads to Firestore
export const importJustDialLeadsToFirestore = async (
    justDialLeads: JustDialLead[],
    onProgress?: (current: number, total: number) => void
): Promise<{ success: number; failed: number; errors: string[] }> => {
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < justDialLeads.length; i++) {
        try {
            const justDialLead = justDialLeads[i];
            const leadData = convertJustDialLeadToLead(justDialLead);
            
            // Add to Firestore leads collection
            await addDoc(collection(db, 'leads'), {
                ...leadData,
                inquiryDate: Timestamp.fromDate(leadData.inquiryDate as Date),
                history: leadData.history?.map(h => ({
                    ...h,
                    timestamp: Timestamp.fromDate(h.timestamp as Date)
                })) || []
            });

            successCount++;
            
            if (onProgress) {
                onProgress(i + 1, justDialLeads.length);
            }
        } catch (error: any) {
            console.error(`Error importing lead ${justDialLeads[i].id}:`, error);
            errors.push(`Lead ${justDialLeads[i].company_name}: ${error.message}`);
            failedCount++;
        }
    }

    return {
        success: successCount,
        failed: failedCount,
        errors
    };
};

// Check if Just Dial integration is configured
export const isJustDialConfigured = async (): Promise<boolean> => {
    const apiKey = await getJustDialApiKey();
    return apiKey !== null && apiKey.length > 0;
};
