import {it,expect} from 'vitest';
import {progressMilestones,newlyEarnedMilestones} from '../domain/milestones';
import {createPracticeSession} from '../domain/practiceActions';
import {baseChallengePool} from '../domain/selectedChallengePool';
import {PracticeSession} from '../domain/types';
const trick=baseChallengePool().find(t=>t.singleTrick!.baseTrickId==='kickflip')!;
function make(id:string,day:number,landings:number,attempts=10,streak=1,complete=true):PracticeSession{
 const date=new Date(Date.UTC(2026,9,day)).toISOString();
 return {...createPracticeSession(trick,{id:'setup',name:'Setup',deckWidthMm:34,wheelMaterial:'urethane'},Date.parse(date)),id,generatedAt:date,sessionStartedAt:date,sessionEndedAt:complete?date:undefined,attemptCount:attempts,landingCount:landings,bestLandingStreak:streak,currentLandingStreak:streak};
}
it('first landing is per exact variation, not per session or display name',()=>{
 const a=make('a',1,1),b=make('b',2,2),c=make('c',3,1);c.trickResult=structuredClone(trick);c.trickResult.singleTrick!.stance='switch';
 expect(progressMilestones([c,b,a]).filter(m=>m.kind==='first')).toHaveLength(2);
 expect(progressMilestones([make('empty',1,0)] )).toHaveLength(0);
});
it('streak records and thresholds track improvements without rewarding ties',()=>{
 const ms=progressMilestones([make('a',1,3,10,3),make('b',2,3,10,3),make('c',3,5,10,5)]);
 expect(ms.filter(m=>m.kind==='streak').map(m=>m.value).sort()).toEqual([3,5]);
 expect(ms.filter(m=>m.kind==='consistency').map(m=>m.value).sort()).toEqual([3,5]);
});
it('rates require finished sessions and ten attempts, compare exact challenges, and use percentage points',()=>{
 const a=make('a',1,5),small=make('small',2,1,1),unfinished=make('unfinished',3,9,10,1,false),b=make('b',4,7);
 const rates=progressMilestones([a,small,unfinished,b]).filter(m=>m.kind==='rate');
 expect(rates).toHaveLength(1);expect(rates[0].detail).toContain('+20.0 percentage points');
});
it('detects newly acknowledged progress and recalculates after undo or deletion',()=>{
 const zero=make('a',1,0),landed=make('a',1,1);expect(newlyEarnedMilestones([zero],[landed]).some(m=>m.kind==='first')).toBe(true);
 expect(newlyEarnedMilestones([landed],[landed])).toEqual([]);
 expect(newlyEarnedMilestones([landed],[zero])).toEqual([]);
 expect(progressMilestones([])).toEqual([]);
});
