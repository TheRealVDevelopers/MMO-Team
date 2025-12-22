import React, { useState, useEffect, useRef } from 'react';
import {
    CheckCircleIcon,
    ClockIcon,
    ChatBubbleLeftRightIcon,
    ExclamationTriangleIcon,
    PaperClipIcon,
    PaperAirplaneIcon,
    UserCircleIcon,
    CalendarIcon,
    BuildingOfficeIcon,
    PhoneIcon,
    EnvelopeIcon,
    DocumentTextIcon,
    ArrowRightIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

// Animation Hook
const useOnScreen = (options: IntersectionObserverInit) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, options);

        if (ref.current) observer.observe(ref.current);
        return () => { if (ref.current) observer.unobserve(ref.current); };
    }, [ref, options]);

    return [ref, isVisible] as const;
};

const FadeInSection: React.FC<{ children: React.ReactNode; delay?: string; className?: string }> = ({ children, delay = '0ms', className = '' }) => {
    const [ref, isVisible] = useOnScreen({ threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    return (
        <div
            ref={ref}
            style={{ animationDelay: delay }}
            className={`${className} ${isVisible ? 'animate-luxury-reveal opacity-100' : 'opacity-0 translate-y-8'}`}
        >
            {children}
        </div>
    );
};

interface ClientDashboardPageProps {
    projectId: string;
    onLogout: () => void;
}

interface ProjectStage {
    id: number;
    name: string;
    status: 'completed' | 'in-progress' | 'upcoming';
    startDate?: string;
    endDate?: string;
    expectedDate?: string;
    notes?: string;
}

interface Message {
    id: string;
    sender: 'client' | 'consultant';
    senderName: string;
    content: string;
    timestamp: Date;
    attachments?: { name: string; url: string }[];
}

interface Issue {
    id: string;
    category: string;
    description: string;
    urgency: 'low' | 'medium' | 'high';
    status: 'open' | 'in-progress' | 'resolved';
    createdAt: Date;
    response?: string;
}

const ClientDashboardPage: React.FC<ClientDashboardPageProps> = ({ projectId, onLogout }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'issues' | 'documents'>('overview');
    const [newMessage, setNewMessage] = useState('');
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [newIssue, setNewIssue] = useState({
        category: '',
        description: '',
        urgency: 'medium' as 'low' | 'medium' | 'high'
    });

    // Demo data - in production, this would come from Firebase
    const projectData = {
        projectId: projectId,
        clientName: 'John Doe',
        projectType: 'Office Interior',
        consultant: {
            name: 'Rajesh Kumar',
            phone: '+91 98765 43210',
            email: 'rajesh@makemyoffice.com'
        },
        currentStage: 3,
        expectedCompletion: 'March 2025',
        area: '2000 sq ft',
        budget: '₹15-20 Lakhs'
    };

    const stages: ProjectStage[] = [
        {
            id: 1,
            name: 'Consultation',
            status: 'completed',
            startDate: 'Dec 1, 2024',
            endDate: 'Dec 5, 2024',
            notes: 'Initial consultation completed. Requirements documented.'
        },
        {
            id: 2,
            name: 'Requirement Finalization',
            status: 'completed',
            startDate: 'Dec 6, 2024',
            endDate: 'Dec 10, 2024',
            notes: 'All requirements finalized and approved by client.'
        },
        {
            id: 3,
            name: 'Design Phase',
            status: 'in-progress',
            startDate: 'Dec 11, 2024',
            expectedDate: 'Dec 25, 2024',
            notes: '3D renders in progress. First draft ready for review.'
        },
        {
            id: 4,
            name: 'Quotation & Approval',
            status: 'upcoming',
            expectedDate: 'Dec 28, 2024'
        },
        {
            id: 5,
            name: 'Material Selection',
            status: 'upcoming',
            expectedDate: 'Jan 5, 2025'
        },
        {
            id: 6,
            name: 'Manufacturing',
            status: 'upcoming',
            expectedDate: 'Jan 15, 2025'
        },
        {
            id: 7,
            name: 'Site Execution',
            status: 'upcoming',
            expectedDate: 'Feb 1, 2025'
        },
        {
            id: 8,
            name: 'Installation',
            status: 'upcoming',
            expectedDate: 'Feb 20, 2025'
        },
        {
            id: 9,
            name: 'Final Handover',
            status: 'upcoming',
            expectedDate: 'Mar 1, 2025'
        }
    ];

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            sender: 'consultant',
            senderName: 'Rajesh Kumar',
            content: 'Welcome to your project dashboard! I\'ll be your dedicated consultant throughout this journey. Feel free to ask any questions.',
            timestamp: new Date('2024-12-01T10:00:00'),
        },
        {
            id: '2',
            sender: 'client',
            senderName: 'John Doe',
            content: 'Thank you! When can I expect the initial design concepts?',
            timestamp: new Date('2024-12-01T14:30:00'),
        },
        {
            id: '3',
            sender: 'consultant',
            senderName: 'Rajesh Kumar',
            content: 'We\'re working on the 3D renders and will share the first draft by Dec 20th. You\'ll receive 3 concept options to choose from.',
            timestamp: new Date('2024-12-02T09:15:00'),
        }
    ]);

    const [issues, setIssues] = useState<Issue[]>([
        {
            id: '1',
            category: 'Design Query',
            description: 'Can we modify the conference room layout to accommodate 12 people instead of 10?',
            urgency: 'medium',
            status: 'resolved',
            createdAt: new Date('2024-12-05T11:00:00'),
            response: 'Yes, we\'ve updated the design to accommodate 12 people. New renders attached in documents section.'
        }
    ]);

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        const message: Message = {
            id: Date.now().toString(),
            sender: 'client',
            senderName: projectData.clientName,
            content: newMessage,
            timestamp: new Date()
        };

        setMessages([...messages, message]);
        setNewMessage('');
    };

    const handleRaiseIssue = () => {
        if (!newIssue.category || !newIssue.description) return;

        const issue: Issue = {
            id: Date.now().toString(),
            category: newIssue.category,
            description: newIssue.description,
            urgency: newIssue.urgency,
            status: 'open',
            createdAt: new Date()
        };

        setIssues([issue, ...issues]);
        setShowIssueModal(false);
        setNewIssue({ category: '', description: '', urgency: 'medium' });
    };

    const getStageIcon = (stage: ProjectStage) => {
        if (stage.status === 'completed') {
            return <CheckCircleSolid className="w-8 h-8 text-green-500" />;
        } else if (stage.status === 'in-progress') {
            return <ClockIcon className="w-8 h-8 text-primary animate-pulse" />;
        } else {
            return <div className="w-8 h-8 rounded-full border-2 border-gray-300 bg-white"></div>;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="bg-white border-b border-border sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                                <span className="text-white font-serif font-bold text-xl">M</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-serif font-bold text-text-primary/90">My Project</h1>
                                <p className="text-xs text-text-secondary">ID: {projectId}</p>
                            </div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="text-sm text-text-secondary hover:text-text-primary/90 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN - Project Timeline */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Project Overview Card */}
                        <FadeInSection>
                            <div className="bg-white rounded-2xl shadow-lg p-8">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-serif font-bold text-text-primary/90 mb-2">
                                            {projectData.projectType}
                                        </h2>
                                        <p className="text-text-secondary">Welcome back, {projectData.clientName}!</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-text-secondary mb-1">Expected Completion</p>
                                        <p className="text-lg font-bold text-primary">{projectData.expectedCompletion}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-subtle-background rounded-xl">
                                        <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Area</p>
                                        <p className="text-lg font-bold text-text-primary/90">{projectData.area}</p>
                                    </div>
                                    <div className="p-4 bg-subtle-background rounded-xl">
                                        <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Budget</p>
                                        <p className="text-lg font-bold text-text-primary/90">{projectData.budget}</p>
                                    </div>
                                    <div className="p-4 bg-subtle-background rounded-xl">
                                        <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Current Stage</p>
                                        <p className="text-lg font-bold text-text-primary/90">{stages[projectData.currentStage - 1].name}</p>
                                    </div>
                                </div>
                            </div>
                        </FadeInSection>

                        {/* Timeline */}
                        <FadeInSection delay="100ms">
                            <div className="bg-white rounded-2xl shadow-lg p-8">
                                <h3 className="text-xl font-serif font-bold text-text-primary/90 mb-8">Project Journey</h3>

                                <div className="space-y-6">
                                    {stages.map((stage, index) => (
                                        <div key={stage.id} className="relative">
                                            {/* Connecting Line */}
                                            {index < stages.length - 1 && (
                                                <div className={`absolute left-4 top-12 w-0.5 h-full ${stage.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                                                    }`}></div>
                                            )}

                                            <div className="flex items-start space-x-4">
                                                <div className="flex-shrink-0 relative z-10 bg-white">
                                                    {getStageIcon(stage)}
                                                </div>

                                                <div className={`flex-1 pb-8 transition-all duration-700 ${stage.status === 'upcoming' ? 'opacity-50' : 'opacity-100'
                                                    }`}>
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h4 className={`font-bold text-lg mb-1 ${stage.status === 'in-progress' ? 'text-primary' :
                                                                stage.status === 'completed' ? 'text-green-700' :
                                                                    'text-gray-600'
                                                                }`}>
                                                                {stage.name}
                                                            </h4>
                                                            {stage.notes && (
                                                                <p className="text-sm text-text-secondary mt-2">{stage.notes}</p>
                                                            )}
                                                        </div>

                                                        <div className="text-right ml-4">
                                                            {stage.status === 'completed' && stage.endDate && (
                                                                <span className="inline-flex items-center text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                                                    <CheckCircleIcon className="w-3 h-3 mr-1" />
                                                                    Completed {stage.endDate}
                                                                </span>
                                                            )}
                                                            {stage.status === 'in-progress' && (
                                                                <span className="inline-flex items-center text-xs text-primary-hover bg-primary/10 px-3 py-1 rounded-full">
                                                                    <ClockIcon className="w-3 h-3 mr-1" />
                                                                    Expected: {stage.expectedDate}
                                                                </span>
                                                            )}
                                                            {stage.status === 'upcoming' && stage.expectedDate && (
                                                                <span className="inline-flex items-center text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                                                                    <CalendarIcon className="w-3 h-3 mr-1" />
                                                                    Expected: {stage.expectedDate}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </FadeInSection>
                    </div>

                    {/* RIGHT COLUMN - Details & Chat */}
                    <div className="space-y-6">

                        {/* Consultant Card */}
                        <FadeInSection delay="200ms">
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Your Consultant</h3>
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="w-12 h-12 bg-primary-subtle-background/200 rounded-full flex items-center justify-center">
                                        <UserCircleIcon className="w-8 h-8 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-text-primary/90">{projectData.consultant.name}</h4>
                                        <p className="text-xs text-text-secondary">Project Consultant</p>
                                    </div>
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center space-x-3 text-text-secondary">
                                        <PhoneIcon className="w-4 h-4 text-primary" />
                                        <span>{projectData.consultant.phone}</span>
                                    </div>
                                    <div className="flex items-center space-x-3 text-text-secondary">
                                        <EnvelopeIcon className="w-4 h-4 text-primary" />
                                        <span className="break-all">{projectData.consultant.email}</span>
                                    </div>
                                </div>
                            </div>
                        </FadeInSection>

                        {/* Tabs */}
                        <FadeInSection delay="300ms">
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                {/* Tab Navigation */}
                                <div className="flex border-b border-border">
                                    <button
                                        onClick={() => setActiveTab('chat')}
                                        className={`flex-1 px-4 py-3 text-sm font-bold transition-colors ${activeTab === 'chat'
                                            ? 'bg-primary text-white'
                                            : 'text-text-secondary hover:bg-gray-50'
                                            }`}
                                    >
                                        <ChatBubbleLeftRightIcon className="w-4 h-4 inline mr-2" />
                                        Chat
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('issues')}
                                        className={`flex-1 px-4 py-3 text-sm font-bold transition-colors ${activeTab === 'issues'
                                            ? 'bg-primary text-white'
                                            : 'text-text-secondary hover:bg-gray-50'
                                            }`}
                                    >
                                        <ExclamationTriangleIcon className="w-4 h-4 inline mr-2" />
                                        Issues
                                    </button>
                                </div>

                                {/* Chat Tab */}
                                {activeTab === 'chat' && (
                                    <div className="flex flex-col h-[500px]">
                                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                            {messages.map((msg) => (
                                                <div
                                                    key={msg.id}
                                                    className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div className={`max-w-[80%] ${msg.sender === 'client'
                                                        ? 'bg-primary text-white'
                                                        : 'bg-gray-100 text-text-primary/90'
                                                        } rounded-2xl px-4 py-3`}>
                                                        <p className="text-xs font-bold mb-1 opacity-70">{msg.senderName}</p>
                                                        <p className="text-sm">{msg.content}</p>
                                                        <p className="text-xs opacity-60 mt-2">
                                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Message Input */}
                                        <div className="p-4 border-t border-border">
                                            <div className="flex space-x-2">
                                                <input
                                                    type="text"
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                                    placeholder="Type your message..."
                                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:border-primary outline-none text-sm"
                                                />
                                                <button
                                                    onClick={handleSendMessage}
                                                    className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-text-primary/90 transition-colors"
                                                >
                                                    <PaperAirplaneIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Issues Tab */}
                                {activeTab === 'issues' && (
                                    <div className="p-4">
                                        <button
                                            onClick={() => setShowIssueModal(true)}
                                            className="w-full mb-4 px-4 py-3 bg-text-primary/90 text-white font-bold text-sm rounded-xl hover:bg-primary transition-colors"
                                        >
                                            <ExclamationTriangleIcon className="w-4 h-4 inline mr-2" />
                                            Raise an Issue
                                        </button>

                                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                            {issues.map((issue) => (
                                                <div key={issue.id} className="p-4 bg-gray-50 rounded-xl">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <span className="text-xs font-bold text-text-primary/90">{issue.category}</span>
                                                        <span className={`text-xs px-2 py-1 rounded-full ${issue.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                                            issue.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-red-100 text-red-700'
                                                            }`}>
                                                            {issue.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-text-secondary mb-2">{issue.description}</p>
                                                    {issue.response && (
                                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                                            <p className="text-xs font-bold text-primary mb-1">Response:</p>
                                                            <p className="text-sm text-text-primary/90">{issue.response}</p>
                                                        </div>
                                                    )}
                                                    <p className="text-xs text-gray-400 mt-2">
                                                        {issue.createdAt.toLocaleDateString()}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </FadeInSection>
                    </div>
                </div>
            </div>

            {/* Issue Modal */}
            {showIssueModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-serif font-bold text-text-primary/90">Raise an Issue</h3>
                            <button onClick={() => setShowIssueModal(false)} className="text-gray-400 hover:text-text-primary/90">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Category</label>
                                <select
                                    value={newIssue.category}
                                    onChange={(e) => setNewIssue({ ...newIssue, category: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none"
                                >
                                    <option value="">Select category</option>
                                    <option value="Design Query">Design Query</option>
                                    <option value="Timeline Concern">Timeline Concern</option>
                                    <option value="Material Issue">Material Issue</option>
                                    <option value="Budget Clarification">Budget Clarification</option>
                                    <option value="Site Issue">Site Issue</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Description</label>
                                <textarea
                                    rows={4}
                                    value={newIssue.description}
                                    onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none"
                                    placeholder="Describe your issue..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Urgency</label>
                                <div className="flex gap-3">
                                    {(['low', 'medium', 'high'] as const).map((level) => (
                                        <button
                                            key={level}
                                            type="button"
                                            onClick={() => setNewIssue({ ...newIssue, urgency: level })}
                                            className={`flex-1 px-4 py-2 rounded-xl border-2 capitalize transition-all ${newIssue.urgency === level
                                                ? 'border-primary bg-primary/5 text-text-primary/90 font-bold'
                                                : 'border-gray-200 text-text-secondary hover:border-primary/50'
                                                }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleRaiseIssue}
                                disabled={!newIssue.category || !newIssue.description}
                                className="w-full py-4 bg-text-primary/90 text-white font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Submit Issue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientDashboardPage;
