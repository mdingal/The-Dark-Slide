import React, { useState } from 'react';
import { PracticeSession } from '../../domain/types';
import { formatDurationMs } from '../../domain/timer';
import { Play, Eye, Trash2, ChevronDown, ChevronRight, CheckSquare, Square } from 'lucide-react';
import { Modal } from '../common/Modal';

interface HistoryTableProps {
  sessions: PracticeSession[];
  onResume: (session: PracticeSession) => void;
  onOpenDetails: (session: PracticeSession) => void;
  onDelete: (sessionId: string) => void;
  onBatchDelete: (sessionIds: string[]) => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  sessions,
  onResume,
  onOpenDetails,
  onDelete,
  onBatchDelete,
}) => {
  const [expandedComboIds, setExpandedComboIds] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirmSession, setDeleteConfirmSession] = useState<PracticeSession | null>(null);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const totalRows = sessions.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRows);
  const displayedSessions = sessions.slice(startIndex, endIndex);

  const toggleExpand = (id: string) => {
    setExpandedComboIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isAllSelected = sessions.length > 0 && selectedIds.size === sessions.length;
  const isPartiallySelected = selectedIds.size > 0 && selectedIds.size < sessions.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sessions.map((s) => s.id)));
    }
  };

  const handleToggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirmBatchDelete = () => {
    onBatchDelete(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsBatchDeleteModalOpen(false);
  };

  if (sessions.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-12 text-center">
        <p className="text-sm font-medium text-neutral-900 dark:text-white">
          No practice records match your filter criteria.
        </p>
        <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-1">
          Try clearing filters or generate a new challenge on the Generator tab.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs overflow-hidden space-y-0">
      {/* Batch Actions Bar when rows are selected */}
      {selectedIds.size > 0 && (
        <div className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-2.5 flex items-center justify-between text-xs font-medium animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold font-mono">
              {selectedIds.size} session{selectedIds.size > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-neutral-300 dark:text-neutral-600 hover:text-white dark:hover:text-black cursor-pointer text-xs underline"
            >
              Clear selection
            </button>
            <button
              type="button"
              onClick={() => setIsBatchDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected ({selectedIds.size})
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/75 dark:bg-neutral-950/50 text-neutral-700 dark:text-neutral-300 font-semibold font-mono">
              {/* Checkbox select all */}
              <th className="py-3 px-3 w-8 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isPartiallySelected;
                  }}
                  onChange={handleToggleSelectAll}
                  aria-label="Select all sessions"
                  className="rounded text-neutral-900 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                />
              </th>
              <th className="py-3 px-2 w-6"></th>
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3">Trick / Routine</th>
              <th className="py-3 px-3">Mode & Obstacle</th>
              <th className="py-3 px-3">Stance</th>
              <th className="py-3 px-3">Setup</th>
              <th className="py-3 px-3 text-right">Attempts</th>
              <th className="py-3 px-3 text-right">Landed</th>
              <th className="py-3 px-3 text-right">1st Land</th>
              <th className="py-3 px-3 text-right">Active Time</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
            {displayedSessions.map((session) => {
              const isCombo = session.trickResult.mode === 'combo';
              const isExpanded = !!expandedComboIds[session.id];
              const isSelected = selectedIds.has(session.id);
              const dateStr = new Date(session.generatedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              const singleStance =
                session.trickResult.singleTrick?.stance ||
                session.trickResult.comboSteps?.[0]?.parameters.stance ||
                'regular';

              return (
                <React.Fragment key={session.id}>
                  <tr
                    className={`transition-colors group ${
                      isSelected
                        ? 'bg-neutral-100/80 dark:bg-neutral-800/60'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                    }`}
                  >
                    {/* Multi-select checkbox */}
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleToggleSelectRow(session.id, e as any)}
                        aria-label={`Select session ${session.trickResult.canonicalName}`}
                        className="rounded text-neutral-900 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                      />
                    </td>

                    {/* Expand icon for combos */}
                    <td className="py-2.5 px-1 text-neutral-600 dark:text-neutral-400">
                      {isCombo ? (
                        <button
                          type="button"
                          onClick={() => toggleExpand(session.id)}
                          aria-label={isExpanded ? 'Collapse combo steps' : 'Expand combo steps'}
                          className="p-1 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      ) : null}
                    </td>

                    {/* Date */}
                    <td className="py-2.5 px-3 font-mono text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                      {dateStr}
                    </td>

                    {/* Trick Name */}
                    <td className="py-2.5 px-3 font-semibold text-neutral-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[200px]" title={session.trickResult.canonicalName}>
                          {session.trickResult.canonicalName}
                        </span>
                      </div>
                    </td>

                    {/* Mode & Obstacle */}
                    <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-300 capitalize whitespace-nowrap">
                      {session.trickResult.mode === 'obstacle'
                        ? session.trickResult.obstacleData?.obstacleType
                        : session.setupSnapshot.obstacleType || 'flatground'}
                    </td>

                    {/* Stance */}
                    <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-300 capitalize whitespace-nowrap">
                      {singleStance}
                    </td>

                    {/* Setup Snapshot */}
                    <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-300 whitespace-nowrap font-mono text-[11px]">
                      {session.setupSnapshot.deckWidthMm}mm · {session.setupSnapshot.wheelMaterial.charAt(0).toUpperCase()}
                    </td>

                    {/* Attempts */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                      {session.attemptCount}
                    </td>

                    {/* Landed */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                      {session.landingCount}
                    </td>

                    {/* First Land */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-700 dark:text-neutral-300">
                      {session.firstLandingAttemptNumber ? `#${session.firstLandingAttemptNumber}` : '—'}
                    </td>

                    {/* Active Time */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                      {formatDurationMs(session.activeDurationMs)}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold ${
                          session.status === 'success'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : session.status === 'failed'
                            ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {session.status}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onResume(session)}
                          title="Practice or resume this trick session"
                          aria-label={`Practice ${session.trickResult.canonicalName}`}
                          className="p-1.5 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenDetails(session)}
                          title="View session parameters and snapshot"
                          aria-label={`View details of ${session.trickResult.canonicalName}`}
                          className="p-1.5 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmSession(session)}
                          title="Delete session record"
                          aria-label={`Delete record for ${session.trickResult.canonicalName}`}
                          className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expandable Step Breakdown for combos */}
                  {isCombo && isExpanded && session.trickResult.comboSteps && (
                    <tr className="bg-neutral-50/60 dark:bg-neutral-950/40 border-b border-neutral-100 dark:border-neutral-800">
                      <td colSpan={13} className="p-3 pl-12 text-xs">
                        <div className="space-y-1.5">
                          <div className="text-[11px] font-mono font-semibold text-neutral-700 dark:text-neutral-300">
                            Combo Step Breakdown & Derived Transitions:
                          </div>
                          {session.trickResult.comboSteps.map((step) => (
                            <div key={step.stepNumber} className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                              <span className="font-mono text-neutral-700 dark:text-neutral-300 font-semibold">
                                Step {step.stepNumber}:
                              </span>
                              <span className="font-medium text-neutral-900 dark:text-white">
                                {step.resolvedName}
                              </span>
                              <span className="text-neutral-600 dark:text-neutral-400">·</span>
                              <span>{step.breakdown}</span>
                              <span className="text-neutral-600 dark:text-neutral-400">·</span>
                              <span className="font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
                                Resulting stance: {step.landingState.resultStance}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/90 text-xs">
        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
          <span>
            Showing <strong className="text-neutral-900 dark:text-white font-semibold">{totalRows === 0 ? 0 : startIndex + 1}–{endIndex}</strong> of{' '}
            <strong className="text-neutral-900 dark:text-white font-semibold">{totalRows}</strong> sessions
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Rows per page selector: 10, 30, 70 */}
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-600 dark:text-neutral-400">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 text-xs font-medium text-neutral-900 dark:text-white cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={30}>30</option>
              <option value={70}>70</option>
            </select>
          </div>

          {/* Previous / Next and Page indicator */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={validCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors font-medium"
            >
              Previous
            </button>

            <span className="px-2 font-mono text-neutral-700 dark:text-neutral-300">
              Page {validCurrentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={validCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Delete Single Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmSession !== null}
        onClose={() => setDeleteConfirmSession(null)}
        title="Confirm Session Deletion"
      >
        <div className="space-y-4">
          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Are you sure you want to delete the practice record for{' '}
            <strong>{deleteConfirmSession?.trickResult.canonicalName}</strong>?
            This will permanently remove the attempt logs and duration tracking for this session.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => setDeleteConfirmSession(null)}
              className="px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (deleteConfirmSession) {
                  onDelete(deleteConfirmSession.id);
                  setDeleteConfirmSession(null);
                }
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors"
            >
              Delete Record
            </button>
          </div>
        </div>
      </Modal>

      {/* Batch Delete Confirmation Modal */}
      <Modal
        isOpen={isBatchDeleteModalOpen}
        onClose={() => setIsBatchDeleteModalOpen(false)}
        title="Confirm Batch Deletion"
      >
        <div className="space-y-4">
          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Are you sure you want to delete all <strong>{selectedIds.size} selected session records</strong>?
            This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => setIsBatchDeleteModalOpen(false)}
              className="px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmBatchDelete}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors"
            >
              Delete {selectedIds.size} Sessions
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
