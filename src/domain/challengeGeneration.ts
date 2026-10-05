import {singleFitsClass,challengeFitsClass} from './skateClasses';
import { BASE_TRICKS, CATALOG_VERSION, getBaseTrickById } from './catalog';
import { getObstacleTricksForObstacle } from './obstacleCatalog';
import { getTransferChoices } from './obstacleTransfers';
import { generateBreakdown } from './rules';
import { calculateResultingStance } from './comboEngine';
import { resolveUnderlyingMovements } from './movements';
import { resolveObstacleMechanics } from './obstacleMechanics';
import { formatSingleTrickName, formatComboName, formatObstacleTrickName, explainObstacleTrick } from './naming';
import { singleComplexity, obstacleComplexity, matchesComplexity, getChallengeComplexity } from './complexity';
import { ParameterLocks, ParameterExclusions, SingleTrickParameters, GeneratorPresetConfig, GeneratedTrickResult, ComboStep, ObstacleComponent, ObstacleType } from './types';

const pick = <T,>(items: T[]): T => items[Math.floor(Math.random()*items.length)];
function allowed<T extends string>(values: T[], lock: string | undefined, excluded?: string[]): T[] {
  return values.filter(v => (lock === undefined || v === lock) && !excluded?.includes(v));
}
export function enumerateSingleOptions(locks: ParameterLocks, excluded: ParameterExclusions): SingleTrickParameters[] {
  const options: SingleTrickParameters[] = [];
  for (const base of BASE_TRICKS) {
    if ((locks.baseTrickId !== undefined && locks.baseTrickId !== base.id) || excluded.baseTrickIds?.includes(base.id)) continue;
    const bodies = base.allowedModifiers.bodyVarial ? ['none','frontside','backside'] as const : ['none'] as const;
    const landings = base.allowedModifiers.landingManual ? ['normal','manual','nose_manual'] as const : ['normal'] as const;
    const reverts = base.allowedModifiers.revert ? ['none','frontside','backside'] as const : ['none'] as const;
    for (const stance of allowed(base.allowedStances,locks.stance,excluded.stances))
    for (const direction of allowed(base.applicableDirections,locks.direction,excluded.directions))
    for (const bodyVarial of allowed([...bodies],locks.bodyVarial,excluded.bodyVarials))
    for (const landing of allowed([...landings],locks.landing,excluded.landings))
    for (const revert of allowed([...reverts],locks.revert,excluded.reverts)) {
      options.push({ stance,direction,baseTrickId:base.id,bodyVarial,landing,revert });
    }
  }
  return options;
}
function completeSingle(p: SingleTrickParameters) {
  const params = { ...p, movements: resolveUnderlyingMovements(p) };
  return { params, breakdown: generateBreakdown(params,getBaseTrickById(p.baseTrickId)!) };
}
function createStep(p: SingleTrickParameters, index: number, out: boolean): ComboStep {
  const { params,breakdown } = completeSingle(p);
  const stance = calculateResultingStance(params);
  return { stepNumber:index,parameters:params,resolvedName:formatSingleTrickName(params)+(out?' out':''),
    landingState:{ resultStance:stance,travelDirection:stance==='fakie'||stance==='nollie'?'backward':'forward',boardPosition:params.landing },
    breakdown:breakdown.join(' · '),movements:params.movements };
}

