import React from 'react';
import { Project, User, MaterialRequestStatus, ProjectStatus } from '../../../types';
import { formatCurrencyINR } from '../../../constants';
import { useActivities } from '../../../hooks/useActivities';
import { useUsers } from '../../../hooks/useUsers';
import { useVendorBills } from '../../../hooks/useVendorBills';
import { logActivity } from '../../../services/liveDataService';
import { updateProject } from '../../../hooks/useProjects';
import Modal from '../../shared/Modal';
import {
    BanknotesIcon,
    BuildingStorefrontIcon,
    MapPinIcon,
    PhoneIcon,
    UserGroupIcon,
    ArrowTrendingUpIcon,
    DocumentTextIcon,
    ClockIcon,
    CheckCircleIcon,
    PlusIcon,
    ChevronDownIcon,
    PencilSquareIcon,
    PaperClipIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import ProjectActivityHistory from '../../shared/ProjectActivityHistory';
import { ContentCard, cn } from '../shared/DashboardUI';
import { motion } from 'framer-motion';
import ProjectEditModal from '../execution-team/ProjectEditModal';

const getStatusConfig = (status: MaterialRequestStatus) => {
    switch (status) {
        case MaterialRequestStatus.RFQ_PENDING: return { color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', label: 'RFQ Pending' };
        case MaterialRequestStatus.BIDDING_OPEN: return { color: 'bg-primary-500/10 text-primary-500 border-primary-500/20', label: 'Bidding Open' };
        case MaterialRequestStatus.ORDER_PLACED: return { color: 'bg-secondary-500/10 text-secondary-500 border-secondary-500/20', label: 'Order Placed' };
        case MaterialRequestStatus.DELIVERED: return { color: 'bg-green-500/10 text-green-500 border-green-500/20', label: 'Delivered' };
        default: return { color: 'bg-slate-500/10 text-slate-500 border-slate-500/20', label: status };
    }
}

const ProjectDetailModal: React.FC<{ project: Project; isOpen: boolean; onClose: () => void; }> = ({ project: initialProject, isOpen, onClose }) => {
    const [project, setProject] = React.useState(initialProject);

    React.useEffect(() => {
        setProject(initialProject);
    }, [initialProject]);

    const { activities, loading: activitiesLoading } = useActivities(project.id);
    const { users } = useUsers();
    // const { vendorBills } = useVendorBills(); // Using empty for now as VENDORS is also removed

    const assignedTeamMembers = Object.entries(project.assignedTeam || {})
        .flatMap(([role, userIdOrIds]) => {
            const userIds = Array.isArray(userIdOrIds) ? userIdOrIds : [userIdOrIds];
            return userIds.map(userId => {
                const user = users.find(u => u.id === userId);
                return user ? { ...user, designatedRole: role.replace('_', ' ') } : null;
            });
        })
        .filter((user): user is User & { designatedRole: string } => user !== null);

    const projectMaterials: any[] = []; // TODO: Implement useMaterialRequests
    const projectVendors: any[] = []; // TODO: Implement useVendors or useOrganizations
    // const projectVendors = VENDORS.filter(v => VENDOR_BILLS.some(b => b.projectId === project.id && b.vendorId === v.id));

    const remainingBalance = project.budget - project.advancePaid;
    const budgetUsedPercentage = project.totalExpenses ? (project.totalExpenses / project.budget) * 100 : 0;

    const [isUpdating, setIsUpdating] = React.useState(false);
    const [newNote, setNewNote] = React.useState('');
    const [newStatus, setNewStatus] = React.useState<ProjectStatus>(project.status);
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [files, setFiles] = React.useState<File[]>([]);
    const [isUploading, setIsUploading] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleUpdateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const updates: Partial<Project> = { status: newStatus };
            const uploadedFiles: any[] = []; // Using any to avoid LeadFile strictness issues if imports missing, but essentially LeadFile

            // Handle File Uploads first (upload to Firebase Storage, then save URLs in Firestore)
            if (files.length > 0) {
                setIsUploading(true);
                const { arrayUnion, doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
                const { db } = await import('../../../firebase');
                const { uploadProjectFiles } = await import('../../../services/storageService');

                const fileArray = Array.from(files);
                const results = await uploadProjectFiles(project.id, fileArray);

                for (let i = 0; i < results.length; i++) {
                    const file = fileArray[i];
                    const result = results[i];
                    const fileType = file.type.startsWith('image/') ? 'image' : 'document';
                    uploadedFiles.push({
                        id: `file-${Date.now()}-${i}`,
                        leadId: project.id,
                        fileName: file.name,
                        fileUrl: result.url,
                        fileType,
                        uploadedBy: 'admin',
                        uploadedByName: 'System Admin',
                        uploadedAt: new Date(),
                        category: 'activity_attachment'
                    });
                }

                if (uploadedFiles.length > 0) {
                    const projectRef = doc(db, 'projects', project.id);
                    await updateDoc(projectRef, {
                        files: arrayUnion(...uploadedFiles.map(f => ({
                            ...f,
                            uploadedAt: serverTimestamp()
                        })))
                    });
                }
                setIsUploading(false);
            }


            // If there's a note, we could potentially add it to a history field if one exists, 
            // but for now we log it as a global activity.
            await updateProject(project.id, updates);
            setProject(prev => ({ ...prev, ...updates }));

            if (newNote.trim() || uploadedFiles.length > 0) {
                await logActivity({
                    description: `ADMIN OVERRIDE: ${newNote} ${uploadedFiles.length > 0 ? `[${uploadedFiles.length} file(s) attached]` : ''}`,
                    team: project.assignedTeam.drawing ? (users.find(u => u.id === project.assignedTeam.drawing)?.role || project.assignedTeam.drawing as any) : 'Management' as any,
                    userId: 'admin',
                    status: 'done' as any,
                    projectId: project.id,
                    attachments: uploadedFiles // Attach to activity
                });
            }

            setNewNote('');
            setFiles([]);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            console.error("Failed to update project:", error);
        } finally {
            setIsUpdating(false);
            setIsUploading(false);
        }
    };

    const handleFullProjectUpdate = async (updatedProject: Project) => {
        try {
            await updateProject(project.id, updatedProject);
            setProject(updatedProject);
            setIsEditModalOpen(false);
            // Optionally refresh or assuming local state updates via listener
        } catch (error) {
            console.error("Failed to update project details:", error);
        }
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`${project.projectName} Detail View`} size="7xl">
                <div className="flex justify-end mb-6 border-b border-border/40 pb-4">
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all shadow-md hover:shadow-lg active:scale-95 shadow-primary/20"
                    >
                        <PencilSquareIcon className="w-5 h-5" />
                        <span className="font-bold tracking-wide text-sm">Edit Full Project</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-1">
                    {/* Main Intel Column */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Financial Pulse */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Total Budget', val: formatCurrencyINR(project.budget), col: 'text-text-primary', icon: BanknotesIcon },
                                { label: 'Advance Inflow', val: formatCurrencyINR(project.advancePaid), col: 'text-secondary', icon: ArrowTrendingUpIcon },
                                { label: 'Remaining Edge', val: formatCurrencyINR(remainingBalance), col: 'text-text-primary', icon: ClockIcon },
                                { label: 'Operational Burn', val: formatCurrencyINR(project.totalExpenses || 0), col: 'text-error', icon: DocumentTextIcon },
                            ].map((stat, i) => (
                                <div key={i} className="bg-subtle-background/50 border border-border/40 p-4 rounded-2xl flex flex-col justify-between">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-6 h-6 rounded-lg bg-surface flex items-center justify-center border border-border/40 text-text-tertiary">
                                            <stat.icon className="w-3.5 h-3.5" />
                                        </div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-text-tertiary leading-none">{stat.label}</p>
                                    </div>
                                    <p className={cn("text-base font-black tracking-tight font-serif", stat.col)}>{stat.val}</p>
                                </div>
                            ))}
                        </div>

                        {/* Utilization Bar */}
                        <div className="bg-surface border border-border/40 p-6 rounded-3xl shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Budget Utilization Gauge</h4>
                                <span className="text-sm font-black text-text-primary">{budgetUsedPercentage.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-border/20 h-4 rounded-full overflow-hidden shadow-inner flex">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${budgetUsedPercentage}%` }}
                                    className={cn(
                                        "h-full transition-all duration-1000 relative",
                                        budgetUsedPercentage > 90 ? 'bg-error' : budgetUsedPercentage > 70 ? 'bg-accent' : 'bg-primary'
                                    )}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent italic" />
                                </motion.div>
                            </div>
                        </div>

                        {/* Procurement Stream */}
                        <ContentCard className="!p-0 overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-border/40 bg-subtle-background/30 flex items-center gap-3">
                                <BuildingStorefrontIcon className="w-5 h-5 text-primary" />
                                <h4 className="text-sm font-black uppercase tracking-widest text-text-primary">Strategic Sourcing</h4>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-surface border-b border-border/40">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-tertiary">Manifest</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-tertiary">State</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-tertiary">Partner</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/20">
                                        {projectMaterials.map(mat => {
                                            const config = getStatusConfig(mat.status);
                                            return (
                                                <tr key={mat.id} className="hover:bg-subtle-background/20 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-text-primary">{mat.materials.map(m => m.name).join(', ')}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", config.color)}>
                                                            {config.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-text-secondary font-medium">{projectVendors.length > 0 ? projectVendors[0].name : 'Selection Pending'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </ContentCard>

                        {/* Activity Registry */}
                        <ContentCard className="shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <ClockIcon className="w-5 h-5 text-accent" />
                                <h4 className="text-sm font-black uppercase tracking-widest text-text-primary">Engagement Registry</h4>
                            </div>
                            {activitiesLoading ? (
                                <div className="text-xs text-text-tertiary animate-pulse">Syncing registry...</div>
                            ) : (
                                <ProjectActivityHistory activities={activities} />
                            )}
                        </ContentCard>
                    </div>

                    {/* Side Intel Column */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Client Intelligence */}
                        <div className="bg-surface border border-border/40 p-6 rounded-3xl shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                                <UserGroupIcon className="w-24 h-24" />
                            </div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 pb-2 border-b border-primary/10">Stakeholder Profile</h4>
                            <p className="text-xl font-serif font-black text-text-primary mb-4">{project.clientContact?.name || project.clientName}</p>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <MapPinIcon className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-xs font-semibold text-text-secondary leading-relaxed">{project.clientAddress}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                                        <PhoneIcon className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-xs font-semibold text-text-secondary">{project.clientContact?.phone || 'No phone'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Project Control Panel */}
                        <div className="bg-surface border border-border/40 p-6 rounded-3xl shadow-sm">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-6 pb-2 border-b border-primary/10">Project Command</h4>
                            <form onSubmit={handleUpdateProject} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-2">Update Mission Status</label>
                                    <div className="relative">
                                        <select
                                            value={newStatus}
                                            onChange={(e) => setNewStatus(e.target.value as ProjectStatus)}
                                            className="w-full bg-subtle-background border border-border rounded-xl px-4 py-3 text-xs font-bold text-text-primary appearance-none focus:ring-2 focus:ring-primary/10 outline-none"
                                        >
                                            {Object.values(ProjectStatus).map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                        <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-2">Internal Protocol Note</label>
                                    <textarea
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        placeholder="Log strategic update or operational note..."
                                        className="w-full bg-subtle-background border border-border rounded-xl px-4 py-3 text-xs font-medium text-text-primary min-h-[100px] focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                                    />
                                    <div className="mt-2 text-right">
                                        <input
                                            type="file"
                                            multiple
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            id="file-upload"
                                        />
                                        <label
                                            htmlFor="file-upload"
                                            className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-subtle-background border border-border rounded-lg text-xs font-bold text-text-secondary hover:bg-surface hover:text-primary transition-colors"
                                        >
                                            <PaperClipIcon className="w-4 h-4" />
                                            {files.length > 0 ? `${files.length} file(s)` : 'Attach Files'}
                                        </label>
                                    </div>
                                    {files.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            {files.map((f, i) => (
                                                <div key={i} className="flex items-center justify-between text-xs bg-surface p-1.5 rounded border border-border/50">
                                                    <span className="truncate max-w-[180px]">{f.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                                                        className="text-error hover:text-error/80"
                                                    >
                                                        <XMarkIcon className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={isUpdating || (newStatus === project.status && !newNote.trim())}
                                    className="w-full bg-primary text-white font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                                >
                                    {isUpdating ? 'Synchronizing Intelligence...' : 'Update Project Registry'}
                                </button>
                            </form>
                        </div>

                        {/* Operational Task Force */}
                        <div className="bg-surface border border-border/40 p-6 rounded-3xl shadow-sm">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-6 pb-2 border-b border-accent/10">Operational Task Force</h4>
                            <ul className="space-y-6">
                                {assignedTeamMembers.map((user, idx) => (
                                    <motion.li
                                        key={user.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="flex items-center gap-4 group"
                                    >
                                        <div className="relative">
                                            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-xl object-cover ring-2 ring-surface shadow-sm" />
                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-secondary border border-surface shadow-sm" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors truncate">{user.name}</p>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-text-tertiary mt-0.5">{user.designatedRole}</p>
                                        </div>
                                        <CheckCircleIcon className="w-4 h-4 text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </motion.li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </Modal>

            <ProjectEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                project={project}
                onSave={handleFullProjectUpdate}
            />
        </>
    );
};

export default ProjectDetailModal;