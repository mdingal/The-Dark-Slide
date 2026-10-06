import { collection, doc, getDocFromServer, getDocsFromServer, deleteDoc, runTransaction } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, PracticeSession } from '../domain/types';
export function cleanCloudData<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }
export function requireRider(id: string): void {
  if (!auth.currentUser?.emailVerified || auth.currentUser.uid !== id) throw new Error('Sign in with your verified account to save progress.');
  if (typeof navigator !== 'undefined' && !navigator.onLine) throw new Error('You are offline. Connect before saving progress.');
}
const tools = ['savedSetups', 'bookmarks', 'poolPresets', 'trickLibrary', 'partsInventory'] as const;
const rawStorageService = {
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
 async saveSession(id: string, session: PracticeSession): Promise<void> {
  requireRider(id);
  await runTransaction(db, async tx => {
    const ref=doc(db,'users',id,'sessions',session.id),old=await tx.get(ref);
    if((old.data()?.cloudRevision||0)!==(session.cloudRevision||0))throw Error('Session changed on another device. Reload before saving.');
    if(session.sessionStartedAt) {
      const setupRef=doc(db,'users',id,'savedSetups',session.setupSnapshot.id),setup=await tx.get(setupRef);
      if (!old.data()?.sessionStartedAt && setup.exists()) {
        const stable=(value:any):any=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().filter(k=>!['favorite','usedAt'].includes(k)).map(k=>[k,stable(value[k])])):value;
        if(JSON.stringify(stable(cleanCloudData(session.setupSnapshot)))!==JSON.stringify(stable(setup.data())))throw Error('This setup changed on another device. Reload and choose it again.');
      }
      if(!old.data()?.sessionStartedAt&&!setup.exists())throw Error('Choose a saved fingerboard setup before starting.');
      if(setup.exists()&&!setup.data().usedAt)tx.update(setupRef,{usedAt:session.sessionStartedAt});
    }
    tx.set(ref,{...cleanCloudData(session),cloudRevision:(session.cloudRevision||0)+1});
  });
  session.cloudRevision=(session.cloudRevision||0)+1;
 },
 async deleteSession(id: string, sessionId: string): Promise<void> { requireRider(id); await deleteDoc(doc(db, 'users', id, 'sessions', sessionId)); },
};

let pendingWrites=0;
function saveSignal(state:string,message=''){if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('cloud-save-status',{detail:{state,message,pending:pendingWrites}}));}
export const storageService:typeof rawStorageService=new Proxy(rawStorageService,{
 get(target,key: keyof typeof rawStorageService){const fn=target[key];if(!['saveProfile','saveSession','deleteSession'].includes(key))return fn;
 return async (...args:unknown[])=>{pendingWrites++;saveSignal('saving');try{const result=await (fn as (...args:unknown[])=>Promise<unknown>)(...args);pendingWrites--;saveSignal(pendingWrites?'saving':'saved');return result;}catch(error){pendingWrites--;saveSignal('error',error instanceof Error?error.message:'Could not save. Retry the action.');throw error;}};}
});
