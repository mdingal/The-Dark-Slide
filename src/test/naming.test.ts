import { describe, it, expect } from 'vitest';
import { formatSingleTrickName, explainSingleTrick } from '../domain/naming';
import {
  resolveUnderlyingMovements,
  recognizeTrickFromMovements,
  formatMovementsSummary,
} from '../domain/movements';
import { SingleTrickParameters } from '../domain/types';

describe('Evolved Trick Naming & Underlying Movements Engine', () => {
  describe('Category 1: Flip + Board Spin (Simultaneous Combinations)', () => {
    it('recognizes Kickflip + BS 180 shuvit as Varial Kickflip', () => {
      const params: SingleTrickParameters = {
        stance: 'regular',
        direction: 'none',
        baseTrickId: 'varial_kickflip',
        bodyVarial: 'none',
        landing: 'normal',
        revert: 'none',
      };
      expect(formatSingleTrickName(params)).toBe('Varial Kickflip');
      const movements = resolveUnderlyingMovements(params);
      expect(movements.boardSpinDeg).toBe(180);
      expect(movements.boardSpinDir).toBe('backside');
      expect(movements.boardFlip).toBe('kickflip');
      expect(movements.bodyRotationDeg).toBe(0);
    });

    it('recognizes Kickflip + FS 180 shuvit as Hardflip', () => {
      const params: SingleTrickParameters = {
        stance: 'regular',
        direction: 'none',
        baseTrickId: 'hardflip',
        bodyVarial: 'none',
        landing: 'normal',
        revert: 'none',
      };
      expect(formatSingleTrickName(params)).toBe('Hardflip');
      const movements = resolveUnderlyingMovements(params);
      expect(movements.boardSpinDeg).toBe(180);
      expect(movements.boardSpinDir).toBe('frontside');
      expect(movements.boardFlip).toBe('kickflip');
      expect(movements.bodyRotationDeg).toBe(0);
    });

    it('recognizes Heelflip + FS 180 shuvit as Varial Heelflip', () => {
      const params: SingleTrickParameters = {
        stance: 'regular',
        direction: 'none',
        baseTrickId: 'varial_heelflip',
        bodyVarial: 'none',
        landing: 'normal',
        revert: 'none',
      };
      expect(formatSingleTrickName(params)).toBe('Varial Heelflip');
      const movements = resolveUnderlyingMovements(params);
      expect(movements.boardSpinDeg).toBe(180);
      expect(movements.boardSpinDir).toBe('frontside');
      expect(movements.boardFlip).toBe('heelflip');
    });

    it('recognizes Heelflip + BS 180 shuvit as Inward Heelflip', () => {
      const params: SingleTrickParameters = {
        stance: 'regular',
        direction: 'none',
        baseTrickId: 'inward_heelflip',
        bodyVarial: 'none',
        landing: 'normal',
        revert: 'none',
      };
      expect(formatSingleTrickName(params)).toBe('Inward Heelflip');
      const movements = resolveUnderlyingMovements(params);
      expect(movements.boardSpinDeg).toBe(180);
      expect(movements.boardSpinDir).toBe('backside');
      expect(movements.boardFlip).toBe('heelflip');
    });

    it('recognizes Kickflip + BS 360 shuvit as Tre Flip (360 Flip)', () => {
      const params: SingleTrickParameters = {
        stance: 'regular',
        direction: 'none',
        baseTrickId: 'tre_flip',
        bodyVarial: 'none',
        landing: 'normal',
        revert: 'none',
      };
      expect(formatSingleTrickName(params)).toBe('Tre Flip');
      const movements = resolveUnderlyingMovements(params);
      expect(movements.boardSpinDeg).toBe(360);
      expect(movements.boardSpinDir).toBe('backside');
      expect(movements.boardFlip).toBe('kickflip');
    });

    it('recognizes Heelflip + FS 360 shuvit as Laser Flip', () => {
      const params: SingleTrickParameters = {
        stance: 'regular',
        direction: 'none',
        baseTrickId: 'laser_flip',
        bodyVarial: 'none',
        landing: 'normal',
        revert: 'none',
      };
      expect(formatSingleTrickName(params)).toBe('Laser Flip');
      const movements = resolveUnderlyingMovements(params);
      expect(movements.boardSpinDeg).toBe(360);
      expect(movements.boardSpinDir).toBe('frontside');
      expect(movements.boardFlip).toBe('heelflip');
    });

    it('recognizes Double Kickflip + BS 180 shuvit as Nightmare Flip', () => {
      const params: SingleTrickParameters = {
        stance: 'regular',
        direction: 'none',
        baseTrickId: 'nightmare_flip',
        bodyVarial: 'none',
        landing: 'normal',
        revert: 'none',
      };
      expect(formatSingleTrickName(params)).toBe('Nightmare Flip');
      const movements = resolveUnderlyingMovements(params);
      expect(movements.boardSpinDeg).toBe(180);
      expect(movements.boardSpinDir).toBe('backside');
      expect(movements.boardFlip).toBe('double_kickflip');
    });
  });

  describe('Category 2: Flip + Rider and Board Rotating Together', () => {
    it('recognizes Kickflip + FS 180 ollie as Frontside Flip (not Frontside 180 Kickflip)', () => {
      const params: SingleTrickParameters = {
        stance: 'regular',
        direction: 'frontside',
        baseTrickId: 'kickflip',
        bodyVarial: 'none',
        landing: 'normal',
        revert: 'none',
      };
      expect(formatSingleTrickName(params)).toBe('Frontside Flip');
      const movements = resolveUnderlyingMovements(params);
      expect(movements.boardSpinDeg).toBe(180);
      expect(movements.boardSpinDir).toBe('frontside');
      expect(movements.bodyRotationDeg).toBe(180);
      expect(movements.bodyRotationDir).toBe('frontside');
      expect(movements.boardFlip).toBe('kickflip');
    });

    it('recognizes Kickflip + BS 180 ollie as Backside Flip', () => {
      const params: SingleTrickParameters = {
        stance: 'regular',
        direction: 'backside',
        baseTrickId: 'kickflip',
        bodyVarial: 'none',
        landing: 'normal',
        revert: 'none',
      };
      expect(formatSingleTrickName(params)).toBe('Backside Flip');
    });

    it('recognizes Heelflip + FS 180 ollie as Frontside Heelflip', () => {
      const params: SingleTrickParameters = {
        stance: 'regular',
        direction: 'frontside',
        baseTrickId: 'heelflip',
        bodyVarial: 'none',
        landing: 'normal',
        revert: 'none',
      };
      expect(formatSingleTrickName(params)).toBe('Frontside Heelflip');
    });

    it('recognizes Heelflip + BS 180 ollie as Backside Heelflip', () => {
      const params: SingleTrickParameters = {
        stance: 'regular',
        direction: 'backside',
        baseTrickId: 'heelflip',
        bodyVarial: 'none',
        landing: 'normal',
        revert: 'none',
      };
      expect(formatSingleTrickName(params)).toBe('Backside Heelflip');
    });

    it('recognizes Kickflip + 180 body varial (no board shuvit) as Kickflip Body Varial / Sex Change', () => {
      const params: SingleTrickParameters = {
        stance: 'regular',
        direction: 'none',
        baseTrickId: 'kickflip',
        bodyVarial: 'backside',
        landing: 'normal',
        revert: 'none',
      };
      const name = formatSingleTrickName(params);
      expect(name).toBe('Kickflip Body Varial');
      const movements = resolveUnderlyingMovements(params);
      expect(movements.boardSpinDeg).toBe(0);
      expect(movements.bodyRotationDeg).toBe(180);
      expect(movements.bodyRotationDir).toBe('backside');
      expect(movements.isBodyVarialOnly).toBe(true);
    });
  });

  describe('Category 3: Bigspin Family (Board and Body in Same Direction)', () => {
    it('recognizes 360 shuvit + 180° body rotation as Bigspin', () => {
      const params: SingleTrickParameters = {
        stance: 'regular',
        direction: 'backside',
        baseTrickId: 'shuvit_360',
        bodyVarial: 'none',
        landing: 'normal',
        revert: 'none',
      };
      expect(formatSingleTrickName(params)).toBe('Bigspin');
    });

    it('recognizes BS 360 board spin + kickflip + BS 180 body rotation as Bigflip', () => {
      // Stored underlying movements explicitly
      const movements = {
        boardSpinDeg: 360,
        boardSpinDir: 'backside' as const,
        boardFlip: 'kickflip' as const,
        bodyRotationDeg: 180,
        bodyRotationDir: 'backside' as const,
      };
      const recognition = recognizeTrickFromMovements('regular', movements);
      expect(recognition.canonicalName).toBe('Bigflip');
      expect(recognition.formula).toContain('BS 360° Shuvit + Kickflip + BS 180° Body');
    });

    it('recognizes tre_flip with backside rotation as Bigflip', () => {
      const params: SingleTrickParameters = {
        stance: 'regular',
        direction: 'backside',
        baseTrickId: 'tre_flip',
        bodyVarial: 'none',
        landing: 'normal',
        revert: 'none',
      };
      expect(formatSingleTrickName(params)).toBe('Bigflip');
    });

    it('recognizes FS 360 shuvit + heelflip + FS 180° body rotation as Bigheel', () => {
      const movements = {
        boardSpinDeg: 360,
        boardSpinDir: 'frontside' as const,
        boardFlip: 'heelflip' as const,
        bodyRotationDeg: 180,
        bodyRotationDir: 'frontside' as const,
      };
      const recognition = recognizeTrickFromMovements('regular', movements);
      expect(recognition.canonicalName).toBe('Bigheel');
    });

    it('recognizes BS 360 shuvit + heelflip + BS 180° body rotation as Bigspin Inward Heelflip', () => {
      const movements = {
        boardSpinDeg: 360,
        boardSpinDir: 'backside' as const,
        boardFlip: 'heelflip' as const,
        bodyRotationDeg: 180,
        bodyRotationDir: 'backside' as const,
      };
      const recognition = recognizeTrickFromMovements('regular', movements);
      expect(recognition.canonicalName).toBe('Bigspin Inward Heelflip');
    });

    it('recognizes BS 540 shuvit + kickflip + BS 180° as Bigger Flip', () => {
      const movements = {
        boardSpinDeg: 540,
        boardSpinDir: 'backside' as const,
        boardFlip: 'kickflip' as const,
        bodyRotationDeg: 180,
        bodyRotationDir: 'backside' as const,
      };
      const recognition = recognizeTrickFromMovements('regular', movements);
      expect(recognition.canonicalName).toBe('Bigger Flip');
    });

    it('recognizes BS 540 shuvit + kickflip + BS 360° as Gazelle Flip', () => {
      const movements = {
        boardSpinDeg: 540,
        boardSpinDir: 'backside' as const,
        boardFlip: 'kickflip' as const,
        bodyRotationDeg: 360,
        bodyRotationDir: 'backside' as const,
      };
      const recognition = recognizeTrickFromMovements('regular', movements);
      expect(recognition.canonicalName).toBe('Gazelle Flip');
    });
  });

  describe('Category 4: Stance & Timing Dependent Names (Cabs & Ghetto Bird)', () => {
    it('recognizes Fakie BS 180 ollie as Half Cab', () => {
      const params: SingleTrickParameters = {
        stance: 'fakie',
        direction: 'backside',
        baseTrickId: 'ollie',
        bodyVarial: 'none',
        landing: 'normal',
        revert: 'none',
      };
      expect(formatSingleTrickName(params)).toBe('Half Cab');
    });

    it('recognizes Fakie BS 180 + kickflip as Half Cab Flip', () => {
      const params: SingleTrickParameters = {
        stance: 'fakie',
        direction: 'backside',
        baseTrickId: 'kickflip',
        bodyVarial: 'none',
        landing: 'normal',
        revert: 'none',
      };
      expect(formatSingleTrickName(params)).toBe('Half Cab Flip');
    });

    it('recognizes Fakie BS 180 + heelflip as Half Cab Heelflip', () => {
      const params: SingleTrickParameters = {
        stance: 'fakie',
        direction: 'backside',
        baseTrickId: 'heelflip',
        bodyVarial: 'none',
        landing: 'normal',
        revert: 'none',
      };
      expect(formatSingleTrickName(params)).toBe('Half Cab Heelflip');
    });

    it('recognizes Fakie BS 360 ollie as Caballerial', () => {
      const movements = {
        boardSpinDeg: 360,
        boardSpinDir: 'backside' as const,
        boardFlip: 'none' as const,
        bodyRotationDeg: 360,
        bodyRotationDir: 'backside' as const,
      };
      const recognition = recognizeTrickFromMovements('fakie', movements);
      expect(recognition.canonicalName).toBe('Caballerial');
    });

    it('recognizes Fakie BS 360 + kickflip as Cab Flip', () => {
      const movements = {
        boardSpinDeg: 360,
        boardSpinDir: 'backside' as const,
        boardFlip: 'kickflip' as const,
        bodyRotationDeg: 360,
        bodyRotationDir: 'backside' as const,
      };
      const recognition = recognizeTrickFromMovements('fakie', movements);
      expect(recognition.canonicalName).toBe('Cab Flip');
    });

    it('recognizes regular hardflip then late BS 180 as Modern Ghetto Bird', () => {
      const params: SingleTrickParameters = {
        stance: 'regular',
        direction: 'none',
        baseTrickId: 'hardflip',
        bodyVarial: 'none',
        landing: 'normal',
        revert: 'backside',
      };
      expect(formatSingleTrickName(params)).toBe('Modern Ghetto Bird');
    });

    it('recognizes nollie hardflip then late BS 180 as Original Ghetto Bird', () => {
      const params: SingleTrickParameters = {
        stance: 'nollie',
        direction: 'none',
        baseTrickId: 'hardflip',
        bodyVarial: 'none',
        landing: 'normal',
        revert: 'backside',
      };
      expect(formatSingleTrickName(params)).toBe('Original Ghetto Bird');
    });
  });

  describe('Category 5: Everyday Pop Shuvit Rule', () => {
    it('omits backside from everyday Pop Shuvit name', () => {
      const params: SingleTrickParameters = {
        stance: 'regular',
        direction: 'none',
        baseTrickId: 'pop_shuvit',
        bodyVarial: 'none',
        landing: 'normal',
        revert: 'none',
      };
      expect(formatSingleTrickName(params)).toBe('Pop Shuvit');
    });

    it('retains Frontside in Frontside Pop Shuvit', () => {
      const params: SingleTrickParameters = {
        stance: 'regular',
        direction: 'none',
        baseTrickId: 'frontside_pop_shuvit',
        bodyVarial: 'none',
        landing: 'normal',
        revert: 'none',
      };
      expect(formatSingleTrickName(params)).toBe('Frontside Pop Shuvit');
    });
  });

  describe('Category 6: Separate Storage & Formatting of Underlying Movements', () => {
    it('formats a clean scannable string of underlying movements', () => {
      const movements = {
        boardSpinDeg: 360,
        boardSpinDir: 'backside' as const,
        boardFlip: 'kickflip' as const,
        bodyRotationDeg: 180,
        bodyRotationDir: 'backside' as const,
      };
      const summary = formatMovementsSummary(movements);
      expect(summary).toBe('BS 360° Board Spin + Kickflip + BS 180° Body Rotation');
    });

    it('provides a detailed breakdown in explainSingleTrick', () => {
      const params: SingleTrickParameters = {
        stance: 'regular',
        direction: 'frontside',
        baseTrickId: 'kickflip',
        bodyVarial: 'none',
        landing: 'manual',
        revert: 'none',
      };
      const breakdown = explainSingleTrick(params);
      expect(breakdown.some((b) => b.includes('Stance: Regular'))).toBe(true);
      expect(breakdown.some((b) => b.includes('Frontside Flip'))).toBe(true);
      expect(breakdown.some((b) => b.includes('Manual'))).toBe(true);
    });
  });
});
