import {
  Stance,
  SingleTrickParameters,
  ComboStep,
  ParameterLocks,
  ParameterExclusions,
  LandingPosition,
} from './types';
import { BASE_TRICKS, getBaseTrickById } from './catalog';
import { formatSingleTrickName } from './naming';
import { generateSingleTrick, getCompatibleOptionsForLocks, detectLockConflict } from './rules';
import { resolveUnderlyingMovements } from './movements';

// Calculate rider's resulting stance after a trick
export function calculateResultingStance(params: SingleTrickParameters): Stance {
  let stance = params.stance;

  // 1. Board & body 180 (FS 180 or BS 180)
  const is180Direction = params.direction === 'frontside' || params.direction === 'backside';
  if (is180Direction) {
    stance = invertStance180(stance);
  }

  // 2. Body varial (body spins 180, board straight)
  if (params.bodyVarial !== 'none') {
    stance = switchStanceBody(stance);
  }

  // 3. Revert (180 surface pivot)
  if (params.revert !== 'none') {
    stance = invertStance180(stance);
  }

  return stance;
}

function invertStance180(s: Stance): Stance {
  switch (s) {
    case 'regular':
      return 'fakie';
    case 'fakie':
      return 'regular';
    case 'switch':
      return 'nollie';
    case 'nollie':
      return 'switch';
  }
}

function switchStanceBody(s: Stance): Stance {
  switch (s) {
    case 'regular':
      return 'switch';
    case 'switch':
      return 'regular';
    case 'fakie':
      return 'nollie';
    case 'nollie':
      return 'fakie';
  }
}

export function generateTwoTrickCombo(
  step1Locks: ParameterLocks = {},
  step2Locks: ParameterLocks = {},
  step1Exclusions?: ParameterExclusions,
  step2Exclusions?: ParameterExclusions
): { steps: ComboStep[] } | { error: string } {
  // Step 1 generation
  const res1 = generateSingleTrick(step1Locks, step1Exclusions);
  if ('error' in res1) {
    return { error: `Step 1 conflict: ${res1.error}` };
  }

  const params1 = res1.params;
  const resultingStance = calculateResultingStance(params1);
  const landingPos = params1.landing;

  const resolvedName1 = formatSingleTrickName(params1);
  const movements1 = params1.movements || resolveUnderlyingMovements(params1);
  params1.movements = movements1;

  const step1: ComboStep = {
    stepNumber: 1,
    parameters: params1,
    resolvedName: resolvedName1,
    landingState: {
      resultStance: resultingStance,
      travelDirection: resultingStance === 'fakie' || resultingStance === 'nollie' ? 'backward' : 'forward',
      boardPosition: landingPos,
    },
    breakdown: res1.breakdown.join(' · '),
    movements: movements1,
  };

  // Step 2 generation
  // The stance of Step 2 MUST be the resulting stance of Step 1, NOT independently randomized
  if (step2Locks.stance && step2Locks.stance !== resultingStance) {
    return {
      error: `Combo transition conflict: Step 1 lands in ${resultingStance} stance, but Step 2 is locked to ${step2Locks.stance}.`,
    };
  }

  const effectiveStep2Locks: ParameterLocks = {
    ...step2Locks,
    stance: resultingStance,
  };

  // If Step 1 landed in manual or nose_manual, restrict Step 2 to cataloged tricks compatible with manuals
  if (landingPos === 'manual') {
    const manualExitTricks = ['ollie', 'kickflip', 'heelflip', 'pop_shuvit'].filter(
      (id) => !step2Exclusions?.baseTrickIds?.includes(id)
    );
    if (manualExitTricks.length === 0) {
      return {
        error: `Combo transition conflict: All manual exit tricks are excluded in Step 2.`,
      };
    }
    if (effectiveStep2Locks.baseTrickId && !manualExitTricks.includes(effectiveStep2Locks.baseTrickId)) {
      return {
        error: `Combo transition conflict: Step 1 lands in Manual, which only supports popping out with [${manualExitTricks.join(', ')}], but Step 2 requested ${effectiveStep2Locks.baseTrickId}.`,
      };
    }
    if (!effectiveStep2Locks.baseTrickId) {
      effectiveStep2Locks.baseTrickId = manualExitTricks[Math.floor(Math.random() * manualExitTricks.length)];
    }
  } else if (landingPos === 'nose_manual') {
    const noseManualExitTricks = ['ollie', 'kickflip', 'heelflip', 'frontside_pop_shuvit'].filter(
      (id) => !step2Exclusions?.baseTrickIds?.includes(id)
    );
    if (noseManualExitTricks.length === 0) {
      return {
        error: `Combo transition conflict: All nose manual exit tricks are excluded in Step 2.`,
      };
    }
    if (effectiveStep2Locks.baseTrickId && !noseManualExitTricks.includes(effectiveStep2Locks.baseTrickId)) {
      return {
        error: `Combo transition conflict: Step 1 lands in Nose Manual, which only supports [${noseManualExitTricks.join(', ')}], but Step 2 requested ${effectiveStep2Locks.baseTrickId}.`,
      };
    }
    if (!effectiveStep2Locks.baseTrickId) {
      effectiveStep2Locks.baseTrickId = noseManualExitTricks[Math.floor(Math.random() * noseManualExitTricks.length)];
    }
  }

  const res2 = generateSingleTrick(effectiveStep2Locks, step2Exclusions);
  if ('error' in res2) {
    return { error: `Step 2 conflict: ${res2.error}` };
  }

  const params2 = res2.params;
  const resultingStance2 = calculateResultingStance(params2);
  let resolvedName2 = formatSingleTrickName(params2);
  const movements2 = params2.movements || resolveUnderlyingMovements(params2);
  params2.movements = movements2;

  // If coming from manual, append "Out" indicator if appropriate
  if (landingPos === 'manual' || landingPos === 'nose_manual') {
    resolvedName2 = `${resolvedName2} out`;
  }

  const step2: ComboStep = {
    stepNumber: 2,
    parameters: params2,
    resolvedName: resolvedName2,
    landingState: {
      resultStance: resultingStance2,
      travelDirection: resultingStance2 === 'fakie' || resultingStance2 === 'nollie' ? 'backward' : 'forward',
      boardPosition: params2.landing,
    },
    breakdown: res2.breakdown.join(' · '),
    movements: movements2,
  };

  return { steps: [step1, step2] };
}
