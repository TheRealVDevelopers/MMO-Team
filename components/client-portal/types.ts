/**
 * Client Portal Types
 * TypeScript interfaces for the gamified client dashboard experience
 */

// Role types for team members
export type ResponsibleRole = 'consultant' | 'designer' | 'engineer' | 'factory' | 'installer' | 'accounts';

// Stage status for journey nodes
export type StageStatus = 'completed' | 'in-progress' | 'locked' | 'issue';

// Output types for stage deliverables
export type OutputType = 'render' | 'document' | 'photo' | 'video';

// Client action types
export type ClientAction = 'view' | 'comment' | 'approve' | 'question';

// Activity types for the live feed
export type ActivityType = 'upload' | 'approval' | 'site_visit' | 'progress' | 'payment' | 'stage_change' | 'message';

// Project health status
export type ProjectHealth = 'on-track' | 'minor-delay' | 'at-risk';

// Request types for client requests
export type RequestType = 'question' | 'concern' | 'change_request' | 'approval';

// Request status
export type RequestStatus = 'open' | 'acknowledged' | 'in-progress' | 'resolved';

/**
 * Stage output/deliverable
 */
export interface StageOutput {
    id: string;
    name: string;
    type: OutputType;
    url: string;
    thumbnail?: string;
    uploadedAt: Date;
    uploadedBy: string;
}

/**
 * Enhanced journey stage for the interactive map
 */
export interface JourneyStage {
    id: number;
    name: string;
    description: string;
    status: StageStatus;
    responsibleRole: ResponsibleRole;
    assigneeName?: string;
    assigneeAvatar?: string;
    startDate?: Date;
    expectedEndDate?: Date;
    actualEndDate?: Date;
    outputs?: StageOutput[];
    clientActions?: ClientAction[];
    notes?: string;
    progressPercent?: number;
}

/**
 * Activity item for the live feed
 */
export interface ActivityItem {
    id: string;
    type: ActivityType;
    title: string;
    description?: string;
    timestamp: Date;
    actor: string;
    actorRole: ResponsibleRole;
    actorAvatar?: string;
    metadata?: Record<string, any>;
    stageId?: number;
}

/**
 * Payment milestone linked to project stages
 */
export interface PaymentMilestone {
    id: string;
    stageName: string;
    stageId: number;
    amount: number;
    percentage: number;
    isPaid: boolean;
    paidAt?: Date;
    dueDate?: Date;
    unlocksStage: number;
    description?: string;
}

/**
 * Message in a client request thread
 */
export interface RequestMessage {
    id: string;
    sender: 'client' | 'company';
    senderName: string;
    senderAvatar?: string;
    message: string;
    timestamp: Date;
    attachments?: StageOutput[];
}

/**
 * Client request (enhanced version of issues)
 */
export interface ClientRequest {
    id: string;
    type: RequestType;
    title: string;
    description: string;
    status: RequestStatus;
    owner?: string;
    ownerRole?: ResponsibleRole;
    ownerAvatar?: string;
    eta?: Date;
    priority: 'low' | 'medium' | 'high';
    createdAt: Date;
    updatedAt: Date;
    conversation: RequestMessage[];
    relatedStageId?: number;
}

/**
 * Delay information for transparency panel
 */
export interface DelayInfo {
    stageId: number;
    stageName: string;
    days: number;
    reason: string;
    resolvedAt?: Date;
}

/**
 * Next action indicator
 */
export interface NextAction {
    actor: 'client' | 'company';
    actorRole?: ResponsibleRole;
    action: string;
    description?: string;
    deadline?: Date;
    stageId?: number;
}

/**
 * Transparency panel data
 */
export interface TransparencyData {
    totalDurationDays: number;
    daysCompleted: number;
    daysRemaining: number;
    projectHealth: ProjectHealth;
    healthReason?: string;
    delays: DelayInfo[];
    nextAction: NextAction;
    estimatedCompletion: Date;
    originalCompletion?: Date;
}

/**
 * Complete client project data
 */
export interface ClientProject {
    projectId: string;
    clientName: string;
    clientEmail: string;
    projectType: string;
    projectName?: string;
    area: string;
    budget: string;
    startDate: Date;
    expectedCompletion: Date;
    currentStageId: number;
    stages: JourneyStage[];
    consultant: {
        id: string;
        name: string;
        phone: string;
        email: string;
        avatar?: string;
    };
    paymentMilestones: PaymentMilestone[];
    activities: ActivityItem[];
    requests: ClientRequest[];
    transparency: TransparencyData;
    documents: ClientDocument[]; // Added for Documents Archive
    totalPaid: number;
    totalBudget: number;
}

export interface ClientDocument {
    id: string;
    name: string;
    category: 'Contract' | 'Invoice' | 'Report' | 'Drawing' | 'Other';
    date: Date;
    size: string;
    url: string;
}

/**
 * Role configuration for avatars
 */
export interface RoleConfig {
    role: ResponsibleRole;
    label: string;
    color: string;
    bgColor: string;
    icon: string;
}

export const ROLE_CONFIGS: Record<ResponsibleRole, RoleConfig> = {
    consultant: {
        role: 'consultant',
        label: 'Sales Consultant',
        color: '#6366F1',
        bgColor: '#EEF2FF',
        icon: 'briefcase'
    },
    designer: {
        role: 'designer',
        label: 'Designer',
        color: '#EC4899',
        bgColor: '#FDF2F8',
        icon: 'paintbrush'
    },
    engineer: {
        role: 'engineer',
        label: 'Site Engineer',
        color: '#F59E0B',
        bgColor: '#FFFBEB',
        icon: 'hardhat'
    },
    factory: {
        role: 'factory',
        label: 'Manufacturing',
        color: '#10B981',
        bgColor: '#ECFDF5',
        icon: 'building'
    },
    installer: {
        role: 'installer',
        label: 'Installation Team',
        color: '#3B82F6',
        bgColor: '#EFF6FF',
        icon: 'wrench'
    },
    accounts: {
        role: 'accounts',
        label: 'Accounts',
        color: '#8B5CF6',
        bgColor: '#F5F3FF',
        icon: 'calculator'
    }
};
