import {it,expect} from 'vitest';
import catalog from '../../shared/communityChallengeCatalog.json';
import {challengePeriod,challengeSchedule} from '../../shared/challengePeriods.mjs';
import {SharedChallenge,challengeActive,challengeCompleted,sharedCompletionHistory} from '../domain/communityChallenges';
import {createPracticeSession} from '../domain/practiceActions';
const now=Date.parse('2026-10-02T04:00:00Z');
const schedule=challengeSchedule(catalog,60,now) as SharedChallenge[];
const daily=schedule.find(c=>c.id==='daily-2026-10-02')!;
function session(c=daily){const s=createPracticeSession(c.primary,{id:'setup',name:'Setup',deckWidthMm:34,wheelMaterial:'urethane'},now);return {...s,sharedChallenge:{id:c.id,kind:c.kind,variant:'primary' as const,startsAt:c.startsAt,endsAt:c.endsAt,targetLandings:c.targetLandings},landingCount:c.targetLandings,attemptCount:c.targetLandings,sessionEndedAt:new Date(now+1000).toISOString()};}
it('rotates at Philippines midnight and Monday midnight',()=>{
 expect(challengePeriod('daily',Date.parse('2026-10-02T15:59:59Z')).id).toBe('daily-2026-10-02');
 expect(challengePeriod('daily',Date.parse('2026-10-02T16:00:00Z')).id).toBe('daily-2026-10-03');
 expect(challengePeriod('weekly',Date.parse('2026-10-04T15:59:59Z')).id).toBe('weekly-2026-09-28');
 expect(challengePeriod('weekly',Date.parse('2026-10-04T16:00:00Z')).id).toBe('weekly-2026-10-05');
});
it('publishes stable shared schedules with 60 daily entries and fixed obstacle alternatives',()=>{
 expect(challengeSchedule(catalog,60,now)).toEqual(schedule);
 expect(schedule.filter(c=>c.kind==='daily')).toHaveLength(60);
 expect(new Set(schedule.filter(c=>c.kind==='daily').slice(0,34).map(c=>c.primary.canonicalName)).size).toBe(34);
 expect(catalog.weekly.filter(c=>c.primary.mode==='obstacle').every(c=>!!c.alternative)).toBe(true);
 expect(challengeActive(daily,Date.parse(daily.endsAt))).toBe(false);
});
it('requires exact linked challenges finished before the deadline',()=>{
 const s=session();expect(challengeCompleted(daily,s)).toBe(true);
 expect(challengeCompleted(daily,{...s,sharedChallenge:undefined})).toBe(false);
 expect(challengeCompleted(daily,{...s,landingCount:0})).toBe(false);
 expect(challengeCompleted(daily,{...s,sessionEndedAt:undefined})).toBe(false);
 expect(challengeCompleted(daily,{...s,sessionEndedAt:daily.endsAt})).toBe(false);
 expect(challengeCompleted(daily,{...s,sessionEndedAt:new Date(now-1).toISOString()})).toBe(false);
 const other=schedule.find(c=>c.kind==='daily'&&c.primary.canonicalName!==daily.primary.canonicalName)!;
 expect(challengeCompleted(daily,{...s,trickResult:other.primary})).toBe(false);
});
it('counts weekly alternatives without summing separate sessions',()=>{
 const c=schedule.find(c=>c.kind==='weekly'&&c.alternative)!;
 const within=Date.parse(c.startsAt)+10000;
 const s={...session(c),generatedAt:new Date(within).toISOString(),sessionEndedAt:new Date(within+1000).toISOString(),trickResult:c.alternative!,sharedChallenge:{...session(c).sharedChallenge,variant:'alternative' as const}};
 expect(challengeCompleted(c,s)).toBe(true);
 expect(sharedCompletionHistory([{...s,landingCount:2},{...s,id:'other',landingCount:1}])).toHaveLength(0);
 expect(sharedCompletionHistory([s,{...s,id:'again'}])).toHaveLength(1);
 expect(sharedCompletionHistory([{...s,sessionEndedAt:new Date(within-1).toISOString()}])).toHaveLength(0);
});
