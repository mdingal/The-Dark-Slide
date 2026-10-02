import { enumerateSingleOptions } from './challengeGeneration';
import { resolveUnderlyingMovements } from './movements';
import { BASE_TRICKS, CATALOG_VERSION, getBaseTrickById } from './catalog';
import { generateBreakdown } from './rules';
import { formatSingleTrickName } from './naming';
import { getChallengeComplexity } from './complexity';
import { trickKey } from './progression';
import { GeneratedTrickResult, SingleTrickParameters, ComplexityFilter, TrickMode } from './types';
export function baseChallengePool(): GeneratedTrickResult[] {
 return BASE_TRICKS.map(base => {
  const singleTrick: SingleTrickParameters = {stance:base.allowedStances.includes('regular')?'regular':base.allowedStances[0],direction:base.applicableDirections.includes('none')?'none':base.applicableDirections[0],baseTrickId:base.id,bodyVarial:'none',landing:'normal',revert:'none'};
  return {mode:'single',singleTrick,canonicalName:formatSingleTrickName(singleTrick),breakdown:generateBreakdown(singleTrick,base),catalogVersion:CATALOG_VERSION};
 });
}
export function uniqueChallenges(items: GeneratedTrickResult[]): GeneratedTrickResult[] {
 return [...new Map(items.map(item=>[trickKey(item),item])).values()];
}
export function selectPoolChallenge(items: GeneratedTrickResult[], mode: TrickMode, complexity: ComplexityFilter, random = Math.random): GeneratedTrickResult | {error:string} {
 const eligible=uniqueChallenges(items).filter(t=>t.mode===mode&&(complexity==='all'||getChallengeComplexity(t)===complexity));
 if(!eligible.length)return {error:'No selected tricks match this session mode and complexity. Select more tricks or change the filters.'};
 const selected=eligible[Math.min(eligible.length-1,Math.floor(random()*eligible.length))];
 return {...structuredClone(selected),complexity:getChallengeComplexity(selected)};
}

export function expandSelectedVariations(items: GeneratedTrickResult[], stanceVariations: boolean, rotations: ('none'|'frontside'|'backside')[] | null, stances: SingleTrickParameters['stance'][] = ['regular','nollie','fakie','switch']): GeneratedTrickResult[] {
 return uniqueChallenges(items.flatMap(t=>{
  if(t.mode!=='single'||!t.singleTrick)return [t];
  const p=t.singleTrick,base=getBaseTrickById(p.baseTrickId);
  if(!base)return [];
  const parameters=enumerateSingleOptions({baseTrickId:p.baseTrickId,...(!stanceVariations?{stance:p.stance}:{}),...(!rotations?{direction:p.direction}:{}),bodyVarial:p.bodyVarial,landing:p.landing,revert:p.revert},{});
  return parameters.filter(q=>(!stanceVariations||stances.includes(q.stance))&&(!rotations||rotations.includes(q.direction))).map(q=>{
   const singleTrick={...q,movements:resolveUnderlyingMovements(q)};
   return {...t,singleTrick,canonicalName:formatSingleTrickName(singleTrick),movements:singleTrick.movements,breakdown:generateBreakdown(singleTrick,base),catalogVersion:CATALOG_VERSION};
  });
 }));
}
