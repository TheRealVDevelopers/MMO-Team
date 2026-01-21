import React, { useState } from 'react';
import {
    ArrowRightOnRectangleIcon,
    PhoneIcon,
    EnvelopeIcon,
    ChatBubbleLeftRightIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Import client portal components
import VerticalRoadmap from '../client-portal/JourneyMap/VerticalRoadmap';
import StageBottomSheet from '../client-portal/JourneyMap/StageBottomSheet';
import TodaysWork from '../client-portal/TodaysWork';
import LiveActivityFeed from '../client-portal/ActivityFeed/LiveActivityFeed';
import PaymentWidget from '../client-portal/PaymentMilestones/PaymentWidget';
import QuickChat from '../client-portal/QuickChat';
import {
    JourneyStage,
    ActivityItem,
    PaymentMilestone,
    TransparencyData,
    ClientProject,
    ProjectHealth
} from '../client-portal/types';

interface ClientDashboardPageProps {
    projectId: string;
    onLogout: () => void;
}

// Status Badge Component
const StatusBadge: React.FC<{ health: ProjectHealth }> = ({ health }) => {
    const config = {
        'on-track': { icon: CheckCircleIcon, label: 'On Track', bg: 'bg-emerald-100', color: 'text-emerald-700' },
        'minor-delay': { icon: ClockIcon, label: 'Minor Delay', bg: 'bg-amber-100', color: 'text-amber-700' },
        'at-risk': { icon: ExclamationTriangleIcon, label: 'At Risk', bg: 'bg-red-100', color: 'text-red-700' }
    }[health];
    const Icon = config.icon;

    return (
        <div className={`inline-flex items-center gap-2 px-4 py-2 ${config.bg} rounded-full`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
            <span className={`font-semibold ${config.color}`}>{config.label}</span>
        </div>
    );
};

// Demo Data
const createDemoProject = (projectId: string): ClientProject => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30);

    const stages: JourneyStage[] = [
        {
            id: 1,
            name: 'Consultation',
            description: 'We met to understand your vision and requirements.',
            status: 'completed',
            responsibleRole: 'consultant',
            assigneeName: 'Rajesh Kumar',
            startDate: startDate,
            actualEndDate: new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000),
            outputs: [{ id: '1', name: 'Meeting Notes.pdf', type: 'document', url: '#', uploadedAt: new Date(), uploadedBy: 'Rajesh' }],
            notes: 'Requirements documented.'
        },
        {
            id: 2,
            name: 'Site Survey',
            description: 'Engineer visited to take measurements.',
            status: 'completed',
            responsibleRole: 'engineer',
            assigneeName: 'Amit Singh',
            startDate: new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000),
            actualEndDate: new Date(startDate.getTime() + 10 * 24 * 60 * 60 * 1000),
            outputs: [{ id: '2', name: 'Site Photos.zip', type: 'photo', url: '#', uploadedAt: new Date(), uploadedBy: 'Amit' }]
        },
        {
            id: 3,
            name: 'Design Phase',
            description: 'Creating 3D renders and design concepts for your workspace. Our designer is working on multiple options for you to choose from.',
            status: 'in-progress',
            responsibleRole: 'designer',
            assigneeName: 'Priya Sharma',
            startDate: new Date(startDate.getTime() + 11 * 24 * 60 * 60 * 1000),
            expectedEndDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
            progressPercent: 65,
            outputs: [
                { id: '4', name: 'Concept A.jpg', type: 'render', url: '#', uploadedAt: new Date(), uploadedBy: 'Priya' },
                { id: '5', name: 'Concept B.jpg', type: 'render', url: '#', uploadedAt: new Date(), uploadedBy: 'Priya' }
            ],
            clientActions: ['view', 'comment', 'approve'],
            notes: 'Two design options ready for review!'
        },
        {
            id: 4, name: 'Quotation', description: 'Detailed pricing breakdown.', status: 'locked', responsibleRole: 'accounts',
            expectedEndDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000)
        },
        {
            id: 5, name: 'Material Selection', description: 'Choose finishes and materials.', status: 'locked', responsibleRole: 'designer',
            expectedEndDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000)
        },
        {
            id: 6, name: 'Manufacturing', description: 'Custom furniture being made.', status: 'locked', responsibleRole: 'factory',
            expectedEndDate: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000)
        },
        {
            id: 7, name: 'Site Execution', description: 'Civil and electrical work.', status: 'locked', responsibleRole: 'engineer',
            expectedEndDate: new Date(now.getTime() + 55 * 24 * 60 * 60 * 1000)
        },
        {
            id: 8, name: 'Installation', description: 'Furniture installation.', status: 'locked', responsibleRole: 'installer',
            expectedEndDate: new Date(now.getTime() + 70 * 24 * 60 * 60 * 1000)
        },
        {
            id: 9, name: 'Handover', description: 'Final walkthrough and keys!', status: 'locked', responsibleRole: 'consultant',
            expectedEndDate: new Date(now.getTime() + 75 * 24 * 60 * 60 * 1000)
        }
    ];

    const activities: ActivityItem[] = [
        { id: '1', type: 'upload', title: 'New design uploaded', description: 'Concept B ready', timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), actor: 'Priya', actorRole: 'designer' },
        { id: '2', type: 'progress', title: 'Design 65% complete', timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000), actor: 'Priya', actorRole: 'designer' },
        { id: '3', type: 'stage_change', title: 'Site Survey completed', timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), actor: 'Amit', actorRole: 'engineer' },
        { id: '4', type: 'payment', title: 'Advance received ₹2L', timestamp: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000), actor: 'Accounts', actorRole: 'accounts' }
    ];

    const paymentMilestones: PaymentMilestone[] = [
        { id: '1', stageName: 'Token Advance', stageId: 1, amount: 200000, percentage: 10, isPaid: true, unlocksStage: 2 },
        { id: '2', stageName: 'Design Approval', stageId: 3, amount: 400000, percentage: 20, isPaid: false, dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), unlocksStage: 4 },
        { id: '3', stageName: 'Material Order', stageId: 5, amount: 600000, percentage: 30, isPaid: false, unlocksStage: 6 },
        { id: '4', stageName: 'Installation', stageId: 8, amount: 600000, percentage: 30, isPaid: false, unlocksStage: 8 },
        { id: '5', stageName: 'Handover', stageId: 9, amount: 200000, percentage: 10, isPaid: false, unlocksStage: 9 }
    ];

    const transparency: TransparencyData = {
        totalDurationDays: 75, daysCompleted: 30, daysRemaining: 45,
        projectHealth: 'on-track', delays: [],
        nextAction: { actor: 'client', action: 'Review design concepts', deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000) },
        estimatedCompletion: new Date(now.getTime() + 75 * 24 * 60 * 60 * 1000)
    };

    return {
        projectId, clientName: 'John Doe', clientEmail: projectId,
        projectType: 'Office Interior', projectName: 'Premium Workspace',
        area: '2,000 sq ft', budget: '₹20 Lakhs', startDate,
        expectedCompletion: new Date(now.getTime() + 75 * 24 * 60 * 60 * 1000),
        currentStageId: 3, stages, consultant: { id: 'c1', name: 'Rajesh Kumar', phone: '+91 98765 43210', email: 'rajesh@makemyoffice.com' },
        paymentMilestones, activities, requests: [], transparency,
        totalPaid: 200000, totalBudget: 2000000
    };
};

