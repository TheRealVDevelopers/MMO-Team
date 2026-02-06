
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useExecutionTasks } from '../../../hooks/useExecutionTasks';
import { useCases } from '../../../hooks/useCases';
import { TaskStatus, ExecutionTask, Case } from '../../../types';
import { doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Clock, Calendar, ChevronRight, AlertTriangle,
    CheckCircle, FileText, Upload, Ruler
} from 'lucide-react';

// --- Types & Helpers ---

// Extend Case type locally for dynamic fields
interface ExtendedCase extends Case {
    siteInspection?: {
        engineerId?: string;
        startedAt?: any; // Timestamp | Date
        completedAt?: any; // Timestamp | Date
        status?: string;
        distanceKm?: number;
        duration?: string;
    };
    boq?: any; // Dynamic BOQ object
    drawingReview?: {
        completedAt?: any;
        status?: string;
    }
}

const COLUMNS = {
    SITE_INSPECTION: 'Site Inspection',
    WAITING_FOR_DRAWING: 'Waiting for Drawing',
    COMPLETED: 'Completed'
};

const formatTime = (date?: Date) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleDateString();
};

const getDuration = (start?: Date, end?: Date) => {
    if (!start || !end) return '';
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
};

// --- Main Component ---

const SiteEngineerProjectBoard: React.FC = () => {
    const { currentUser } = useAuth();
    // Fetch tasks assignments for this user
    const { tasks, loading: tasksLoading, updateTaskStatus } = useExecutionTasks(undefined, currentUser?.id);
    // Fetch all cases to link data (siteInspection details, BOQ status)
    const { cases, loading: casesLoading } = useCases();

    const [selectedTaskForDistance, setSelectedTaskForDistance] = useState<ExecutionTask | null>(null);
    const [distanceInput, setDistanceInput] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter tasks for columns
    const siteInspectionTasks = tasks.filter(t =>
        t.missionType === 'SITE_INSPECTION' &&
        t.status !== TaskStatus.COMPLETED
    );

    // "Waiting for Drawing" includes tasks that are DRAWING type
    // AND tasks where Site Inspection is done but Drawing not started/ongoing
    const drawingTasks = tasks.filter(t =>
        t.missionType === 'DRAWING' &&
        t.status !== TaskStatus.COMPLETED
    );

    // Completed column logic: Drawing tasks that are completed
    const completedTasks = tasks.filter(t =>
        t.status === TaskStatus.COMPLETED &&
        (t.missionType === 'DRAWING' || t.missionType === 'SITE_INSPECTION')
    );

    // --------------------------------------------------------------------------------
    // Handlers
    // --------------------------------------------------------------------------------

    const handleStartTask = async (task: ExecutionTask) => {
        try {
            await updateTaskStatus(task.id, TaskStatus.ONGOING); // Fixed Enum

            // If Site Inspection, update Case
            if (task.missionType === 'SITE_INSPECTION') {
                // Determine correct caseId (usually projectId in this schema)
                const caseRef = doc(db, 'cases', task.projectId);
                await updateDoc(caseRef, {
                    siteInspection: {
                        engineerId: currentUser?.id,
                        startedAt: serverTimestamp(),
                        status: 'IN_PROGRESS'
                    }
                });
            }
        } catch (err) {
            console.error("Error starting task:", err);
            setError("Failed to start task. Please try again.");
        }
    };

    const handleEndInspectionClick = (task: ExecutionTask) => {
        setDistanceInput('');
        setSelectedTaskForDistance(task);
    };

    const confirmEndInspection = async () => {
        if (!selectedTaskForDistance || !distanceInput) return;
        setSubmitting(true);
        try {
            const distance = parseFloat(distanceInput);
            if (isNaN(distance)) throw new Error("Invalid distance");

            // 1. Update Task Status
            await updateTaskStatus(selectedTaskForDistance.id, TaskStatus.COMPLETED);

            // 2. Update Case Data
            const caseRef = doc(db, 'cases', selectedTaskForDistance.projectId);
            const relatedCase = cases.find(c => c.id === selectedTaskForDistance.projectId) as ExtendedCase | undefined;

            // Safe timestamp conversion
            const getTimestamp = (ts: any) => ts instanceof Timestamp ? ts.toDate() : (ts ? new Date(ts) : new Date());

            const startedAt = relatedCase?.siteInspection?.startedAt
                ? getTimestamp(relatedCase.siteInspection.startedAt)
                : new Date();

            const completedAt = new Date();

            await updateDoc(caseRef, {
                'siteInspection.completedAt': serverTimestamp(),
                'siteInspection.distanceKm': distance,
                'siteInspection.status': 'COMPLETED',
                // Calculate duration implicitly or store if needed, mostly derived
            });

            setSelectedTaskForDistance(null);
        } catch (err) {
            console.error("Error ending inspection:", err);
            setError("Failed to end inspection.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCompleteDrawing = async (task: ExecutionTask) => {
        const relatedCase = cases.find(c => c.id === task.projectId) as ExtendedCase | undefined;

        const hasBoq = relatedCase?.boq && Object.keys(relatedCase.boq).length > 0;

        if (!hasBoq) {
            alert("BOQ is mandatory. Please create/upload BOQ before completing.");
            return;
        }

        try {
            await updateTaskStatus(task.id, TaskStatus.COMPLETED);
            const caseRef = doc(db, 'cases', task.projectId);
            await updateDoc(caseRef, {
                'drawingReview.completedAt': serverTimestamp(),
                'drawingReview.status': 'COMPLETED'
            });
        } catch (err) {
            console.error("Error completing drawing:", err);
            setError("Failed to complete drawing.");
        }
    };


    // --------------------------------------------------------------------------------
    // Renderers
    // --------------------------------------------------------------------------------

    if (tasksLoading || casesLoading) {
        return <div className="p-8 text-center text-text-secondary animate-pulse">Loading Board...</div>;
    }

    return (
        <div className="h-[calc(100vh-6rem)] w-full overflow-x-auto bg-background p-6">
            <div className="flex h-full gap-6 min-w-[1024px]">

                {/* COLUMN 1: SITE INSPECTION */}
                <Column title="Site Inspection" icon={<MapPin className="w-5 h-5" />} color="border-t-blue-500">
                    {siteInspectionTasks.length === 0 && <EmptyState message="No inspections assigned" />}
                    {siteInspectionTasks.map(task => (
                        <Card key={task.id}>
                            <CardHeader title={task.projectName} subtitle={task.id} />

                            <div className="mt-4 flex items-center justify-between">
                                <div className="text-sm text-text-secondary">
                                    {task.status === TaskStatus.ONGOING ? (
                                        <span className="text-green-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> In Progress
                                        </span>
                                    ) : (
                                        <span className="text-blue-500">Ready to Start</span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4">
                                {task.status !== TaskStatus.ONGOING ? (
                                    <Button onClick={() => handleStartTask(task)}>Start Task</Button>
                                ) : (
                                    <Button variant="primary" onClick={() => handleEndInspectionClick(task)}>
                                        End Task
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </Column>

                {/* COLUMN 2: WAITING FOR DRAWING */}
                <Column title="Waiting for Drawing" icon={<Ruler className="w-5 h-5" />} color="border-t-orange-500">
                    {drawingTasks.length === 0 && <EmptyState message="No drawings pending" />}
                    {drawingTasks.map(task => {
                        const relatedCase = cases.find(c => c.id === task.projectId) as ExtendedCase | undefined;

                        const getTimestamp = (ts: any) => ts instanceof Timestamp ? ts.toDate() : (ts ? new Date(ts) : null);
                        const inspectionCompletedAt = getTimestamp(relatedCase?.siteInspection?.completedAt);

                        // Timer Logic (4 hours from inspection completion)
                        const deadline = inspectionCompletedAt ? new Date(inspectionCompletedAt.getTime() + 4 * 60 * 60 * 1000) : null;
                        const isLate = deadline && new Date() > deadline;

                        return (
                            <Card key={task.id}>
                                <CardHeader title={task.projectName} subtitle="Drawing & BOQ" />

                                {deadline && (
                                    <div className={`mt-3 p-2 rounded text-xs font-mono flex items-center gap-2 ${isLate ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                        <Clock className="w-3 h-3" />
                                        Deadline: {formatTime(deadline)}
                                    </div>
                                )}

                                <div className="mt-4">
                                    {task.status !== TaskStatus.ONGOING ? (
                                        <Button onClick={() => handleStartTask(task)}>Start Drawing</Button>
                                    ) : (
                                        <Button variant="success" onClick={() => handleCompleteDrawing(task)}>
                                            Complete & Submit
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        )
                    })}
                </Column>

                {/* COLUMN 3: COMPLETED */}
                <Column title="Completed" icon={<CheckCircle className="w-5 h-5" />} color="border-t-green-500">
                    {Array.from(new Set(completedTasks.map(t => t.projectId))).map(projectId => {
                        if (!projectId) return null;
                        const relatedCase = cases.find(c => c.id === projectId) as ExtendedCase | undefined;
                        if (!relatedCase) return null;
                        const projectTasks = completedTasks.filter(t => t.projectId === projectId);

                        const inspection = relatedCase.siteInspection;
                        const getTimestamp = (ts: any) => ts instanceof Timestamp ? ts.toDate() : (ts ? new Date(ts) : null);

                        return (
                            <Card key={projectId}>
                                <CardHeader title={relatedCase.projectName || relatedCase.clientName || "Project"} subtitle="Completed" />

                                {inspection && (
                                    <div className="mt-3 text-xs space-y-2 border-t border-border pt-2 text-text-secondary">
                                        <div className="font-semibold text-text-primary">Inspection Summary</div>
                                        <div className="flex justify-between">
                                            <span>Distance:</span>
                                            <span>{inspection.distanceKm || '--'} km</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Engineer:</span>
                                            <span>{inspection.engineerId === currentUser?.id ? 'Me' : inspection.engineerId}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Completed:</span>
                                            <span>{formatDate(getTimestamp(inspection.completedAt) || undefined)}</span>
                                        </div>
                                    </div>
                                )}

                                {projectTasks.find(t => t.missionType === 'DRAWING') && (
                                    <div className="mt-2 text-xs text-green-500 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" /> Drawing Submitted
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </Column>
            </div>

            {/* Distance Input Modal */}
            <AnimatePresence>
                {selectedTaskForDistance && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md bg-surface border border-border rounded-xl p-6 shadow-2xl"
                        >
                            <h3 className="text-xl font-bold text-text-primary mb-2">End Site Inspection</h3>
                            <p className="text-sm text-text-secondary mb-6">Enter total distance traveled to complete this task.</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Total Distance (KM)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            autoFocus
                                            className="w-full bg-background border border-border rounded-lg px-4 py-3 text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                            placeholder="e.g. 15.5"
                                            value={distanceInput}
                                            onChange={e => setDistanceInput(e.target.value)}
                                        />
                                        <span className="absolute right-4 top-3 text-text-secondary">km</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    onClick={() => setSelectedTaskForDistance(null)}
                                    className="px-4 py-2 text-text-secondary hover:bg-background rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmEndInspection}
                                    disabled={!distanceInput || submitting}
                                    className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
                                >
                                    {submitting ? 'Saving...' : 'Complete Task'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Subcomponents ---

const Column: React.FC<{ title: string; icon: React.ReactNode; color: string; children: React.ReactNode }> = ({ title, icon, color, children }) => (
    <div className={`flex-1 min-w-[320px] h-full flex flex-col bg-surface/50 rounded-xl border border-border overflow-hidden ${color}`}>
        <div className="p-4 border-b border-border bg-surface flex items-center gap-2 font-bold text-text-primary sticky top-0 z-10">
            {icon} {title}
        </div>
        <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
            {children}
        </div>
    </div>
);

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
    >
        {children}
    </motion.div>
);

const CardHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
    <div>
        <h4 className="font-semibold text-text-primary text-lg leading-tight">{title}</h4>
        <div className="text-xs text-text-secondary mt-1 font-mono uppercase tracking-wide">{subtitle}</div>
    </div>
);

const Button: React.FC<{ children: React.ReactNode; onClick: () => void; variant?: 'default' | 'primary' | 'success' }> = ({ children, onClick, variant = 'default' }) => {
    const styles = {
        default: "bg-surface border border-border hover:bg-background text-text-primary",
        primary: "bg-primary text-white hover:bg-primary-hover border-transparent",
        success: "bg-green-600 text-white hover:bg-green-700 border-transparent"
    };

    return (
        <button
            onClick={onClick}
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all active:scale-[0.98] border ${styles[variant]}`}
        >
            {children}
        </button>
    );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <div className="h-40 flex flex-col items-center justify-center text-text-secondary/50 border-2 border-dashed border-border rounded-lg">
        <div className="text-sm">{message}</div>
    </div>
);

export default SiteEngineerProjectBoard;