export function generateChallenge(config: GeneratorPresetConfig): GeneratedTrickResult | { error: string } {
  const tier = config.skateClass;
  const filter = config.complexityFilter || 'all';
  let result: GeneratedTrickResult | undefined;
  if (config.mode === 'single') {
    const choices = enumerateSingleOptions(config.singleLocks,config.singleExclusions).filter(p => (!tier||singleFitsClass(p,tier)) && matchesComplexity(singleComplexity(p),filter));
    if (choices.length) {
      const {params,breakdown}=completeSingle(pick(choices));
      result={mode:'single',canonicalName:formatSingleTrickName(params),singleTrick:params,movements:params.movements,breakdown,catalogVersion:CATALOG_VERSION};
    }
  } else if (config.mode === 'combo') {
    const first = enumerateSingleOptions(config.step1Locks,config.step1Exclusions).filter(p=>!tier||singleFitsClass(p,tier));
    const second = enumerateSingleOptions(config.step2Locks,config.step2Exclusions).filter(p=>!tier||singleFitsClass(p,tier));
    // Reuse compatible second-step pools for a stance, balance position, and first-step complexity.
    const cache = new Map<string,SingleTrickParameters[]>();
    const candidates: { first: SingleTrickParameters; second: SingleTrickParameters[] }[]=[];
    for (const p of first) {
      const stance=calculateResultingStance(p),score=singleComplexity(p);
      const key=JSON.stringify([stance,p.landing,score]);
      let options=cache.get(key);
      if (!options) {
        const exits=p.landing==='manual'?['ollie','kickflip','heelflip','pop_shuvit']
          :p.landing==='nose_manual'?['ollie','kickflip','heelflip','frontside_pop_shuvit']:null;
        options=second.filter(q => q.stance===stance && (!exits||exits.includes(q.baseTrickId))
          && matchesComplexity(Math.max(score,singleComplexity(q))+1,filter));
        cache.set(key,options);
      }
      if (options.length) candidates.push({first:p,second:options});
    }
    if (candidates.length) {
      const choice=pick(candidates),steps=[createStep(choice.first,1,false),createStep(pick(choice.second),2,choice.first.landing!=='normal')];
      result={mode:'combo',comboSteps:steps,canonicalName:formatComboName(steps),breakdown:[
        `Step 1: ${steps[0].resolvedName} (${steps[0].breakdown})`,
        `Transition: Lands in ${steps[0].landingState.resultStance} stance (${steps[0].landingState.boardPosition})`,
        `Step 2: ${steps[1].resolvedName} (${steps[1].breakdown})`],catalogVersion:CATALOG_VERSION};
    }
  } else {
    const l=config.obstacleLocks,e=config.obstacleExclusions;
    const options:ObstacleComponent[]=[];
    const obstacleLock=(l as ParameterLocks & {obstacleType?:ObstacleType}).obstacleType;
    for (const obstacleType of allowed(['ledge','rail'] as ObstacleType[],obstacleLock,e.obstacles))
    for (const trick of getObstacleTricksForObstacle(obstacleType)) {
      if ((l.obstacleTrickId!==undefined&&l.obstacleTrickId!==trick.id)||e.obstacleTrickIds?.includes(trick.id)) continue;
      if ((l.contactPoint!==undefined&&l.contactPoint!==trick.contactPoint)||e.contactPoints?.includes(trick.contactPoint)) continue;
      if ((l.boardAngle!==undefined&&l.boardAngle!==trick.boardAngle)||e.boardAngles?.includes(trick.boardAngle)) continue;
      if (l.whichTruckCrosses!==undefined&&l.whichTruckCrosses!==trick.whichTruckCrosses) continue;
      if (l.entryRotation!==undefined&&l.entryRotation!==(trick.entryRotation||'none')) continue;
      for (const approach of allowed(trick.applicableApproaches,l.approach,e.approaches))
      for (const entryTrickId of allowed(trick.allowedEntryTricks,l.entryTrickId,e.entryTrickIds))
      for (const transfer of getTransferChoices(obstacleType,trick.id,approach,l,e))
      for (const exitTrick of transfer.exits) {
        const p:ObstacleComponent={obstacleType,approach,obstacleTrickId:trick.id,entryTrickId,exitTrick,transferTrickId:transfer.id||undefined};
        if ((!tier||challengeFitsClass({mode:'obstacle',obstacleData:p,canonicalName:'',breakdown:[],catalogVersion:CATALOG_VERSION},tier))&&matchesComplexity(obstacleComplexity(p),filter)) options.push(p);
      }
    }
    if (options.length) {
      const p=pick(options);p.mechanics=resolveObstacleMechanics(p);
      result={mode:'obstacle',obstacleData:p,canonicalName:formatObstacleTrickName(p),breakdown:explainObstacleTrick(p),catalogVersion:CATALOG_VERSION};
    }
  }
  if (!result) return {error:`No ${filter==='all'?'compatible':filter} challenge matches these locks and pools. Adjust the skate class, unlock a value, or include more pool options.`};
  return {...result,...(tier?{skateClass:tier}:{}),complexity:getChallengeComplexity(result)};
}
