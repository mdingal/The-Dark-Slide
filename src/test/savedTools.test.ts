import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { createPracticeSession } from '../domain/practiceActions';
import { LocalStorageService } from '../services/localStorageService';
import { UserProfile, GeneratorPresetConfig } from '../domain/types';

let storage: LocalStorageService;
const rider = (id: string): UserProfile => ({ id, displayName: id, email: `${id}@test.local`, preferredTheme: 'dark', savedSetups: [], availableObstacles: ['rail'] });
beforeEach(() => {
  const data = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value), removeItem: (key: string) => data.delete(key) });
  storage = new LocalStorageService();
});
afterEach(() => vi.unstubAllGlobals());
describe('Saved rider tools', () => {
  it('persists bookmarks and presets and keeps another rider separate', async () => {
    const a = rider('a'), b = rider('b');
    const session = createPracticeSession({ mode: 'single', canonicalName: 'Kickflip', breakdown: [], catalogVersion: '1' },
      { id: 's', name: '34mm', deckWidthMm: 34, wheelMaterial: 'urethane' }, 1000);
    a.bookmarks = [{ id: 'bookmark', savedAt: 'now', trickResult: session.trickResult }];
    const config = { mode: 'obstacle', obstacleLocks: { transferTrickId: '' },
      obstacleExclusions: { transferTrickIds: ['smith'] } } as GeneratorPresetConfig;
    a.poolPresets = [{ id: 'preset', name: 'Rails', savedAt: 'now', config }];
    await storage.saveProfile(a); await storage.saveProfile(b);
    await storage.switchProfile('a');
    expect((await storage.getActiveProfile()).bookmarks).toEqual(a.bookmarks);
    expect((await storage.getActiveProfile()).poolPresets).toEqual(a.poolPresets);
    await storage.switchProfile('b');
    expect((await storage.getActiveProfile()).bookmarks || []).toEqual([]);
    expect((await storage.getActiveProfile()).poolPresets || []).toEqual([]);
    await storage.switchProfile('a');
    expect((await storage.getActiveProfile()).poolPresets?.[0].config.obstacleLocks.transferTrickId).toBe('');
  });
  it('persists first landing time including zero without modifying another session', async () => {
    const a = rider('a'); await storage.saveProfile(a);
    const session = createPracticeSession({ mode: 'single', canonicalName: 'Kickflip', breakdown: [], catalogVersion: '1' },
      { id: 's', name: '34mm', deckWidthMm: 34, wheelMaterial: 'urethane' }, 1000);
    await storage.saveSession(a.id, { ...session, firstLandingElapsedMs: 0, firstLandingAttemptNumber: 1 });
    const stored = await storage.getSessions(a.id);
    expect(stored[0].firstLandingElapsedMs).toBe(0);
    expect(stored[0].firstLandingAttemptNumber).toBe(1);
    expect(await storage.getSessions('b')).toEqual([]);
  });
});
