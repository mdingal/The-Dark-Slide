import React from 'react';
import { ChallengeActions } from '../common/ChallengeActions';
import { getStreaks, MISS_TAGS } from '../../domain/progression';
import { getChallengeComplexity } from '../../domain/complexity';
import { PracticeSession } from '../../domain/types';
import { Modal } from '../common/Modal';
import { formatDurationMs } from '../../domain/timer';

interface SessionDetailsModalProps {
  session: PracticeSession | null;
  isOpen: boolean;
  onClose: () => void;
  onResume: (session: PracticeSession) => void;
}

export const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
  session,
  isOpen,
  onClose,
  onResume,
}) => {
  if (!session) return null;

  const landingRate =
    session.attemptCount > 0
      ? Math.round((session.landingCount / session.attemptCount) * 100)
      : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Session Record Details">
      <div className="space-y-4 text-xs">
        {/* Trick Header */}
        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="text-[11px] text-neutral-700 dark:text-neutral-300 font-mono uppercase">
            {session.trickResult.mode} Challenge
          </div>
          <div className="text-base font-bold text-neutral-900 dark:text-white mt-0.5">
            {session.trickResult.canonicalName}
          </div>
          <div className="text-[11px] text-neutral-700 dark:text-neutral-300 mt-1">
            Generated: {new Date(session.generatedAt).toLocaleString()}
          </div>
        </div>

        {/* Breakdown */}
        <div>
          <div className="font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
            Mechanics Breakdown
          </div>
          <ul className="list-disc list-inside space-y-1 text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/60 p-2.5 rounded border border-neutral-200 dark:border-neutral-800">
            {session.trickResult.breakdown.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>

        {/* Setup Snapshot */}
        <div>
          <div className="font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
            Setup Snapshot (Archived at Session Start)
          </div>
          <div className="grid grid-cols-2 gap-2 bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded border border-neutral-200 dark:border-neutral-800">
            <div>
              <span className="text-neutral-700 dark:text-neutral-300">Deck Name:</span>{' '}
              <span className="font-medium text-neutral-900 dark:text-white">
                {session.setupSnapshot.name}
              </span>
            </div>
            <div>
              <span className="text-neutral-700 dark:text-neutral-300">Deck Width:</span>{' '}
              <span className="font-mono text-neutral-900 dark:text-white">
                {session.setupSnapshot.deckWidthMm}mm
              </span>
            </div>
            <div>
              <span className="text-neutral-700 dark:text-neutral-300">Wheels:</span>{' '}
              <span className="font-medium capitalize text-neutral-900 dark:text-white">
                {session.setupSnapshot.wheelMaterial}
              </span>
            </div>
            <div>
              <span className="text-neutral-700 dark:text-neutral-300">Surface:</span>{' '}
              <span className="font-medium text-neutral-900 dark:text-white">
                {session.setupSnapshot.surface || 'Desk'}
              </span>
            </div>
            <div>
              <span className="text-neutral-700 dark:text-neutral-300">Obstacle:</span>{' '}
              <span className="font-medium capitalize text-neutral-900 dark:text-white">
                {session.setupSnapshot.obstacleType}
              </span>
            </div>
            <div>
              <span className="text-neutral-700 dark:text-neutral-300">Difficulty:</span>{' '}
              <span className="font-mono text-neutral-900 dark:text-white">
                Level {session.difficultyRating} / 5
              </span>
            </div>
          </div>
        </div>

        {/* Practice Stats */}
        <div>
          <div className="font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
            Session Performance Statistics
          </div>
          <div className="grid grid-cols-3 gap-2 bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded border border-neutral-200 dark:border-neutral-800 font-mono">
            <div>
              <div className="text-neutral-700 dark:text-neutral-300 text-[10px]">Attempts</div>
              <div className="text-sm font-bold text-neutral-900 dark:text-white">
                {session.attemptCount}
              </div>
            </div>
            <div>
              <div className="text-neutral-700 dark:text-neutral-300 text-[10px]">Landings</div>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {session.landingCount}
              </div>
            </div>
            <div>
              <div className="text-neutral-700 dark:text-neutral-300 text-[10px]">Landing Rate</div>
              <div className="text-sm font-bold text-neutral-900 dark:text-white">
                {landingRate}%
              </div>
            </div>
            <div>
              <div className="text-neutral-700 dark:text-neutral-300 text-[10px]">Active Duration</div>
              <div className="text-sm font-bold text-neutral-900 dark:text-white">
                {formatDurationMs(session.activeDurationMs)}
              </div>
            </div>
            <div>
              <div className="text-neutral-700 dark:text-neutral-300 text-[10px]">First Land</div>
              <div className="text-sm font-bold text-neutral-900 dark:text-white">
                {session.firstLandingAttemptNumber ? `#${session.firstLandingAttemptNumber}` : '—'}
              </div>
            </div>
            <div>
              <div className="text-neutral-700 dark:text-neutral-300 text-[10px]">Status</div>
              <div className="text-sm font-bold capitalize text-neutral-900 dark:text-white">
                {session.status}
              </div>
            </div>
          </div>
        </div>

        <p className="text-neutral-600 dark:text-neutral-300">
          Time to first landing: {session.firstLandingElapsedMs !== undefined
            ? formatDurationMs(session.firstLandingElapsedMs) : 'Not recorded'} (active practice time; pauses excluded).
        </p>
        <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-3 text-xs space-y-1">
          <p>Challenge complexity: <span className="capitalize">{getChallengeComplexity(session.trickResult)}</span> · Session difficulty: {session.difficultyRating} / 5</p>
          <p>Current streak: {getStreaks(session).current} · Best recorded streak: {getStreaks(session).best} · Goal: {session.consistencyGoal || 3}</p>
          <p>Miss tags: {MISS_TAGS.filter(t=>(session.missTagCounts?.[t.id]||0)>0).map(t=>`${t.label}: ${session.missTagCounts?.[t.id]}`).join(' · ')||'None recorded'}</p>
          <p>Deck: {session.setupSnapshot.deckModel || 'Not recorded'} · Trucks: {session.setupSnapshot.truckModel || 'Not recorded'} · Wheel model: {session.setupSnapshot.wheelModel || 'Not recorded'}</p>
        </div>
        <ChallengeActions result={session.trickResult} />

        {/* Notes */}
        {session.notes && (
          <div>
            <div className="font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Notes</div>
            <p className="text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded border border-neutral-200 dark:border-neutral-800 leading-relaxed">
              {session.notes}
            </p>
          </div>
        )}

        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onResume(session);
            }}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-semibold rounded-md shadow-xs"
          >
            Open Saved Session
          </button>
        </div>
      </div>
    </Modal>
  );
};
