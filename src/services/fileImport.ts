import { doc, runTransaction } from 'firebase/firestore';
import { db } from './firebase';
import { cleanCloudData, requireRider, storageService } from './firebaseStorageService';
import { RiderExport } from './dataExport';
import { PracticeSession, UserProfile } from '../domain/types';
const object = (x: unknown): x is Record<string, any> => !!x && typeof x === 'object' && !Array.isArray(x);
const id = (x: unknown) => typeof x === 'string' && /^[A-Za-z0-9_.:-]{1,1200}$/.test(x);
const text = (x: unknown) => typeof x === 'string';
const number = (x: unknown) => typeof x === 'number' && Number.isFinite(x) && x >= 0;
const count = (x: unknown) => number(x) && Number.isInteger(x);
const date = (x: unknown) => text(x) && Number.isFinite(Date.parse(x as string));
const setup = (x: unknown) => object(x) && id(x.id) && text(x.name) && number(x.deckWidthMm) && x.deckWidthMm > 0 && ['plastic','urethane','resin'].includes(x.wheelMaterial);
const params = (x: unknown) => object(x) && ['regular','fakie','switch','nollie'].includes(x.stance) && ['none','frontside','backside'].includes(x.direction) && text(x.baseTrickId) && ['none','frontside','backside'].includes(x.bodyVarial) && ['normal','manual','nose_manual'].includes(x.landing) && ['none','frontside','backside'].includes(x.revert);
function trick(x: unknown): boolean {
 if (!object(x) || !text(x.canonicalName) || !text(x.catalogVersion) || !Array.isArray(x.breakdown) || !x.breakdown.every(text)) return false;
 if (x.mode === 'single') return params(x.singleTrick);
 if (x.mode === 'combo') return Array.isArray(x.comboSteps) && x.comboSteps.length > 0 && x.comboSteps.every((s: unknown) => object(s) && params(s.parameters) && text(s.resolvedName) && text(s.breakdown) && object(s.landingState));
 return x.mode === 'obstacle' && object(x.obstacleData) && ['ledge','rail','flatground','manual_pad'].includes(x.obstacleData.obstacleType) && ['frontside','backside'].includes(x.obstacleData.approach) && text(x.obstacleData.obstacleTrickId) && text(x.obstacleData.entryTrickId) && text(x.obstacleData.exitTrick);
}
function session(x: unknown): boolean {
 if (!object(x) || !id(x.id) || !trick(x.trickResult) || !setup(x.setupSnapshot) || !['pending','success','failed'].includes(x.status) || !date(x.generatedAt) || !count(x.attemptCount) || !count(x.landingCount) || x.landingCount > x.attemptCount || !number(x.activeDurationMs) || !text(x.notes) || !number(x.difficultyRating) || x.difficultyRating > 5 || !object(x.timerState) || typeof x.timerState.isRunning !== 'boolean' || !number(x.timerState.accumulatedMs) || !Array.isArray(x.history)) return false;
 if (x.history.some((h: unknown) => !object(h) || !['attempt','landing','status_change'].includes(h.action) || !number(h.timestamp) || !count(h.prevAttemptCount) || !count(h.prevLandingCount) || !['pending','success','failed'].includes(h.prevStatus))) return false;
 for (const key of ['firstLandingAttemptNumber','firstLandingElapsedMs','currentLandingStreak','bestLandingStreak','consistencyGoal']) if (x[key] !== undefined && !number(x[key])) return false;
 for (const key of ['sessionStartedAt','sessionEndedAt']) if (x[key] !== undefined && !date(x[key])) return false;
 return x.missTagCounts === undefined || (object(x.missTagCounts) && Object.values(x.missTagCounts).every(count));
}
export function parseRiderExport(source: string): RiderExport {
 let data: unknown; try { data = JSON.parse(source.replace(/^\uFEFF/, '')); } catch { throw new Error('Choose a valid JSON export from The Dark Slide.'); }
 if (!object(data) || data.format !== 'the-dark-slide-rider-export' || data.version !== 1 || !object(data.profile) || !id(data.profile.id) || !text(data.profile.displayName) || !Array.isArray(data.sessions) || !data.sessions.every(session)) throw new Error('This file is not a supported rider export, or contains invalid sessions.');
 const p = data.profile;
 if (!Array.isArray(p.savedSetups) || !p.savedSetups.every(setup)) throw new Error('The export contains invalid setups.');
 for (const key of ['bookmarks','poolPresets','trickLibrary']) {
  if (p[key] === undefined) continue;
  if (!Array.isArray(p[key]) || !p[key].every((item: unknown) => object(item) && id(item.id) && (key === 'poolPresets' ? text(item.name) && date(item.savedAt) && object(item.config) && ['single','combo','obstacle'].includes(item.config.mode) && object(item.config.singleLocks) && object(item.config.singleExclusions) && object(item.config.obstacleData) && params(item.config.activeParams) && params(item.config.step1Params) && params(item.config.step2Params) && ['step1Locks','step2Locks','step1Exclusions','step2Exclusions','obstacleLocks','obstacleExclusions'].every(key => object(item.config[key])) : trick(item.trickResult) && (key === 'bookmarks' ? date(item.savedAt) : ['want_to_learn','learning','landed','consistent'].includes(item.status) && date(item.addedAt) && date(item.updatedAt))))) throw new Error('The export contains invalid saved tools.');
 }
 for (const key of ['savedSetups','bookmarks','poolPresets','trickLibrary']) if (new Set((p[key] || []).map((row: { id: string }) => row.id)).size !== (p[key] || []).length) throw new Error('The export contains duplicate saved-tool IDs.');
 if (new Set(data.sessions.map((s: PracticeSession) => s.id)).size !== data.sessions.length) throw new Error('The export contains duplicate session IDs.');
 return data as unknown as RiderExport;
}
export async function importRiderExport(uid: string, data: RiderExport): Promise<{ added: number; skipped: number }> {
 requireRider(uid);
 const current = await storageService.getProfile(uid); if (!current) throw new Error('Cloud profile missing.');
 const ids = new Map<string, string>();
 const sourceIds = [...data.sessions.map(s => s.id), ...['savedSetups','bookmarks','poolPresets','trickLibrary'].flatMap(key => ((data.profile as unknown as Record<string, { id: string }[]>)[key] || []).map(row => row.id))];
 for (const source of sourceIds) {
  if (data.profile.id === uid) ids.set(source, source);
  else { const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data.profile.id + ':' + source)); ids.set(source, 'file_' + Array.from(new Uint8Array(digest)).map(n => n.toString(16).padStart(2, '0')).join('')); }
 }
 const mappedId = (source: string) => ids.get(source)!;
 let added = 0, skipped = 0;
 for (const record of data.sessions) {
  requireRider(uid);
  const ref = doc(db, 'users', uid, 'sessions', mappedId(record.id));
  const created = await runTransaction(db, async tx => {
   const existing = await tx.get(ref); if (existing.exists()) return false;
   tx.set(ref, cleanCloudData({ ...record, id: mappedId(record.id), cloudRevision: 1, timerState: { ...record.timerState, isRunning: false, lastStartedTimestamp: undefined, accumulatedMs: record.activeDurationMs } })); return true;
  }); if (created) added++; else skipped++;
 }
 const updated: UserProfile = { ...current };
 for (const key of ['savedSetups','bookmarks','poolPresets','trickLibrary'] as const) {
  const existing = current[key] || [], incoming = (data.profile[key] || []).map(row => ({ ...row, id: mappedId(row.id) }));
  (updated as unknown as Record<string, unknown>)[key] = [...existing, ...incoming.filter(row => !existing.some(e => e.id === row.id))];
 }
 // Identity and current preferences stay with the destination account.
 await storageService.saveProfile(updated); requireRider(uid);
 return { added, skipped };
}
