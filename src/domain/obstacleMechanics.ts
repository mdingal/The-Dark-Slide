import {
  ObstacleComponent,
  ObstacleMechanics,
  ContactPoint,
  BoardAngle,
  TruckCrossing,
  EntryRotation,
} from './types';
import { getObstacleTrickById } from './obstacleCatalog';
import { getBaseTrickById } from './catalog';

/**
 * Resolves the physical mechanics of an obstacle trick:
 * - Approach side (frontside = facing obstacle, backside = back to obstacle)
 * - Entry rotation (none, 180, fs_180, bs_180, alley_oop_180)
 * - Which truck crosses the obstacle (none, front_truck, rear_truck, both_trucks)
 * - Contact point (both_trucks, rear_truck, front_truck, center_deck, nose_deck, tail_deck, tail_blunt, nose_blunt, griptape, primo, double_contact)
 * - Board angle (parallel, crooked_near, crooked_far, dipped_near, dipped_far, raised_near, raised_far, perpendicular)
 */
export function resolveObstacleMechanics(data: ObstacleComponent): ObstacleMechanics {
  if (data.mechanics) {
    return { ...data.mechanics };
  }

  const def = getObstacleTrickById(data.obstacleTrickId);
  const approach = data.approach;

  let contactPoint: ContactPoint = def?.contactPoint || 'both_trucks';
  let boardAngle: BoardAngle = def?.boardAngle || 'parallel';
  let whichTruckCrosses: TruckCrossing = def?.whichTruckCrosses || 'none';
  let entryRotation: EntryRotation = def?.entryRotation || 'none';
  let isSpecialRotationalEntry = false;
  let specialEntryName: string | undefined = undefined;

  // Check special rotational entries
  if (data.obstacleTrickId === 'bennett' || (approach === 'frontside' && entryRotation === 'bs_180' && def?.id === 'smith')) {
    isSpecialRotationalEntry = true;
    specialEntryName = 'Bennett Grind';
  } else if (data.obstacleTrickId === 'barley' || (approach === 'backside' && entryRotation === 'fs_180' && def?.id === 'smith')) {
    isSpecialRotationalEntry = true;
    specialEntryName = 'Barley Grind';
  } else if (data.obstacleTrickId === 'hurricane' || (entryRotation === '180' && def?.id === 'feeble')) {
    isSpecialRotationalEntry = true;
    specialEntryName = 'Hurricane Grind';
  } else if (data.obstacleTrickId === 'sugarcane' || (entryRotation === 'alley_oop_180' && def?.id === 'smith')) {
    isSpecialRotationalEntry = true;
    specialEntryName = 'Sugarcane Grind';
  }

  return {
    approach,
    entryRotation,
    whichTruckCrosses,
    contactPoint,
    boardAngle,
    isSpecialRotationalEntry,
    specialEntryName,
  };
}

/**
 * Recognizes the obstacle trick canonical name based on entry, approach,
 * contact point, board angle, truck crossing, transfers, and exits.
 */
export function formatObstacleTrickCanonicalName(data: ObstacleComponent): string {
  const def = getObstacleTrickById(data.obstacleTrickId);
  const mechanics = resolveObstacleMechanics(data);

  // 1. Entry trick prefix
  let entryPrefix = '';
  if (data.entryTrickId && data.entryTrickId !== 'ollie') {
    const entryDef = getBaseTrickById(data.entryTrickId);
    entryPrefix = entryDef ? entryDef.name : capitalize(data.entryTrickId.replace('_', ' '));
  }

  // 2. Core Trick & Approach
  let coreName = '';
  if (mechanics.isSpecialRotationalEntry && mechanics.specialEntryName) {
    // Bennett, Barley, Hurricane, Sugarcane
    coreName = mechanics.specialEntryName;
  } else {
    const approachText = data.approach === 'frontside' ? 'Frontside' : 'Backside';
    const baseName = def ? def.name : data.obstacleTrickId;
    coreName = `${approachText} ${baseName}`;
  }

  // Combine Entry + Core
  let result = entryPrefix ? `${entryPrefix} ${coreName}` : coreName;

  // 3. Transfer (e.g., "to Backside 50-50")
  if (data.transferTrickId) {
    const transferDef = getObstacleTrickById(data.transferTrickId);
    const transferApproachText = (data.transferApproach || data.approach) === 'frontside' ? 'Frontside' : 'Backside';
    const transferName = transferDef ? transferDef.name : data.transferTrickId;
    result = `${result} to ${transferApproachText} ${transferName}`;
  }

  // 4. Exit trick
  let exitString = '';
  switch (data.exitTrick) {
    case 'revert_fs':
      exitString = 'to FS Revert';
      break;
    case 'revert_bs':
      exitString = 'to BS Revert';
      break;
    case 'kickflip_out':
      exitString = 'Kickflip Out';
      break;
    case 'nollie_flip_out':
      exitString = 'Nollie Flip Out';
      break;
    case 'shuvit_out':
      exitString = 'Shuvit Out';
      break;
    case 'to_fakie':
      exitString = 'to Fakie';
      break;
    case 'ollie_out':
      exitString = 'Ollie Out';
      break;
    case 'nollie_out':
      exitString = 'Nollie Out';
      break;
    default:
      exitString = '';
      break;
  }

  if (exitString) {
    result = `${result} ${exitString}`;
  }

  return result.replace(/\bfrontside\b/gi, 'FS').replace(/\bbackside\b/gi, 'BS').replace(/\s+/g, ' ').trim();
}

