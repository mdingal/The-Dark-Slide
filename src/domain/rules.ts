import {
  Stance,
  Direction,
  BodyVarial,
  LandingPosition,
  RevertDirection,
  SingleTrickParameters,
  ParameterLocks,
  ParameterExclusions,
  BaseTrickDefinition,
} from './types';
import { BASE_TRICKS, getBaseTrickById } from './catalog';
import { formatSingleTrickName } from './naming';
import {
  resolveUnderlyingMovements,
  recognizeTrickFromMovements,
  formatMovementsSummary,
} from './movements';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateTrickParameters(params: SingleTrickParameters): ValidationResult {
  const errors: string[] = [];
  const base = getBaseTrickById(params.baseTrickId);

  if (!base) {
    return {
      isValid: false,
      errors: [`Base trick '${params.baseTrickId}' is outside the current catalog.`],
    };
  }

  // Stance check
  if (!base.allowedStances.includes(params.stance)) {
    errors.push(
      `${base.name} does not support ${params.stance} stance in the current catalog.`
    );
  }

  // Direction check
  if (!base.applicableDirections.includes(params.direction)) {
    if (params.direction !== 'none') {
      errors.push(
        `${base.name} has intrinsic rotation and does not support independent '${params.direction}' direction.`
      );
    }
  }

  // Body Varial check
  if (params.bodyVarial !== 'none' && !base.allowedModifiers.bodyVarial) {
    errors.push(
      `${base.name} does not support body varials in the current catalog.`
    );
  }

  // Landing position check
  if (params.landing !== 'normal' && !base.allowedModifiers.landingManual) {
    errors.push(
      `${base.name} does not support landing in manual in the current catalog.`
    );
  }

  // Revert check
  if (params.revert !== 'none' && !base.allowedModifiers.revert) {
    errors.push(
      `${base.name} does not support reverts in the current catalog.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export interface CompatibilityMatrix {
  compatibleStances: Stance[];
  compatibleDirections: Direction[];
  compatibleBaseTricks: string[];
  compatibleBodyVarials: BodyVarial[];
  compatibleLandings: LandingPosition[];
  compatibleReverts: RevertDirection[];
}

export function getCompatibleOptionsForLocks(
  locks: ParameterLocks = {},
  exclusions?: ParameterExclusions
): CompatibilityMatrix {
  const allStances: Stance[] = ['regular', 'fakie', 'switch', 'nollie'];
  const allDirections: Direction[] = ['none', 'frontside', 'backside'];
  const allBodyVarials: BodyVarial[] = ['none', 'frontside', 'backside'];
  const allLandings: LandingPosition[] = ['normal', 'manual', 'nose_manual'];
  const allReverts: RevertDirection[] = ['none', 'frontside', 'backside'];

  const compatibleStances: Stance[] = [];
  const compatibleDirections: Direction[] = [];
  const compatibleBaseTricks: string[] = [];
  const compatibleBodyVarials: BodyVarial[] = [];
  const compatibleLandings: LandingPosition[] = [];
  const compatibleReverts: RevertDirection[] = [];

  // Check which base tricks match the locks and exclusions
  for (const trick of BASE_TRICKS) {
    if (locks.baseTrickId && locks.baseTrickId !== trick.id) continue;
    if (!locks.baseTrickId && exclusions?.baseTrickIds?.includes(trick.id)) continue;
    if (locks.stance && !trick.allowedStances.includes(locks.stance)) continue;
    if (locks.direction && !trick.applicableDirections.includes(locks.direction)) continue;
    if (locks.bodyVarial && locks.bodyVarial !== 'none' && !trick.allowedModifiers.bodyVarial) continue;
    if (locks.landing && locks.landing !== 'normal' && !trick.allowedModifiers.landingManual) continue;
    if (locks.revert && locks.revert !== 'none' && !trick.allowedModifiers.revert) continue;

    compatibleBaseTricks.push(trick.id);
  }

  // For stances
  for (const s of allStances) {
    if (locks.stance && locks.stance !== s) continue;
    if (!locks.stance && exclusions?.stances?.includes(s)) continue;
    const hasMatch = compatibleBaseTricks.some((id) => {
      const b = getBaseTrickById(id);
      return b && b.allowedStances.includes(s);
    });
    if (hasMatch) compatibleStances.push(s);
  }

  // For directions
  for (const d of allDirections) {
    if (locks.direction && locks.direction !== d) continue;
    if (!locks.direction && exclusions?.directions?.includes(d)) continue;
    const hasMatch = compatibleBaseTricks.some((id) => {
      const b = getBaseTrickById(id);
      return b && b.applicableDirections.includes(d);
    });
    if (hasMatch) compatibleDirections.push(d);
  }

  // For body varials
  for (const bv of allBodyVarials) {
    if (locks.bodyVarial && locks.bodyVarial !== bv) continue;
    if (!locks.bodyVarial && exclusions?.bodyVarials?.includes(bv)) continue;
    if (bv === 'none') {
      compatibleBodyVarials.push(bv);
    } else {
      const hasMatch = compatibleBaseTricks.some((id) => {
        const b = getBaseTrickById(id);
        return b && b.allowedModifiers.bodyVarial;
      });
      if (hasMatch) compatibleBodyVarials.push(bv);
    }
  }

  // For landings
  for (const l of allLandings) {
    if (locks.landing && locks.landing !== l) continue;
    if (!locks.landing && exclusions?.landings?.includes(l)) continue;
    if (l === 'normal') {
      compatibleLandings.push(l);
    } else {
      const hasMatch = compatibleBaseTricks.some((id) => {
        const b = getBaseTrickById(id);
        return b && b.allowedModifiers.landingManual;
      });
      if (hasMatch) compatibleLandings.push(l);
    }
  }

  // For reverts
  for (const r of allReverts) {
    if (locks.revert && locks.revert !== r) continue;
    if (!locks.revert && exclusions?.reverts?.includes(r)) continue;
    if (r === 'none') {
      compatibleReverts.push(r);
    } else {
      const hasMatch = compatibleBaseTricks.some((id) => {
        const b = getBaseTrickById(id);
        return b && b.allowedModifiers.revert;
      });
      if (hasMatch) compatibleReverts.push(r);
    }
  }

  return {
    compatibleStances,
    compatibleDirections,
    compatibleBaseTricks,
    compatibleBodyVarials,
    compatibleLandings,
    compatibleReverts,
  };
}

export function detectLockConflict(
  locks: ParameterLocks = {},
  exclusions?: ParameterExclusions
): string | null {
  const matrix = getCompatibleOptionsForLocks(locks, exclusions);

  if (matrix.compatibleBaseTricks.length === 0) {
    if (locks.baseTrickId) {
      const b = getBaseTrickById(locks.baseTrickId);
      const name = b ? b.name : locks.baseTrickId;
      if (locks.direction && b && !b.applicableDirections.includes(locks.direction)) {
        return `Conflict: "${name}" only supports direction [${b.applicableDirections.join(', ')}], but Direction is locked to "${locks.direction}".`;
      }
      if (locks.bodyVarial && locks.bodyVarial !== 'none' && b && !b.allowedModifiers.bodyVarial) {
        return `Conflict: "${name}" does not support body varials in the catalog, but Body Varial is locked to "${locks.bodyVarial}".`;
      }
    }
    if (exclusions?.baseTrickIds && exclusions.baseTrickIds.length >= BASE_TRICKS.length) {
      return `Conflict: All base tricks have been excluded from randomization. Please include at least one base trick.`;
    }
    return `No catalog tricks match current locked parameters or exclusions. Please adjust locks or exclusions.`;
  }

  if (matrix.compatibleStances.length === 0) {
    return `Conflict: All stances are excluded or incompatible. Please include at least one stance.`;
  }

  if (matrix.compatibleDirections.length === 0) {
    return `Conflict: All directions are excluded or incompatible. Please include at least one direction.`;
  }

  return null;
}

export function generateSingleTrick(
  locks: ParameterLocks = {},
  exclusions?: ParameterExclusions
): { params: SingleTrickParameters; breakdown: string[] } | { error: string } {
  const conflict = detectLockConflict(locks, exclusions);
  if (conflict) {
    return { error: conflict };
  }

  const matrix = getCompatibleOptionsForLocks(locks, exclusions);

  // Pick Base Trick (respecting lock and exclusions)
  const baseTrickId = locks.baseTrickId || randomChoice(matrix.compatibleBaseTricks);
  const baseDef = getBaseTrickById(baseTrickId)!;

  // Filter options strictly for this base trick and exclusions
  const validStances = baseDef.allowedStances.filter((s) => {
    if (locks.stance) return locks.stance === s;
    if (exclusions?.stances?.includes(s)) return false;
    return true;
  });

  const validDirections = baseDef.applicableDirections.filter((d) => {
    if (locks.direction) return locks.direction === d;
    if (exclusions?.directions?.includes(d)) return false;
    return true;
  });

  const stance = locks.stance || randomChoice(validStances.length > 0 ? validStances : [baseDef.allowedStances[0]]);
  const direction = locks.direction || randomChoice(validDirections.length > 0 ? validDirections : ['none']);

  // Body varial: respect lock or exclusions or use balanced weighting
  let bodyVarial: BodyVarial = 'none';
  if (locks.bodyVarial) {
    bodyVarial = locks.bodyVarial;
  } else {
    const allowedBV = (['none', 'frontside', 'backside'] as BodyVarial[]).filter((bv) => {
      if (exclusions?.bodyVarials?.includes(bv)) return false;
      if (bv !== 'none' && !baseDef.allowedModifiers.bodyVarial) return false;
      return true;
    });

    if (allowedBV.length > 0) {
      if (allowedBV.includes('none') && allowedBV.length > 1) {
        // 80% none, 20% others if available
        if (Math.random() > 0.8) {
          const nones = allowedBV.filter((b) => b !== 'none');
          bodyVarial = randomChoice(nones);
        } else {
          bodyVarial = 'none';
        }
      } else {
        bodyVarial = randomChoice(allowedBV);
      }
    }
  }

  // Landing: respect lock or exclusions
  let landing: LandingPosition = 'normal';
  if (locks.landing) {
    landing = locks.landing;
  } else {
    const allowedLandings = (['normal', 'manual', 'nose_manual'] as LandingPosition[]).filter((l) => {
      if (exclusions?.landings?.includes(l)) return false;
      if (l !== 'normal' && !baseDef.allowedModifiers.landingManual) return false;
      return true;
    });

    if (allowedLandings.length > 0) {
      if (allowedLandings.includes('normal') && allowedLandings.length > 1) {
        if (Math.random() > 0.85) {
          const manuals = allowedLandings.filter((l) => l !== 'normal');
          landing = randomChoice(manuals);
        } else {
          landing = 'normal';
        }
      } else {
        landing = randomChoice(allowedLandings);
      }
    }
  }

  // Revert: respect lock or exclusions
  let revert: RevertDirection = 'none';
  if (locks.revert) {
    revert = locks.revert;
  } else {
    const allowedReverts = (['none', 'frontside', 'backside'] as RevertDirection[]).filter((r) => {
      if (exclusions?.reverts?.includes(r)) return false;
      if (r !== 'none' && !baseDef.allowedModifiers.revert) return false;
      return true;
    });

    if (allowedReverts.length > 0) {
      if (allowedReverts.includes('none') && allowedReverts.length > 1) {
        if (Math.random() > 0.85) {
          const revs = allowedReverts.filter((r) => r !== 'none');
          revert = randomChoice(revs);
        } else {
          revert = 'none';
        }
      } else {
        revert = randomChoice(allowedReverts);
      }
    }
  }

  const params: SingleTrickParameters = {
    stance,
    direction,
    baseTrickId,
    bodyVarial,
    landing,
    revert,
  };

  const movements = resolveUnderlyingMovements(params);
  params.movements = movements;

  const breakdown = generateBreakdown(params, baseDef);

  return { params, breakdown };
}

export function generateBreakdown(
  params: SingleTrickParameters,
  baseDef: BaseTrickDefinition
): string[] {
  if(['feather_flip','unpossible'].includes(params.baseTrickId)) return [baseDef.description, `Stance: ${params.stance}`, `Body varial: ${params.bodyVarial}`, `Landing: ${params.landing}`, `Revert: ${params.revert}`];
  const breakdown: string[] = [];
  const movements = params.movements || resolveUnderlyingMovements(params);
  const recognition = recognizeTrickFromMovements(params.stance, movements);

  breakdown.push(`Stance: ${capitalize(params.stance)}`);
  breakdown.push(`Movements: ${formatMovementsSummary(movements)}`);

  if (recognition.formula) {
    breakdown.push(`Formula: ${recognition.formula} ➔ ${recognition.canonicalName}`);
  }

  if (movements.boardSpinDeg > 0) {
    const dir = movements.boardSpinDir === 'none' ? '' : `${capitalize(movements.boardSpinDir)} `;
    breakdown.push(`Board Spin: ${dir}${movements.boardSpinDeg}°`);
  }

  if (movements.boardFlip !== 'none') {
    const flipName =
      movements.boardFlip === 'vertical_wrap'
        ? 'Vertical Wrap'
        : movements.boardFlip === 'double_kickflip'
        ? 'Double Kickflip'
        : capitalize(movements.boardFlip);
    breakdown.push(`Board Flip: ${flipName}`);
  }

  if (movements.bodyRotationDeg > 0) {
    const dir = movements.bodyRotationDir === 'none' ? '' : `${capitalize(movements.bodyRotationDir)} `;
    breakdown.push(`Body Rotation: ${dir}${movements.bodyRotationDeg}°`);
  }

  if (params.landing !== 'normal') {
    breakdown.push(`Landing: Balances into ${params.landing === 'manual' ? 'Manual (back wheels)' : 'Nose Manual (front wheels)'}`);
  }

  if (params.revert !== 'none' && !recognition.absorbedRevert) {
    breakdown.push(`Revert: Exits with rapid ${capitalize(params.revert)} 180° surface pivot`);
  }

  return breakdown;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
