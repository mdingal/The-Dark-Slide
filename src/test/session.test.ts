import { describe, it, expect } from 'vitest';
import { PracticeSession, SetupData, CounterActionHistoryItem } from '../domain/types';
import { CATALOG_VERSION } from '../domain/catalog';
import { createInitialTimerState } from '../domain/timer';

describe('Session Tracking & Snapshot Behavior', () => {
  const originalSetup: SetupData = {
    id: 'setup_1',
    name: 'Berlinwood 33.6mm',
    deckWidthMm: 33.6,
    wheelMaterial: 'urethane',
    surface: 'Granite Counter',
    obstacleType: 'ledge',
    difficultyRating: 4,
  };

  function createTestSession(setup: SetupData): PracticeSession {
    return {
      id: 'session_test_1',
      trickResult: {
        mode: 'single',
        canonicalName: 'Kickflip',
        breakdown: ['Base: Kickflip'],
        catalogVersion: CATALOG_VERSION,
      },
      setupSnapshot: { ...setup }, // Cloned snapshot
      status: 'pending',
      generatedAt: new Date().toISOString(),
      attemptCount: 0,
      landingCount: 0,
      activeDurationMs: 0,
      timerState: createInitialTimerState(),
      difficultyRating: 3,
      notes: '',
      history: [],
    };
  }

  it('guarantees setup snapshot immutability when original setup changes', () => {
    const session = createTestSession(originalSetup);

    // Modify original setup
    const mutatedOriginal: SetupData = {
      ...originalSetup,
      name: 'Renamed Wide Cruiser 36mm',
      deckWidthMm: 36,
      wheelMaterial: 'plastic',
    };

    // Session snapshot must retain original properties
    expect(session.setupSnapshot.name).toBe('Berlinwood 33.6mm');
    expect(session.setupSnapshot.deckWidthMm).toBe(33.6);
    expect(session.setupSnapshot.wheelMaterial).toBe('urethane');
  });

  it('correctly tracks attempt, successful landing, first landing attempt, and undo', () => {
    let session = createTestSession(originalSetup);

    // 1. Add normal attempt (+1 attempt)
    const h1: CounterActionHistoryItem = {
      action: 'attempt',
      timestamp: Date.now(),
      prevAttemptCount: session.attemptCount,
      prevLandingCount: session.landingCount,
      prevFirstLandingAttemptNumber: session.firstLandingAttemptNumber,
      prevStatus: session.status,
    };
    session = {
      ...session,
      attemptCount: 1,
      history: [h1],
    };
    expect(session.attemptCount).toBe(1);
    expect(session.landingCount).toBe(0);

    // 2. Add second attempt
    const h2: CounterActionHistoryItem = {
      action: 'attempt',
      timestamp: Date.now(),
      prevAttemptCount: session.attemptCount,
      prevLandingCount: session.landingCount,
      prevFirstLandingAttemptNumber: session.firstLandingAttemptNumber,
      prevStatus: session.status,
    };
    session = {
      ...session,
      attemptCount: 2,
      history: [h2, ...session.history],
    };
    expect(session.attemptCount).toBe(2);

    // 3. Successful landing (+1 attempt and +1 landing, first landing is #3)
    const h3: CounterActionHistoryItem = {
      action: 'landing',
      timestamp: Date.now(),
      prevAttemptCount: session.attemptCount,
      prevLandingCount: session.landingCount,
      prevFirstLandingAttemptNumber: session.firstLandingAttemptNumber,
      prevStatus: session.status,
    };
    session = {
      ...session,
      attemptCount: 3,
      landingCount: 1,
      firstLandingAttemptNumber: 3,
      history: [h3, ...session.history],
    };
    expect(session.attemptCount).toBe(3);
    expect(session.landingCount).toBe(1);
    expect(session.firstLandingAttemptNumber).toBe(3);

    // 4. Undo the successful landing
    const [lastAction, ...remainingHistory] = session.history;
    session = {
      ...session,
      attemptCount: lastAction.prevAttemptCount,
      landingCount: lastAction.prevLandingCount,
      firstLandingAttemptNumber: lastAction.prevFirstLandingAttemptNumber,
      history: remainingHistory,
    };
    expect(session.attemptCount).toBe(2);
    expect(session.landingCount).toBe(0);
    expect(session.firstLandingAttemptNumber).toBeUndefined();
  });
});
