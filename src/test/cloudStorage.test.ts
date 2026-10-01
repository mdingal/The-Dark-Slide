import { describe, it, expect, vi, beforeEach } from 'vitest';
const state = vi.hoisted(() => ({ user: { uid: 'rider1', email: 'rider@example.com', emailVerified: true }, data: undefined as Record<string, unknown> | undefined, writes: [] as unknown[][] }));
vi.mock('../services/firebase', () => ({ auth: { get currentUser() { return state.user; } }, db: {} }));
vi.mock('firebase/firestore', () => ({
 doc: (_db: unknown, ...parts: string[]) => parts.join('/'), collection: vi.fn(), getDocFromServer: vi.fn(), getDocsFromServer: vi.fn(), deleteDoc: vi.fn(),
 runTransaction: async (_db: unknown, fn: (tx: unknown) => Promise<void>) => fn({ get: async () => ({ exists: () => !!state.data, data: () => state.data }), set: (...args: unknown[]) => state.writes.push(args), delete: vi.fn() }),
}));
import { cleanCloudData, requireRider, storageService } from '../services/firebaseStorageService';
describe('cloud storage', () => {
 beforeEach(() => { state.user = { uid: 'rider1', email: 'rider@example.com', emailVerified: true }; state.data = undefined; state.writes = []; vi.stubGlobal('navigator', { onLine: true }); });
 it('rejects another account and unverified users', () => { expect(() => requireRider('other')).toThrow(); state.user.emailVerified = false; expect(() => requireRider('rider1')).toThrow(); });
 it('rejects offline saves instead of writing local data', () => { vi.stubGlobal('navigator', { onLine: false }); expect(() => requireRider('rider1')).toThrow('offline'); });
 it('removes undefined optional properties but preserves zero and null', () => { expect(cleanCloudData({ first: 0, other: undefined, nested: { value: null } })).toEqual({ first: 0, nested: { value: null } }); });
 it('uses rider-scoped session path and advances acknowledged revision', async () => {
  const session = { id: 's1', attemptCount: 0 } as Parameters<typeof storageService.saveSession>[1];
  await storageService.saveSession('rider1', session); expect(state.writes[0][0]).toBe('users/rider1/sessions/s1'); expect(session.cloudRevision).toBe(1);
 });
 it('rejects stale session updates without overwriting newer data', async () => {
  state.data = { cloudRevision: 2 }; await expect(storageService.saveSession('rider1', { id: 's1', cloudRevision: 1 } as Parameters<typeof storageService.saveSession>[1])).rejects.toThrow('another device'); expect(state.writes).toHaveLength(0);
 });
 it('stores practice tools in separate documents and protects profile revisions', async () => {
  const p = { id: 'rider1', displayName: 'Rider', email: 'rider@example.com', preferredTheme: 'system', savedSetups: [{ id: 'setup1' }], bookmarks: [], availableObstacles: [] } as unknown as Parameters<typeof storageService.saveProfile>[0];
  await storageService.saveProfile(p); expect(state.writes.map(w => w[0])).toContain('users/rider1/savedSetups/setup1'); const root = state.writes.find(w => w[0] === 'users/rider1')![1] as Record<string, unknown>; expect(root.savedSetups).toBeUndefined(); expect(root.cloudRevision).toBe(1);
  state.data = { cloudRevision: 3 }; await expect(storageService.saveProfile(p)).rejects.toThrow('another device');
 });
});
