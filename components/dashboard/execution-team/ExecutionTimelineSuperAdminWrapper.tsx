/**
 * Super Admin timeline: pick any project then view read-only timeline.
 * Redesigned with premium glassmorphism, search, status indicators & animations.
 */

import React, { useState, useMemo } from 'react';
import { useCases } from '../../../hooks/useCases';
import ExecutionTimelinePage from './ExecutionTimelinePage';
import {
  CalendarIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { CaseStatus } from '../../../types';

interface Props {
  setCurrentPage: (page: string) => void;
}

/* ─── Status config ────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { color: string; bg: string; glow: string; label: string }> = {
  [CaseStatus.LEAD]: { color: 'text-blue-600', bg: 'bg-blue-500/10', glow: 'shadow-blue-500/20', label: 'Lead' },
  [CaseStatus.SITE_VISIT]: { color: 'text-amber-600', bg: 'bg-amber-500/10', glow: 'shadow-amber-500/20', label: 'Site Visit' },
  [CaseStatus.DRAWING]: { color: 'text-purple-600', bg: 'bg-purple-500/10', glow: 'shadow-purple-500/20', label: 'Drawing' },
  [CaseStatus.BOQ]: { color: 'text-indigo-600', bg: 'bg-indigo-500/10', glow: 'shadow-indigo-500/20', label: 'BOQ' },
  [CaseStatus.QUOTATION]: { color: 'text-teal-600', bg: 'bg-teal-500/10', glow: 'shadow-teal-500/20', label: 'Quotation' },
  [CaseStatus.EXECUTION_ACTIVE]: { color: 'text-green-600', bg: 'bg-green-500/10', glow: 'shadow-green-500/20', label: 'In Execution' },
  [CaseStatus.WAITING_FOR_PLANNING]: { color: 'text-cyan-600', bg: 'bg-cyan-500/10', glow: 'shadow-cyan-500/20', label: 'Planning' },
  [CaseStatus.COMPLETED]: { color: 'text-gray-500', bg: 'bg-gray-500/10', glow: 'shadow-gray-500/20', label: 'Completed' },
};

const getStatusCfg = (status?: string) =>
  (status && STATUS_CONFIG[status]) ?? { color: 'text-text-secondary', bg: 'bg-text-secondary/10', glow: '', label: status ?? '—' };

const ExecutionTimelineSuperAdminWrapper: React.FC<Props> = ({ setCurrentPage }) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const { cases, loading } = useCases({ isProject: true });

  /* ─── Search filter ─────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return cases;
    const q = searchTerm.toLowerCase();
    return cases.filter(
      (c) =>
        (c.title ?? '').toLowerCase().includes(q) ||
        (c.projectName ?? '').toLowerCase().includes(q) ||
        (c.clientName ?? '').toLowerCase().includes(q) ||
        (c.id ?? '').toLowerCase().includes(q)
    );
  }, [cases, searchTerm]);

  /* ─── Timeline view ─────────────────────────────────────────────── */
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

  /* ─── Project selector ───────────────────────────────────────────── */
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-start py-8 px-4 sm:px-6 animate-[fadeIn_0.4s_ease-out]">
      {/* Back button */}
      <div className="w-full max-w-2xl mb-6">
        <button
          type="button"
          onClick={() => setCurrentPage('project-hub')}
          className="group flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-primary transition-colors duration-200"
        >
          <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
          Back to Hub
        </button>
      </div>

      {/* Main card */}
      <div className="w-full max-w-2xl">
        {/* Header section with gradient */}
        <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-primary/5 via-surface to-accent/5 border border-border border-b-0 px-8 pt-10 pb-8">
          {/* Decorative circles */}
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/5 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-accent/5 blur-2xl" />

          <div className="relative text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5 shadow-luxury">
              <CalendarIcon className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-extrabold text-text-primary tracking-tight mb-2">
              Project Timelines
            </h2>
            <p className="text-text-secondary text-sm max-w-md mx-auto">
              Select a project to explore its execution timeline, milestones, and Gantt chart.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative mt-7 max-w-lg mx-auto">
            <MagnifyingGlassIcon className="w-4.5 h-4.5 absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search projects by name, client, or ID…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-background border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200 shadow-luxury-subtle"
            />
          </div>
        </div>

        {/* Project list section */}
        <div className="rounded-b-2xl bg-surface border border-border border-t-0 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
              <p className="text-sm text-text-secondary font-medium">Loading projects…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <BuildingOfficeIcon className="w-12 h-12 text-text-tertiary/50" />
              <p className="text-text-secondary text-sm font-medium">
                {searchTerm ? 'No projects match your search.' : 'No projects available yet.'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-xs font-semibold text-primary hover:text-secondary transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Count badge */}
              <div className="px-6 pt-5 pb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest">
                  {filtered.length} project{filtered.length !== 1 ? 's' : ''}
                </span>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-xs font-semibold text-primary hover:text-secondary transition-colors"
                  >
                    Show all
                  </button>
                )}
              </div>

              {/* Project list */}
              <ul className="px-4 pb-4 max-h-[400px] overflow-y-auto space-y-2 scrollbar-hide">
                {filtered.map((c, idx) => {
                  const cfg = getStatusCfg(c.status);
                  const isHovered = hoveredId === c.id;
                  const createdAt = c.createdAt
                    ? new Date(c.createdAt instanceof Date ? c.createdAt : (c.createdAt as any).toDate?.() ?? c.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                    : null;

                  return (
                    <li
                      key={c.id}
                      style={{ animationDelay: `${idx * 40}ms` }}
                      className="animate-[slideUp_0.35s_ease-out_both]"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedCaseId(c.id)}
                        onMouseEnter={() => setHoveredId(c.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        className={`
                          group w-full px-5 py-4 rounded-xl border transition-all duration-200
                          ${isHovered
                            ? 'border-primary/40 bg-primary/[0.03] shadow-luxury-hover'
                            : 'border-border bg-background hover:border-primary/20 shadow-luxury-subtle hover:shadow-luxury'
                          }
                        `}
                      >
                        <div className="flex items-center gap-4">
                          {/* Left icon */}
                          <div className={`
                            flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
                            ${isHovered ? 'bg-primary/15 scale-105' : 'bg-primary/8'}
                          `}>
                            <CalendarIcon className={`w-5 h-5 transition-colors duration-200 ${isHovered ? 'text-primary' : 'text-primary/70'}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="text-sm font-bold text-text-primary truncate group-hover:text-primary transition-colors duration-200">
                                {c.title ?? c.projectName ?? c.id}
                              </h3>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-text-tertiary">
                              {c.clientName && (
                                <span className="truncate max-w-[160px]">{c.clientName}</span>
                              )}
                              {createdAt && (
                                <span className="flex items-center gap-1 flex-shrink-0">
                                  <ClockIcon className="w-3 h-3" />
                                  {createdAt}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right: status + arrow */}
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
                              {cfg.label}
                            </span>
                            <svg
                              className={`w-4 h-4 text-text-tertiary transition-all duration-200 ${isHovered ? 'translate-x-0.5 text-primary' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ExecutionTimelineSuperAdminWrapper;
