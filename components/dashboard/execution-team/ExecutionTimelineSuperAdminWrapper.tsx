/**
 * Super Admin timeline: pick any project then view read-only timeline.
 */

import React, { useState } from 'react';
import { useCases } from '../../../hooks/useCases';
import ExecutionTimelinePage from './ExecutionTimelinePage';
import { CalendarIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface Props {
  setCurrentPage: (page: string) => void;
}

const ExecutionTimelineSuperAdminWrapper: React.FC<Props> = ({ setCurrentPage }) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const { cases, loading } = useCases({ isProject: true });

  if (selectedCaseId) {
    return (
      <div className="p-6">
        <ExecutionTimelinePage
          caseId={selectedCaseId}
          onSelectProject={(id) => setSelectedCaseId(id || null)}
          onBack={() => setSelectedCaseId(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <button
        type="button"
        onClick={() => setCurrentPage('project-hub')}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6"
      >
        <ArrowLeftIcon className="w-5 h-5" /> Back
      </button>
      <div className="rounded-xl border border-border bg-surface p-12 text-center">
        <CalendarIcon className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
        <h2 className="text-xl font-bold text-text-primary mb-2">Select a project</h2>
        <p className="text-text-secondary mb-6">Choose a project to view its timeline.</p>
        {loading ? (
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
        ) : cases.length === 0 ? (
          <p className="text-text-secondary text-sm">No projects yet.</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto text-left mt-4">
            {cases.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelectedCaseId(c.id)}
                  className="w-full px-4 py-3 rounded-lg border border-border hover:bg-background-hover flex items-center gap-2"
                >
                  <CalendarIcon className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="font-medium text-text-primary truncate">{c.title ?? c.projectName ?? c.id}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ExecutionTimelineSuperAdminWrapper;
