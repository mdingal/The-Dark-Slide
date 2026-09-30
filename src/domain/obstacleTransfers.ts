import { ObstacleType, ObstacleExclusions, ParameterLocks } from './types';
import { getObstacleTrickById } from './obstacleCatalog';

export const TRANSFER_OPTIONS = [
  { id: '', label: 'None (Single Lock)' },
  { id: '50_50', label: 'to 50-50' },
  { id: '5_0', label: 'to 5-0' },
  { id: 'nosegrind', label: 'to Nosegrind' },
  { id: 'crooked', label: 'to Crooked Grind' },
  { id: 'boardslide', label: 'to Boardslide' },
  { id: 'tailslide', label: 'to Tailslide' },
  { id: 'smith', label: 'to Smith Grind' },
];

export function getTransferChoices(
  obstacle: ObstacleType, firstTrickId: string, approach: 'frontside' | 'backside',
  locks: ParameterLocks, exclusions: ObstacleExclusions
): { id: string; exits: string[] }[] {
  return TRANSFER_OPTIONS.flatMap(({ id }) => {
    if (exclusions.transferTrickIds?.includes(id) ||
        (locks.transferTrickId !== undefined && locks.transferTrickId !== id)) return [];
    if (id && id === firstTrickId) return [];
    const finalTrick = getObstacleTrickById(id || firstTrickId);
    if (!finalTrick || !finalTrick.supportedObstacles.includes(obstacle) ||
        !finalTrick.applicableApproaches.includes(approach)) return [];
    const exits = finalTrick.allowedExitTricks.filter(exit =>
      !exclusions.exitTricks?.includes(exit) &&
      (locks.exitTrick === undefined || locks.exitTrick === exit));
    return exits.length ? [{ id, exits }] : [];
  });
}
