import { describe, it, expect } from 'vitest';
import {
  formatObstacleTrickCanonicalName,
  resolveObstacleMechanics,
  formatObstacleMechanicsSummary,
} from '../domain/obstacleMechanics';
import { getObstacleTrickById } from '../domain/obstacleCatalog';
import { ObstacleComponent } from '../domain/types';

describe('Obstacle Mode: Grinds, Slides, Mechanics & Nomenclature', () => {
  describe('Basic Grinds and Variations', () => {
    it('recognizes 50-50 as both trucks grinding parallel to obstacle', () => {
      const comp: ObstacleComponent = {
        obstacleType: 'ledge',
        approach: 'frontside',
        obstacleTrickId: '50_50',
        entryTrickId: 'ollie',
        exitTrick: 'clean',
      };
      const name = formatObstacleTrickCanonicalName(comp);
      expect(name).toBe('Frontside 50-50');

      const mechanics = resolveObstacleMechanics(comp);
      expect(mechanics.contactPoint).toBe('both_trucks');
      expect(mechanics.boardAngle).toBe('parallel');
      expect(mechanics.whichTruckCrosses).toBe('none');
    });

    it('recognizes 5-0 as rear truck grinding with front truck lifted', () => {
      const comp: ObstacleComponent = {
        obstacleType: 'ledge',
        approach: 'backside',
        obstacleTrickId: '5_0',
        entryTrickId: 'ollie',
        exitTrick: 'clean',
      };
      expect(formatObstacleTrickCanonicalName(comp)).toBe('Backside 5-0');

      const mechanics = resolveObstacleMechanics(comp);
      expect(mechanics.contactPoint).toBe('rear_truck');
      expect(mechanics.boardAngle).toBe('parallel');
    });

    it('recognizes Nosegrind as front truck grinding with rear truck lifted', () => {
      const comp: ObstacleComponent = {
        obstacleType: 'ledge',
        approach: 'frontside',
        obstacleTrickId: 'nosegrind',
        entryTrickId: 'ollie',
        exitTrick: 'clean',
      };
      expect(formatObstacleTrickCanonicalName(comp)).toBe('Frontside Nosegrind');

      const mechanics = resolveObstacleMechanics(comp);
      expect(mechanics.contactPoint).toBe('front_truck');
      expect(mechanics.boardAngle).toBe('parallel');
    });

    it('recognizes Crooked Grind as nose pressed on edge, tail angled to near side', () => {
      const comp: ObstacleComponent = {
        obstacleType: 'ledge',
        approach: 'backside',
        obstacleTrickId: 'crooked',
        entryTrickId: 'ollie',
        exitTrick: 'clean',
      };
      expect(formatObstacleTrickCanonicalName(comp)).toBe('Backside Crooked Grind');

      const mechanics = resolveObstacleMechanics(comp);
      expect(mechanics.contactPoint).toBe('front_truck');
      expect(mechanics.boardAngle).toBe('crooked_near');
      expect(mechanics.whichTruckCrosses).toBe('none');
    });

    it('recognizes Overcrook as crooked position with tail angled to far side', () => {
      const comp: ObstacleComponent = {
        obstacleType: 'rail',
        approach: 'frontside',
        obstacleTrickId: 'overcrook',
        entryTrickId: 'ollie',
        exitTrick: 'clean',
      };
      expect(formatObstacleTrickCanonicalName(comp)).toBe('Frontside Overcrook');

      const mechanics = resolveObstacleMechanics(comp);
      expect(mechanics.contactPoint).toBe('front_truck');
      expect(mechanics.boardAngle).toBe('crooked_far');
      expect(mechanics.whichTruckCrosses).toBe('front_truck');
    });
  });

  describe('Dipped and Angled Grind Variations (Smith, Feeble, Suski, Salad, Willy, Overwilly)', () => {
    it('recognizes Smith Grind: rear truck grinding + front truck dipped on near side', () => {
      const comp: ObstacleComponent = {
        obstacleType: 'ledge',
        approach: 'backside',
        obstacleTrickId: 'smith',
        entryTrickId: 'ollie',
        exitTrick: 'clean',
      };
      expect(formatObstacleTrickCanonicalName(comp)).toBe('Backside Smith Grind');

      const mechanics = resolveObstacleMechanics(comp);
      expect(mechanics.contactPoint).toBe('rear_truck');
      expect(mechanics.boardAngle).toBe('dipped_near');
      expect(mechanics.whichTruckCrosses).toBe('none');
    });

    it('recognizes Feeble Grind: rear truck grinding + front truck extended across to far side dipped', () => {
      const comp: ObstacleComponent = {
        obstacleType: 'rail',
        approach: 'frontside',
        obstacleTrickId: 'feeble',
        entryTrickId: 'ollie',
        exitTrick: 'clean',
      };
      expect(formatObstacleTrickCanonicalName(comp)).toBe('Frontside Feeble Grind');

      const mechanics = resolveObstacleMechanics(comp);
      expect(mechanics.contactPoint).toBe('rear_truck');
      expect(mechanics.boardAngle).toBe('dipped_far');
      expect(mechanics.whichTruckCrosses).toBe('front_truck');
    });

    it('recognizes Suski Grind: Smith-like sideways angle, but front truck raised instead of dipped', () => {
      const comp: ObstacleComponent = {
        obstacleType: 'ledge',
        approach: 'frontside',
        obstacleTrickId: 'suski',
        entryTrickId: 'ollie',
        exitTrick: 'clean',
      };
      expect(formatObstacleTrickCanonicalName(comp)).toBe('Frontside Suski Grind');

      const mechanics = resolveObstacleMechanics(comp);
      expect(mechanics.contactPoint).toBe('rear_truck');
      expect(mechanics.boardAngle).toBe('raised_near');
    });

    it('recognizes Salad Grind: Feeble-like sideways angle, but front truck raised instead of dipped', () => {
      const comp: ObstacleComponent = {
        obstacleType: 'rail',
        approach: 'backside',
        obstacleTrickId: 'salad',
        entryTrickId: 'ollie',
        exitTrick: 'clean',
      };
      expect(formatObstacleTrickCanonicalName(comp)).toBe('Backside Salad Grind');

      const mechanics = resolveObstacleMechanics(comp);
      expect(mechanics.contactPoint).toBe('rear_truck');
      expect(mechanics.boardAngle).toBe('raised_far');
    });

    it('recognizes Willy Grind: front truck grinding + rear truck dipped on near side', () => {
      const comp: ObstacleComponent = {
        obstacleType: 'ledge',
        approach: 'frontside',
        obstacleTrickId: 'willy',
        entryTrickId: 'ollie',
        exitTrick: 'clean',
      };
      expect(formatObstacleTrickCanonicalName(comp)).toBe('Frontside Willy Grind');

      const mechanics = resolveObstacleMechanics(comp);
      expect(mechanics.contactPoint).toBe('front_truck');
      expect(mechanics.boardAngle).toBe('dipped_near');
    });

    it('recognizes Overwilly: front truck grinding + rear truck dipped on far side', () => {
      const comp: ObstacleComponent = {
        obstacleType: 'ledge',
        approach: 'backside',
        obstacleTrickId: 'overwilly',
        entryTrickId: 'ollie',
        exitTrick: 'clean',
      };
      expect(formatObstacleTrickCanonicalName(comp)).toBe('Backside Overwilly');

      const mechanics = resolveObstacleMechanics(comp);
      expect(mechanics.contactPoint).toBe('front_truck');
      expect(mechanics.boardAngle).toBe('dipped_far');
      expect(mechanics.whichTruckCrosses).toBe('front_truck');
    });
  });

  describe('Slides and Variations (Boardslide vs Lipslide, Blunts, Darkslide, Primo, Banana)', () => {
    it('recognizes Boardslide when front truck passes over during entry', () => {
      const comp: ObstacleComponent = {
        obstacleType: 'rail',
        approach: 'backside',
        obstacleTrickId: 'boardslide',
        entryTrickId: 'ollie',
        exitTrick: 'clean',
      };
      expect(formatObstacleTrickCanonicalName(comp)).toBe('Backside Boardslide');

      const mechanics = resolveObstacleMechanics(comp);
      expect(mechanics.contactPoint).toBe('center_deck');
      expect(mechanics.whichTruckCrosses).toBe('front_truck');
    });

    it('recognizes Lipslide when rear truck passes over during entry', () => {
      const comp: ObstacleComponent = {
        obstacleType: 'rail',
        approach: 'frontside',
        obstacleTrickId: 'lipslide',
        entryTrickId: 'ollie',
        exitTrick: 'clean',
      };
      expect(formatObstacleTrickCanonicalName(comp)).toBe('Frontside Lipslide');

      const mechanics = resolveObstacleMechanics(comp);
      expect(mechanics.contactPoint).toBe('center_deck');
      expect(mechanics.whichTruckCrosses).toBe('rear_truck');
    });

    it('recognizes Noseslide and Tailslide', () => {
      const noseslideComp: ObstacleComponent = {
        obstacleType: 'ledge',
        approach: 'frontside',
        obstacleTrickId: 'noseslide',
        entryTrickId: 'ollie',
        exitTrick: 'clean',
      };
      expect(formatObstacleTrickCanonicalName(noseslideComp)).toBe('Frontside Noseslide');

      const tailslideComp: ObstacleComponent = {
        obstacleType: 'ledge',
        approach: 'backside',
        obstacleTrickId: 'tailslide',
        entryTrickId: 'ollie',
        exitTrick: 'clean',
      };
      expect(formatObstacleTrickCanonicalName(tailslideComp)).toBe('Backside Tailslide');
    });

    it('recognizes Bluntslide as board crossing over obstacle with tail edge lock', () => {
      const comp: ObstacleComponent = {
        obstacleType: 'ledge',
        approach: 'backside',
        obstacleTrickId: 'bluntslide',
        entryTrickId: 'ollie',
        exitTrick: 'clean',
      };
      expect(formatObstacleTrickCanonicalName(comp)).toBe('Backside Bluntslide');

      const mechanics = resolveObstacleMechanics(comp);
      expect(mechanics.contactPoint).toBe('tail_blunt');
      expect(mechanics.whichTruckCrosses).toBe('both_trucks');
    });

    it('recognizes Nosebluntslide as corresponding nose edge lock', () => {
      const comp: ObstacleComponent = {
        obstacleType: 'rail',
        approach: 'frontside',
        obstacleTrickId: 'nosebluntslide',
        entryTrickId: 'ollie',
        exitTrick: 'clean',
      };
      expect(formatObstacleTrickCanonicalName(comp)).toBe('Frontside Nosebluntslide');

      const mechanics = resolveObstacleMechanics(comp);
      expect(mechanics.contactPoint).toBe('nose_blunt');
      expect(mechanics.whichTruckCrosses).toBe('both_trucks');
    });

    it('recognizes Darkslide, Primo Slide, and Banana Slide', () => {
      const darkslideComp: ObstacleComponent = {
        obstacleType: 'rail',
        approach: 'backside',
        obstacleTrickId: 'darkslide',
        entryTrickId: 'kickflip',
        exitTrick: 'clean',
      };
      expect(formatObstacleTrickCanonicalName(darkslideComp)).toBe('Kickflip Backside Darkslide');

      const primoComp: ObstacleComponent = {
        obstacleType: 'ledge',
        approach: 'frontside',
        obstacleTrickId: 'primo_slide',
        entryTrickId: 'ollie',
        exitTrick: 'clean',
      };
      expect(formatObstacleTrickCanonicalName(primoComp)).toBe('Frontside Primo Slide');

      const bananaComp: ObstacleComponent = {
        obstacleType: 'ledge',
        approach: 'frontside',
        obstacleTrickId: 'banana_slide',
        entryTrickId: 'ollie',
        exitTrick: 'clean',
      };
      expect(formatObstacleTrickCanonicalName(bananaComp)).toBe('Frontside Banana Slide');
    });
  });

  describe('Rotational Entries with Special Names (Hurricane, Sugarcane, Bennett, Barley)', () => {
    it('recognizes Hurricane Grind (180 into backward/fakie feeble)', () => {
      const comp: ObstacleComponent = {
        obstacleType: 'rail',
        approach: 'backside',
        obstacleTrickId: 'hurricane',
        entryTrickId: 'ollie',
        exitTrick: 'clean',
      };
      expect(formatObstacleTrickCanonicalName(comp)).toBe('Hurricane Grind');

      const mechanics = resolveObstacleMechanics(comp);
      expect(mechanics.isSpecialRotationalEntry).toBe(true);
      expect(mechanics.specialEntryName).toBe('Hurricane Grind');
    });

    it('recognizes Sugarcane Grind (Alley-oop 180 into backward/fakie Smith)', () => {
      const comp: ObstacleComponent = {
        obstacleType: 'rail',
        approach: 'frontside',
        obstacleTrickId: 'sugarcane',
        entryTrickId: 'ollie',
        exitTrick: 'clean',
      };
      expect(formatObstacleTrickCanonicalName(comp)).toBe('Sugarcane Grind');
    });

    it('recognizes Bennett Grind (Frontside approach + BS 180 into switch BS Smith)', () => {
      const comp: ObstacleComponent = {
        obstacleType: 'rail',
        approach: 'frontside',
        obstacleTrickId: 'bennett',
        entryTrickId: 'ollie',
        exitTrick: 'clean',
      };
      expect(formatObstacleTrickCanonicalName(comp)).toBe('Bennett Grind');

      const mechanics = resolveObstacleMechanics(comp);
      expect(mechanics.isSpecialRotationalEntry).toBe(true);
      expect(mechanics.specialEntryName).toBe('Bennett Grind');
    });

    it('recognizes Barley Grind (Backside approach + FS 180 into switch FS Smith)', () => {
      const comp: ObstacleComponent = {
        obstacleType: 'ledge',
        approach: 'backside',
        obstacleTrickId: 'barley',
        entryTrickId: 'ollie',
        exitTrick: 'clean',
      };
      expect(formatObstacleTrickCanonicalName(comp)).toBe('Barley Grind');

      const mechanics = resolveObstacleMechanics(comp);
      expect(mechanics.isSpecialRotationalEntry).toBe(true);
      expect(mechanics.specialEntryName).toBe('Barley Grind');
    });
  });

  describe('Combinations with Flip-ins, Transfers, and Exits', () => {
    it('formats Kickflip into BS boardslide as Kickflip Backside Boardslide', () => {
      const comp: ObstacleComponent = {
        obstacleType: 'rail',
        approach: 'backside',
        obstacleTrickId: 'boardslide',
        entryTrickId: 'kickflip',
        exitTrick: 'clean',
      };
      expect(formatObstacleTrickCanonicalName(comp)).toBe('Kickflip Backside Boardslide');
    });

    it('formats Heelflip into FS tailslide as Heelflip Frontside Tailslide', () => {
      const comp: ObstacleComponent = {
        obstacleType: 'ledge',
        approach: 'frontside',
        obstacleTrickId: 'tailslide',
        entryTrickId: 'heelflip',
        exitTrick: 'clean',
      };
      expect(formatObstacleTrickCanonicalName(comp)).toBe('Heelflip Frontside Tailslide');
    });

    it('formats BS boardslide then change into BS 50-50 as Backside Boardslide to Backside 50-50', () => {
      const comp: ObstacleComponent = {
        obstacleType: 'rail',
        approach: 'backside',
        obstacleTrickId: 'boardslide',
        entryTrickId: 'ollie',
        transferTrickId: '50_50',
        transferApproach: 'backside',
        exitTrick: 'clean',
      };
      expect(formatObstacleTrickCanonicalName(comp)).toBe('Backside Boardslide to Backside 50-50');
    });

    it('formats BS crooked grind then nollie flip out as Backside Crooked Grind Nollie Flip Out', () => {
      const comp: ObstacleComponent = {
        obstacleType: 'ledge',
        approach: 'backside',
        obstacleTrickId: 'crooked',
        entryTrickId: 'ollie',
        exitTrick: 'nollie_flip_out',
      };
      expect(formatObstacleTrickCanonicalName(comp)).toBe('Backside Crooked Grind Nollie Flip Out');
    });

    it('formats FS tailslide then kickflip out as Frontside Tailslide Kickflip Out', () => {
      const comp: ObstacleComponent = {
        obstacleType: 'ledge',
        approach: 'frontside',
        obstacleTrickId: 'tailslide',
        entryTrickId: 'ollie',
        exitTrick: 'kickflip_out',
      };
      expect(formatObstacleTrickCanonicalName(comp)).toBe('Frontside Tailslide Kickflip Out');
    });
  });

  describe('Approach Side Distinction (FS vs BS)', () => {
    it('verifies FS and BS describe front facing vs back facing the obstacle', () => {
      const fsComp: ObstacleComponent = {
        obstacleType: 'rail',
        approach: 'frontside',
        obstacleTrickId: '50_50',
        entryTrickId: 'ollie',
        exitTrick: 'clean',
      };
      const bsComp: ObstacleComponent = {
        obstacleType: 'rail',
        approach: 'backside',
        obstacleTrickId: '50_50',
        entryTrickId: 'ollie',
        exitTrick: 'clean',
      };

      const fsMechanics = resolveObstacleMechanics(fsComp);
      const bsMechanics = resolveObstacleMechanics(bsComp);

      expect(fsMechanics.approach).toBe('frontside');
      expect(bsMechanics.approach).toBe('backside');
      expect(formatObstacleMechanicsSummary(fsMechanics)).toContain('FS Approach (Chest Facing)');
      expect(formatObstacleMechanicsSummary(bsMechanics)).toContain('BS Approach (Back Facing)');
    });
  });
});
