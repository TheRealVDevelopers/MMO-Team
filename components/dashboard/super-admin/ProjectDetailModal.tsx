import React from 'react';
import { Project, User, UserRole, MaterialRequestStatus } from '../../../types';
import { ACTIVITIES, USERS, MATERIAL_REQUESTS, VENDORS, VENDOR_BILLS, formatCurrencyINR } from '../../../constants';
import Modal from '../../shared/Modal';
import Card from '../../shared/Card';
import ProgressBar from '../../shared/ProgressBar';
import StatusPill from '../../shared/StatusPill';
import { BanknotesIcon, BuildingStorefrontIcon, MapPinIcon, PhoneIcon, UserGroupIcon } from '../../icons/IconComponents';
import ProjectActivityHistory from '../../shared/ProjectActivityHistory';


const getStatusPillColor = (status: MaterialRequestStatus): 'blue' | 'amber' | 'green' | 'slate' => {
    switch (status) {
        case MaterialRequestStatus.RFQ_PENDING: return 'amber';
        case MaterialRequestStatus.BIDDING_OPEN: return 'blue';
        case MaterialRequestStatus.ORDER_PLACED: return 'blue';
        case MaterialRequestStatus.DELIVERED: return 'green';
        default: return 'slate';
    }
}

const ProjectDetailModal: React.FC<{ project: Project; isOpen: boolean; onClose: () => void; }> = ({ project, isOpen, onClose }) => {
    
    const assignedTeamMembers = Object.entries(project.assignedTeam)
        .flatMap(([role, userIdOrIds]) => {
            const userIds = Array.isArray(userIdOrIds) ? userIdOrIds : [userIdOrIds];
            return userIds.map(userId => {
                const user = USERS.find(u => u.id === userId);
                return user ? { ...user, designatedRole: role.replace('_', ' ') } : null;
            });
        })
        .filter((user): user is User & { designatedRole: string } => user !== null);

    const projectActivities = ACTIVITIES.filter(a => a.projectId === project.id);
    const projectMaterials = MATERIAL_REQUESTS.filter(m => m.projectId === project.id);
    const projectVendors = VENDORS.filter(v => VENDOR_BILLS.some(b => b.projectId === project.id && b.vendorId === v.id));

    const remainingBalance = project.budget - project.advancePaid;
    const budgetUsedPercentage = project.totalExpenses ? (project.totalExpenses / project.budget) * 100 : 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${project.projectName} - Overview`}>
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <h4 className="font-bold text-text-primary mb-2 flex items-center"><BanknotesIcon className="w-5 h-5 mr-2" />Financials</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <p className="text-xs text-text-secondary">Total Budget</p>
                                <p className="font-bold text-md text-text-primary">{formatCurrencyINR(project.budget)}</p>
                            </div>
                             <div>
                                <p className="text-xs text-text-secondary">Advance Paid</p>
                                <p className="font-bold text-md text-secondary">{formatCurrencyINR(project.advancePaid)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-text-secondary">Balance Due</p>
                                <p className="font-bold text-md text-text-primary">{formatCurrencyINR(remainingBalance)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-text-secondary">Expenses to Date</p>
                                <p className="font-bold text-md text-error">{formatCurrencyINR(project.totalExpenses || 0)}</p>
                            </div>
                        </div>
                        <div className="mt-4">
                             <p className="text-xs text-text-secondary mb-1">Budget Utilization</p>
                             <ProgressBar progress={budgetUsedPercentage} />
                        </div>
                    </Card>

                    <Card>
                         <h4 className="font-bold text-text-primary mb-2 flex items-center"><BuildingStorefrontIcon className="w-5 h-5 mr-2" />Procurement</h4>
                         <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-subtle-background">
                                    <tr>
                                        <th className="px-2 py-1 text-left font-medium text-text-secondary">Item</th>
                                        <th className="px-2 py-1 text-left font-medium text-text-secondary">Status</th>
                                        <th className="px-2 py-1 text-left font-medium text-text-secondary">Vendor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projectMaterials.map(mat => (
                                        <tr key={mat.id} className="border-b border-border">
                                            <td className="px-2 py-1.5">{mat.materials.map(m => m.name).join(', ')}</td>
                                            <td className="px-2 py-1.5"><StatusPill color={getStatusPillColor(mat.status)}>{mat.status}</StatusPill></td>
                                            <td className="px-2 py-1.5">{projectVendors.length > 0 ? projectVendors[0].name : 'TBD'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                    </Card>
                    
                    <Card>
                        <h4 className="font-bold text-text-primary mb-2">Project Activity History</h4>
                        <ProjectActivityHistory activities={projectActivities} />
                    </Card>

                </div>

                {/* Right Column */}
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <h4 className="font-bold text-text-primary mb-2">Client Details</h4>
                        <p className="text-sm font-medium text-text-primary">{project.clientContact.name}</p>
                        <div className="text-sm text-text-secondary mt-1 space-y-1">
                            <p className="flex items-start"><MapPinIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0"/><span>{project.clientAddress}</span></p>
                            <p className="flex items-center"><PhoneIcon className="w-4 h-4 mr-2"/><span>{project.clientContact.phone}</span></p>
                        </div>
                    </Card>
                    <Card>
                         <h4 className="font-bold text-text-primary mb-2 flex items-center"><UserGroupIcon className="w-5 h-5 mr-2" />Assigned Team</h4>
                         <ul className="space-y-3">
                            {assignedTeamMembers.map(user => (
                                <li key={user.id} className="flex items-center space-x-3">
                                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                                    <div>
                                        <p className="text-sm font-medium text-text-primary">{user.name}</p>
                                        <p className="text-xs text-text-secondary capitalize">{user.designatedRole}</p>
                                    </div>
                                </li>
                            ))}
                         </ul>
                    </Card>
                </div>
           </div>
        </Modal>
    );
};

export default ProjectDetailModal;