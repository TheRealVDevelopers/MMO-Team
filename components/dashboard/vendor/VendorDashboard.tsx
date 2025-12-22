
import React from 'react';
import VendorOverview from './VendorOverview';
import ActiveRFQs from './ActiveRFQs';
import MyBids from './MyBids';
import VendorOrders from './VendorOrders';
import { Squares2X2Icon, ClipboardDocumentListIcon, DocumentCheckIcon, ArrowLeftOnRectangleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../../context/AuthContext';

interface VendorDashboardProps {
    currentPage: string;
    setCurrentPage: (page: string) => void;
}

const VendorDashboard: React.FC<VendorDashboardProps> = ({ currentPage, setCurrentPage }) => {
    const { setCurrentVendor } = useAuth();

    const handleLogout = () => {
        setCurrentVendor(null);
        // Refresh or clean state handled by App.tsx
    };

    const renderContent = () => {
        switch (currentPage) {
            case 'overview':
                return <VendorOverview />;
            case 'rfqs':
                return <ActiveRFQs />;
            case 'bids':
                return <MyBids />;
            case 'orders':
                return <VendorOrders />;
            default:
                return <VendorOverview />;
        }
    };

    const NavItem = ({ id, label, icon: Icon }: any) => (
        <button
            onClick={() => setCurrentPage(id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${currentPage === id
                ? 'bg-primary text-white shadow-lg'
                : 'text-text-secondary hover:bg-surface hover:text-primary'
                }`}
        >
            <Icon className="w-5 h-5" />
            <span className="font-bold text-sm tracking-wide">{label}</span>
        </button>
    );

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-surface border-r border-border hidden md:flex flex-col">
                <div className="p-6 border-b border-border">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center text-white font-serif font-bold">V</div>
                        <span className="font-serif font-bold text-text-primary text-lg">Vendor Portal</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <NavItem id="overview" label="Overview" icon={Squares2X2Icon} />
                    <NavItem id="rfqs" label="Active RFQs" icon={ClipboardDocumentListIcon} />
                    <NavItem id="bids" label="My Bids" icon={DocumentCheckIcon} />
                    <NavItem id="orders" label="Purchase Orders" icon={DocumentTextIcon} />
                </nav>

                <div className="p-4 border-t border-border">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                    >
                        <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                        <span className="font-bold text-sm">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {/* Mobile Header (visible only on small screens) */}
                <div className="md:hidden p-4 bg-surface border-b border-border flex justify-between items-center">
                    <span className="font-serif font-bold">Vendor Portal</span>
                    <button onClick={handleLogout}><ArrowLeftOnRectangleIcon className="w-5 h-5" /></button>
                </div>

                {renderContent()}
            </main>
        </div>
    );
};

export default VendorDashboard;
