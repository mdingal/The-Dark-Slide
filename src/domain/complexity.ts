import { GeneratedTrickResult, SingleTrickParameters, ComplexityFilter, ComplexityTier, ObstacleComponent } from './types';
import { getBaseTrickById, getReservedTrickById } from './catalog';
import { getObstacleTrickById } from './obstacleCatalog';

export function singleComplexity(p: SingleTrickParameters): number {
  const base = getBaseTrickById(p.baseTrickId);
  const reserved=getReservedTrickById(p.baseTrickId);
  return (base?.difficulty ?? (reserved ? reserved.category==='core_late'?4:5 : 1)) + (p.stance === 'switch' || p.stance === 'nollie' ? 1 : 0)
    + (p.direction !== 'none' && !base?.boardRotationDeg ? 1 : 0)
    + (p.bodyVarial !== 'none' ? 1 : 0) + (p.landing !== 'normal' ? 1 : 0) + (p.revert !== 'none' ? 1 : 0);
}
export function obstacleComplexity(p: ObstacleComponent): number {
  return Math.max(getObstacleTrickById(p.obstacleTrickId)?.difficulty || 1,
    p.transferTrickId ? getObstacleTrickById(p.transferTrickId)?.difficulty || 1 : 1)
    + (p.entryTrickId !== 'ollie' ? Math.max(1,(getBaseTrickById(p.entryTrickId)?.difficulty || 2)-1) : 0)
    + (p.transferTrickId ? 1 : 0) + (p.exitTrick !== 'clean' ? 1 : 0);
}
export function complexityTier(score: number): ComplexityTier {
  return score <= 2 ? 'beginner' : score <= 4 ? 'intermediate' : 'advanced';
}
export function matchesComplexity(score: number, filter: ComplexityFilter): boolean {
  return filter === 'all' || complexityTier(score) === filter;
}
export function getChallengeComplexity(result: GeneratedTrickResult): ComplexityTier {
  if (result.mode === 'obstacle' && result.obstacleData) return complexityTier(obstacleComplexity(result.obstacleData));
  if (result.mode === 'combo' && result.comboSteps?.length) return complexityTier(Math.max(...result.comboSteps.map(s => singleComplexity(s.parameters)))+1);
  if (result.singleTrick) return complexityTier(singleComplexity(result.singleTrick));
  return result.complexity || 'beginner';
}
