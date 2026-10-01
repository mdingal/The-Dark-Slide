import React, { useState, useRef } from 'react';
import { Bookmark, Repeat2 } from 'lucide-react';
import { GeneratedTrickResult } from '../../domain/types';
import { challengeKey } from '../../domain/practiceActions';
import { useApp } from '../../context/AppContext';
import { Modal } from './Modal';
import { TrickLibraryControl } from './TrickLibraryControl';

export const ChallengeActions: React.FC<{ result: GeneratedTrickResult; compact?: boolean }> = ({ result, compact }) => {
  const { profile, currentSession, repeatChallenge, toggleBookmark, showToast } = useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const bookmarked = (profile?.bookmarks || []).some(b => challengeKey(b.trickResult) === challengeKey(result));
  const perform = async (action: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true);
    try { await action(); setConfirmOpen(false); }
    catch { showToast('Could not save this change. Try again.'); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const repeat = () => {
    if (currentSession && !currentSession.sessionEndedAt &&
        (currentSession.attemptCount > 0 || currentSession.timerState.isRunning || currentSession.activeDurationMs > 0)) {
      setConfirmOpen(true);
    } else { void perform(() => repeatChallenge(result)); }
  };
  const button = 'inline-flex items-center justify-center gap-1.5 rounded-md p-2 text-xs font-medium disabled:opacity-40';
  return <>
    <div className="flex flex-wrap items-center gap-1.5">
      <button type="button" disabled={busy} onClick={repeat} title="Repeat challenge in a fresh session"
        aria-label={`Repeat ${result.canonicalName}`} className={`${button} bg-neutral-100 dark:bg-neutral-800`}>
        <Repeat2 className="w-3.5 h-3.5" />{!compact && 'Repeat Challenge'}
      </button>
      <button type="button" disabled={busy} onClick={() => void perform(() => toggleBookmark(result))}
        aria-pressed={bookmarked} aria-label={`${bookmarked ? 'Remove bookmark for' : 'Bookmark'} ${result.canonicalName}`}
        title={bookmarked ? 'Remove bookmark' : 'Bookmark challenge'}
        className={`${button} ${bookmarked ? 'text-[#8A6500] dark:text-[#D4A72C]' : 'text-neutral-600 dark:text-neutral-300'}`}>
        <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />{!compact && (bookmarked ? 'Bookmarked' : 'Bookmark')}
      </button>
      {!compact && <TrickLibraryControl result={result} />}
    </div>
    <Modal isOpen={confirmOpen} onClose={() => { if (!busy) setConfirmOpen(false); }} title="Start a fresh session?">
      <div className="space-y-4 text-sm">
        <p>Your current session will be paused and kept in history. This challenge starts with zero attempts, landings, and practice time.</p>
        <div className="flex justify-end gap-2">
          <button type="button" disabled={busy} onClick={() => setConfirmOpen(false)} className="px-3 py-2">Cancel</button>
          <button type="button" disabled={busy} onClick={() => void perform(() => repeatChallenge(result))}
            className="px-3 py-2 rounded-md bg-[#D4A72C] text-[#292524] disabled:opacity-40">{busy ? 'Saving...' : 'Start Fresh'}</button>
        </div>
      </div>
    </Modal>
  </>;
};
