import {sharedCompletionHistory} from './communityChallenges';
import { PracticeSession } from './types';
import { trickKey, getStreaks } from './progression';
export interface RiderMilestone {id:string;kind:'first'|'streak'|'rate'|'consistency'|'community';title:string;detail:string;trickName:string;trickKey:string;sessionId:string;date:string;value:number;}
export function progressMilestones(sessions:PracticeSession[]):RiderMilestone[]{
 const result:RiderMilestone[]=[],records=new Map<string,{landed:boolean;streak:number;rate:number|null;thresholds:Set<number>}>();
 for(const s of [...sessions].sort((a,b)=>(a.sessionStartedAt||a.generatedAt).localeCompare(b.sessionStartedAt||b.generatedAt)||a.id.localeCompare(b.id))){
  if(s.attemptCount<1||s.landingCount<1)continue;
  const key=trickKey(s.trickResult),record=records.get(key)||{landed:false,streak:0,rate:null,thresholds:new Set<number>()};
  const date=s.sessionEndedAt||s.sessionStartedAt||s.generatedAt;
  const add=(kind:RiderMilestone['kind'],title:string,detail:string,value:number,suffix='')=>result.push({id:JSON.stringify([key,kind,s.id,suffix]),kind,title,detail,trickName:s.trickResult.canonicalName,trickKey:key,sessionId:s.id,date,value});
  if(!record.landed){add('first','First recorded landing',s.firstLandingAttemptNumber?`Landed on attempt ${s.firstLandingAttemptNumber}.`:'Your first landing in recorded history.',1);record.landed=true;}
  const streak=getStreaks(s).best;
  if(streak>=2&&streak>record.streak)add('streak','New best streak',`${streak} consecutive landings${record.streak?` · previous best ${record.streak}`:''}.`,streak);
  record.streak=Math.max(record.streak,streak);
  for(const threshold of [3,5,10])if(streak>=threshold&&!record.thresholds.has(threshold)){add('consistency',`${threshold} in a row`,`${threshold} consecutive landings achieved.`,threshold,String(threshold));record.thresholds.add(threshold);}
  if(s.sessionEndedAt&&s.attemptCount>=10){const rate=s.landingCount/s.attemptCount;
   if(record.rate!==null&&rate>record.rate+0.000001)add('rate','Landing-rate personal best',`${Math.round(rate*100)}% over ${s.attemptCount} attempts · +${((rate-record.rate)*100).toFixed(1)} percentage points.`,rate);
   record.rate=Math.max(record.rate??0,rate);
  }
  records.set(key,record);
 }
 for(const s of sharedCompletionHistory(sessions)){
  const link=s.sharedChallenge!;result.push({id:JSON.stringify(['community',link.id]),kind:'community',title:link.kind==='daily'?'Daily challenge completed':'Weekly challenge completed',detail:`${s.landingCount} landings · self-reported completion.`,trickName:s.trickResult.canonicalName,trickKey:trickKey(s.trickResult),sessionId:s.id,date:s.sessionEndedAt!,value:1});
 }
 return result.sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
}
export function newlyEarnedMilestones(previous:PracticeSession[],next:PracticeSession[]):RiderMilestone[]{
 const old=new Map(progressMilestones(previous).map(m=>[m.id,m.value]));
 return progressMilestones(next).filter(m=>!old.has(m.id)||m.value>(old.get(m.id)??0));
}
