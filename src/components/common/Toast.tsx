import React from 'react';
import { useApp } from '../../context/AppContext';

export const Toast: React.FC = () => {
  const { toast } = useApp();

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium border border-neutral-700 dark:border-neutral-200 transition-all animate-in fade-in slide-in-from-bottom-2"
    >
      {toast}
    </div>
  );
};
