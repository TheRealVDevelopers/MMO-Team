import React from 'react';
import { ArrowLeftOnRectangleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface ClientLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  /** Optional: show back button with this callback */
  onBack?: () => void;
  backLabel?: string;
  /** Optional: custom title in header (e.g. "Organization") */
  title?: string;
  /** Hide logo/title in header when true (e.g. when child has its own full header) */
  minimalHeader?: boolean;
}

/**
 * Client-only layout: header with logo, optional back, logout.
 * No staff sidebar, no staff nav, no staff routes.
 */
const ClientLayout: React.FC<ClientLayoutProps> = ({
  children,
  onLogout,
  onBack,
  backLabel = 'Back',
  title,
  minimalHeader = false,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex flex-col">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shrink-0">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-2 text-sm font-medium text-[#111111] hover:text-green-700 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                {backLabel}
              </button>
            )}
            {!minimalHeader && (
              <>
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                  <img src="/mmo-logo.png" alt="MMO" className="h-6 w-auto object-contain brightness-0 invert" />
                </div>
                <span className="text-lg font-bold text-[#111111]">
                  {title || 'Client Portal'}
                </span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-red-50 text-[#111111] hover:text-red-700 rounded-xl transition-all duration-300 text-sm font-medium"
          >
            <ArrowLeftOnRectangleIcon className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
};

export default ClientLayout;
