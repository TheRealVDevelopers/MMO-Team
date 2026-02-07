import {
    ClockIcon,
    InboxStackIcon,
    BriefcaseIcon,
    BookOpenIcon,
    BanknotesIcon,
    CircleStackIcon,
    DocumentTextIcon,
    ClipboardDocumentListIcon,
    ChartPieIcon,
    ChatBubbleLeftRightIcon,
    ShieldExclamationIcon,
    BuildingOfficeIcon
} from '@heroicons/react/24/outline'; // Direct import for better coverage

interface SidebarProps {
    currentPage: string;
    setCurrentPage: (page: string) => void;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
    badge?: number;
}> = ({ icon, label, isActive, onClick, badge }) => (
    <li>
        <a
            href="#"
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            className={`flex items-center justify-between p-2 text-base font-normal rounded-lg transition-colors duration-150 ${isActive
                ? 'bg-primary/10 text-primary'
                : 'text-text-secondary hover:bg-subtle-background hover:text-text-primary'
                }`}
        >
            <div className="flex items-center">
                {icon}
                <span className="ml-3">{label}</span>
            </div>
            {badge ? (
                <span className="inline-flex items-center justify-center w-5 h-5 ml-2 text-xs font-semibold text-white bg-red-500 rounded-full">
                    {badge}
                </span>
            ) : null}
        </a>
    </li>
);

const AccountsTeamSidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
    // TODO: Fetch pending approval count for badge
    const pendingCount = 0;

    const navItems = [
        { id: 'my-day', label: 'My Day', icon: <ClockIcon className="w-6 h-6" /> },
        { id: 'approvals', label: 'Inbox', icon: <InboxStackIcon className="w-6 h-6" />, badge: pendingCount },

        { type: 'divider', label: 'Financials' },
        { id: 'general-ledger', label: 'General Ledger', icon: <BookOpenIcon className="w-6 h-6" /> },
        { id: 'project-pnl', label: 'Project P&L', icon: <BriefcaseIcon className="w-6 h-6" /> },
        { id: 'salary', label: 'Salary Ledger', icon: <BanknotesIcon className="w-6 h-6" /> },

        { type: 'divider', label: 'Operations' },
        { id: 'inventory', label: 'Inventory', icon: <CircleStackIcon className="w-6 h-6" /> },
        { id: 'sales-invoices', label: 'Sales (Receivables)', icon: <DocumentTextIcon className="w-6 h-6" /> },
        { id: 'vendor-bills', label: 'Purchases (Payables)', icon: <ClipboardDocumentListIcon className="w-6 h-6" /> },
        { id: 'expenses', label: 'Expenses', icon: <BanknotesIcon className="w-6 h-6" /> }, // Reused icon or find better

        { type: 'divider', label: 'Support' },
        { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
        { id: 'reports', label: 'Reports', icon: <ChartPieIcon className="w-6 h-6" /> },
    ];

    return (
        <aside className="w-64 bg-surface border-r border-border flex-shrink-0 flex flex-col h-full" aria-label="Sidebar">
            <div className="flex items-center pl-6 h-16 border-b border-border">
                <BuildingOfficeIcon className="h-8 w-8 text-primary" />
                <h1 className="ml-3 text-xl font-bold text-text-primary tracking-tight">
                    Finance Hub
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3">
                <ul className="space-y-1">
                    {navItems.map((item, index) => {
                        if (item.type === 'divider') {
                            return (
                                <li key={`div-${index}`} className="pt-4 pb-2 px-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    {item.label}
                                </li>
                            );
                        }
                        return (
                            <NavItem
                                key={item.id!}
                                label={item.label!}
                                icon={item.icon}
                                isActive={currentPage === item.id}
                                onClick={() => setCurrentPage(item.id!)}
                                badge={item.badge}
                            />
                        );
                    })}
                </ul>
            </div>
        </aside>
    );
}

export default AccountsTeamSidebar;
