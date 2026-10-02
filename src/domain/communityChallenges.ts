import {PracticeSession,GeneratedTrickResult} from './types';
import {trickKey} from './progression';
export interface SharedChallenge {id:string;kind:'daily'|'weekly';startsAt:string;endsAt:string;published:boolean;targetLandings:number;primary:GeneratedTrickResult;alternative?:GeneratedTrickResult;}
export interface SharedChallengeLink {id:string;kind:'daily'|'weekly';variant:'primary'|'alternative';startsAt:string;endsAt:string;targetLandings:number;}
export function challengeActive(c:SharedChallenge,now=Date.now()):boolean{return c.published&&Date.parse(c.startsAt)<=now&&now<Date.parse(c.endsAt);}
export function challengeSessions(c:SharedChallenge,sessions:PracticeSession[]):PracticeSession[]{return sessions.filter(s=>{
 const link=s.sharedChallenge;if(!link||link.id!==c.id)return false;
 const target=link.variant==='alternative'?c.alternative:c.primary;
 return target&&trickKey(target)===trickKey(s.trickResult)&&Date.parse(s.generatedAt)>=Date.parse(c.startsAt)&&Date.parse(s.generatedAt)<Date.parse(c.endsAt);
 });}
export function challengeCompleted(c:SharedChallenge,s:PracticeSession):boolean{
 const end=Date.parse(s.sessionEndedAt||'');
 return challengeSessions(c,[s]).length>0&&Number.isFinite(end)&&end>=Date.parse(s.generatedAt)&&end<Date.parse(c.endsAt)&&s.landingCount>=c.targetLandings;
}
export function challengeProgress(c:SharedChallenge,sessions:PracticeSession[]):'Not joined'|'In progress'|'Completed'{
 const linked=challengeSessions(c,sessions);
 return linked.some(s=>challengeCompleted(c,s))?'Completed':linked.length?'In progress':'Not joined';
}
export function sharedCompletionHistory(sessions:PracticeSession[]):PracticeSession[]{return sessions.filter(s=>{
 const c=s.sharedChallenge;if(!c||!s.sessionEndedAt)return false;
 const start=Date.parse(s.generatedAt),end=Date.parse(s.sessionEndedAt);
 return (c.targetLandings===1||c.targetLandings===3)&&s.landingCount>=c.targetLandings&&start>=Date.parse(c.startsAt)&&start<Date.parse(c.endsAt)&&end>=start&&end<Date.parse(c.endsAt);
 }).filter((s,i,all)=>all.findIndex(other=>other.sharedChallenge!.id===s.sharedChallenge!.id)===i);}
