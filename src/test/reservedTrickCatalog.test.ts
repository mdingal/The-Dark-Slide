import { describe, it, expect } from 'vitest';
import { BASE_TRICKS, RESERVED_TRICKS, getBaseTrickById, getReservedTrickById } from '../domain/catalog';
import { enumerateSingleOptions } from '../domain/challengeGeneration';
import { baseChallengePool, selectPoolChallenge } from '../domain/selectedChallengePool';
import { referenceChallenge } from '../domain/referenceChallenge';
import { TRICK_TREE_CATALOG } from '../domain/trickTreeCatalog';

describe('reserved trick records', () => {
 it('stores 18 records with a single late kickflip covering both techniques', () => {
  expect(RESERVED_TRICKS).toHaveLength(18);
  expect(new Set(RESERVED_TRICKS.map(t => t.id)).size).toBe(18);
  expect(RESERVED_TRICKS.filter(t => t.category === 'core_late')).toHaveLength(4);
  expect(RESERVED_TRICKS.filter(t => t.category === 'late_combination')).toHaveLength(10);
  expect(RESERVED_TRICKS.filter(t => t.category === 'specialty')).toHaveLength(4);
  expect(getReservedTrickById('late_kickflip')!.description).toContain('back-finger');
  expect(getReservedTrickById('late_kickflip')!.description).toContain('front-finger');
  expect(getReservedTrickById('late_kickflip_back_finger')).toBe(getReservedTrickById('late_kickflip'));
  expect(getReservedTrickById('late_kickflip_front_finger')).toBe(getReservedTrickById('late_kickflip'));
  expect(RESERVED_TRICKS.every(t=>!(/shove-it|\(360 flip\)|\((front|back)-finger\)/i.test(t.name)))).toBe(true);
  expect(RESERVED_TRICKS.every(t => t.status === 'reserved' && t.generatorEnabled === false)).toBe(true);
 });
 it('keeps reserved tricks outside playable catalogs, pools, trees and guide practice', () => {
  const ids = new Set(RESERVED_TRICKS.map(t => t.id));
  expect(BASE_TRICKS.every(t => !ids.has(t.id))).toBe(true);
  expect(enumerateSingleOptions({}, {}).every(t => !ids.has(t.baseTrickId))).toBe(true);
  expect(baseChallengePool().every(t => !ids.has(t.singleTrick!.baseTrickId))).toBe(true);
  expect(TRICK_TREE_CATALOG.every(t => !ids.has(t.id))).toBe(true);
  for (const trick of RESERVED_TRICKS) {
   expect(getBaseTrickById(trick.id)).toBeUndefined();
   expect(() => referenceChallenge(trick.id)).toThrow();
   const entry = structuredClone(baseChallengePool()[0]);
   entry.singleTrick!.baseTrickId = trick.id;
   expect(selectPoolChallenge([entry], 'single', 'all')).toHaveProperty('error');
  }
 });
});
