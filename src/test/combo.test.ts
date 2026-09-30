import { describe, it, expect } from 'vitest';
import { generateTwoTrickCombo, calculateResultingStance } from '../domain/comboEngine';
import { ParameterLocks, SingleTrickParameters } from '../domain/types';

describe('Combo Transition Engine', () => {
  it('correctly calculates resulting stance after rotations and body varials', () => {
    // 1. Regular + BS 180 -> Fakie
    const bs180Ollie: SingleTrickParameters = {
      stance: 'regular',
      direction: 'backside',
      baseTrickId: 'ollie',
      bodyVarial: 'none',
      landing: 'normal',
      revert: 'none',
    };
    expect(calculateResultingStance(bs180Ollie)).toBe('fakie');

    // 2. Fakie + BS 180 (Half Cab) -> Regular
    const halfCab: SingleTrickParameters = {
      stance: 'fakie',
      direction: 'backside',
      baseTrickId: 'ollie',
      bodyVarial: 'none',
      landing: 'normal',
      revert: 'none',
    };
    expect(calculateResultingStance(halfCab)).toBe('regular');

    // 3. Regular + Body Varial (Sex Change) -> Switch
    const sexChange: SingleTrickParameters = {
      stance: 'regular',
      direction: 'none',
      baseTrickId: 'kickflip',
      bodyVarial: 'backside',
      landing: 'normal',
      revert: 'none',
    };
    expect(calculateResultingStance(sexChange)).toBe('switch');

    // 4. Regular + Revert -> Fakie
    const ollieRevert: SingleTrickParameters = {
      stance: 'regular',
      direction: 'none',
      baseTrickId: 'ollie',
      bodyVarial: 'none',
      landing: 'normal',
      revert: 'frontside',
    };
    expect(calculateResultingStance(ollieRevert)).toBe('fakie');
  });

  it('generates two-trick combos with deterministically linked stances', () => {
    const step1Locks: ParameterLocks = {
      stance: 'regular',
      direction: 'frontside',
      baseTrickId: 'ollie',
      bodyVarial: 'none',
      revert: 'none',
    };

    const res = generateTwoTrickCombo(step1Locks, {});
    expect('steps' in res).toBe(true);
    if ('steps' in res) {
      expect(res.steps).toHaveLength(2);
      // Regular + FS 180 lands in Fakie
      expect(res.steps[0].landingState.resultStance).toBe('fakie');
      // Step 2 MUST have stance 'fakie'
      expect(res.steps[1].parameters.stance).toBe('fakie');
      // In all cases, Step 2 stance equals Step 1 resulting stance
      expect(res.steps[1].parameters.stance).toBe(res.steps[0].landingState.resultStance);
    }
  });

  it('rejects an independent Step 2 stance lock that contradicts Step 1 landing mechanics', () => {
    const step1Locks: ParameterLocks = {
      stance: 'regular',
      direction: 'frontside',
      baseTrickId: 'ollie',
      bodyVarial: 'none',
      revert: 'none',
    };
    // Contradictory: Step 1 lands in fakie, but step 2 is locked to nollie
    const step2Locks: ParameterLocks = {
      stance: 'nollie',
    };

    const res = generateTwoTrickCombo(step1Locks, step2Locks);
    expect('error' in res).toBe(true);
    if ('error' in res) {
      expect(res.error).toContain('Combo transition conflict');
      expect(res.error).toContain('fakie');
    }
  });

  it('restricts Step 2 to manual-compatible exits when Step 1 lands in manual', () => {
    const step1Locks: ParameterLocks = {
      stance: 'regular',
      baseTrickId: 'kickflip',
      landing: 'manual',
    };

    const res = generateTwoTrickCombo(step1Locks, {});
    expect('steps' in res).toBe(true);
    if ('steps' in res) {
      expect(res.steps[0].parameters.landing).toBe('manual');
      // Step 2 must be one of manual exit tricks
      const manualExitTricks = ['ollie', 'kickflip', 'heelflip', 'pop_shuvit'];
      expect(manualExitTricks).toContain(res.steps[1].parameters.baseTrickId);
    }
  });
});
