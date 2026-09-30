import { SingleTrickParameters, ComboStep, ObstacleComponent } from './types';
import { getBaseTrickById } from './catalog';
import { getObstacleTrickById } from './obstacleCatalog';
import {
  resolveUnderlyingMovements,
  recognizeTrickFromMovements,
  formatMovementsSummary,
} from './movements';
import {
  formatObstacleTrickCanonicalName,
  resolveObstacleMechanics,
  formatObstacleMechanicsSummary,
} from './obstacleMechanics';

export function formatSingleTrickName(params: SingleTrickParameters): string {
  const movements = resolveUnderlyingMovements(params);
  const recognition = recognizeTrickFromMovements(params.stance, movements);

  let result = recognition.canonicalName;
  const parts: string[] = [];

  // Landing position modifier
  if (params.landing === 'manual') {
    parts.push('to Manual');
  } else if (params.landing === 'nose_manual') {
    parts.push('to Nose Manual');
  }

  // Revert modifier (only if not already absorbed by trick name like Ghetto Bird)
  if (!recognition.absorbedRevert && params.revert !== 'none') {
    if (params.revert === 'frontside') {
      parts.push('FS Revert');
    } else if (params.revert === 'backside') {
      parts.push('BS Revert');
    }
  }

  if (parts.length > 0) {
    result = `${result} ${parts.join(' ')}`;
  }

  return result.replace(/\s+/g, ' ').trim();
}

export function formatComboName(steps: ComboStep[]): string {
  if (steps.length === 0) return 'Empty Combo';
  return steps.map((s) => s.resolvedName).join(' ➔ ');
}

export function formatObstacleTrickName(data: ObstacleComponent): string {
  return formatObstacleTrickCanonicalName(data);
}

export function explainObstacleTrick(data: ObstacleComponent): string[] {
  const breakdown: string[] = [];
  const mechanics = resolveObstacleMechanics(data);
  const def = getObstacleTrickById(data.obstacleTrickId);

  breakdown.push(`Obstacle: ${capitalize(data.obstacleType)}`);
  breakdown.push(`Approach: ${capitalize(data.approach)} (${data.approach === 'frontside' ? 'Front/Chest Facing' : 'Back Facing'})`);
  
  if (data.entryTrickId && data.entryTrickId !== 'ollie') {
    const entryDef = getBaseTrickById(data.entryTrickId);
    breakdown.push(`Entry: ${entryDef ? entryDef.name : capitalize(data.entryTrickId.replace('_', ' '))} In`);
  }

  breakdown.push(`Mechanics: ${formatObstacleMechanicsSummary(mechanics)}`);

  if (def) {
    breakdown.push(`Lock Position: ${def.name} (${def.description})`);
  }

  if (data.transferTrickId) {
    const transferDef = getObstacleTrickById(data.transferTrickId);
    breakdown.push(`Transfer: to ${capitalize(data.transferApproach || data.approach)} ${transferDef?.name || data.transferTrickId}`);
  }

  if (data.exitTrick && data.exitTrick !== 'clean') {
    breakdown.push(`Exit: ${capitalize(data.exitTrick.replace('_', ' '))}`);
  }

  return breakdown;
}

export function explainSingleTrick(params: SingleTrickParameters): string[] {
  const breakdown: string[] = [];
  const movements = resolveUnderlyingMovements(params);
  const recognition = recognizeTrickFromMovements(params.stance, movements);

  breakdown.push(`Stance: ${capitalize(params.stance)}`);

  // Underlying movements breakdown
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
    breakdown.push(`Landing: ${params.landing === 'manual' ? 'Manual' : 'Nose Manual'}`);
  }

  if (params.revert !== 'none' && !recognition.absorbedRevert) {
    breakdown.push(`Exit: ${params.revert === 'frontside' ? 'FS' : 'BS'} Revert`);
  }

  return breakdown;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
