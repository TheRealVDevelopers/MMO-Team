import React, { useState } from 'react';
import {
    ArrowRightOnRectangleIcon,
    PhoneIcon,
    EnvelopeIcon,
    ChatBubbleLeftRightIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

// Import client portal components
import VerticalRoadmap from '../client-portal/JourneyMap/VerticalRoadmap';
import StageBottomSheet from '../client-portal/JourneyMap/StageBottomSheet';
import TodaysWork from '../client-portal/TodaysWork';
import LiveActivityFeed from '../client-portal/ActivityFeed/LiveActivityFeed';
import PaymentWidget from '../client-portal/PaymentMilestones/PaymentWidget';
import QuickChat from '../client-portal/QuickChat';
import RECCEDrawingViewer from '../client-portal/RECCEDrawingViewer';
import PayAdvanceSection from '../client-portal/PayAdvanceSection';
import DocumentsArchive from '../client-portal/DocumentsArchive';

import {
    JourneyStage,
    ActivityItem,
    PaymentMilestone,
    TransparencyData,
    ClientProject,
    ProjectHealth
} from '../client-portal/types';
import { useInvoices } from '../../hooks/useInvoices';
import { Invoice, CompanyInfo } from '../../types';
import { formatCurrencyINR, formatDate } from '../../constants';
// Import Payment Submission Modal
import PaymentSubmissionModal from '../client-portal/PaymentSubmissionModal';
import { useToast } from '../shared/toast/ToastProvider';

// Mock Company Info
const MOCK_COMPANY_INFO: CompanyInfo = {
    name: 'Make My Office',
    address: '123, 100ft Road, Indiranagar, Bangalore - 560038',
    gstin: '29ABCDE1234F1Z5',
    contactPhone: '+91 98765 43210',
    contactEmail: 'support@makemyoffice.com',
    website: 'www.makemyoffice.com',
    logoUrl: '/mmo-logo.png' // Utilizing existing logo path
};

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

// Mock Data for new features
const MOCK_RECCE = {
    url: '#',
    name: 'Site_Measurement_vFinal.pdf',
    uploadedAt: new Date(),
    deadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
    status: 'Pending' as const
};

const MOCK_DOCS = [
    { id: 'd1', name: 'Initial_Consultation_Notes.pdf', category: 'Report' as const, date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), size: '1.2 MB', url: '#' },
    { id: 'd2', name: 'Material_Selection_Catalog.pdf', category: 'Other' as const, date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), size: '4.5 MB', url: '#' },
    { id: 'd3', name: 'Service_Agreement_Signed.pdf', category: 'Contract' as const, date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000), size: '850 KB', url: '#' },
];

