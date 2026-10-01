import { describe, it, expect } from 'vitest';
import { createPracticeSession, recordCounterAction, undoCounterAction, challengeKey } from '../domain/practiceActions';
import { getStreaks, getPersonalBests, compareSetups, trickKey } from '../domain/progression';
import { GeneratedTrickResult, SetupData } from '../domain/types';
const result:GeneratedTrickResult={mode:'single',canonicalName:'Kickflip',singleTrick:{stance:'regular',direction:'none',baseTrickId:'kickflip',bodyVarial:'none',landing:'normal',revert:'none'},breakdown:[],catalogVersion:'1'};
const setup:SetupData={id:'one',name:'One',deckWidthMm:34,wheelMaterial:'urethane',deckModel:'Deck A',truckModel:'Trucks A',wheelModel:'Wheels A'};
const make=()=>createPracticeSession(result,setup,1000);

describe('Progression and miss tracking',()=>{
  it('counts consecutive landings, resets on miss, and restores streak and tags on Undo',()=>{
    let s=recordCounterAction(make(),'landing',2000);
    s=recordCounterAction(s,'landing',3000);s=recordCounterAction(s,'landing',4000);
    expect(getStreaks(s)).toEqual({current:3,best:3});
    s=recordCounterAction(s,'attempt',5000,['underflip','missed_catch','underflip']);
    expect(getStreaks(s)).toEqual({current:0,best:3});
    expect(s.missTagCounts).toEqual({underflip:1,missed_catch:1});
    expect(s.history[0].missTags).toEqual(['underflip','missed_catch']);
    s=undoCounterAction(s);
    expect(getStreaks(s)).toEqual({current:3,best:3});expect(s.missTagCounts).toEqual({});
    s=undoCounterAction(s);expect(getStreaks(s)).toEqual({current:2,best:2});
  });
  it('ignores tags on successful landings and leaves a fresh repeat with no streak',()=>{
    const s=recordCounterAction(make(),'landing',2000,['underflip']);
    expect(s.missTagCounts).toEqual({});
    expect(getStreaks(createPracticeSession(s.trickResult,setup,3000))).toEqual({current:0,best:0});
  });
  it('replays old action history without modifying older records',()=>{
    let s=recordCounterAction(make(),'landing',2000);s=recordCounterAction(s,'landing',3000);
    delete s.currentLandingStreak;delete s.bestLandingStreak;
    expect(getStreaks(s)).toEqual({current:2,best:2});
    expect(s.currentLandingStreak).toBeUndefined();
  });
  it('computes per-challenge personal bests with sample counts and tied weak points',()=>{
    const a={...make(),attemptCount:10,landingCount:8,firstLandingAttemptNumber:3,bestLandingStreak:4,currentLandingStreak:0,missTagCounts:{underflip:2}};
    const b={...make(),id:'b',attemptCount:1,landingCount:1,firstLandingAttemptNumber:1,bestLandingStreak:1,currentLandingStreak:1,missTagCounts:{missed_catch:2}};
    const best=getPersonalBests([a,b,make()]);
    expect(best.fewestFirstLandingAttempts).toBe(1);expect(best.highestLandingRate?.attempts).toBe(1);
    expect(best.bestStreak).toBe(4);expect(best.totalAttempts).toBe(11);expect(best.topMisses).toHaveLength(2);
  });
  it('does not invent first-landing results for failed or legacy sessions',()=>{
    const best=getPersonalBests([{...make(),attemptCount:4,landingCount:0},make()]);
    expect(best.fewestFirstLandingAttempts).toBeUndefined();expect(best.highestLandingRate).toBeUndefined();
  });
  it('matches exact challenge parameters independently of naming and complexity metadata',()=>{
    expect(challengeKey({...result,complexity:'advanced',canonicalName:'Different label'})).toBe(trickKey(result));
    expect(trickKey({...result,singleTrick:{...result.singleTrick!,stance:'switch'}})).not.toBe(trickKey(result));
  });
  it('compares the same trick with weighted landing rates and preserved hardware snapshots',()=>{
    const a={...make(),attemptCount:2,landingCount:1,firstLandingAttemptNumber:2};
    const b={...make(),id:'b',attemptCount:8,landingCount:2,firstLandingAttemptNumber:4};
    const other={...make(),id:'c',trickResult:{...result,singleTrick:{...result.singleTrick!,stance:'switch' as const}},attemptCount:10,landingCount:10};
    const rows=compareSetups([a,b,other,make()],'setup',trickKey(result));
    expect(rows).toHaveLength(1);expect(rows[0].attempts).toBe(10);expect(rows[0].landingRate).toBe(.3);
    expect(rows[0].averageFirstLandingAttempts).toBe(3);expect(rows[0].firstLandingSamples).toBe(2);
    const changed={...a,id:'changed',setupSnapshot:{...a.setupSnapshot,truckModel:'New Trucks'}};
    expect(compareSetups([a,changed],'setup')).toHaveLength(2);
    expect(a.setupSnapshot.truckModel).toBe('Trucks A');
  });
  it('groups wheels by model and material and trucks by model',()=>{
    const a={...make(),attemptCount:1,landingCount:1};
    const b={...a,id:'b',setupSnapshot:{...setup,id:'two',wheelMaterial:'plastic' as const}};
    expect(compareSetups([a,b],'wheels')).toHaveLength(2);
    expect(compareSetups([a,b],'trucks')).toHaveLength(1);
  });
});
