import { describe, expect, it } from 'vitest';
import { referenceChallenge } from '../domain/referenceChallenge';
import { OBSTACLE_TRICKS } from '../domain/obstacleCatalog';

describe('reference guide practice challenges',()=>{
  it.each([['ollie','ollie'],['kickflip','kickflip'],['heelflip','heelflip'],['pop-shuvit','pop_shuvit']])('opens the exact unmodified %s',(id,base)=>{
    const result=referenceChallenge(id);
    expect(result.mode).toBe('single');
    expect(result.singleTrick).toMatchObject({baseTrickId:base,stance:'regular',direction:'none',bodyVarial:'none',landing:'normal',revert:'none'});
    expect(result.canonicalName).toBeTruthy();
    expect(result.breakdown.length).toBeGreaterThan(0);
  });
  it('uses a supported ledge 50-50 with permitted entry and exit',()=>{
    const result=referenceChallenge('50-50');const data=result.obstacleData!;
    const trick=OBSTACLE_TRICKS.find(t=>t.id===data.obstacleTrickId)!;
    expect(result.mode).toBe('obstacle');expect(data.obstacleTrickId).toBe('50_50');
    expect(trick.supportedObstacles).toContain(data.obstacleType);
    expect(trick.allowedEntryTricks).toContain(data.entryTrickId);
    expect(trick.allowedExitTricks).toContain(data.exitTrick);
    expect(trick.applicableApproaches).toContain(data.approach);
  });
  it('rejects unknown guides rather than opening a random trick',()=>{expect(()=>referenceChallenge('unknown')).toThrow();});
});
