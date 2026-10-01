import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ requireRider: vi.fn(), getProfile: vi.fn(), saveProfile: vi.fn(), records: new Map<string, unknown>(), writes: [] as unknown[] }));
vi.mock('../services/firebase', () => ({ db: {} }));
vi.mock('../services/firebaseStorageService', () => ({ requireRider: mocks.requireRider, cleanCloudData: (x: unknown) => JSON.parse(JSON.stringify(x)), storageService: mocks }));
vi.mock('firebase/firestore', () => ({ doc: (_db: unknown, ...parts: string[]) => parts.join('/'), runTransaction: async (_db: unknown, fn: (tx: unknown) => unknown) => fn({ get: async (ref: string) => ({ exists: () => mocks.records.has(ref) }), set: (ref: string, value: unknown) => { mocks.records.set(ref, value); mocks.writes.push(value); } }) }));
import { parseRiderExport, importRiderExport } from '../services/fileImport';
import { INITIAL_PROFILES, INITIAL_SESSIONS_ALEX } from '../services/seedData';
const backup = () => ({ format: 'the-dark-slide-rider-export', version: 1, exportedAt: new Date().toISOString(), profile: INITIAL_PROFILES[0], sessions: INITIAL_SESSIONS_ALEX });
describe('JSON backup import', () => {
 beforeEach(() => { vi.clearAllMocks(); mocks.records.clear(); mocks.writes = []; });
 it('accepts a complete export including a BOM', () => { expect(parseRiderExport('\uFEFF' + JSON.stringify(backup())).sessions.length).toBe(INITIAL_SESSIONS_ALEX.length); });
 it('rejects arbitrary JSON, unsupported versions, and invalid metrics', () => {
  expect(() => parseRiderExport('{}')).toThrow(); const data = backup(); data.version = 2; expect(() => parseRiderExport(JSON.stringify(data))).toThrow();
  const invalid = backup(); invalid.sessions = [{ ...invalid.sessions[0], landingCount: invalid.sessions[0].attemptCount + 1 }]; expect(() => parseRiderExport(JSON.stringify(invalid))).toThrow();
 });
 it('rejects duplicate IDs and invalid tool records before writing', () => { const data = backup(); data.sessions = [data.sessions[0], data.sessions[0]]; expect(() => parseRiderExport(JSON.stringify(data))).toThrow('duplicate'); expect(mocks.writes).toHaveLength(0); });
 it('adds once, pauses timers, merges tools, and preserves destination identity', async () => {
  const data = parseRiderExport(JSON.stringify(backup())); data.sessions = data.sessions.slice(0,1);
  mocks.getProfile.mockResolvedValue({ ...data.profile, id: 'destination', email: 'destination@example.com', displayName: 'Destination Rider', savedSetups: [], bookmarks: [], poolPresets: [], trickLibrary: [] });
  expect((await importRiderExport('destination', data)).added).toBe(1);
  expect((await importRiderExport('destination', data)).skipped).toBe(1); expect(mocks.writes).toHaveLength(1);
  const saved = mocks.writes[0] as { timerState: { isRunning: boolean } }; expect(saved.timerState.isRunning).toBe(false);
  expect(mocks.saveProfile.mock.calls[0][0].displayName).toBe('Destination Rider'); expect(mocks.saveProfile.mock.calls[0][0].email).toBe('destination@example.com');
 });
 it('does not overwrite matching current-account session IDs', async () => {
  const data = parseRiderExport(JSON.stringify(backup())); data.sessions = data.sessions.slice(0,1);
  mocks.getProfile.mockResolvedValue(data.profile); mocks.records.set(`users/${data.profile.id}/sessions/${data.sessions[0].id}`, { notes: 'newer notes' });
  expect((await importRiderExport(data.profile.id, data)).skipped).toBe(1); expect(mocks.writes).toHaveLength(0);
 });
});
