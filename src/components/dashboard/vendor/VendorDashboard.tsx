import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import UnifiedBiddingBoard from './UnifiedBiddingBoard';

const VendorDashboard: React.FC = () => {
    const { logout, currentVendor } = useAuth();

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <header className="bg-surface border-b border-border h-20 shrink-0 flex items-center justify-between px-8 z-10">
                    <div className="flex items-center space-x-4 text-primary">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                            <span className="font-serif font-black text-2xl">M</span>
                        </div>
                        <div>
                            <h1 className="font-serif font-black text-text-primary text-xl leading-tight">Vendor Portal</h1>
                            <p className="text-[10px] text-text-tertiary uppercase tracking-[0.2em] font-black">Live Bidding Board</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-6">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-black text-text-primary">{currentVendor?.name || 'Vendor Partner'}</p>
                            <div className="flex items-center justify-end space-x-2 mt-0.5">
                                <span className="text-[10px] text-primary font-black uppercase tracking-widest">★ {currentVendor?.rating || '5.0'} Rating</span>
                                <span className="w-1 h-1 rounded-full bg-border"></span>
                                <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest">Active Partner</span>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className="p-3 bg-subtle-background text-text-secondary hover:text-error hover:bg-error/10 rounded-2xl transition-all border border-border/50 group"
                            title="Sign Out"
                        >
                            <ArrowLeftOnRectangleIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </header>

                {/* Unified Bidding Board */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-background/50">
                    <UnifiedBiddingBoard />
                </main>
            </div>
        </div>
    );
};

export default VendorDashboard;
