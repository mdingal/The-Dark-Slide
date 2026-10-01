import { PracticeSession, GeneratedTrickResult, SetupData, MissTag } from './types';
import { trickKey, getStreaks, MISS_TAGS } from './progression';
import { createInitialTimerState, startTimer, calculateActiveDurationMs } from './timer';

export function challengeKey(result: GeneratedTrickResult): string {
  return trickKey(result);
}

export function createPracticeSession(result: GeneratedTrickResult, setup: SetupData,
  now = Date.now()): PracticeSession {
  return {
    id: `session_${now}_${Math.random().toString(36).slice(2, 9)}`,
    trickResult: structuredClone(result), setupSnapshot: structuredClone(setup),
    status: 'pending', generatedAt: new Date(now).toISOString(),
    attemptCount: 0, landingCount: 0, activeDurationMs: 0,
    currentLandingStreak: 0, bestLandingStreak: 0, consistencyGoal: 3, missTagCounts: {},
    timerState: createInitialTimerState(), difficultyRating: setup.difficultyRating || 3,
    notes: '', history: [],
  };
}

export function recordCounterAction(session: PracticeSession, action: 'attempt' | 'landing',
  now = Date.now(), missTags: MissTag[] = []): PracticeSession {
  let timerState = session.timerState;
  let sessionStartedAt = session.sessionStartedAt;
  if (!timerState.isRunning && !sessionStartedAt && timerState.accumulatedMs === 0) {
    timerState = startTimer(timerState, now);
    sessionStartedAt = new Date(now).toISOString();
  }
  const duration = calculateActiveDurationMs(timerState, now);
  const firstLanding = action === 'landing' && session.landingCount === 0;
  const previous = getStreaks(session);
  const currentLandingStreak = action === 'landing' ? previous.current + 1 : 0;
  const tags = action === 'attempt' ? [...new Set(missTags)].filter(tag => MISS_TAGS.some(t => t.id === tag)) : [];
  const missTagCounts = { ...(session.missTagCounts || {}) };
  tags.forEach(tag => { missTagCounts[tag] = (missTagCounts[tag] || 0) + 1; });
  return {
    ...session, timerState, sessionStartedAt, activeDurationMs: duration,
    currentLandingStreak, bestLandingStreak: Math.max(previous.best,currentLandingStreak), missTagCounts,
    attemptCount: session.attemptCount + 1,
    landingCount: session.landingCount + (action === 'landing' ? 1 : 0),
    firstLandingAttemptNumber: firstLanding ? session.attemptCount + 1 : session.firstLandingAttemptNumber,
    firstLandingElapsedMs: firstLanding ? duration : session.firstLandingElapsedMs,
    history: [{ action, timestamp: now, prevAttemptCount: session.attemptCount,
      prevLandingCount: session.landingCount, prevStatus: session.status,
      prevFirstLandingAttemptNumber: session.firstLandingAttemptNumber,
      prevFirstLandingElapsedMs: session.firstLandingElapsedMs,
      prevCurrentLandingStreak: previous.current, prevBestLandingStreak: previous.best,
      prevMissTagCounts: { ...(session.missTagCounts || {}) }, missTags: tags }, ...(session.history || [])],
  };
}

export function undoCounterAction(session: PracticeSession): PracticeSession {
  const [last, ...history] = session.history || [];
  if (!last) return session;
  return { ...session, attemptCount: last.prevAttemptCount, landingCount: last.prevLandingCount,
    firstLandingAttemptNumber: last.prevFirstLandingAttemptNumber,
    firstLandingElapsedMs: last.prevFirstLandingElapsedMs,
    currentLandingStreak: last.prevCurrentLandingStreak, bestLandingStreak: last.prevBestLandingStreak,
    missTagCounts: last.prevMissTagCounts ?? session.missTagCounts, status: last.prevStatus, history };
}
