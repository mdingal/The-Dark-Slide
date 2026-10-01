import { describe, it, expect } from 'vitest';
import { createPracticeSession, recordCounterAction, undoCounterAction, challengeKey } from '../domain/practiceActions';
import { pauseTimer, startTimer } from '../domain/timer';
import { GeneratedTrickResult, SetupData } from '../domain/types';

const result: GeneratedTrickResult = { mode: 'single', canonicalName: 'Kickflip',
  singleTrick: { stance: 'regular', direction: 'none', baseTrickId: 'kickflip', bodyVarial: 'none', landing: 'normal', revert: 'none' },
  breakdown: ['Kickflip'], catalogVersion: '1' };
const setup: SetupData = { id: 'setup', name: '34mm', deckWidthMm: 34, wheelMaterial: 'urethane' };

describe('Practice tools', () => {
  it('repeats a challenge into an independent session with reset stats', () => {
    const old = recordCounterAction(createPracticeSession(result, setup, 1000), 'landing', 2000);
    const fresh = createPracticeSession(old.trickResult, setup, 3000);
    expect(fresh.id).not.toBe(old.id);
    expect(fresh.trickResult).toEqual(old.trickResult);
    expect(fresh.attemptCount).toBe(0); expect(fresh.landingCount).toBe(0);
    expect(fresh.firstLandingElapsedMs).toBeUndefined();
    expect(fresh.firstLandingAttemptNumber).toBeUndefined();
    expect(fresh.timerState.isRunning).toBe(false); expect(fresh.activeDurationMs).toBe(0);
    fresh.trickResult.breakdown.push('changed');
    expect(old.trickResult.breakdown).toEqual(['Kickflip']);
  });
  it('records the first landing attempt and elapsed time, excluding paused time', () => {
    let session = createPracticeSession(result, setup, 1000);
    session = recordCounterAction(session, 'attempt', 2000);
    session = { ...session, timerState: pauseTimer(session.timerState, 5000) };
    session = { ...session, timerState: startTimer(session.timerState, 10000) };
    session = recordCounterAction(session, 'landing', 12000);
    expect(session.firstLandingAttemptNumber).toBe(2);
    expect(session.firstLandingElapsedMs).toBe(5000);
    session = recordCounterAction(session, 'landing', 14000);
    expect(session.firstLandingAttemptNumber).toBe(2);
    expect(session.firstLandingElapsedMs).toBe(5000);
  });
  it('undo clears the first landing and allows a new first landing', () => {
    let session = recordCounterAction(createPracticeSession(result, setup, 1000), 'attempt', 2000);
    session = recordCounterAction(session, 'landing', 5000);
    session = undoCounterAction(session);
    expect(session.landingCount).toBe(0); expect(session.attemptCount).toBe(1);
    expect(session.firstLandingAttemptNumber).toBeUndefined();
    expect(session.firstLandingElapsedMs).toBeUndefined();
    session = recordCounterAction(session, 'landing', 8000);
    expect(session.firstLandingAttemptNumber).toBe(2); expect(session.firstLandingElapsedMs).toBe(6000);
  });
  it('handles a landing on the first attempt with a valid zero elapsed time', () => {
    const session = recordCounterAction(createPracticeSession(result, setup, 1000), 'landing', 2000);
    expect(session.firstLandingAttemptNumber).toBe(1); expect(session.firstLandingElapsedMs).toBe(0);
  });
  it('does not invent first landing time for older records', () => {
    const legacy = { ...createPracticeSession(result, setup, 1000), landingCount: 2, attemptCount: 5, firstLandingAttemptNumber: 3 };
    const session = recordCounterAction(legacy, 'landing', 5000);
    expect(session.firstLandingAttemptNumber).toBe(3); expect(session.firstLandingElapsedMs).toBeUndefined();
  });
  it('does not restart a paused timer while recording a landing', () => {
    let session = recordCounterAction(createPracticeSession(result, setup, 1000), 'attempt', 2000);
    session = { ...session, timerState: pauseTimer(session.timerState, 5000) };
    session = recordCounterAction(session, 'landing', 9000);
    expect(session.firstLandingElapsedMs).toBe(3000); expect(session.timerState.isRunning).toBe(false);
  });
  it('retains an empty transfer lock and exclusions when a preset is saved as JSON', () => {
    const config = { mode: 'obstacle', obstacleLocks: { transferTrickId: '' },
      obstacleExclusions: { transferTrickIds: ['smith', 'boardslide'] } };
    const restored = JSON.parse(JSON.stringify(config));
    expect(restored.obstacleLocks.transferTrickId).toBe('');
    expect(restored.obstacleExclusions.transferTrickIds).toEqual(['smith', 'boardslide']);
  });
  it('matches the same bookmarked challenge independently of the saved session', () => {
    expect(challengeKey(result)).toBe(challengeKey(structuredClone(result)));
    expect(challengeKey(result)).not.toBe(challengeKey({ ...result, canonicalName: 'Switch Kickflip', singleTrick: { ...result.singleTrick!, stance: 'switch' } }));
  });
});
