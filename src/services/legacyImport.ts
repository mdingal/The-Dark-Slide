import { PracticeSession, UserProfile } from '../domain/types';
import { storageService, requireRider } from './firebaseStorageService';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from './firebase';
import { cleanCloudData, writeSessionSummary } from './firebaseStorageService';
// Read-only migration. Never initializes demo data or writes browser records.
export function localImportCandidates(): { profile: UserProfile; sessions: PracticeSession[] }[] {
  try {
    const profiles = JSON.parse(localStorage.getItem('fb_app_profiles_v1') || '[]');
    if (!Array.isArray(profiles)) return [];
    return profiles.filter(p => typeof p.id === 'string' && typeof p.displayName === 'string' && !['profile_alex', 'profile_sam'].includes(p.id)).map(profile => {
      const data = JSON.parse(localStorage.getItem(`fb_app_sessions_v1_${profile.id}`) || '[]');
      return { profile, sessions: Array.isArray(data) ? data : [] };
    });
  } catch { return []; }
}
export async function importLocalRider(current: UserProfile, legacy: UserProfile, sessions: PracticeSession[]): Promise<UserProfile> {
  requireRider(current.id);
  if (current.importedLocalProfiles?.includes(legacy.id)) throw new Error('This local profile was already imported.');
  const prefix = `import_${legacy.id}_`;
  for (const session of sessions) {
    if (!session.id || !session.trickResult || !session.timerState) throw new Error('A local session is invalid. Import stopped; your original local data remains intact.');
    const copy = cleanCloudData({ ...session, id: prefix + session.id, cloudRevision: 1, timerState: { ...session.timerState, isRunning: false, lastStartedTimestamp: undefined, accumulatedMs: session.activeDurationMs || session.timerState.accumulatedMs } });
    const ref = doc(db, 'users', current.id, 'sessions', copy.id);
    // Retrying a partial import never overwrites already imported session edits.
    await runTransaction(db, async tx => { const old = await tx.get(ref); if (!old.exists()) {await writeSessionSummary(tx,current.id,copy);tx.set(ref,copy);} });
  }
  const updated = { ...current, importedLocalProfiles: [...(current.importedLocalProfiles || []), legacy.id] };
  for (const key of ['savedSetups', 'bookmarks', 'poolPresets', 'trickLibrary'] as const) {
    const existing = updated[key] || [];
    const imported = (legacy[key] || []).map(row => ({ ...row, id: prefix + row.id }));
    (updated as unknown as Record<string, unknown>)[key] = [...existing, ...imported.filter(row => !existing.some(item => item.id === row.id))];
  }
  await storageService.saveProfile(updated);
  return updated;
}
