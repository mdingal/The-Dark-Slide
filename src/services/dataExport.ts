import {classLabel} from '../domain/skateClasses';
import { PracticeSession, UserProfile } from '../domain/types';
import { requireRider, storageService } from './firebaseStorageService';
export interface RiderExport { format: 'the-dark-slide-rider-export'; version: 1; exportedAt: string; profile: UserProfile; sessions: PracticeSession[] }
export async function fetchRiderExport(uid: string): Promise<RiderExport> {
  requireRider(uid);
  const [profile, sessions] = await Promise.all([storageService.getProfile(uid), storageService.getSessions(uid)]);
  requireRider(uid);
  if (!profile) throw new Error('Your cloud profile could not be found.');
  return { format: 'the-dark-slide-rider-export', version: 1, exportedAt: new Date().toISOString(), profile, sessions };
}
export function csvCell(value: unknown): string {
  let text = value === undefined || value === null ? '' : String(value);
  // Stop spreadsheet formula execution, including values hidden behind whitespace.
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
export function sessionsCsv(sessions: PracticeSession[]): string {
  const headers = ['Session ID', 'Trick', 'Mode', 'Skate class', 'Obstacle', 'Obstacle approach', 'Grind/slide ID', 'Transfer ID', 'Stance', 'Direction', 'Body varial', 'Landing position', 'Revert', 'Generated at', 'Started at', 'Finished at', 'Status', 'Attempts', 'Landings', 'Landing rate (%)', 'Active time (seconds)', 'First landing attempt', 'First landing time (seconds)', 'Current streak', 'Best streak', 'Streak goal', 'Underflip', 'Overflip', 'Missed catch', 'Missed lock-in', 'Slipped out', 'Rider difficulty', 'Notes', 'Setup', 'Deck width (mm)', 'Custom deck width', 'Deck model', 'Truck model', 'Wheel model', 'Wheel material', 'Shape', 'Mold', 'Surface', 'Setup notes', 'Trick details (JSON)', 'Goal type', 'Goal target', 'Timer type', 'Countdown seconds', 'Practice surface', 'End reason', 'Parked at', 'Setup parts (JSON)'];
  const rows = sessions.map(s => {
    const t = s.trickResult, p = t.singleTrick, o = t.obstacleData, setup = s.setupSnapshot, misses = s.missTagCounts;
    return [s.id, t.canonicalName, t.mode, classLabel(t), t.mode === 'obstacle' ? o?.obstacleType : 'flatground', o?.approach, o?.obstacleTrickId, o?.transferTrickId, p?.stance, p?.direction, p?.bodyVarial, p?.landing, p?.revert, s.generatedAt, s.sessionStartedAt, s.sessionEndedAt, s.status, s.attemptCount, s.landingCount, s.attemptCount > 0 ? (100*s.landingCount/s.attemptCount).toFixed(2) : undefined, s.activeDurationMs/1000, s.firstLandingAttemptNumber, s.firstLandingElapsedMs === undefined ? undefined : s.firstLandingElapsedMs/1000, s.currentLandingStreak, s.bestLandingStreak, s.consistencyGoal, misses?.underflip, misses?.overflip, misses?.missed_catch, misses?.missed_lock_in, misses?.slipped_out, s.difficultyRating || undefined, s.notes, setup.name, setup.deckWidthMm, setup.isCustomDeckWidth, setup.deckModel, setup.truckModel, setup.wheelModel, setup.wheelMaterial, setup.shape, setup.mold, setup.surface, setup.notes, JSON.stringify(t),s.goal?.type,s.goal?.target,s.practiceTimer?.type,s.practiceTimer?.durationMs===undefined?undefined:s.practiceTimer.durationMs/1000,s.practiceSurface,s.endedReason,s.parkedAt,JSON.stringify(setup.partsSnapshot||{})];
  });
  return '\uFEFF' + [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
}
export function downloadRiderExport(data: RiderExport, format: 'json' | 'csv'): void {
  const text = format === 'json' ? JSON.stringify(data, null, 2) : sessionsCsv(data.sessions);
  const blob = new Blob([text], { type: format === 'json' ? 'application/json;charset=utf-8' : 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = `dark-slide-${data.exportedAt.slice(0,10)}.${format}`;
  document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function clearLegacyRiderData(): number {
  const exact = ['fb_app_profiles_v1', 'fb_app_active_profile_id_v1', 'ktnk_auth_status', 'ktnk_rider_is_first_login', 'fb_app_theme'];
  const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)).filter((key): key is string => !!key && (exact.includes(key) || key.startsWith('fb_app_sessions_v1_')));
  for (const key of keys) localStorage.removeItem(key);
  return keys.length;
}