const ClientDashboardPage: React.FC<ClientDashboardPageProps> = ({ projectId, onLogout }) => {
    const toast = useToast();
    const [project] = useState<ClientProject>(() => createDemoProject(projectId));
    const [selectedStage, setSelectedStage] = useState<JourneyStage | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const { invoices, loading: invoicesLoading } = useInvoices(projectId);

    // New State for Phase 5
    const [recceStatus, setRecceStatus] = useState<'Pending' | 'Approved' | 'Revision Requested'>('Pending');
    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedPaymentMilestone, setSelectedPaymentMilestone] = useState<{ amount: number; name: string } | null>(null);

    const handleStageClick = (stage: JourneyStage) => {
        setSelectedStage(stage);
        setIsSheetOpen(true);
    };

    const handlePaymentSubmit = (data: { method: 'UTR' | 'Screenshot'; value: string; amount: number }) => {
        console.log('Payment Submitted:', data);
        // Here you would call an API/Firestore to save the PaymentRequest
        // const paymentRequest: PaymentRequest = { ... };
        toast.success('Payment submitted. Accounts will verify shortly.');
        setShowPayModal(false);
    };

    const handlePayClick = (amount: number, name: string) => {
        setSelectedPaymentMilestone({ amount, name });
        setShowPayModal(true);
    };

    const currentStage = project.stages.find(s => s.id === project.currentStageId)!;
    const paidMilestoneCount = project.paymentMilestones.filter(m => m.isPaid).length;
    const unlockedUntilStage = paidMilestoneCount > 0 ? project.paymentMilestones[paidMilestoneCount - 1].unlocksStage + 1 : 2;

    // Find next unpaid milestone
    const nextUnpaidMilestone = project.paymentMilestones.find(m => !m.isPaid);

    return (
        <div className="min-h-screen bg-gray-50">

            {/* ============================================ */}
            {/* HEADER - Simple */}
            {/* ============================================ */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <img src={MOCK_COMPANY_INFO.logoUrl} alt={MOCK_COMPANY_INFO.name} className="h-10 w-auto" />
                            <div className="hidden md:block border-l border-gray-200 pl-3">
                                <h1 className="text-lg font-bold text-gray-900 leading-tight">{MOCK_COMPANY_INFO.name}</h1>
                                <p className="text-xs text-gray-500">GSTIN: {MOCK_COMPANY_INFO.gstin}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-gray-800">{MOCK_COMPANY_INFO.contactPhone}</p>
                                <p className="text-xs text-gray-500">{MOCK_COMPANY_INFO.contactEmail}</p>
                            </div>
                            <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* ============================================ */}
            {/* HERO - Project Info & Live Stats */}
            {/* ============================================ */}
            <section className="bg-white border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
                        {/* Left - Project Info */}
                        <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{project.projectName}</h1>
                                <StatusBadge health={project.transparency.projectHealth} />
                            </div>
                            <p className="text-gray-500 text-base sm:text-lg">Welcome back, {project.clientName} 👋</p>

                            <div className="flex flex-wrap gap-4 mt-6">
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-gray-400">📏</span>
                                    <span className="text-sm font-medium text-gray-700">{project.area}</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-gray-400">💰</span>
                                    <span className="text-sm font-medium text-gray-700">{project.budget}</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100/50">
                                    <span className="text-emerald-500">📅</span>
                                    <span className="text-sm font-bold text-emerald-700">
                                        Completion: {project.expectedCompletion.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right - Live Status & Help */}
                        <div className="flex flex-col sm:flex-row lg:flex-col gap-4 w-full sm:min-w-[300px]">
                            {/* Live Updates Mini Widget */}
                            <div className="bg-gray-900 rounded-2xl p-4 text-white shadow-xl shadow-gray-200/50">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Live Activity Feed</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-500">RECENT</span>
                                </div>
                                <div className="space-y-3">
                                    {project.activities.slice(0, 2).map((activity) => (
                                        <div key={activity.id} className="flex items-start gap-3">
                                            <span className="text-sm mt-0.5">
                                                {activity.type === 'upload' ? '📤' : '✅'}
                                            </span>
                                            <div>
                                                <p className="text-xs font-medium text-gray-200 line-clamp-1">{activity.title}</p>
                                                <p className="text-[10px] text-gray-500 mt-0.5">{activity.actor} • {Math.floor((Date.now() - new Date(activity.timestamp).getTime()) / 3600000)}h ago</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button className="flex items-center justify-center gap-3 px-6 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-secondary transition-all shadow-lg shadow-primary/20">
                                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                Ask a Question
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================ */}
            {/* MAIN CONTENT - Reorganized */}
            {/* ============================================ */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                    {/* LEFT COLUMN: Roadmap & Actionables */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Phase 5: RECCE Drawing Approval (Conditional) */}
                        {recceStatus !== 'Approved' && (
                            <div className="animate-fade-in-up">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                    Action Required
                                </h2>
                                <RECCEDrawingViewer
                                    drawingUrl={MOCK_RECCE.url}
                                    drawingName={MOCK_RECCE.name}
                                    uploadedAt={MOCK_RECCE.uploadedAt}
                                    deadline={MOCK_RECCE.deadline}
                                    status={recceStatus}
                                    onApprove={() => setRecceStatus('Approved')}
                                    onRequestRevision={() => setRecceStatus('Revision Requested')}
                                />
                            </div>
                        )}

                        <div className="overflow-x-hidden">
                            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                    <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">Project Journey</h2>
                            </div>
                            <VerticalRoadmap
                                stages={project.stages}
                                currentStageId={project.currentStageId}
                                onStageClick={handleStageClick}
                                unlockedUntilStage={unlockedUntilStage}
                            />
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Actionable Widgets */}
                    <div className="space-y-8">
                        {/* Today's Work - Highly Accessible */}
                        <div>
                            <TodaysWork currentStage={currentStage} />
                        </div>

                        {/* Phase 5: Pay Advance Call to Action */}
                        {nextUnpaidMilestone && (
                            <PayAdvanceSection
                                amount={nextUnpaidMilestone.amount}
                                milestoneName={nextUnpaidMilestone.stageName}
                                dueDate={nextUnpaidMilestone.dueDate}
                                isOverdue={nextUnpaidMilestone.dueDate ? new Date() > nextUnpaidMilestone.dueDate : false}
                                onPayNow={() => handlePayClick(nextUnpaidMilestone.amount, nextUnpaidMilestone.stageName)}
                            />
                        )}

                        {/* Payment Progress Legacy Widget (Optional, maybe keep below) */}
                        <PaymentWidget
                            milestones={project.paymentMilestones}
                            totalPaid={project.totalPaid}
                            totalBudget={project.totalBudget}
                        />

                        {/* Invoices Widget */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900">Billing & Invoices</h3>
                                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{invoices.length} Invoices</span>
                            </div>

                            {invoicesLoading ? (
                                <p className="text-sm text-gray-500">Loading invoices...</p>
                            ) : invoices.length === 0 ? (
                                <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <p className="text-sm text-gray-400">No invoices generated yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {invoices.map((invoice) => (
                                        <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-primary/20 transition-all group">
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 mb-0.5">{invoice.invoiceNumber}</p>
                                                <p className="text-xs text-gray-500">{formatDate(invoice.issueDate)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-gray-900">{formatCurrencyINR(invoice.total)}</p>
                                                <div className="flex items-center justify-end gap-2 mt-1">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${invoice.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                                                        invoice.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                                                            'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {invoice.status}
                                                    </span>
                                                    {/* Download Button Placeholder - In real app, this would link to PDF */}
                                                    {invoice.attachments && invoice.attachments.length > 0 && (
                                                        <a href={invoice.attachments[0].url || '#'} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-secondary" title="Download Invoice">
                                                            <DocumentArrowDownIcon className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Phase 5: Documents Archive */}
                        <DocumentsArchive documents={MOCK_DOCS} />

                        {/* Support & Contact */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Direct Support</h3>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white font-serif font-black text-xl shadow-lg shadow-primary/20">
                                    {project.consultant.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">Project Head</p>
                                    <p className="font-bold text-gray-900">{project.consultant.name}</p>
                                    <p className="text-xs text-gray-500">Dedicated Expert</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <a href={`tel:${project.consultant.phone}`} className="flex items-center justify-center gap-2 py-3 bg-gray-50 rounded-xl border border-gray-100 text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all">
                                    <PhoneIcon className="w-4 h-4 text-gray-400" />
                                    Call
                                </a>
                                <a href={`mailto:${project.consultant.email}`} className="flex items-center justify-center gap-2 py-3 bg-gray-50 rounded-xl border border-gray-100 text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all">
                                    <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                                    Email
                                </a>
                            </div>
                            <div className="mt-6 pt-6 border-t border-gray-50">
                                <QuickChat projectHeadName={project.consultant.name} />
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
            {selectedPaymentMilestone && (
                <PaymentSubmissionModal
                    isOpen={showPayModal}
                    onClose={() => setShowPayModal(false)}
                    onSubmit={handlePaymentSubmit}
                    amount={selectedPaymentMilestone.amount}
                    milestoneName={selectedPaymentMilestone.name}
                />
            )}
        </div>
    );
};

export default ClientDashboardPage;
