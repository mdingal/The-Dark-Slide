import {GeneratedTrickResult,PracticeSession,UserProfile,MissTag} from './types';
import {trickKey,getStreaks,MISS_TAGS} from './progression';
import {progressionSessions} from './riderProgression';
import {enumerateSingleOptions} from './challengeGeneration';
import {getBaseTrickById,CATALOG_VERSION} from './catalog';
import {formatSingleTrickName} from './naming';
import {generateBreakdown} from './rules';
import {referenceChallenge} from './referenceChallenge';

export interface PracticeTarget {
 id:string;
 createdAt:string;
 trickResult:GeneratedTrickResult;
 goal:NonNullable<PracticeSession['goal']>;
 title:string;
 reason:string;
 sourceSessionId?:string;
 focusTag?:MissTag;
}
export const MISS_TIPS:Record<MissTag,string>={underflip:'Focus on completing the flip before the catch. Keep the same setup and change one movement at a time.',overflip:'Try a lighter flick and an earlier catch. Change one movement at a time.',missed_catch:'Focus on catching with the board level before landing.',missed_lock_in:'Slow the approach and focus on the entry angle and a clean lock-in.',slipped_out:'Focus on a balanced landing and controlled pressure after the catch.'};
export function goalLabel(goal:NonNullable<PracticeSession['goal']>):string {
 return goal.type==='time'?`${goal.target} minutes of practice`:goal.type==='streak'?`${goal.target} landings in a row`:`${goal.target} successful landing${goal.target===1?'':'s'}`;
}
export function createTarget(trick:GeneratedTrickResult,goal:PracticeTarget['goal'],reason:string,now=Date.now(),extra:Partial<Pick<PracticeTarget,'focusTag'|'sourceSessionId'>>={}):PracticeTarget {
 return {id:`target_${now}_${Math.random().toString(36).slice(2,8)}`,createdAt:new Date(now).toISOString(),trickResult:structuredClone(trick),goal:{...goal},title:`${trick.canonicalName} · ${goalLabel(goal)}`,reason,...extra};
}
export function suggestionFor(records:PracticeSession[],profile?:UserProfile|null,now=Date.now()):PracticeTarget {
 const latest=progressionSessions(records,now).at(-1);
 if(latest){
  const target=Math.min(10000,latest.landingCount+Math.max(1,Math.min(3,Math.ceil(latest.landingCount*.25))));
  return createTarget(latest.trickResult,{type:'landings',target},`Last time, you landed ${latest.landingCount}/${latest.attemptCount} ${latest.trickResult.canonicalName.toLowerCase()}. Go for ${target} today.`,now,{sourceSessionId:latest.id});
 }
 const learning=profile?.trickLibrary?.find(entry=>entry.status==='learning'||entry.status==='want_to_learn');
 const trick=learning?.trickResult||referenceChallenge('kickflip');
 return createTarget(trick,{type:'landings',target:learning?1:5},learning?'Start with a first recorded landing from your trick library.':'Start with five landings, or choose a smaller goal during setup.',now);
}
export function personalWins(records:PracticeSession[],sessionId:string,now=Date.now()):string[]{
 const finished=progressionSessions(records,now),index=finished.findIndex(s=>s.id===sessionId);
 if(index<0)return [];
 const s=finished[index],past=finished.slice(0,index).filter(p=>trickKey(p.trickResult)===trickKey(s.trickResult)),wins:string[]=[];
 if(s.landingCount>0&&!past.some(p=>p.landingCount>0))wins.push('Your first recorded landing of this variation.');
 const previousBest=Math.max(0,...past.map(p=>getStreaks(p).best)),best=getStreaks(s).best;
 if(best>=2&&best>previousBest)wins.push(`New best streak: ${best}${previousBest?` (previous best: ${previousBest})`:''}.`);
 const measured=past.filter(p=>p.landingCount>0&&Number.isInteger(p.firstLandingAttemptNumber)&&p.firstLandingAttemptNumber!>0);
 if(s.landingCount>0&&s.firstLandingAttemptNumber&&measured.length){
  const old=Math.min(...measured.map(p=>p.firstLandingAttemptNumber!));
  if(s.firstLandingAttemptNumber<old)wins.push(`First landing came ${old-s.firstLandingAttemptNumber} attempt${old-s.firstLandingAttemptNumber===1?'':'s'} sooner than your previous best.`);
 }
 if(s.attemptCount>=10){const eligible=past.filter(p=>p.attemptCount>=10),rate=s.landingCount/s.attemptCount;
  if(eligible.length){const old=Math.max(...eligible.map(p=>p.landingCount/p.attemptCount));if(rate>old+.000001)wins.push(`New landing-rate best: ${Math.round(rate*100)}% (+${((rate-old)*100).toFixed(1)} percentage points, ${s.attemptCount} attempts).`);}
 }
 return wins;
}
function anotherStance(trick:GeneratedTrickResult):GeneratedTrickResult|null {
 const original=trick.singleTrick;if(!original)return null;
 for(const stance of ['fakie','regular','switch','nollie'] as const){
  if(stance===original.stance)continue;
  const params=enumerateSingleOptions({...original,stance},{})[0];if(!params)continue;
  return {mode:'single',singleTrick:params,canonicalName:formatSingleTrickName(params),breakdown:generateBreakdown(params,getBaseTrickById(params.baseTrickId)!),catalogVersion:CATALOG_VERSION};
 }
 return null;
}
function familyKey(trick:GeneratedTrickResult):string {
 if(!trick.singleTrick)return trickKey(trick);
 return trickKey({...trick,singleTrick:{...trick.singleTrick,stance:'regular'}});
}
export function masteryPath(records:PracticeSession[],trick:GeneratedTrickResult,now=Date.now()){
 const complete=progressionSessions(records,now),exact=complete.filter(s=>trickKey(s.trickResult)===trickKey(trick)),landed=exact.filter(s=>s.landingCount>0);
 const first=landed.length>0,repeat=first&&landed.length>=2;
 const stable=repeat&&exact.some(s=>getStreaks(s).best>=3)&&exact.some(s=>s.attemptCount>=10&&s.landingCount/s.attemptCount>=.5);
 const other=anotherStance(trick);
 const explored=!!other&&stable&&complete.some(s=>s.landingCount>0&&familyKey(s.trickResult)===familyKey(trick)&&s.trickResult.singleTrick?.stance!==trick.singleTrick?.stance);
 const steps=[{title:'Land it',detail:'A first landing in a finished session.',done:first},{title:'Repeat it',detail:'Land it in two separate finished sessions.',done:repeat},{title:'Build consistency',detail:'A streak of 3 and a 50% landing rate over 10+ attempts.',done:stable},...(other?[{title:'Explore a stance',detail:'Record a landing of the same variation in another stance.',done:explored}]:[])];
 const next=!first?createTarget(trick,{type:'landings',target:1},'Start the path with one recorded landing.',now):!repeat?createTarget(trick,{type:'landings',target:1},'Repeat your landing in another session.',now):!stable?createTarget(trick,{type:'streak',target:3},'Build a streak of three. The consistency step also needs a 50% landing rate over at least 10 attempts.',now):other&&!explored?createTarget(other,{type:'landings',target:1},'Explore the next stance on your mastery path.',now):null;
 return {steps,next,complete:steps.every(step=>step.done),landedSessions:landed.length};
}
export function nextSteps(records:PracticeSession[],sessionId:string,now=Date.now()) {
 const session=records.find(s=>s.id===sessionId);if(!session)return [];
 const beat=createTarget(session.trickResult,{type:session.goal?.type==='time'?'time':session.goal?.type==='streak'?'streak':'landings',target:Math.min(session.goal?.type==='time'?1440:10000,session.goal?.type==='time'?Math.max(1,Math.ceil(session.activeDurationMs/60000)+1):session.goal?.type==='streak'?Math.max(2,getStreaks(session).best+1):session.landingCount+Math.max(1,Math.min(3,Math.ceil(session.landingCount*.25))))},'Build on the result of your last session.',now,{sourceSessionId:session.id});
 const counts=MISS_TAGS.map(tag=>({...tag,count:session.missTagCounts?.[tag.id]||0})).sort((a,b)=>b.count-a.count);
 const weak=counts[0]?.count?createTarget(session.trickResult,{type:'landings',target:3},`${counts[0].label} was tagged ${counts[0].count} time${counts[0].count===1?'':'s'} in this session. ${MISS_TIPS[counts[0].id]}`,now,{sourceSessionId:session.id,focusTag:counts[0].id}):null;
 const path=masteryPath(records,session.trickResult,now);
 const next=path.next||createTarget(referenceChallenge(session.trickResult.singleTrick?.baseTrickId==='heelflip'?'kickflip':'heelflip'),{type:'landings',target:1},'Explore a different base trick. Review its guide if it is new to you.',now,{sourceSessionId:session.id});
 return [{label:'Beat this result',target:beat},...(weak?[{label:'Practice your weak point',target:weak}]:[]),{label:path.next?.trickResult.canonicalName===session.trickResult.canonicalName?'Continue the mastery path':'Try the next trick',target:next}];
}
export function targetAchieved(records:PracticeSession[],target:PracticeTarget,now=Date.now()):boolean {
 return progressionSessions(records,now).some(s=>Date.parse(s.sessionStartedAt!)>=Date.parse(target.createdAt)&&trickKey(s.trickResult)===trickKey(target.trickResult)&&(target.goal.type==='time'?s.activeDurationMs>=target.goal.target*60000:target.goal.type==='streak'?getStreaks(s).best>=target.goal.target:s.landingCount>=target.goal.target));
}
