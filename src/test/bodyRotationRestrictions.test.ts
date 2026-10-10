import { describe, it, expect } from 'vitest';
import { BASE_TRICKS } from '../domain/catalog';
import { enumerateSingleOptions } from '../domain/challengeGeneration';
import { resolveUnderlyingMovements } from '../domain/movements';
import { validateTrickParameters } from '../domain/rules';
import { baseChallengePool, selectPoolChallenge, expandSelectedVariations } from '../domain/selectedChallengePool';

describe('full body rotation restrictions', () => {
 it('removes Gazelles and excludes full body rotations from all generated parameters', () => {
  expect(BASE_TRICKS.some(t => t.id.startsWith('gazelle'))).toBe(false);
  const options = enumerateSingleOptions({}, {});
  expect(options.length).toBeGreaterThan(0);
  expect(options.every(p => Math.abs(resolveUnderlyingMovements(p).bodyRotationDeg) < 360)).toBe(true);
 });
 it('rejects legacy full-body movement overrides in selected pools and combos', () => {
  const trick = structuredClone(baseChallengePool().find(t => t.singleTrick?.baseTrickId === 'kickflip')!);
  trick.singleTrick!.movements = {...resolveUnderlyingMovements(trick.singleTrick!), bodyRotationDeg:360};
  expect(validateTrickParameters(trick.singleTrick!).isValid).toBe(false);
  expect(selectPoolChallenge([trick], 'single', 'all')).toHaveProperty('error');
  expect(expandSelectedVariations([trick], true, null)).toEqual([]);
  const combo = {...trick, mode:'combo' as const, singleTrick:undefined, comboSteps:[{stepNumber:1,parameters:trick.singleTrick!,resolvedName:'Cab Flip',landingState:{resultStance:'regular' as const,travelDirection:'forward' as const,boardPosition:'normal' as const},breakdown:''}]};
  expect(selectPoolChallenge([combo], 'combo', 'all')).toHaveProperty('error');
 });
 it('keeps 360 board spins and 180 body rotations available', () => {
  for (const id of ['tre_flip','laser_flip','shuvit_360','bigspin','bigger_spin']) {
   const trick = baseChallengePool().find(t => t.singleTrick?.baseTrickId === id)!;
   expect(validateTrickParameters(trick.singleTrick!).isValid).toBe(true);
   expect(selectPoolChallenge([trick], 'single', 'all')).not.toHaveProperty('error');
  }
 });
});