const ClientDashboardPage: React.FC<ClientDashboardPageProps> = ({ projectId, onLogout }) => {
    const [project] = useState<ClientProject>(() => createDemoProject(projectId));
    const [selectedStage, setSelectedStage] = useState<JourneyStage | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const handleStageClick = (stage: JourneyStage) => {
        setSelectedStage(stage);
        setIsSheetOpen(true);
    };

    const currentStage = project.stages.find(s => s.id === project.currentStageId)!;
    const paidMilestoneCount = project.paymentMilestones.filter(m => m.isPaid).length;
    const unlockedUntilStage = paidMilestoneCount > 0 ? project.paymentMilestones[paidMilestoneCount - 1].unlocksStage + 1 : 2;

    return (
        <div className="min-h-screen bg-gray-50">

            {/* ============================================ */}
            {/* HEADER - Simple */}
            {/* ============================================ */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <img src="/mmo-logo.png" alt="Make My Office" className="h-8" />
                    <button onClick={onLogout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </header>

            {/* ============================================ */}
            {/* HERO - Project Info */}
            {/* ============================================ */}
            <section className="bg-white border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Left - Project Info */}
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{project.projectName}</h1>
                            <p className="text-gray-500 mt-1">Welcome, {project.clientName}</p>
                            <div className="flex flex-wrap gap-3 mt-3">
                                <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700">{project.area}</span>
                                <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700">{project.budget}</span>
                                <span className="px-3 py-1.5 bg-emerald-50 rounded-lg text-sm text-emerald-700">
                                    Due: {project.expectedCompletion.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                        </div>

                        {/* Right - Status & Project Head */}
                        <div className="flex items-center gap-4">
                            <StatusBadge health={project.transparency.projectHealth} />

                            <div className="hidden md:flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                                    {project.consultant.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Project Head</p>
                                    <p className="font-semibold text-gray-800">{project.consultant.name}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <a href={`tel:${project.consultant.phone}`} className="text-xs text-primary hover:underline">
                                            📞 {project.consultant.phone}
                                        </a>
                                    </div>
                                    <a href={`mailto:${project.consultant.email}`} className="text-xs text-primary hover:underline block mt-0.5">
                                        ✉️ Email
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================ */}
            {/* MAIN CONTENT - Reorganized */}
            {/* ============================================ */}
            <main className="max-w-6xl mx-auto px-4 py-6">

                {/* ROW 1: Today's Work + Live Updates (Side by Side) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Today's Work */}
                    <TodaysWork currentStage={currentStage} />

                    {/* Live Updates - Compact */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <h3 className="font-bold text-gray-800">Live Updates</h3>
                            </div>
                        </div>
                        <div className="space-y-3 max-h-[150px] overflow-y-auto">
                            {project.activities.slice(0, 3).map((activity) => (
                                <div key={activity.id} className="flex items-center gap-3 text-sm">
                                    <span className="text-lg">
                                        {activity.type === 'upload' ? '📤' :
                                            activity.type === 'payment' ? '💰' :
                                                activity.type === 'progress' ? '📈' : '✅'}
                                    </span>
                                    <span className="flex-1 text-gray-700">{activity.title}</span>
                                    <span className="text-xs text-gray-400">
                                        {Math.floor((Date.now() - new Date(activity.timestamp).getTime()) / 3600000)}h
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ROW 2: Need Help Button (Prominent) */}
                <div className="mb-6">
                    <button className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 text-primary font-medium rounded-xl transition-all">
                        <ChatBubbleLeftRightIcon className="w-5 h-5" />
                        Need Help? Ask a Question
                    </button>
                </div>

                {/* ROW 3: Roadmap + Payments (Side by Side) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Roadmap - Takes 2 columns */}
                    <div className="lg:col-span-2">
                        <VerticalRoadmap
                            stages={project.stages}
                            currentStageId={project.currentStageId}
                            onStageClick={handleStageClick}
                            unlockedUntilStage={unlockedUntilStage}
                        />
                    </div>

                    {/* Payments */}
                    <div>
                        <PaymentWidget
                            milestones={project.paymentMilestones}
                            totalPaid={project.totalPaid}
                            totalBudget={project.totalBudget}
                        />

                        {/* Quick Chat Widget */}
                        <div className="mt-6">
                            <QuickChat projectHeadName={project.consultant.name} />
                        </div>

                        {/* Project Head Card - Mobile */}
                        <div className="mt-6 md:hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Project Head</p>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                                    {project.consultant.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">{project.consultant.name}</p>
                                    <a href={`tel:${project.consultant.phone}`} className="text-sm text-primary">{project.consultant.phone}</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* ============================================ */}
            {/* STAGE DETAIL BOTTOM SHEET */}
            {/* ============================================ */}
            <StageBottomSheet
                stage={selectedStage}
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
            />
        </div>
    );
};

export default ClientDashboardPage;
