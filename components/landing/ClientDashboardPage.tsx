import React, { useState } from 'react';
import {
    ArrowRightOnRectangleIcon,
    PhoneIcon,
    EnvelopeIcon,
    ChatBubbleLeftRightIcon,
    PlusIcon
} from '@heroicons/react/24/outline';

// Import simplified client portal components
import GameRoadmap from '../client-portal/JourneyMap/GameRoadmap';
import StageBottomSheet from '../client-portal/JourneyMap/StageBottomSheet';
import SimpleStatusPanel from '../client-portal/TransparencyPanel/SimpleStatusPanel';
import PaymentWidget from '../client-portal/PaymentMilestones/PaymentWidget';
import LiveActivityFeed from '../client-portal/ActivityFeed/LiveActivityFeed';
import {
    JourneyStage,
    ActivityItem,
    PaymentMilestone,
    TransparencyData,
    ClientProject
} from '../client-portal/types';

interface ClientDashboardPageProps {
    projectId: string;
    onLogout: () => void;
}

// Demo Data
const createDemoProject = (projectId: string): ClientProject => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30);

    const stages: JourneyStage[] = [
        {
            id: 1,
            name: 'Consultation',
            description: 'We met to understand your vision, requirements, and expectations for your workspace.',
            status: 'completed',
            responsibleRole: 'consultant',
            assigneeName: 'Rajesh Kumar',
            startDate: startDate,
            actualEndDate: new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000),
            outputs: [{ id: '1', name: 'Meeting Notes.pdf', type: 'document', url: '#', uploadedAt: new Date(), uploadedBy: 'Rajesh' }],
            notes: 'All requirements documented and approved.'
        },
        {
            id: 2,
            name: 'Site Survey',
            description: 'Our engineer visited your site to take measurements and assess the space.',
            status: 'completed',
            responsibleRole: 'engineer',
            assigneeName: 'Amit Singh',
            startDate: new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000),
            actualEndDate: new Date(startDate.getTime() + 10 * 24 * 60 * 60 * 1000),
            outputs: [
                { id: '2', name: 'Site Photos.zip', type: 'photo', url: '#', uploadedAt: new Date(), uploadedBy: 'Amit' },
                { id: '3', name: 'Measurements.pdf', type: 'document', url: '#', uploadedAt: new Date(), uploadedBy: 'Amit' }
            ],
            notes: 'Site survey completed successfully.'
        },
        {
            id: 3,
            name: 'Design Phase',
            description: 'Our designers are creating 3D renders and concepts based on your requirements.',
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
            notes: 'Two design options ready for your review!'
        },
        {
            id: 4,
            name: 'Quotation',
            description: 'Detailed pricing and cost breakdown for your project.',
            status: 'locked',
            responsibleRole: 'accounts',
            expectedEndDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000)
        },
        {
            id: 5,
            name: 'Material Selection',
            description: 'Choose finishes, fabrics, and materials with our guidance.',
            status: 'locked',
            responsibleRole: 'designer',
            expectedEndDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000)
        },
        {
            id: 6,
            name: 'Manufacturing',
            description: 'Your custom furniture is being crafted in our factory.',
            status: 'locked',
            responsibleRole: 'factory',
            expectedEndDate: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000)
        },
        {
            id: 7,
            name: 'Site Execution',
            description: 'Civil work, electrical, and infrastructure at your site.',
            status: 'locked',
            responsibleRole: 'engineer',
            expectedEndDate: new Date(now.getTime() + 55 * 24 * 60 * 60 * 1000)
        },
        {
            id: 8,
            name: 'Installation',
            description: 'Professional installation of all furniture and fixtures.',
            status: 'locked',
            responsibleRole: 'installer',
            expectedEndDate: new Date(now.getTime() + 70 * 24 * 60 * 60 * 1000)
        },
        {
            id: 9,
            name: 'Handover',
            description: 'Final walkthrough and keys to your new workspace!',
            status: 'locked',
            responsibleRole: 'consultant',
            expectedEndDate: new Date(now.getTime() + 75 * 24 * 60 * 60 * 1000)
        }
    ];

    const activities: ActivityItem[] = [
        {
            id: '1',
            type: 'upload',
            title: 'New design uploaded',
            description: 'Concept B ready for review',
            timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
            actor: 'Priya',
            actorRole: 'designer'
        },
        {
            id: '2',
            type: 'progress',
            title: 'Design 65% complete',
            timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000),
            actor: 'Priya',
            actorRole: 'designer'
        },
        {
            id: '3',
            type: 'stage_change',
            title: 'Site Survey completed',
            timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
            actor: 'Amit',
            actorRole: 'engineer'
        },
        {
            id: '4',
            type: 'payment',
            title: 'Advance received ₹2L',
            timestamp: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
            actor: 'Accounts',
            actorRole: 'accounts'
        }
    ];

    const paymentMilestones: PaymentMilestone[] = [
        { id: '1', stageName: 'Token Advance', stageId: 1, amount: 200000, percentage: 10, isPaid: true, unlocksStage: 2 },
        { id: '2', stageName: 'Design Approval', stageId: 3, amount: 400000, percentage: 20, isPaid: false, dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), unlocksStage: 4 },
        { id: '3', stageName: 'Material Order', stageId: 5, amount: 600000, percentage: 30, isPaid: false, unlocksStage: 6 },
        { id: '4', stageName: 'Installation Start', stageId: 8, amount: 600000, percentage: 30, isPaid: false, unlocksStage: 8 },
        { id: '5', stageName: 'Final Handover', stageId: 9, amount: 200000, percentage: 10, isPaid: false, unlocksStage: 9 }
    ];

    const transparency: TransparencyData = {
        totalDurationDays: 75,
        daysCompleted: 30,
        daysRemaining: 45,
        projectHealth: 'on-track',
        delays: [],
        nextAction: {
            actor: 'client',
            action: 'Review design concepts',
            deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
        },
        estimatedCompletion: new Date(now.getTime() + 75 * 24 * 60 * 60 * 1000)
    };

    return {
        projectId,
        clientName: 'John Doe',
        clientEmail: projectId,
        projectType: 'Office Interior',
        projectName: 'Premium Workspace',
        area: '2,000 sq ft',
        budget: '₹20 Lakhs',
        startDate,
        expectedCompletion: new Date(now.getTime() + 75 * 24 * 60 * 60 * 1000),
        currentStageId: 3,
        stages,
        consultant: {
            id: 'c1',
            name: 'Rajesh Kumar',
            phone: '+91 98765 43210',
            email: 'rajesh@makemyoffice.com'
        },
        paymentMilestones,
        activities,
        requests: [],
        transparency,
        totalPaid: 200000,
        totalBudget: 2000000
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

    const handleCloseSheet = () => {
        setIsSheetOpen(false);
    };

    // Calculate unlocked stages based on payments
    const paidMilestoneCount = project.paymentMilestones.filter(m => m.isPaid).length;
    const unlockedUntilStage = paidMilestoneCount > 0
        ? project.paymentMilestones[paidMilestoneCount - 1].unlocksStage + 1
        : 2;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">

            {/* ============================================ */}
            {/* 1️⃣ HERO SECTION - Clean & Clear */}
            {/* ============================================ */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <img
                            src="/mmo-logo.png"
                            alt="Make My Office"
                            className="h-8 w-auto"
                        />

                        {/* Logout */}
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowRightOnRectangleIcon className="w-5 h-5" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Project Info */}
            <section className="bg-white border-b border-gray-100 pb-6">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

                        {/* Left - Project Info */}
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                {project.projectName}
                            </h1>
                            <p className="text-gray-500 mt-1">
                                Welcome back, {project.clientName}
                            </p>

                            {/* Quick Stats */}
                            <div className="flex flex-wrap gap-4 mt-4">
                                <div className="px-4 py-2 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Area</p>
                                    <p className="font-semibold text-gray-800">{project.area}</p>
                                </div>
                                <div className="px-4 py-2 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Budget</p>
                                    <p className="font-semibold text-gray-800">{project.budget}</p>
                                </div>
                                <div className="px-4 py-2 bg-emerald-50 rounded-lg">
                                    <p className="text-xs text-emerald-600">Expected Completion</p>
                                    <p className="font-semibold text-emerald-700">
                                        {project.expectedCompletion.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="px-4 py-2 bg-primary/10 rounded-lg">
                                    <p className="text-xs text-primary">Current Stage</p>
                                    <p className="font-semibold text-primary">
                                        {project.stages.find(s => s.id === project.currentStageId)?.name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right - Project Head Card */}
                        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-5 min-w-[280px]">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Project Head</p>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold">
                                    {project.consultant.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{project.consultant.name}</h4>
                                    <p className="text-xs text-gray-500">Your dedicated consultant</p>
                                </div>
                            </div>
                            <div className="mt-4 space-y-2">
                                <a href={`tel:${project.consultant.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary">
                                    <PhoneIcon className="w-4 h-4 text-primary" />
                                    {project.consultant.phone}
                                </a>
                                <a href={`mailto:${project.consultant.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary">
                                    <EnvelopeIcon className="w-4 h-4 text-primary" />
                                    {project.consultant.email}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================ */}
            {/* MAIN CONTENT */}
            {/* ============================================ */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* ============================================ */}
                    {/* 2️⃣ MAIN CENTERPIECE: GAME ROADMAP */}
                    {/* ============================================ */}
                    <div className="lg:col-span-2">
                        <GameRoadmap
                            stages={project.stages}
                            currentStageId={project.currentStageId}
                            onStageClick={handleStageClick}
                            unlockedUntilStage={unlockedUntilStage}
                        />

                        {/* Need Help? Button (Soft CTA) */}
                        <div className="mt-6 text-center">
                            <button className="inline-flex items-center gap-2 px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors">
                                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                Need Help? Ask a Question
                            </button>
                        </div>
                    </div>

                    {/* ============================================ */}
                    {/* 6️⃣ RIGHT SIDE PANEL - Simple & Clean */}
                    {/* ============================================ */}
                    <div className="space-y-6">
                        {/* Status Panel */}
                        <SimpleStatusPanel data={project.transparency} />

                        {/* Payment Widget */}
                        <PaymentWidget
                            milestones={project.paymentMilestones}
                            totalPaid={project.totalPaid}
                            totalBudget={project.totalBudget}
                        />

                        {/* Live Updates */}
                        <LiveActivityFeed
                            activities={project.activities}
                            maxItems={5}
                        />
                    </div>
                </div>
            </main>

            {/* ============================================ */}
            {/* 4️⃣ STAGE DETAIL BOTTOM SHEET */}
            {/* ============================================ */}
            <StageBottomSheet
                stage={selectedStage}
                isOpen={isSheetOpen}
                onClose={handleCloseSheet}
            />
        </div>
    );
};

export default ClientDashboardPage;
