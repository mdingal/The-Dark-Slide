import {emptyBucket,summaryHash,encodeSummary,partitionBucket,mergeMissingSummaries,SummaryBucket} from './sessionSummaryIndex';
import { collection, doc, getDocFromServer, getDocsFromServer, runTransaction, Transaction, DocumentReference } from 'firebase/firestore';
import {trackFirebaseRead} from './firebaseReadDiagnostics';
import { auth, db } from './firebase';
import { UserProfile, PracticeSession } from '../domain/types';
export function cleanCloudData<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }
export function requireRider(id: string): void {
  if (!auth.currentUser?.emailVerified || auth.currentUser.uid !== id) throw new Error('Sign in with your verified account to save progress.');
  if (typeof navigator !== 'undefined' && !navigator.onLine) throw new Error('You are offline. Connect before saving progress.');
}
const tools = ['savedSetups', 'bookmarks', 'poolPresets', 'trickLibrary', 'partsInventory'] as const;
// Browser-memory snapshots only; cloud remains authoritative.
const profileBaselines=new Map<string,UserProfile>();
const profileReads=new Map<string,Promise<UserProfile|null>>();
const sessionReads=new Map<string,Promise<PracticeSession[]>>();
const sessionCache=new Map<string,{loadedAt:number;rows:PracticeSession[]}>();
const stable=(value:unknown):unknown=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,stable(v)])):value;
const same=(a:unknown,b:unknown)=>JSON.stringify(stable(a))===JSON.stringify(stable(b));
const fullSessions=new Map<string,PracticeSession>();
const fullSessionReads=new Map<string,Promise<PracticeSession|null>>();
const indexRef=(uid:string,key:string)=>doc(db,'users',uid,'sessionIndex',key);
async function indexLeaf(tx:Transaction,uid:string,sid:string):Promise<{ref:DocumentReference;key:string;bucket:SummaryBucket}>{
 const hash=summaryHash(sid);let key=hash[0];
 while(true){
  const ref=indexRef(uid,key),snap=await tx.get(ref);trackFirebaseRead('Session summary save checks',1);
  const bucket=snap.exists()?snap.data() as SummaryBucket:emptyBucket();
  if(!bucket.split)return {ref,key,bucket};
  if(key.length>=hash.length)throw Error('Invalid session summary index.');key+=hash[key.length];
 }
}
function writeIndexLeaf(tx:Transaction,uid:string,key:string,rows:Record<string,string>){
 for(const [child,bucket] of partitionBucket(key,rows))tx.set(indexRef(uid,child),bucket);
}
export async function writeSessionSummary(tx:Transaction,uid:string,session:PracticeSession):Promise<void>{
 const leaf=await indexLeaf(tx,uid,session.id);writeIndexLeaf(tx,uid,leaf.key,{...leaf.bucket.rows,[session.id]:encodeSummary(session)});
}
async function migrateSessionIndex(uid:string,records:PracticeSession[]){
 const groups=new Map<string,Record<string,string>>();
 for(const s of records){const key=summaryHash(s.id)[0],group=groups.get(key)||{};group[s.id]=encodeSummary(s);groups.set(key,group);}
 // A failed/interrupted build is retryable. Transactions preserve saves/deletes made during migration.
 for(const [key,incoming] of groups){
  const pending=[{key,incoming}];
  while(pending.length){const group=pending.pop()!;
   await runTransaction(db,async tx=>{
    const ref=indexRef(uid,group.key),snap=await tx.get(ref);trackFirebaseRead('Session summary migration checks',1);
    const bucket=snap.exists()?snap.data() as SummaryBucket:emptyBucket();
    if(bucket.split){
     const children=new Map<string,Record<string,string>>();
     for(const [sid,value] of Object.entries(group.incoming)){const child=group.key+summaryHash(sid)[group.key.length],rows=children.get(child)||{};rows[sid]=value;children.set(child,rows);}
     return [...children].map(([key,incoming])=>({key,incoming}));
    }
    writeIndexLeaf(tx,uid,group.key,mergeMissingSummaries(bucket.rows,group.incoming));return [];
   }).then(children=>pending.push(...children));
  }
 }
 await runTransaction(db,async tx=>{tx.set(doc(db,'users',uid,'sessionIndexMeta','state'),{version:1,complete:true});});
}
const rawStorageService = {
 clearMemory():void {profileBaselines.clear();profileReads.clear();sessionCache.clear();sessionReads.clear();fullSessions.clear();fullSessionReads.clear();},
 async getProfile(id: string): Promise<UserProfile | null> {
  requireRider(id);
  let pending=profileReads.get(id);
  if(!pending){
   pending=(async()=>{
    const root=await getDocFromServer(doc(db,'users',id));trackFirebaseRead('Profile loads',1);if(!root.exists())return null;
    const profile=root.data() as UserProfile;
    const baseline=profileBaselines.get(id);
    const metadata=root.data().toolIds as Record<string,string[]>|undefined;
    await Promise.all(tools.map(async key=>{
     // An empty server-owned index avoids even the minimum billed empty query.
     if(metadata&&Array.isArray(metadata[key])&&metadata[key].length===0){(profile as unknown as Record<string,unknown>)[key]=[];return;}
     // Setups can gain usedAt independently of the profile revision: always fetch them.
     if(key!=='savedSetups'&&baseline&&profile.cloudRevision!==undefined&&baseline.cloudRevision===profile.cloudRevision){(profile as unknown as Record<string,unknown>)[key]=cleanCloudData(baseline[key]||[]);return;}
     const rows=await getDocsFromServer(collection(db,'users',id,key));trackFirebaseRead('Tools: '+key,Math.max(1,rows.docs.length));(profile as unknown as Record<string,unknown>)[key]=rows.docs.map(row=>row.data());
    }));
    requireRider(id);profileBaselines.set(id,cleanCloudData(profile));return profile;
   })().finally(()=>profileReads.delete(id));
   profileReads.set(id,pending);
  }
  return cleanCloudData(await pending);
 },
 async saveProfile(profile: UserProfile): Promise<void> {
  requireRider(profile.id); const root = doc(db, 'users', profile.id);
  const baseline=profileBaselines.get(profile.id);
  const nextRevision=await runTransaction(db, async transaction => {
   const old = await transaction.get(root);trackFirebaseRead('Profile save checks',1); const previous = old.data()?.toolIds || {};
   if ((old.data()?.cloudRevision || 0) !== (profile.cloudRevision || 0)) throw new Error('Profile changed on another device. Reload before saving.');
   const clean = cleanCloudData(profile) as unknown as Record<string, unknown>; const toolIds: Record<string, string[]> = {};
   let toolsChanged=false;
   for (const key of tools) {
    const rows = profile[key] || []; toolIds[key] = rows.map(row => row.id);
    const known=baseline&&baseline.cloudRevision===profile.cloudRevision?new Map((baseline[key]||[]).map(row=>[row.id,row])):null;
    for (const id of previous[key] || []) if (!toolIds[key].includes(id)) {transaction.delete(doc(db, 'users', profile.id, key, id));toolsChanged=true;}
    for (const row of rows) if(!known||!same(cleanCloudData(row),known.get(row.id))) {transaction.set(doc(db, 'users', profile.id, key, row.id), cleanCloudData(row));toolsChanged=true;}
    delete clean[key];
   }
   const nextRoot:Record<string,unknown>={...clean,email:auth.currentUser!.email,toolIds};delete nextRoot.cloudRevision;
   const oldRoot={...old.data()};delete oldRoot.cloudRevision;
   if(!toolsChanged&&old.exists()&&same(nextRoot,oldRoot))return profile.cloudRevision||0;
   const revision=(profile.cloudRevision||0)+1;
   transaction.set(root, {...nextRoot,cloudRevision:revision});return revision;
  });
  profile.cloudRevision=nextRevision;
  profileBaselines.set(profile.id,cleanCloudData(profile));
 },
 async getAllSessions(id:string):Promise<PracticeSession[]> {
  requireRider(id);const result=await getDocsFromServer(collection(db,'users',id,'sessions'));
  trackFirebaseRead('Full history export / initial summary build',Math.max(1,result.size));
  requireRider(id);return result.docs.map(row=>row.data() as PracticeSession).sort((a,b)=>b.generatedAt.localeCompare(a.generatedAt));
 },
 async getSession(id:string,sid:string):Promise<PracticeSession|null> {
  requireRider(id);const key=id+'/'+sid,cached=fullSessions.get(key);
  if(cached)return cleanCloudData(cached);
  let pending=fullSessionReads.get(key);
  if(!pending){pending=getDocFromServer(doc(db,'users',id,'sessions',sid)).then(snap=>{
   trackFirebaseRead('Session detail loads',1);requireRider(id);const row=snap.exists()?snap.data() as PracticeSession:null;
   if(row)fullSessions.set(key,cleanCloudData(row));return row;
  }).finally(()=>fullSessionReads.delete(key));fullSessionReads.set(key,pending);}
  return cleanCloudData(await pending);
 },
 async getSessions(id:string,forceRefresh=true):Promise<PracticeSession[]> {
  requireRider(id);const cached=sessionCache.get(id);
  if(!forceRefresh&&cached&&Date.now()-cached.loadedAt<60000)return cleanCloudData(cached.rows);
  let pending=sessionReads.get(id);
  if(!pending){pending=(async()=>{
   if(forceRefresh){for(const key of fullSessions.keys())if(key.startsWith(id+'/'))fullSessions.delete(key);}
   const meta=await getDocFromServer(doc(db,'users',id,'sessionIndexMeta','state'));trackFirebaseRead('Session summary readiness',1);
   if(!meta.exists()||meta.data().version!==1||!meta.data().complete){
    const legacy=await rawStorageService.getAllSessions(id);await migrateSessionIndex(id,legacy);
    for(const row of legacy)fullSessions.set(id+'/'+row.id,cleanCloudData(row));
    sessionCache.set(id,{loadedAt:Date.now(),rows:cleanCloudData(legacy)});return legacy;
   }
   const index=await getDocsFromServer(collection(db,'users',id,'sessionIndex'));trackFirebaseRead('Compact session summaries',Math.max(1,index.size));
   const records=new Map<string,PracticeSession>();const exceptional:string[]=[];
   for(const bucket of index.docs){const data=bucket.data() as SummaryBucket;
    if(data.version!==1||!data.rows)throw Error('Session summaries need rebuilding.');
    for(const [sid,value] of Object.entries(data.rows)){if(value==='null')continue;const row=JSON.parse(value);if(row.loadFull)exceptional.push(sid);else records.set(sid,row);}
   }
   // Resuming, countdown expiry, and outcome reviews must have the complete attempt log.
   const needed=new Set([...exceptional,...[...records.values()].filter(s=>s.summaryOnly&&((s.sessionStartedAt&&!s.sessionEndedAt)||s.outcomeReviewPending)).map(s=>s.id)]);
   const draft=[...records.values()].sort((a,b)=>b.generatedAt.localeCompare(a.generatedAt)).find(s=>s.status==='pending'&&!s.sessionEndedAt);
   if(draft?.summaryOnly)needed.add(draft.id);
   await Promise.all([...needed].map(async sid=>{const row=await rawStorageService.getSession(id,sid);if(row)records.set(sid,row);else records.delete(sid);}));
   requireRider(id);const rows=[...records.values()].sort((a,b)=>b.generatedAt.localeCompare(a.generatedAt));
   sessionCache.set(id,{loadedAt:Date.now(),rows:cleanCloudData(rows)});return rows;
  })().finally(()=>sessionReads.delete(id));sessionReads.set(id,pending);}
  return cleanCloudData(await pending);
 },
 async saveSession(id: string, session: PracticeSession): Promise<void> {
  requireRider(id);
  if(session.summaryOnly)throw Error('Load the full session before editing it.');
  await runTransaction(db, async tx => {
    let setupToLock:DocumentReference|undefined;
    const ref=doc(db,'users',id,'sessions',session.id),old=await tx.get(ref);trackFirebaseRead('Session save checks',1);
    if((old.data()?.cloudRevision||0)!==(session.cloudRevision||0))throw Error('Session changed on another device. Reload before saving.');
    if(session.sessionStartedAt&&!old.data()?.sessionStartedAt) {
      const setupRef=doc(db,'users',id,'savedSetups',session.setupSnapshot.id),setup=await tx.get(setupRef);trackFirebaseRead('Setup start checks',1);
      if (!old.data()?.sessionStartedAt && setup.exists()) {
        const stable=(value:any):any=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().filter(k=>!['favorite','usedAt'].includes(k)).map(k=>[k,stable(value[k])])):value;
        if(JSON.stringify(stable(cleanCloudData(session.setupSnapshot)))!==JSON.stringify(stable(setup.data())))throw Error('This setup changed on another device. Reload and choose it again.');
      }
      if(!old.data()?.sessionStartedAt&&!setup.exists())throw Error('Choose a saved fingerboard setup before starting.');
      if(setup.exists()&&!setup.data().usedAt)setupToLock=setupRef;
    }
    // Live records are loaded in full on every account load. Update their compact index
    // at start/park/end checkpoints rather than on every counter or timer action.
    const checkpoint=!old.exists()||!!session.sessionEndedAt||!!session.parkedAt
      || old.data()?.sessionEndedAt!==session.sessionEndedAt
      || (!!session.sessionStartedAt&&!old.data()?.sessionStartedAt);
    const leaf=checkpoint?await indexLeaf(tx,id,session.id):null;
    const next={...cleanCloudData(session),cloudRevision:(session.cloudRevision||0)+1};
    if(setupToLock)tx.update(setupToLock,{usedAt:session.sessionStartedAt});
    tx.set(ref,next);if(leaf)writeIndexLeaf(tx,id,leaf.key,{...leaf.bucket.rows,[session.id]:encodeSummary(next)});
  });
  session.cloudRevision=(session.cloudRevision||0)+1;fullSessions.set(id+'/'+session.id,cleanCloudData(session));
  const cached=sessionCache.get(id);if(cached)cached.rows=[cleanCloudData(session),...cached.rows.filter(row=>row.id!==session.id)].sort((a,b)=>b.generatedAt.localeCompare(a.generatedAt));
 },
 async deleteSession(id:string,sessionId:string):Promise<void> {
  requireRider(id);
  await runTransaction(db,async tx=>{
   const leaf=await indexLeaf(tx,id,sessionId);
   tx.delete(doc(db,'users',id,'sessions',sessionId));
   writeIndexLeaf(tx,id,leaf.key,{...leaf.bucket.rows,[sessionId]:'null'});
  });
  fullSessions.delete(id+'/'+sessionId);const cached=sessionCache.get(id);if(cached)cached.rows=cached.rows.filter(row=>row.id!==sessionId);
 },
};

let pendingWrites=0;
function saveSignal(state:string,message=''){if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('cloud-save-status',{detail:{state,message,pending:pendingWrites}}));}
export const storageService:typeof rawStorageService=new Proxy(rawStorageService,{
 get(target,key: keyof typeof rawStorageService){const fn=target[key];if(!['saveProfile','saveSession','deleteSession'].includes(key))return fn;
 return async (...args:unknown[])=>{pendingWrites++;saveSignal('saving');try{const result=await (fn as (...args:unknown[])=>Promise<unknown>)(...args);pendingWrites--;saveSignal(pendingWrites?'saving':'saved');return result;}catch(error){pendingWrites--;saveSignal('error',error instanceof Error?error.message:'Could not save. Retry the action.');throw error;}};}
});
