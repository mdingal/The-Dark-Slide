import { describe,it,expect } from 'vitest';
import { generateChallenge } from '../domain/challengeGeneration';
import { getChallengeComplexity,singleComplexity } from '../domain/complexity';
import { calculateResultingStance } from '../domain/comboEngine';
import { GeneratorPresetConfig, ComplexityTier } from '../domain/types';
import { getObstacleTrickById } from '../domain/obstacleCatalog';
import { BASE_TRICKS } from '../domain/catalog';
const params={stance:'regular',direction:'none',baseTrickId:'ollie',bodyVarial:'none',landing:'normal',revert:'none'} as const;
const config:GeneratorPresetConfig={mode:'single',singleLocks:{},singleExclusions:{},step1Locks:{},step2Locks:{},step1Exclusions:{},step2Exclusions:{},obstacleLocks:{},obstacleExclusions:{},activeParams:params,step1Params:params,step2Params:params,selectedObstacle:'ledge',obstacleData:{obstacleType:'ledge',approach:'frontside',obstacleTrickId:'50_50',entryTrickId:'ollie',exitTrick:'clean'}};
describe('Complexity-aware valid generation',()=>{
  for(const mode of ['single','combo','obstacle'] as const)for(const tier of ['beginner','intermediate','advanced'] as ComplexityTier[]){
    it(`generates only ${tier} ${mode} challenges`,()=>{
      for(let i=0;i<4;i++){
        const result=generateChallenge({...config,mode,complexityFilter:tier});
        if('error' in result)throw new Error(result.error);
        expect(getChallengeComplexity(result)).toBe(tier);
        if(mode==='combo')expect(result.comboSteps![1].parameters.stance).toBe(calculateResultingStance(result.comboSteps![0].parameters));
        if(mode==='obstacle'){
          const o=result.obstacleData!,final=getObstacleTrickById(o.transferTrickId||o.obstacleTrickId)!;
          expect(final.allowedExitTricks).toContain(o.exitTrick);expect(final.supportedObstacles).toContain(o.obstacleType);
        }
      }
    });
  }
  it('does not bypass locks or pools to satisfy complexity',()=>{
    const locks={stance:'switch',baseTrickId:'tre_flip',bodyVarial:'frontside',landing:'manual',revert:'frontside'} as const;
    expect('error' in generateChallenge({...config,complexityFilter:'beginner',singleLocks:locks})).toBe(true);
    expect('error' in generateChallenge({...config,singleExclusions:{baseTrickIds:BASE_TRICKS.map(t=>t.id)}})).toBe(true);
    expect('error' in generateChallenge({...config,singleLocks:{baseTrickId:'kickflip'},singleExclusions:{baseTrickIds:['kickflip']}})).toBe(true);
    expect('error' in generateChallenge({...config,singleExclusions:{bodyVarials:['none','frontside','backside']}})).toBe(true);
  });
  it('preserves None transfer locks and reports an empty transfer pool',()=>{
    const result=generateChallenge({...config,mode:'obstacle',obstacleLocks:{transferTrickId:''}});
    if('error' in result)throw new Error(result.error);
    expect(result.obstacleData!.transferTrickId).toBeUndefined();
    const ids=['','50_50','5_0','nosegrind','crooked','boardslide','tailslide','smith'];
    expect('error' in generateChallenge({...config,mode:'obstacle',obstacleExclusions:{transferTrickIds:ids}})).toBe(true);
  });
  it('preserves a locked step-two stance by choosing a compatible first step',()=>{
    const result=generateChallenge({...config,mode:'combo',step2Locks:{stance:'switch'}});
    if('error' in result)throw new Error(result.error);
    expect(result.comboSteps![1].parameters.stance).toBe('switch');
  });
  it('restricts manual exits to supported tricks',()=>{
    const result=generateChallenge({...config,mode:'combo',step1Locks:{landing:'manual'}});
    if('error' in result)throw new Error(result.error);
    expect(['ollie','kickflip','heelflip','pop_shuvit']).toContain(result.comboSteps![1].parameters.baseTrickId);
  });
});
