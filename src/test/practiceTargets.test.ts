import {it,expect} from 'vitest';
import {createPracticeSession} from '../domain/practiceActions';
import {referenceChallenge} from '../domain/referenceChallenge';
import {createTarget,suggestionFor,personalWins,masteryPath,nextSteps,targetAchieved,goalLabel} from '../domain/practiceTargets';
import {closePractice,startConfiguredSession,goalReached} from '../domain/sessionPlan';
import {PracticeSession} from '../domain/types';
import {validateTrickParameters} from '../domain/rules';
const NOW=Date.parse('2026-10-07T03:00:00Z'),trick=referenceChallenge('kickflip'),setup={id:'board',name:'Board',deckWidthMm:34,wheelMaterial:'urethane' as const};
function session(id:string,day:number,landings=6,attempts=20):PracticeSession {
 const end=Date.UTC(2026,9,day,0);
 return {...createPracticeSession(trick,setup,end-600000),id,sessionStartedAt:new Date(end-600000).toISOString(),sessionEndedAt:new Date(end).toISOString(),activeDurationMs:600000,attemptCount:attempts,landingCount:landings,status:'failed',firstLandingAttemptNumber:10,bestLandingStreak:2};
}
it('offers a concrete, achievable improvement based on the last finished session',()=>{
 const suggestion=suggestionFor([session('a',5)],null,NOW);
 expect(suggestion.goal).toEqual({type:'landings',target:8});expect(suggestion.reason).toContain('6/20');
 const parked={...session('parked',6,18),status:'pending' as const};
 expect(suggestionFor([session('a',5),parked],null,NOW).goal.target).toBe(8);
 expect(suggestionFor([session('none',5,0)],null,NOW).goal.target).toBe(1);
});
it('celebrates earlier first landings and best streaks even when the session failed',()=>{
 const a=session('a',5),b={...session('b',6,5),firstLandingAttemptNumber:6,bestLandingStreak:3};
 const wins=personalWins([b,a],'b',NOW);
 expect(wins.some(w=>w.includes('4 attempts sooner'))).toBe(true);expect(wins.some(w=>w.includes('New best streak: 3'))).toBe(true);
 expect(wins.some(w=>w.includes('landing-rate'))).toBe(false);
});
it('does not fabricate improvements for ties or missing first-landing measurements',()=>{
 const a=session('a',5),b={...session('b',6),firstLandingAttemptNumber:undefined};
 expect(personalWins([a,b],'b',NOW)).toEqual([]);
 expect(personalWins([{...a,status:'pending'}],'a',NOW)).toEqual([]);
});
it('requires repeat landings and measured consistency before unlocking a stance step',()=>{
 const a={...session('a',5,12),bestLandingStreak:3};
 const first=masteryPath([a],trick,NOW);expect(first.steps.map(s=>s.done)).toEqual([true,false,false,false]);expect(first.next?.goal.target).toBe(1);
 const b={...session('b',6,12),bestLandingStreak:3};
 const stable=masteryPath([a,b],trick,NOW);expect(stable.steps.map(s=>s.done)).toEqual([true,true,true,false]);
 expect(stable.next?.trickResult.singleTrick?.stance).not.toBe('regular');expect(validateTrickParameters(stable.next!.trickResult.singleTrick!).isValid).toBe(true);
 const c={...session('c',7,1),trickResult:stable.next!.trickResult};expect(masteryPath([a,b,c],trick,NOW).complete).toBe(true);
});
it('does not mark unmeasured tiny samples as consistency',()=>{
 const a={...session('a',5,3,3),bestLandingStreak:3},b={...session('b',6,3,3),bestLandingStreak:3};
 expect(masteryPath([a,b],trick,NOW).steps[2].done).toBe(false);
});
it('offers a weak-point mission only when actual miss tags support it',()=>{
 const a=session('a',5);expect(nextSteps([a],'a',NOW).some(c=>c.label==='Practice your weak point')).toBe(false);
 const tagged={...a,missTagCounts:{underflip:4,missed_catch:1}};
 const weak=nextSteps([tagged],'a',NOW).find(c=>c.label==='Practice your weak point')!;
 expect(weak.target.focusTag).toBe('underflip');expect(weak.target.reason).toContain('4 times');
});
it('preserves targets as account-safe JSON and only completes them with later matching history',()=>{
 const target=createTarget(trick,{type:'streak',target:3},'Three in a row',Date.parse('2026-10-05T12:00:00Z'));
 expect(JSON.parse(JSON.stringify(target))).toEqual(target);
 expect(targetAchieved([{...session('old',5),bestLandingStreak:5}],target,NOW)).toBe(false);
 expect(targetAchieved([{...session('new',6),bestLandingStreak:3}],target,NOW)).toBe(true);
 expect(targetAchieved([{...session('parked',6),status:'pending',bestLandingStreak:3}],target,NOW)).toBe(false);
});
it('supports a real ten-minute goal and excludes paused time from completion',()=>{
 const pending=createPracticeSession(trick,setup,1000);
 const started=startConfiguredSession(pending,setup,{type:'time',target:10},{type:'countdown',durationMs:600000},'Marble',1000);
 expect(closePractice(started,false,3,'',301000).status).toBe('failed');
 const ended=closePractice(started,false,3,'',601000,'countdown');expect(ended.status).toBe('success');expect(goalReached(ended)).toBe(true);
 expect(goalLabel(ended.goal!)).toBe('10 minutes of practice');
 const paused={...started,timerState:{isRunning:false,accumulatedMs:300000},activeDurationMs:300000};expect(goalReached(paused)).toBe(false);
 expect(()=>startConfiguredSession(pending,setup,{type:'time',target:10},{type:'countdown',durationMs:300000},'Marble',1000)).toThrow('countdown');
});
it('lets a recorded time goal complete without inventing attempts or landings',()=>{
 const target=createTarget(trick,{type:'time',target:10},'Practice time',Date.parse('2026-10-05T12:00:00Z'));
 expect(targetAchieved([{...session('timed',6,0,0),goal:{type:'time',target:10}}],target,NOW)).toBe(true);
});
