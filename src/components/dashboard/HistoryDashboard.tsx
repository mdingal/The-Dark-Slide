import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PracticeSession } from '../../domain/types';
import { formatDurationMs } from '../../domain/timer';
import { HistoryFilters, FilterState } from './HistoryFilters';
import { HistoryTable } from './HistoryTable';
import { DashboardCharts } from './DashboardCharts';
import { SessionDetailsModal } from './SessionDetailsModal';
import { BarChart3, ListFilter, Trophy, Target, Clock, Zap } from 'lucide-react';

const INITIAL_FILTERS: FilterState = {
  search: '',
  status: 'all',
  dateRange: 'all',
  stance: 'all',
  deckWidth: 'all',
  wheelMaterial: 'all',
  obstacle: 'all',
  sortBy: 'date',
  sortOrder: 'desc',
};

export const HistoryDashboard: React.FC = () => {
  const { sessions, resumeSession, deleteSession, deleteSessions } = useApp();
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [activeView, setActiveView] = useState<'table' | 'charts' | 'both'>('both');
  const [inspectSession, setInspectSession] = useState<PracticeSession | null>(null);

  // Filter & Sort Sessions
  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    // 1. Search text
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (s) =>
          s.trickResult.canonicalName.toLowerCase().includes(q) ||
          s.setupSnapshot.name.toLowerCase().includes(q) ||
          s.notes?.toLowerCase().includes(q)
      );
    }

    // 2. Status
    if (filters.status !== 'all') {
      result = result.filter((s) => s.status === filters.status);
    }

    // 3. Date range
    if (filters.dateRange !== 'all') {
      const now = Date.now();
      result = result.filter((s) => {
        const time = new Date(s.generatedAt).getTime();
        if (filters.dateRange === 'today') {
          return now - time <= 86400000;
        } else if (filters.dateRange === 'week') {
          return now - time <= 86400000 * 7;
        } else if (filters.dateRange === 'month') {
          return now - time <= 86400000 * 30;
        }
        return true;
      });
    }

    // 4. Stance
    if (filters.stance !== 'all') {
      result = result.filter((s) => {
        const stance =
          s.trickResult.singleTrick?.stance ||
          s.trickResult.comboSteps?.[0]?.parameters.stance ||
          'regular';
        return stance === filters.stance;
      });
    }

    // 5. Deck width
    if (filters.deckWidth !== 'all') {
      if (filters.deckWidth === 'custom') {
        result = result.filter((s) => s.setupSnapshot.isCustomDeckWidth);
      } else {
        const targetWidth = parseFloat(filters.deckWidth);
        result = result.filter((s) => Math.abs(s.setupSnapshot.deckWidthMm - targetWidth) < 0.05);
      }
    }

    // 6. Wheel material
    if (filters.wheelMaterial !== 'all') {
      result = result.filter((s) => s.setupSnapshot.wheelMaterial === filters.wheelMaterial);
    }

    // 7. Obstacle
    if (filters.obstacle !== 'all') {
      result = result.filter((s) => {
        const obs =
          s.trickResult.mode === 'obstacle'
            ? s.trickResult.obstacleData?.obstacleType
            : s.setupSnapshot.obstacleType;
        return obs === filters.obstacle;
      });
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (filters.sortBy === 'date') {
        comparison = new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime();
      } else if (filters.sortBy === 'attempts') {
        comparison = a.attemptCount - b.attemptCount;
      } else if (filters.sortBy === 'duration') {
        comparison = a.activeDurationMs - b.activeDurationMs;
      }
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [sessions, filters]);

  // Dashboard Metrics Calculation
  const metrics = useMemo(() => {
    const generatedChallenges = filteredSessions.length;
    const attemptedSessions = filteredSessions.filter((s) => s.attemptCount > 0);
    const successfulSessions = filteredSessions.filter((s) => s.status === 'success').length;

    let totalAttempts = 0;
    let totalLandings = 0;
    let totalDurationMs = 0;

    filteredSessions.forEach((s) => {
      totalAttempts += s.attemptCount;
      totalLandings += s.landingCount;
      totalDurationMs += s.activeDurationMs;
    });

    // Landing rate = successful landings divided by total attempts
    // Exclude unattempted records from completion-rate / landing-rate calculations
    const landingRate =
      totalAttempts > 0 ? Math.round((totalLandings / totalAttempts) * 100) : 0;

    // Completion rate of attempted sessions
    const completionRate =
      attemptedSessions.length > 0
        ? Math.round((successfulSessions / attemptedSessions.length) * 100)
        : 0;

    return {
      generatedChallenges,
      attemptedCount: attemptedSessions.length,
      successfulSessions,
      totalAttempts,
      totalLandings,
      totalDurationMs,
      landingRate,
      completionRate,
    };
  }, [filteredSessions]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
            Generated Challenges
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white tabular-nums mt-1">
            {metrics.generatedChallenges}
          </div>
          <div className="text-[10px] text-neutral-700 dark:text-neutral-300 mt-1">
            Total logged
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
            Attempted Sessions
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white tabular-nums mt-1">
            {metrics.attemptedCount}
          </div>
          <div className="text-[10px] text-neutral-700 dark:text-neutral-300 mt-1">
            {metrics.completionRate}% completion rate
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
            Successful Sessions
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
            {metrics.successfulSessions}
          </div>
          <div className="text-[10px] text-neutral-700 dark:text-neutral-300 mt-1">
            Marked completed
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
            Total Attempts
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white tabular-nums mt-1">
            {metrics.totalAttempts}
          </div>
          <div className="text-[10px] text-neutral-700 dark:text-neutral-300 mt-1">
            {metrics.totalLandings} landed
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
            Active Practice Time
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white tabular-nums mt-1">
            {formatDurationMs(metrics.totalDurationMs)}
          </div>
          <div className="text-[10px] text-neutral-700 dark:text-neutral-300 mt-1">
            Excludes paused time
          </div>
        </div>

        {/* Metric 6 */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
            Overall Landing Rate
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white tabular-nums mt-1">
            {metrics.landingRate}%
          </div>
          <div className="text-[10px] text-neutral-700 dark:text-neutral-300 mt-1">
            Landings / attempts
          </div>
        </div>
      </div>

      {/* Filter and View Toggle Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <HistoryFilters
          filters={filters}
          onChangeFilters={setFilters}
          onResetFilters={() => setFilters(INITIAL_FILTERS)}
        />
      </div>

      {/* View Mode Switcher */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-neutral-700 dark:text-neutral-300">
          Showing {filteredSessions.length} record{filteredSessions.length === 1 ? '' : 's'}
        </div>
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveView('both')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeView === 'both'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            All Views
          </button>
          <button
            onClick={() => setActiveView('table')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeView === 'table'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Table Only
          </button>
          <button
            onClick={() => setActiveView('charts')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeView === 'charts'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Charts Only
          </button>
        </div>
      </div>

      {/* Analytics Charts */}
      {(activeView === 'charts' || activeView === 'both') && (
        <DashboardCharts sessions={filteredSessions} />
      )}

      {/* Data Table */}
      {(activeView === 'table' || activeView === 'both') && (
        <HistoryTable
          sessions={filteredSessions}
          onResume={resumeSession}
          onOpenDetails={setInspectSession}
          onDelete={deleteSession}
          onBatchDelete={deleteSessions}
        />
      )}

      {/* Details Modal */}
      <SessionDetailsModal
        session={inspectSession}
        isOpen={inspectSession !== null}
        onClose={() => setInspectSession(null)}
        onResume={resumeSession}
      />
    </div>
  );
};
