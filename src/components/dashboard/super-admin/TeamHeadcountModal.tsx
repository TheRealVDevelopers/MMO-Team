import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, UserIcon, FlagIcon } from '@heroicons/react/24/outline';
import { useStaffPerformance } from '../../../hooks/useStaffPerformance';
import { UserRole, AttendanceStatus } from '../../../types';
import { cn } from '../shared/DashboardUI';

interface TeamHeadcountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onViewMemberProfile?: (userId: string) => void;
}

const TeamHeadcountModal: React.FC<TeamHeadcountModalProps> = ({ isOpen, onClose, onViewMemberProfile }) => {
    const { staff, loading } = useStaffPerformance();

    // Group users by Department/Team
    const teams = {
        'Sales Team': staff.filter(u => [UserRole.SALES_GENERAL_MANAGER, UserRole.SALES_TEAM_MEMBER, UserRole.MANAGER].includes(u.role)),
        'Execution Team': staff.filter(u => [UserRole.EXECUTION_TEAM, UserRole.SITE_ENGINEER, UserRole.PROCUREMENT_TEAM].includes(u.role)),
        'Drawing & Design': staff.filter(u => [UserRole.DRAWING_TEAM, UserRole.DESIGNER, UserRole.QUOTATION_TEAM].includes(u.role)),
        'Accounts & Admin': staff.filter(u => [UserRole.ACCOUNTS_TEAM, UserRole.SUPER_ADMIN].includes(u.role)),
    };

    const getAttendanceStatus = (user: typeof staff[0]): AttendanceStatus => {
        // Map real-time attendance status from timeEntries to AttendanceStatus enum
        if (user.attendanceStatus === 'CLOCKED_IN' || user.attendanceStatus === 'ON_BREAK') {
            return AttendanceStatus.PRESENT;
        }
        return AttendanceStatus.ABSENT;
    };

    const isPresent = (status: AttendanceStatus) => [AttendanceStatus.PRESENT, AttendanceStatus.HALF_DAY].includes(status);

    return (
        <Transition show={isOpen} as={React.Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={React.Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={React.Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-3xl bg-white text-left align-middle shadow-2xl transition-all">
                                {/* Header */}
                                <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                                    <div>
                                        <Dialog.Title as="h3" className="text-2xl font-serif font-bold text-gray-900">
                                            Team Headcount Registry
                                        </Dialog.Title>
                                        <p className="text-sm text-gray-500 mt-1 uppercase tracking-wider font-medium">Real-time attendance & status monitor</p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                                    >
                                        <XMarkIcon className="w-6 h-6 text-gray-500" />
                                    </button>
                                </div>

                                <div className="p-8 max-h-[80vh] overflow-y-auto bg-gray-50/50 space-y-10">
                                    {(Object.entries(teams) as [string, typeof users][]).map(([teamName, members]) => (
                                        <div key={teamName}>
                                            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 mb-6 border-b border-gray-200 pb-2">
                                                {teamName}
                                            </h4>

                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                                {members.map(user => {
                                                    const status = getAttendanceStatus(user);
                                                    const present = isPresent(status);

                                                    return (
                                                        <div key={user.id} className="group relative flex flex-col items-center">
                                                            {/* Photo Container */}
                                                            <div className={cn(
                                                                "relative w-24 h-24 rounded-2xl mb-3 overflow-hidden transition-all duration-300 shadow-sm",
                                                                !present && "grayscale opacity-60",
                                                                present && "ring-2 ring-emerald-500/20 shadow-emerald-500/10"
                                                            )}>
                                                                <img
                                                                    src={user.avatar}
                                                                    alt={user.name}
                                                                    className="w-full h-full object-cover"
                                                                />

                                                                {/* Status Indicator Dot */}
                                                                <div className={cn(
                                                                    "absolute bottom-2 right-2 w-3 h-3 rounded-full border-2 border-white",
                                                                    present ? "bg-emerald-500" : "bg-gray-400"
                                                                )} />
                                                            </div>

                                                            {/* User Info */}
                                                            <div className="text-center w-full">
                                                                <p className="text-sm font-bold text-gray-900 truncate px-2">{user.name}</p>
                                                                <p className="text-[10px] text-gray-500 uppercase font-medium truncate opacity-70 mb-2">{user.role.replace(' Member', '')}</p>

                                                                {/* Current Assignment */}
                                                                {user.currentTask && (
                                                                    <p className="text-[9px] text-gray-600 mb-2 px-2 truncate italic" title={user.currentTask}>
                                                                        📋 {user.currentTask}
                                                                    </p>
                                                                )}

                                                                {/* Presence Badge */}
                                                                <div className={cn(
                                                                    "inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider mb-2",
                                                                    present ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                                                                )}>
                                                                    {status}
                                                                </div>

                                                                {/* Performance Flag */}
                                                                {user.performanceFlag && (
                                                                    <div className={cn(
                                                                        "flex items-center justify-center gap-1 text-[10px] font-bold uppercase",
                                                                        user.performanceFlag === 'green' ? "text-emerald-600" :
                                                                            user.performanceFlag === 'yellow' ? "text-amber-500" : "text-red-500"
                                                                    )}>
                                                                        <FlagIcon className="w-3 h-3 fill-current" />
                                                                        <span>{user.performanceFlag} Flag</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Hover Detail Card (Optional enhancement) */}
                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center backdrop-blur-[1px]">
                                                                <button
                                                                    onClick={() => {
                                                                        if (onViewMemberProfile) {
                                                                            onViewMemberProfile(user.id);
                                                                            onClose();
                                                                        }
                                                                    }}
                                                                    className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform"
                                                                >
                                                                    View Profile
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {members.length === 0 && (
                                                    <p className="text-sm text-gray-400 italic col-span-full">No active personnel assigned.</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default TeamHeadcountModal;
