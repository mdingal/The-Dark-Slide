import { describe, it, expect } from 'vitest';
import {
  generateSingleTrick,
  validateTrickParameters,
  detectLockConflict,
  getCompatibleOptionsForLocks,
} from '../domain/rules';
import { ParameterLocks, SingleTrickParameters } from '../domain/types';

describe('Deterministic Rules & Lock Engine', () => {
  it('preserves all locked values unchanged during generation', () => {
    const locks: ParameterLocks = {
      stance: 'fakie',
      baseTrickId: 'kickflip',
      direction: 'backside',
      landing: 'manual',
    };

    // Run multiple generations with the locks
    for (let i = 0; i < 10; i++) {
      const result = generateSingleTrick(locks);
      expect('params' in result).toBe(true);
      if ('params' in result) {
        expect(result.params.stance).toBe('fakie');
        expect(result.params.baseTrickId).toBe('kickflip');
        expect(result.params.direction).toBe('backside');
        expect(result.params.landing).toBe('manual');
      }
    }
  });

  it('produces a clear descriptive error when contradictory locks are provided', () => {
    // Tre Flip only supports direction: 'none' in our catalog
    const contradictoryLocks: ParameterLocks = {
      baseTrickId: 'tre_flip',
      direction: 'frontside',
    };

    const conflict = detectLockConflict(contradictoryLocks);
    expect(conflict).not.toBeNull();
    expect(conflict).toContain('Tre Flip');
    expect(conflict).toContain('frontside');

    const result = generateSingleTrick(contradictoryLocks);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('Tre Flip');
    }
  });

  it('detects body varial conflict on tricks that forbid body varials', () => {
    const locks: ParameterLocks = {
      baseTrickId: 'impossible',
      bodyVarial: 'backside',
    };

    const conflict = detectLockConflict(locks);
    expect(conflict).not.toBeNull();
    expect(conflict).toContain('Impossible');
    expect(conflict).toContain('body varials');
  });

  it('validates catalog combinations accurately', () => {
    // Valid combination
    const validParams: SingleTrickParameters = {
      stance: 'regular',
      direction: 'none',
      baseTrickId: 'ollie',
      bodyVarial: 'none',
      landing: 'normal',
      revert: 'none',
    };
    const validRes = validateTrickParameters(validParams);
    expect(validRes.isValid).toBe(true);
    expect(validRes.errors).toHaveLength(0);

    // Invalid combination outside catalog
    const invalidParams: SingleTrickParameters = {
      stance: 'regular',
      direction: 'none',
      baseTrickId: 'laser_flip_non_catalog_dummy',
      bodyVarial: 'none',
      landing: 'normal',
      revert: 'none',
    };
    const invalidRes = validateTrickParameters(invalidParams);
    expect(invalidRes.isValid).toBe(false);
    expect(invalidRes.errors[0]).toContain('outside the current catalog');
  });

  it('correctly reports backside shuvit in regular stance as valid', () => {
    // Pop Shuvit has backside rotation
    const params: SingleTrickParameters = {
      stance: 'regular',
      direction: 'backside',
      baseTrickId: 'pop_shuvit',
      bodyVarial: 'none',
      landing: 'normal',
      revert: 'none',
    };
    const res = validateTrickParameters(params);
    expect(res.isValid).toBe(true);
  });

  it('respects item exclusions during randomization (e.g. regular and nollie only)', () => {
    // Exclude switch and fakie
    const exclusions = {
      stances: ['switch', 'fakie'] as const,
    };

    for (let i = 0; i < 20; i++) {
      const result = generateSingleTrick({}, exclusions as any);
      expect('params' in result).toBe(true);
      if ('params' in result) {
        expect(['regular', 'nollie']).toContain(result.params.stance);
        expect(['switch', 'fakie']).not.toContain(result.params.stance);
      }
    }
  });

  it('reports a helpful error when all items in a category are excluded', () => {
    const exclusions = {
      stances: ['regular', 'fakie', 'switch', 'nollie'] as const,
    };
    const result = generateSingleTrick({}, exclusions as any);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('All stances are excluded');
    }
  });
});
