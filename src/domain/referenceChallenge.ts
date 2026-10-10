import { GeneratedTrickResult, ObstacleComponent } from './types';
import { getObstacleTrickById } from './obstacleCatalog';
import { CATALOG_VERSION, getBaseTrickById } from './catalog';
import { enumerateSingleOptions } from './challengeGeneration';
import { resolveUnderlyingMovements } from './movements';
import { generateBreakdown } from './rules';
import { formatSingleTrickName, formatObstacleTrickName, explainObstacleTrick } from './naming';
import { resolveObstacleMechanics } from './obstacleMechanics';
import { parseReferenceId } from './referenceVariations';
import { getChallengeComplexity } from './complexity';

export function referenceChallenge(id: string): GeneratedTrickResult {
  const parsed=parseReferenceId(id);id=parsed.baseId;
  let result: GeneratedTrickResult;
  const obstacle = getObstacleTrickById(id === '50-50' ? '50_50' : id);
  if (obstacle) {
    const data: ObstacleComponent = { obstacleType:obstacle.supportedObstacles.includes('ledge')?'ledge':obstacle.supportedObstacles[0], approach:obstacle.applicableApproaches[0], obstacleTrickId:obstacle.id, entryTrickId:obstacle.allowedEntryTricks.includes('ollie')?'ollie':obstacle.allowedEntryTricks[0], exitTrick:'clean' };
    data.mechanics=resolveObstacleMechanics(data);
    result={mode:'obstacle',obstacleData:data,canonicalName:formatObstacleTrickName(data),breakdown:explainObstacleTrick(data),catalogVersion:CATALOG_VERSION};
  } else {
    const baseTrickId=id==='pop-shuvit'?'pop_shuvit':id;
    const p=enumerateSingleOptions({stance:parsed.stance,direction:'none',baseTrickId,bodyVarial:'none',landing:'normal',revert:'none'}, {})[0];
    if (!p) throw new Error('This guide does not have a practice challenge yet.');
    const params={...p,movements:resolveUnderlyingMovements(p)};
    result={mode:'single',singleTrick:params,movements:params.movements,canonicalName:formatSingleTrickName(params),breakdown:generateBreakdown(params,getBaseTrickById(baseTrickId)!),catalogVersion:CATALOG_VERSION};
  }
  return {...result,complexity:getChallengeComplexity(result)};
}
