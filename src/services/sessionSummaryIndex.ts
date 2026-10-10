import {PracticeSession} from '../domain/types';
import {getStreaks} from '../domain/progression';
export const SESSION_INDEX_VERSION=1;
export const SUMMARY_BUCKET_BYTES=600_000;
export interface SummaryBucket {version:1;split:boolean;rows:Record<string,string>;}
export const emptyBucket=():SummaryBucket=>({version:1,split:false,rows:{}});
// Stable across devices and sessions. Buckets split before reaching Firestore's size limit.
export function summaryHash(id:string):string {
 let a=2166136261,b=5381;
 for(let i=0;i<id.length;i++){a=Math.imul(a^id.charCodeAt(i),16777619);b=Math.imul(b,33)^id.charCodeAt(i);}
 return (a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0');
}
export function sessionSummary(s:PracticeSession):PracticeSession {
 const {current,best}=getStreaks(s);
 return {...s,history:[],currentLandingStreak:current,bestLandingStreak:best,summaryOnly:true};
}
export function encodeSummary(s:PracticeSession):string {
 const summary=JSON.stringify(sessionSummary(s));
 // Unusually large notes/configurations remain in the full record, fetched on demand at load.
 return new TextEncoder().encode(summary).length>200_000?JSON.stringify({id:s.id,loadFull:true}):summary;
}
export function summaryBucketSize(bucket:SummaryBucket):number{return new TextEncoder().encode(JSON.stringify(bucket)).length;}
export function partitionBucket(prefix:string,rows:Record<string,string>):Map<string,SummaryBucket> {
 const result=new Map<string,SummaryBucket>();
 const visit=(key:string,entries:Record<string,string>)=>{
  const bucket={version:1 as const,split:false,rows:entries};
  if(summaryBucketSize(bucket)<=SUMMARY_BUCKET_BYTES){result.set(key,bucket);return;}
  if(key.length>=16)throw Error('Session summary bucket is too large. Your full records have not been changed.');
  result.set(key,{version:1,split:true,rows:{}});
  const groups=new Map<string,Record<string,string>>();
  for(const [id,value] of Object.entries(entries)){const child=key+summaryHash(id)[key.length];const group=groups.get(child)||{};group[id]=value;groups.set(child,group);}
  for(const [child,group] of groups)visit(child,group);
 };
 visit(prefix,rows);return result;
}
// Migration fills missing entries only. Newer transactional updates and deletion tombstones win.
export function mergeMissingSummaries(existing:Record<string,string>,incoming:Record<string,string>){
 return {...incoming,...existing};
}
