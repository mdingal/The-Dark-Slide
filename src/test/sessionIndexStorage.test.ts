import {beforeEach,it,expect,vi} from 'vitest';
const state=vi.hoisted(()=>({docs:new Map<string,any>(),reads:[] as string[],queries:[] as any[],writes:[] as string[],failIndex:false}));
vi.mock('../services/firebase',()=>({auth:{currentUser:{uid:'rider',email:'rider@example.com',emailVerified:true}},db:{}}));
vi.mock('firebase/firestore',()=>({
 doc:(_db:any,...parts:string[])=>parts.join('/'),collection:(_db:any,...parts:string[])=>parts.join('/'),
 query:(ref:string,...constraints:any[])=>({ref,constraints}),orderBy:(field:string,dir:string)=>({field,dir}),limit:(count:number)=>({count}),
 getDocFromServer:async(ref:string)=>{state.reads.push(ref);return {exists:()=>state.docs.has(ref),data:()=>structuredClone(state.docs.get(ref))};},
 getDocsFromServer:async(q:any)=>{state.queries.push(q);const ref=typeof q==='string'?q:q.ref;
  let rows=[...state.docs].filter(([path])=>path.startsWith(ref+'/')&&path.slice(ref.length+1).indexOf('/')<0).map(([,value])=>structuredClone(value));
  if(typeof q!=='string'){rows.sort((a,b)=>b.generatedAt.localeCompare(a.generatedAt));rows=rows.slice(0,q.constraints.find((c:any)=>c.count)?.count||rows.length);}
  return {size:rows.length,docs:rows.map(row=>({data:()=>row}))};},
 runTransaction:async(_db:any,fn:any)=>{const staged:any[]=[];const result=await fn({
  get:async(ref:string)=>{if(staged.length)throw Error('Read after write');state.reads.push(ref);return {exists:()=>state.docs.has(ref),data:()=>structuredClone(state.docs.get(ref))};},
  set:(ref:string,row:any)=>staged.push(['set',ref,structuredClone(row)]),
  delete:(ref:string)=>staged.push(['delete',ref]),update:(ref:string,row:any)=>staged.push(['set',ref,{...state.docs.get(ref),...row}])});
  if(state.failIndex&&staged.some(w=>w[1].includes('/sessionIndex/')))throw Error('Simulated index failure');
  for(const [op,ref,row] of staged){state.writes.push(ref);if(op==='delete')state.docs.delete(ref);else state.docs.set(ref,row);}return result;}
}));
import {storageService} from '../services/firebaseStorageService';
import {PracticeSession} from '../domain/types';
import {summaryHash} from '../services/sessionSummaryIndex';
const session=(n:number)=>({id:'s'+n,generatedAt:new Date(1000+n*1000).toISOString(),sessionStartedAt:new Date(1000+n*1000).toISOString(),sessionEndedAt:new Date(2000+n*1000).toISOString(),status:'success',attemptCount:5,landingCount:1,activeDurationMs:1000,history:[{action:'landing'}],notes:'notes',setupSnapshot:{id:'board'},timerState:{isRunning:false,accumulatedMs:1000}} as unknown as PracticeSession);
beforeEach(()=>{state.docs.clear();state.reads=[];state.queries=[];state.writes=[];state.failIndex=false;storageService.clearMemory();vi.stubGlobal('navigator',{onLine:true});});
it('builds summaries once, then loads no completed attempt logs until requested while retaining all-time data',async()=>{
 for(let i=0;i<274;i++)state.docs.set('users/rider/sessions/s'+i,session(i));
 expect(await storageService.getSessions('rider',false)).toHaveLength(274);
 expect(state.queries.filter(q=>q==='users/rider/sessions')).toHaveLength(1);
 storageService.clearMemory();state.queries=[];
 const rows=await storageService.getSessions('rider',false);
 expect(rows).toHaveLength(274);expect(rows.filter(s=>!s.summaryOnly)).toHaveLength(0);
 expect(rows.reduce((n,s)=>n+s.attemptCount,0)).toBe(1370);
 expect(state.queries.some(q=>q==='users/rider/sessions')).toBe(false);
 expect(state.queries.some(q=>q.ref==='users/rider/sessions')).toBe(false);
 await storageService.getSessions('rider',false);expect(state.queries).toHaveLength(1);
 const old=await storageService.getSession('rider','s0');expect(old?.history).toHaveLength(1);
 await storageService.getSession('rider','s0');expect(state.reads.filter(p=>p.endsWith('/sessions/s0'))).toHaveLength(1);
});
it('saves the source and summary atomically and refuses to overwrite logs with summaries',async()=>{
 state.docs.set('users/rider/savedSetups/board',{id:'board'});
 const s=session(1);await storageService.saveSession('rider',s);
 const index=state.docs.get('users/rider/sessionIndex/'+summaryHash(s.id)[0]);
 expect(JSON.parse(index.rows[s.id]).cloudRevision).toBe(1);expect(state.docs.get('users/rider/sessions/s1').history).toHaveLength(1);
 await expect(storageService.saveSession('rider',{...s,summaryOnly:true,history:[]})).rejects.toThrow('full session');
 state.failIndex=true;await expect(storageService.saveSession('rider',{...s,notes:'updated'})).rejects.toThrow('index failure');
 expect(state.docs.get('users/rider/sessions/s1').notes).toBe('notes');
});
it('deletes source and summary together, and migration cannot resurrect it',async()=>{
 state.docs.set('users/rider/sessions/s1',session(1));await storageService.deleteSession('rider','s1');
 expect(state.docs.has('users/rider/sessions/s1')).toBe(false);
 expect(state.docs.get('users/rider/sessionIndex/'+summaryHash('s1')[0]).rows.s1).toBe('null');
 expect(await storageService.getSessions('rider',false)).toEqual([]);
});
it('loads old unfinished sessions completely before they can resume',async()=>{
 for(let i=0;i<30;i++)state.docs.set('users/rider/sessions/s'+i,session(i));
 state.docs.set('users/rider/sessions/s0',{...session(0),status:'pending',sessionEndedAt:undefined});
 await storageService.getSessions('rider',false);storageService.clearMemory();
 const rows=await storageService.getSessions('rider',false);expect(rows.find(s=>s.id==='s0')?.summaryOnly).toBeUndefined();expect(rows.find(s=>s.id==='s0')?.history).toHaveLength(1);
});
it('full export still includes every original attempt log',async()=>{
 for(let i=0;i<30;i++)state.docs.set('users/rider/sessions/s'+i,session(i));
 expect((await storageService.getAllSessions('rider')).every(s=>s.history.length===1)).toBe(true);
});

it('live counter updates do not reread or rewrite summaries, yet reloads retain their latest attempts',async()=>{
 state.docs.set('users/rider/savedSetups/board',{id:'board'});
 const live={...session(1),sessionEndedAt:undefined,status:'pending' as const,attemptCount:0,landingCount:0};
 await storageService.saveSession('rider',live);state.writes=[];state.reads=[];
 await storageService.saveSession('rider',{...live,attemptCount:1});
 expect(state.writes).toEqual(['users/rider/sessions/s1']);expect(state.reads).toEqual(['users/rider/sessions/s1']);
 await storageService.getSessions('rider',false);storageService.clearMemory();
 expect((await storageService.getSessions('rider',false)).find(s=>s.id==='s1')?.attemptCount).toBe(1);
});
