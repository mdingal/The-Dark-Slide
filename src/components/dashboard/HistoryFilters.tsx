import React from 'react';
import { Stance, SessionStatus, WheelMaterial, ObstacleType } from '../../domain/types';
import { Search, RotateCcw } from 'lucide-react';

export interface FilterState {
  search: string;
  status: string; // 'all' | 'pending' | 'success' | 'failed'
  dateRange: string; // 'all' | 'today' | 'week' | 'month'
  stance: string; // 'all' | Stance
  deckWidth: string; // 'all' | string
  wheelMaterial: string; // 'all' | WheelMaterial
  obstacle: string; // 'all' | ObstacleType
  sortBy: 'date' | 'attempts' | 'duration';
  sortOrder: 'asc' | 'desc';
}

interface HistoryFiltersProps {
  filters: FilterState;
  onChangeFilters: (f: FilterState) => void;
  onResetFilters: () => void;
}

export const HistoryFilters: React.FC<HistoryFiltersProps> = ({
  filters,
  onChangeFilters,
  onResetFilters,
}) => {
  const handleChange = (key: keyof FilterState, value: any) => {
    onChangeFilters({ ...filters, [key]: value });
  };

  const isFiltered =
    filters.search !== '' ||
    filters.status !== 'all' ||
    filters.dateRange !== 'all' ||
    filters.stance !== 'all' ||
    filters.deckWidth !== 'all' ||
    filters.wheelMaterial !== 'all' ||
    filters.obstacle !== 'all';

  return (
    <div className="ds-surface bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-xs space-y-3">
      {/* Top Search & Sort Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            placeholder="Search trick name, combo, obstacle..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-600 dark:placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
          />
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">Sort:</span>
          <select
            value={filters.sortBy}
            onChange={(e) => handleChange('sortBy', e.target.value)}
            className="text-xs font-medium bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md px-2 py-1.5 text-neutral-900 dark:text-white focus:outline-none"
          >
            <option value="date">Date</option>
            <option value="attempts">Attempts</option>
            <option value="duration">Active Time</option>
          </select>
          <button
            type="button"
            onClick={() =>
              handleChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')
            }
            className="px-2.5 py-1.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md text-neutral-900 dark:text-white transition-colors cursor-pointer"
          >
            {filters.sortOrder === 'desc' ? 'Desc ↓' : 'Asc ↑'}
          </button>
          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              title="Reset all filters"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Filter Row 2: Status, Date, Stance, Deck Width, Wheel, Obstacle */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
        {/* Status */}
        <div>
          <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md px-2 py-1 text-neutral-900 dark:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Date
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => handleChange('dateRange', e.target.value)}
            className="w-full text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md px-2 py-1 text-neutral-900 dark:text-white"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Past 7 Days</option>
            <option value="month">Past 30 Days</option>
          </select>
        </div>

        {/* Stance */}
        <div>
          <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Stance
          </label>
          <select
            value={filters.stance}
            onChange={(e) => handleChange('stance', e.target.value)}
            className="w-full text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md px-2 py-1 text-neutral-900 dark:text-white"
          >
            <option value="all">All Stances</option>
            <option value="regular">Regular</option>
            <option value="fakie">Fakie</option>
            <option value="switch">Switch</option>
            <option value="nollie">Nollie</option>
          </select>
        </div>

        {/* Deck Width */}
        <div>
          <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Deck Width
          </label>
          <select
            value={filters.deckWidth}
            onChange={(e) => handleChange('deckWidth', e.target.value)}
            className="w-full text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md px-2 py-1 text-neutral-900 dark:text-white"
          >
            <option value="all">All Widths</option>
            <option value="26">26mm</option>
            <option value="29">29mm</option>
            <option value="31">31mm</option>
            <option value="32">32mm</option>
            <option value="33">33mm</option>
            <option value="33.6">33.6mm</option>
            <option value="34">34mm</option>
            <option value="36">36mm</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {/* Wheel Material */}
        <div>
          <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Wheels
          </label>
          <select
            value={filters.wheelMaterial}
            onChange={(e) => handleChange('wheelMaterial', e.target.value)}
            className="w-full text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md px-2 py-1 text-neutral-900 dark:text-white"
          >
            <option value="all">All Wheels</option>
            <option value="plastic">Plastic</option>
            <option value="urethane">Urethane</option>
            <option value="resin">Resin</option>
          </select>
        </div>

        {/* Obstacle */}
        <div>
          <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Obstacle
          </label>
          <select
            value={filters.obstacle}
            onChange={(e) => handleChange('obstacle', e.target.value)}
            className="w-full text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md px-2 py-1 text-neutral-900 dark:text-white"
          >
            <option value="all">All Obstacles</option>
            <option value="flatground">Flatground</option>
            <option value="ledge">Ledge</option>
            <option value="rail">Rail</option>
            <option value="manual_pad">Manual Pad</option>
          </select>
        </div>
      </div>
    </div>
  );
};