/**
 * Returns human-readable summary of the obstacle mechanics.
 */
export function formatObstacleMechanicsSummary(mechanics: ObstacleMechanics): string {
  const parts: string[] = [];

  // Approach
  parts.push(mechanics.approach === 'frontside' ? 'FS Approach (Chest Facing)' : 'BS Approach (Back Facing)');

  // Contact
  switch (mechanics.contactPoint) {
    case 'both_trucks':
      parts.push('Both Trucks Contact');
      break;
    case 'rear_truck':
      parts.push('Rear Truck Contact');
      break;
    case 'front_truck':
      parts.push('Front Truck Contact');
      break;
    case 'center_deck':
      parts.push('Center Deck Contact');
      break;
    case 'nose_deck':
      parts.push('Nose Slide Contact');
      break;
    case 'tail_deck':
      parts.push('Tail Slide Contact');
      break;
    case 'tail_blunt':
      parts.push('Tail Blunt Edge Lock');
      break;
    case 'nose_blunt':
      parts.push('Nose Blunt Edge Lock');
      break;
    case 'griptape':
      parts.push('Inverted Griptape Slide');
      break;
    case 'primo':
      parts.push('Primo Rail Edge');
      break;
    case 'double_contact':
      parts.push('Dual Obstacle Bridge (Nose & Tail)');
      break;
  }

  // Board Angle
  switch (mechanics.boardAngle) {
    case 'parallel':
      parts.push('Parallel to Obstacle');
      break;
    case 'crooked_near':
      parts.push('Tail Near Side (Crooked Angle)');
      break;
    case 'crooked_far':
      parts.push('Tail Far Side (Overcrook Angle)');
      break;
    case 'dipped_near':
      parts.push('Free Truck Dipped (Near Side)');
      break;
    case 'dipped_far':
      parts.push('Free Truck Extended / Dipped (Far Side)');
      break;
    case 'raised_near':
      parts.push('Free Truck Raised (Near Side)');
      break;
    case 'raised_far':
      parts.push('Free Truck Raised (Far Side)');
      break;
    case 'perpendicular':
      parts.push('Perpendicular Across Lip');
      break;
  }

  // Truck Crossing
  if (mechanics.whichTruckCrosses === 'front_truck') {
    parts.push('Front Truck Crosses');
  } else if (mechanics.whichTruckCrosses === 'rear_truck') {
    parts.push('Rear Truck Crosses');
  } else if (mechanics.whichTruckCrosses === 'both_trucks') {
    parts.push('Both Trucks Cross Over');
  }

  // Entry Rotation
  if (mechanics.entryRotation === '180') {
    parts.push('180° Rotational Entry');
  } else if (mechanics.entryRotation === 'alley_oop_180') {
    parts.push('Alley-Oop 180° Entry');
  } else if (mechanics.entryRotation === 'bs_180') {
    parts.push('BS 180° Entry');
  } else if (mechanics.entryRotation === 'fs_180') {
    parts.push('FS 180° Entry');
  }

  return parts.join(' · ');
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
