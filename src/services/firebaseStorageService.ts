import { collection, doc, getDocFromServer, getDocsFromServer, deleteDoc, runTransaction } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, PracticeSession } from '../domain/types';
export function cleanCloudData<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }
export function requireRider(id: string): void {
  if (!auth.currentUser?.emailVerified || auth.currentUser.uid !== id) throw new Error('Sign in with your verified account to save progress.');
  if (typeof navigator !== 'undefined' && !navigator.onLine) throw new Error('You are offline. Connect before saving progress.');
}
const tools = ['savedSetups', 'bookmarks', 'poolPresets', 'trickLibrary'] as const;
export const storageService = {
 async getProfile(id: string): Promise<UserProfile | null> {
  requireRider(id); const root = await getDocFromServer(doc(db, 'users', id));
  if (!root.exists()) return null;
  const profile = root.data() as UserProfile;
  await Promise.all(tools.map(async key => { const rows = await getDocsFromServer(collection(db, 'users', id, key)); (profile as unknown as Record<string, unknown>)[key] = rows.docs.map(row => row.data()); }));
  return profile;
 },
 async saveProfile(profile: UserProfile): Promise<void> {
  requireRider(profile.id); const root = doc(db, 'users', profile.id);
  await runTransaction(db, async transaction => {
   const old = await transaction.get(root); const previous = old.data()?.toolIds || {};
   if ((old.data()?.cloudRevision || 0) !== (profile.cloudRevision || 0)) throw new Error('Profile changed on another device. Reload before saving.');
   const clean = cleanCloudData(profile) as unknown as Record<string, unknown>; const toolIds: Record<string, string[]> = {};
   for (const key of tools) {
    const rows = profile[key] || []; toolIds[key] = rows.map(row => row.id);
    for (const id of previous[key] || []) if (!toolIds[key].includes(id)) transaction.delete(doc(db, 'users', profile.id, key, id));
    for (const row of rows) transaction.set(doc(db, 'users', profile.id, key, row.id), cleanCloudData(row));
    delete clean[key];
   }
   transaction.set(root, { ...clean, cloudRevision: (profile.cloudRevision || 0) + 1, email: auth.currentUser!.email, toolIds });
  });
  profile.cloudRevision = (profile.cloudRevision || 0) + 1;
 },
 async getSessions(id: string): Promise<PracticeSession[]> {
  requireRider(id); const result = await getDocsFromServer(collection(db, 'users', id, 'sessions'));
  return result.docs.map(row => row.data() as PracticeSession).sort((a,b) => b.generatedAt.localeCompare(a.generatedAt));
 },
 async saveSession(id: string, session: PracticeSession): Promise<void> { requireRider(id); await runTransaction(db, async tx => { const ref = doc(db, 'users', id, 'sessions', session.id); const old = await tx.get(ref); if ((old.data()?.cloudRevision || 0) !== (session.cloudRevision || 0)) throw new Error('Session changed on another device. Reload before saving.'); tx.set(ref, { ...cleanCloudData(session), cloudRevision: (session.cloudRevision || 0) + 1 }); }); session.cloudRevision = (session.cloudRevision || 0) + 1; },
 async deleteSession(id: string, sessionId: string): Promise<void> { requireRider(id); await deleteDoc(doc(db, 'users', id, 'sessions', sessionId)); },
};
