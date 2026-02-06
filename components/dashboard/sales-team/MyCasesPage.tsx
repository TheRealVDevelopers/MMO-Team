import React, { useState, useMemo } from 'react';
import { Case, CaseStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import CaseManagementPage from '../CaseManagementPage';

import {
  PlusIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  IdentificationIcon,
  ArrowPathIcon,
  BriefcaseIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

import { USERS, formatDateTime, formatLargeNumberINR, safeDate } from '../../../constants';
import {
  StatCard,
  ContentCard,
  PrimaryButton,
  cn,
  staggerContainer
} from '../shared/DashboardUI';
import { motion, AnimatePresence } from 'framer-motion';

interface MyCasesPageProps {
  cases: Case[];
  onUpdateCase: (caseItem: Case) => void;
  onAddNewCase: (caseItem: Case) => void;
  organizationId: string;
}

const CaseStatusPill: React.FC<{ status: CaseStatus }> = ({ status }) => {
  const statusConfig = {
    [CaseStatus.LEAD]: { color: 'text-error bg-error/10', label: 'New Lead' },
    [CaseStatus.SITE_VISIT]: { color: 'text-purple bg-purple/10', label: 'Site Visit' },
    [CaseStatus.DRAWING]: { color: 'text-blue-500 bg-blue-500/10', label: 'Drawing' },
    [CaseStatus.BOQ]: { color: 'text-indigo-500 bg-indigo-500/10', label: 'BOQ' },
    [CaseStatus.QUOTATION]: { color: 'text-teal-500 bg-teal-500/10', label: 'Quotation' },
    [CaseStatus.EXECUTION]: { color: 'text-green-500 bg-green-500/10', label: 'Execution' },
    [CaseStatus.COMPLETED]: { color: 'text-success bg-success/10', label: 'Completed' },
  };

  const config = statusConfig[status] || { color: 'text-gray-500 bg-gray-100', label: status };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

const CaseCard: React.FC<{
  caseItem: Case;
  onClick: () => void;
  organizationId: string;
}> = ({ caseItem, onClick, organizationId }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      className="bg-surface border border-border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all duration-200"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-text-primary truncate">{caseItem.clientName}</h3>
          <p className="text-sm text-text-secondary truncate">{caseItem.title}</p>
        </div>
        <CaseStatusPill status={caseItem.status} />
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary mb-3">
        <div>
          <span className="font-medium">Value:</span>
          <p>{formatLargeNumberINR(0)}</p>
        </div>
        <div>
          <span className="font-medium">Created:</span>
          <p>{safeDate(caseItem.createdAt)}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center text-xs text-text-secondary">
          <IdentificationIcon className="w-4 h-4 mr-1" />
          {caseItem.isProject ? 'Project' : 'Lead'}
        </div>
        <ChevronRightIcon className="w-5 h-5 text-text-secondary" />
      </div>
    </motion.div>
  );
};

const MyCasesPage: React.FC<MyCasesPageProps> = ({ cases, onUpdateCase, onAddNewCase, organizationId }) => {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'value'>('date');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  // Filter and sort cases
  const filteredCases = useMemo(() => {
    let result = cases.filter(caseItem => {
      // Filter by search term
      const matchesSearch = 
        caseItem.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.siteAddress.toLowerCase().includes(searchTerm.toLowerCase());

      // Filter by status
      const matchesStatus = statusFilter === 'all' || caseItem.status === statusFilter;

      // Filter by assignment (only show cases assigned to current user)
      const isAssigned = caseItem.assignedSales === currentUser?.id || caseItem.projectHead === currentUser?.id;

      return matchesSearch && matchesStatus && isAssigned;
    });

    // Sort cases
    result.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        // For value sorting, we'll sort by a default value since Case doesn't have value property
        return 0;
      }
    });

    return result;
  }, [cases, searchTerm, statusFilter, sortBy, currentUser?.id]);

  // Stats calculation
  const stats = useMemo(() => {
    const totalCases = cases.filter(c => 
      c.assignedSales === currentUser?.id || c.projectHead === currentUser?.id
    ).length;
    
    const activeCases = cases.filter(c => 
      (c.assignedSales === currentUser?.id || c.projectHead === currentUser?.id) &&
      ![CaseStatus.COMPLETED].includes(c.status)
    ).length;

    const totalValue = 0; // Case doesn't have value property, using 0 for now

    return { totalCases, activeCases, totalValue };
  }, [cases, currentUser?.id]);

  const handleCaseClick = (caseId: string) => {
    setSelectedCaseId(caseId);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedCaseId(null);
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My Registry</h1>
          <p className="text-text-secondary mt-1">
            Manage your assigned leads and projects
          </p>
        </div>
        <PrimaryButton onClick={() => console.log('Add new case')}>
          <PlusIcon className="w-5 h-5 mr-2" />
          Add New Case
        </PrimaryButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Cases"
          value={stats.totalCases.toString()}
          icon={<BriefcaseIcon className="w-6 h-6" />}
          trend={{ value: "0", positive: true }}
        />
        <StatCard
          title="Active Cases"
          value={stats.activeCases.toString()}
          icon={<ChartBarIcon className="w-6 h-6" />}
          trend={{ value: "0", positive: true }}
        />
        <StatCard
          title="Total Value"
          value={formatLargeNumberINR(stats.totalValue)}
          icon={<CreditCardIcon className="w-6 h-6" />}
          trend={{ value: "0", positive: true }}
        />
      </div>

      {/* Filters */}
      <ContentCard className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type="text"
                placeholder="Search cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CaseStatus | 'all')}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Status</option>
              {Object.values(CaseStatus).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'value')}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="date">Sort by Date</option>
              <option value="value">Sort by Value</option>
            </select>
          </div>
        </div>
      </ContentCard>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredCases.map((caseItem) => (
            <CaseCard
              key={caseItem.id}
              caseItem={caseItem}
              onClick={() => handleCaseClick(caseItem.id)}
              organizationId={organizationId}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredCases.length === 0 && (
        <div className="text-center py-12">
          <BriefcaseIcon className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No cases found</h3>
          <p className="text-text-secondary mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'You don\'t have any assigned cases yet'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <PrimaryButton onClick={() => console.log('Add new case')}>
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Your First Case
            </PrimaryButton>
          )}
        </div>
      )}

      {/* Case Detail Modal */}
      {isDetailModalOpen && selectedCaseId && (
        <CaseManagementPage
          caseId={selectedCaseId}
          organizationId={organizationId}
          onClose={handleCloseDetailModal}
        />
      )}
    </motion.div>
  );
};

export default MyCasesPage;