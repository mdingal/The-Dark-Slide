import { beforeEach, describe, expect, it, vi } from 'vitest';
const cloud = vi.hoisted(() => ({ requireRider: vi.fn(), getProfile: vi.fn(), getAllSessions: vi.fn() }));
vi.mock('../services/firebaseStorageService', () => ({ requireRider: cloud.requireRider, storageService: cloud }));
import { clearLegacyRiderData, csvCell, fetchRiderExport, sessionsCsv } from '../services/dataExport';
import type { PracticeSession } from '../domain/types';
describe('rider exports', () => {
 beforeEach(() => { vi.clearAllMocks(); });
 it('exports server profile and sessions and rechecks ownership after fetching', async () => {
  cloud.getProfile.mockResolvedValue({ id: 'rider', bookmarks: [{ id: 'b1' }] }); cloud.getAllSessions.mockResolvedValue([{ id: 's1' }]);
  const data = await fetchRiderExport('rider'); expect(data.format).toBe('the-dark-slide-rider-export'); expect(data.profile.bookmarks).toHaveLength(1); expect(data.sessions).toEqual([{ id: 's1' }]); expect(cloud.requireRider).toHaveBeenCalledTimes(2);
 });
 it('does not export if the account changes during fetching', async () => {
  cloud.requireRider.mockImplementationOnce(() => {}).mockImplementationOnce(() => { throw new Error('Account changed'); });
  await expect(fetchRiderExport('rider')).rejects.toThrow('Account changed'); cloud.requireRider.mockReset();
 });
 it('quotes commas, line breaks, and quotes and neutralizes formulas', () => {
  expect(csvCell('one,"two"\nthree')).toBe('"one,""two""\nthree"'); expect(csvCell(' =SUM(A1)')).toBe('"\' =SUM(A1)"'); expect(csvCell(0)).toBe('"0"'); expect(csvCell(undefined)).toBe('""');
 });
 it('preserves measured zero first landing time and leaves unrecorded metrics blank', () => {
  const session = { id: 's1', trickResult: { canonicalName: 'Kickflip', mode: 'single' }, setupSnapshot: { name: 'Deck', deckWidthMm: 34, wheelMaterial: 'urethane' }, generatedAt: '2026-10-01', status: 'success', attemptCount: 1, landingCount: 1, activeDurationMs: 1000, firstLandingElapsedMs: 0, notes: '=danger' } as PracticeSession;
  const csv = sessionsCsv([session]); expect(csv.startsWith('\uFEFF')).toBe(true); expect(csv).toContain('"100.00"'); expect(csv).toContain('"1","","0",""'); expect(csv).toContain('"\'=danger"'); expect(sessionsCsv([])).toContain('"Session ID"');
 });
 it('cleanup preserves Firebase tokens and unrelated browser keys', () => {
  const data = new Map([['fb_app_profiles_v1', 'profiles'], ['fb_app_sessions_v1_old', 'sessions'], ['fb_app_active_profile_id_v1', 'old'], ['firebase:authUser:project', 'token'], ['unrelated', 'keep']]);
  vi.stubGlobal('localStorage', { get length() { return data.size; }, key: (index: number) => [...data.keys()][index] || null, removeItem: (key: string) => data.delete(key) });
  expect(clearLegacyRiderData()).toBe(3); expect(data.get('firebase:authUser:project')).toBe('token'); expect(data.get('unrelated')).toBe('keep');
 });
});
