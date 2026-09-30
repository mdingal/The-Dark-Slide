import React, { useState, useRef, useEffect } from 'react';
import { Filter, Check, X, ChevronDown } from 'lucide-react';

interface ItemPoolSelectorProps {
  label: string;
  items: { id: string; label: string }[];
  excludedIds: string[];
  onToggleExclude: (id: string) => void;
  onResetExclusions: () => void;
}

export const ItemPoolSelector: React.FC<ItemPoolSelectorProps> = ({
  label,
  items,
  excludedIds,
  onToggleExclude,
  onResetExclusions,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const excludedCount = items.filter((item) => excludedIds.includes(item.id)).length;
  const includedCount = items.length - excludedCount;

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={`Filter included items for ${label}`}
        aria-label={`Filter included items for ${label}. ${excludedCount} excluded.`}
        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer border ${
          excludedCount > 0
            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:text-neutral-900 dark:hover:text-white'
        }`}
      >
        <Filter className="w-2.5 h-2.5" />
        <span>
          {excludedCount > 0 ? `${includedCount}/${items.length}` : 'Pool'}
        </span>
        <ChevronDown className="w-2.5 h-2.5 opacity-60" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 z-50 w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg p-2.5 text-xs animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100 dark:border-neutral-800">
            <span className="font-semibold text-neutral-900 dark:text-white text-[11px]">
              Randomize In: {label}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onResetExclusions}
                disabled={excludedCount === 0}
                className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer disabled:opacity-40 disabled:cursor-default"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => {
                  items.forEach((item) => {
                    if (!excludedIds.includes(item.id)) {
                      onToggleExclude(item.id);
                    }
                  });
                }}
                disabled={includedCount === 0}
                className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer disabled:opacity-40 disabled:cursor-default"
              >
                Select None
              </button>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {items.map((item) => {
              const isExcluded = excludedIds.includes(item.id);
              return (
                <label
                  key={item.id}
                  className="flex items-center justify-between p-1.5 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800/60 cursor-pointer select-none"
                >
                  <span
                    className={`truncate text-xs ${
                      isExcluded
                        ? 'text-neutral-400 dark:text-neutral-600 line-through'
                        : 'text-neutral-900 dark:text-neutral-200 font-medium'
                    }`}
                  >
                    {item.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={!isExcluded}
                    onChange={() => onToggleExclude(item.id)}
                    className="rounded text-neutral-900 focus:ring-0 w-3.5 h-3.5"
                  />
                </label>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-500 dark:text-neutral-400">
            Unchecked items will not be chosen during random generation.
          </div>
        </div>
      )}
    </div>
  );
};
