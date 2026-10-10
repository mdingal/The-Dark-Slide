import React from 'react';
import { useApp } from '../../context/AppContext';
import { ChallengeActions } from '../common/ChallengeActions';

export const BookmarksPanel: React.FC = () => {
  const { profile } = useApp();
  const bookmarks = profile?.bookmarks || [];
  return <details className="ds-surface rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
    <summary className="cursor-pointer text-sm font-semibold">Bookmarked Challenges ({bookmarks.length})</summary>
    <div className="mt-3 space-y-3 max-h-80 overflow-y-auto">
      {!bookmarks.length && <p className="text-xs text-neutral-600 dark:text-neutral-300">Bookmark a challenge in Trick Lab or history to practice it again later.</p>}
      {bookmarks.map(bookmark => <div key={bookmark.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-neutral-200 dark:border-neutral-800 pt-3">
        <div className="min-w-0">
          <p className="text-xs text-neutral-500 capitalize">{bookmark.trickResult.mode}</p>
          <p className="text-sm font-medium break-words">{bookmark.trickResult.canonicalName}</p>
        </div>
        <div className="shrink-0"><ChallengeActions result={bookmark.trickResult} /></div>
      </div>)}
    </div>
  </details>;
};
