import {
  Stance,
  Direction,
  BodyVarial,
  LandingPosition,
  RevertDirection,
  SingleTrickParameters,
  UnderlyingMovements,
} from './types';
import { getBaseTrickById } from './catalog';

/**
 * Extracts and normalizes the physical underlying movements of a trick:
 * - Board spin degrees and direction (measured relative to the ground)
 * - Longitudinal flip type
 * - Rider body rotation degrees and direction
 * - Timing modifiers (e.g., late rotation for Ghetto Bird)
 */
export function resolveUnderlyingMovements(params: SingleTrickParameters): UnderlyingMovements {
  if (params.movements) {
    return {
      ...params.movements,
      landingPosition: params.landing,
      revertDirection: params.revert,
    };
  }

  let boardSpinDeg = 0;
  let boardSpinDir: Direction = 'none';
  let boardFlip: UnderlyingMovements['boardFlip'] = 'none';
  let bodyRotationDeg = 0;
  let bodyRotationDir: Direction = 'none';
  let isLateRotation = false;
  let lateRotationDeg = 0;
  let lateRotationDir: Direction = 'none';
  let isBodyVarialOnly = false;

  const baseTrickId = params.baseTrickId;

  switch (baseTrickId) {
    case 'ollie':
      boardFlip = 'none';
      if (params.direction !== 'none') {
        boardSpinDeg = 180;
        boardSpinDir = params.direction;
        bodyRotationDeg = 180;
        bodyRotationDir = params.direction;
      } else if (params.bodyVarial !== 'none') {
        boardSpinDeg = 0;
        boardSpinDir = 'none';
        bodyRotationDeg = 180;
        bodyRotationDir = params.bodyVarial;
        isBodyVarialOnly = true;
      }
      break;

    case 'kickflip':
      boardFlip = 'kickflip';
      if (params.direction !== 'none') {
        // Rider and board rotate together (Frontside Flip / Backside Flip)
        boardSpinDeg = 180;
        boardSpinDir = params.direction;
        bodyRotationDeg = 180;
        bodyRotationDir = params.direction;
      } else if (params.bodyVarial !== 'none') {
        // Board stays straight; rider rotates body (Sex Change)
        boardSpinDeg = 0;
        boardSpinDir = 'none';
        bodyRotationDeg = 180;
        bodyRotationDir = params.bodyVarial;
        isBodyVarialOnly = true;
      }
      break;

    case 'heelflip':
      boardFlip = 'heelflip';
      if (params.direction !== 'none') {
        // Rider and board rotate together (Frontside Heelflip / Backside Heelflip)
        boardSpinDeg = 180;
        boardSpinDir = params.direction;
        bodyRotationDeg = 180;
        bodyRotationDir = params.direction;
      } else if (params.bodyVarial !== 'none') {
        boardSpinDeg = 0;
        boardSpinDir = 'none';
        bodyRotationDeg = 180;
        bodyRotationDir = params.bodyVarial;
        isBodyVarialOnly = true;
      }
      break;

    case 'double_kickflip':
      boardFlip = 'double_kickflip';
      if (params.direction !== 'none') {
        boardSpinDeg = 180;
        boardSpinDir = params.direction;
        bodyRotationDeg = 180;
        bodyRotationDir = params.direction;
      } else if (params.bodyVarial !== 'none') {
        bodyRotationDeg = 180;
        bodyRotationDir = params.bodyVarial;
        isBodyVarialOnly = true;
      }
      break;

    case 'pop_shuvit':
      // Regular pop shuvit is backside 180 board spin
      boardSpinDeg = 180;
      boardSpinDir = 'backside';
      boardFlip = 'none';
      if (params.direction !== 'none') {
        bodyRotationDeg = 180;
        bodyRotationDir = params.direction;
      } else if (params.bodyVarial !== 'none') {
        bodyRotationDeg = 180;
        bodyRotationDir = params.bodyVarial;
      }
      break;

    case 'frontside_pop_shuvit':
      boardSpinDeg = 180;
      boardSpinDir = 'frontside';
      boardFlip = 'none';
      if (params.direction !== 'none') {
        bodyRotationDeg = 180;
        bodyRotationDir = params.direction;
      } else if (params.bodyVarial !== 'none') {
        bodyRotationDeg = 180;
        bodyRotationDir = params.bodyVarial;
      }
      break;

    case 'shuvit_360':
      boardSpinDeg = 360;
      boardSpinDir = 'backside';
      boardFlip = 'none';
      if (params.direction !== 'none') {
        bodyRotationDeg = 180;
        bodyRotationDir = params.direction;
      } else if (params.bodyVarial !== 'none') {
        bodyRotationDeg = 180;
        bodyRotationDir = params.bodyVarial;
      }
      break;

    case 'shuvit_540':
      boardSpinDeg = 540;
      boardSpinDir = 'backside';
      boardFlip = 'none';
      if (params.direction !== 'none') {
        bodyRotationDeg = 180;
        bodyRotationDir = params.direction;
      }
      break;

    case 'varial_kickflip':
      boardSpinDeg = 180;
      boardSpinDir = 'backside';
      boardFlip = 'kickflip';
      if (params.direction !== 'none') {
        bodyRotationDeg = 180;
        bodyRotationDir = params.direction;
      }
      break;

    case 'varial_heelflip':
      boardSpinDeg = 180;
      boardSpinDir = 'frontside';
      boardFlip = 'heelflip';
      if (params.direction !== 'none') {
        bodyRotationDeg = 180;
        bodyRotationDir = params.direction;
      }
      break;

    case 'hardflip':
      boardSpinDeg = 180;
      boardSpinDir = 'frontside';
      boardFlip = 'kickflip';
      if (params.revert === 'backside') {
        isLateRotation = true;
        lateRotationDeg = 180;
        lateRotationDir = 'backside';
      }
      break;

    case 'inward_heelflip':
      boardSpinDeg = 180;
      boardSpinDir = 'backside';
      boardFlip = 'heelflip';
      if (params.direction !== 'none') {
        bodyRotationDeg = 180;
        bodyRotationDir = params.direction;
      }
      break;

    case 'tre_flip':
      boardSpinDeg = 360;
      boardSpinDir = 'backside';
      boardFlip = 'kickflip';
      if (params.direction === 'backside') {
        // BS 360 shuvit + kickflip + BS 180 body = Bigflip
        bodyRotationDeg = 180;
        bodyRotationDir = 'backside';
      } else if (params.direction === 'frontside') {
        bodyRotationDeg = 180;
        bodyRotationDir = 'frontside';
      }
      break;

    case 'laser_flip':
      boardSpinDeg = 360;
      boardSpinDir = 'frontside';
      boardFlip = 'heelflip';
      if (params.direction === 'frontside') {
        // FS 360 shuvit + heelflip + FS 180 body = Bigheel
        bodyRotationDeg = 180;
        bodyRotationDir = 'frontside';
      }
      break;

    case 'nightmare_flip':
      boardSpinDeg = 180;
      boardSpinDir = 'backside';
      boardFlip = 'double_kickflip';
      break;

    case 'bigspin':
      boardSpinDeg = 360;
      boardSpinDir = params.direction === 'frontside' ? 'frontside' : 'backside';
      boardFlip = 'none';
      bodyRotationDeg = 180;
      bodyRotationDir = params.direction === 'frontside' ? 'frontside' : 'backside';
      break;

    case 'bigger_spin':
      boardSpinDeg = 540;
      boardSpinDir = params.direction === 'frontside' ? 'frontside' : 'backside';
      boardFlip = 'none';
      bodyRotationDeg = 180;
      bodyRotationDir = params.direction === 'frontside' ? 'frontside' : 'backside';
      break;

    case 'gazelle_spin':
      boardSpinDeg = 540;
      boardSpinDir = params.direction === 'frontside' ? 'frontside' : 'backside';
      boardFlip = 'none';
      bodyRotationDeg = 360;
      bodyRotationDir = params.direction === 'frontside' ? 'frontside' : 'backside';
      break;

    case 'bigflip':
      boardSpinDeg = 360;
      boardSpinDir = params.direction === 'frontside' ? 'frontside' : 'backside';
      boardFlip = 'kickflip';
      bodyRotationDeg = 180;
      bodyRotationDir = params.direction === 'frontside' ? 'frontside' : 'backside';
      break;

    case 'bigger_flip':
      boardSpinDeg = 540;
      boardSpinDir = 'backside';
      boardFlip = 'kickflip';
      bodyRotationDeg = 180;
      bodyRotationDir = 'backside';
      break;

    case 'gazelle_flip':
      boardSpinDeg = 540;
      boardSpinDir = 'backside';
      boardFlip = 'kickflip';
      bodyRotationDeg = 360;
      bodyRotationDir = 'backside';
      break;

    case 'bigheel':
      boardSpinDeg = 360;
      boardSpinDir = 'frontside';
      boardFlip = 'heelflip';
      bodyRotationDeg = 180;
      bodyRotationDir = 'frontside';
      break;

    case 'bigspin_inward_heelflip':
      boardSpinDeg = 360;
      boardSpinDir = 'backside';
      boardFlip = 'heelflip';
      bodyRotationDeg = 180;
      bodyRotationDir = 'backside';
      break;

    case 'impossible':
      boardSpinDeg = 360;
      boardSpinDir = 'none';
      boardFlip = 'vertical_wrap';
      break;

    default:
      const fallbackBase = getBaseTrickById(baseTrickId);
      if (fallbackBase) {
        boardSpinDeg = fallbackBase.boardRotationDeg;
        boardFlip = fallbackBase.boardFlip;
      }
      break;
  }

  return {
    boardSpinDeg,
    boardSpinDir,
    boardFlip,
    bodyRotationDeg,
    bodyRotationDir,
    isLateRotation,
    lateRotationDeg,
    lateRotationDir,
    isBodyVarialOnly,
    landingPosition: params.landing,
    revertDirection: params.revert,
  };
}

export interface TrickRecognitionResult {
  canonicalName: string;
  formula: string;
  underlyingSummary: string;
  absorbedRevert: boolean;
}

/**
 * Recognizes the evolved skateboarding name from underlying movements and stance.
 * Adheres strictly to canonical nomenclature:
 * - Flip + Board Spin: Varial Kickflip, Hardflip, Varial Heelflip, Inward Heelflip, Tre Flip, Laser Flip, Nightmare Flip
 * - Flip + Ollie rotation: Frontside Flip, Backside Flip, Frontside Heelflip, Backside Heelflip
 * - Body Varials: Sex Change / Kickflip Body Varial, Heelflip Body Varial
 * - Bigspin Family: Bigspin, Bigger Spin, Gazelle Spin, Bigflip, Bigger Flip, Gazelle Flip, Bigheel, Bigspin Inward Heelflip
 * - Stance & Timing: Half Cab, Caballerial, Half Cab Flip, Half Cab Heelflip, Cab Flip, Cab Heelflip, Original / Modern Ghetto Bird
 * - Pop Shuvit: everyday backside shuvit omits 'backside'
 */
export function recognizeTrickFromMovements(
  stance: Stance,
  movements: UnderlyingMovements
): TrickRecognitionResult {
  const {
    boardSpinDeg,
    boardSpinDir,
    boardFlip,
    bodyRotationDeg,
    bodyRotationDir,
    isLateRotation,
    lateRotationDir,
    isBodyVarialOnly,
  } = movements;

  let baseName = '';
  let formula = '';
  let absorbedRevert = false;

  // 1. Check Ghetto Bird: Hardflip (FS 180 shuvit + kickflip) + late BS 180
  const isHardflipMovements =
    boardSpinDeg === 180 && boardSpinDir === 'frontside' && boardFlip === 'kickflip';

  if (
    isHardflipMovements &&
    (isLateRotation || movements.revertDirection === 'backside') &&
    (lateRotationDir === 'backside' || movements.revertDirection === 'backside')
  ) {
    absorbedRevert = true;
    if (stance === 'nollie') {
      baseName = 'Original Ghetto Bird';
      formula = 'Nollie Hardflip + Late BS 180°';
    } else if (stance === 'regular') {
      baseName = 'Modern Ghetto Bird';
      formula = 'Hardflip + Late BS 180°';
    } else if (stance === 'switch') {
      baseName = 'Switch Ghetto Bird';
      formula = 'Switch Hardflip + Late BS 180°';
    } else if (stance === 'fakie') {
      baseName = 'Fakie Ghetto Bird';
      formula = 'Fakie Hardflip + Late BS 180°';
    }
    return {
      canonicalName: baseName,
      formula,
      underlyingSummary: formatMovementsSummary(movements),
      absorbedRevert,
    };
  }

  // 2. Fakie Stance Specifics (Caballerial family)
  if (stance === 'fakie') {
    // Fakie BS 180 Ollie
    if (
      bodyRotationDeg === 180 &&
      bodyRotationDir === 'backside' &&
      boardSpinDeg === 180 &&
      boardSpinDir === 'backside'
    ) {
      if (boardFlip === 'none') {
        baseName = 'Half Cab';
        formula = 'Fakie BS 180° Ollie';
      } else if (boardFlip === 'kickflip') {
        baseName = 'Half Cab Flip';
        formula = 'Fakie BS 180° + Kickflip';
      } else if (boardFlip === 'heelflip') {
        baseName = 'Half Cab Heelflip';
        formula = 'Fakie BS 180° + Heelflip';
      }
    }
    // Fakie BS 360 Ollie / Cab
    else if (
      bodyRotationDeg === 360 &&
      bodyRotationDir === 'backside' &&
      boardSpinDeg === 360 &&
      boardSpinDir === 'backside'
    ) {
      if (boardFlip === 'none') {
        baseName = 'Caballerial';
        formula = 'Fakie BS 360° Ollie (Full Cab)';
      } else if (boardFlip === 'kickflip') {
        baseName = 'Cab Flip';
        formula = 'Fakie BS 360° + Kickflip (Full Cab Flip)';
      } else if (boardFlip === 'heelflip') {
        baseName = 'Cab Heelflip';
        formula = 'Fakie BS 360° + Heelflip';
      }
    }
    // Fakie Tre Flip / Cab Flip alias
    else if (
      boardSpinDeg === 360 &&
      boardSpinDir === 'backside' &&
      boardFlip === 'kickflip' &&
      bodyRotationDeg === 0
    ) {
      baseName = 'Fakie Tre Flip';
      formula = 'Fakie BS 360° Shuvit + Kickflip';
    }

    if (baseName) {
      return {
        canonicalName: baseName,
        formula,
        underlyingSummary: formatMovementsSummary(movements),
        absorbedRevert,
      };
    }
  }

  // 3. Bigspin Family (board and body rotate in the same direction)
  const isSameDirection =
    (boardSpinDir === bodyRotationDir && boardSpinDir !== 'none') ||
    (boardSpinDir !== 'none' && bodyRotationDir === 'none');

  // Bigflips / Bigger Flips / Gazelle Flips
  if (boardFlip === 'kickflip') {
    if (boardSpinDeg === 360 && bodyRotationDeg === 180) {
      if (boardSpinDir === 'backside' && bodyRotationDir === 'backside') {
        baseName = 'Bigflip';
        formula = 'BS 360° Shuvit + Kickflip + BS 180° Body';
      } else if (boardSpinDir === 'frontside' && bodyRotationDir === 'frontside') {
        baseName = 'Frontside Bigflip';
        formula = 'FS 360° Shuvit + Kickflip + FS 180° Body';
      }
    } else if (boardSpinDeg === 540 && bodyRotationDeg === 180 && boardSpinDir === 'backside') {
      baseName = 'Bigger Flip';
      formula = 'BS 540° Shuvit + Kickflip + BS 180° Body';
    } else if (boardSpinDeg === 540 && bodyRotationDeg === 360 && boardSpinDir === 'backside') {
      baseName = 'Gazelle Flip';
      formula = 'BS 540° Shuvit + Kickflip + BS 360° Body';
    }
  }
  // Bigheels / Bigspin Inward Heelflips
  else if (boardFlip === 'heelflip') {
    if (boardSpinDeg === 360 && bodyRotationDeg === 180) {
      if (boardSpinDir === 'frontside' && bodyRotationDir === 'frontside') {
        baseName = 'Bigheel';
        formula = 'FS 360° Shuvit + Heelflip + FS 180° Body';
      } else if (boardSpinDir === 'backside' && bodyRotationDir === 'backside') {
        baseName = 'Bigspin Inward Heelflip';
        formula = 'BS 360° Shuvit + Heelflip + BS 180° Body';
      }
    }
  }
  // Bigspin flat (no flip)
  else if (boardFlip === 'none') {
    if (boardSpinDeg === 360 && bodyRotationDeg === 180) {
      if (boardSpinDir === 'frontside' && bodyRotationDir === 'frontside') {
        baseName = 'Frontside Bigspin';
        formula = 'FS 360° Shuvit + FS 180° Body';
      } else {
        baseName = 'Bigspin';
        formula = '360° Shuvit + 180° Body';
      }
    } else if (boardSpinDeg === 540 && bodyRotationDeg === 180) {
      if (boardSpinDir === 'frontside') {
        baseName = 'Frontside Bigger Spin';
        formula = 'FS 540° Shuvit + FS 180° Body';
      } else {
        baseName = 'Bigger Spin';
        formula = '540° Shuvit + 180° Body';
      }
    } else if (boardSpinDeg === 540 && bodyRotationDeg === 360) {
      if (boardSpinDir === 'frontside') {
        baseName = 'Frontside Gazelle Spin';
        formula = 'FS 540° Shuvit + FS 360° Body';
      } else {
        baseName = 'Gazelle Spin';
        formula = '540° Shuvit + 360° Body';
      }
    }
  }

  // 4. Flip + Rider and board rotating together (Ollie 180 rotation)
  if (!baseName && bodyRotationDeg === 180 && boardSpinDeg === 180 && boardSpinDir === bodyRotationDir) {
    if (boardFlip === 'kickflip') {
      if (boardSpinDir === 'frontside') {
        baseName = 'Frontside Flip';
        formula = 'Kickflip + FS 180° Ollie';
      } else {
        baseName = 'Backside Flip';
        formula = 'Kickflip + BS 180° Ollie';
      }
    } else if (boardFlip === 'heelflip') {
      if (boardSpinDir === 'frontside') {
        baseName = 'Frontside Heelflip';
        formula = 'Heelflip + FS 180° Ollie';
      } else {
        baseName = 'Backside Heelflip';
        formula = 'Heelflip + BS 180° Ollie';
      }
    }
  }

  // 5. Flip + Body Varial only (no board shuvit)
  if (!baseName && boardSpinDeg === 0 && bodyRotationDeg === 180) {
    if (boardFlip === 'kickflip') {
      if (bodyRotationDir === 'backside') {
        baseName = 'Kickflip Body Varial';
        formula = 'Kickflip + 180° Body Varial (Sex Change)';
      } else {
        baseName = 'Kickflip FS Body Varial';
        formula = 'Kickflip + FS 180° Body Varial';
      }
    } else if (boardFlip === 'heelflip') {
      if (bodyRotationDir === 'frontside') {
        baseName = 'Heelflip Body Varial';
        formula = 'Heelflip + 180° Body Varial (Heelflip Sex Change)';
      } else {
        baseName = 'Heelflip BS Body Varial';
        formula = 'Heelflip + BS 180° Body Varial';
      }
    }
  }

  // 6. Flip + Board Spin (simultaneous combinations, body does not rotate)
  if (!baseName && bodyRotationDeg === 0) {
    // Varial Kickflip: Kickflip + BS 180 shuvit
    if (boardFlip === 'kickflip' && boardSpinDeg === 180 && boardSpinDir === 'backside') {
      baseName = 'Varial Kickflip';
      formula = 'Kickflip + BS 180° Shuvit';
    }
    // Hardflip: Kickflip + FS 180 shuvit
    else if (boardFlip === 'kickflip' && boardSpinDeg === 180 && boardSpinDir === 'frontside') {
      baseName = 'Hardflip';
      formula = 'Kickflip + FS 180° Shuvit';
    }
    // Varial Heelflip: Heelflip + FS 180 shuvit
    else if (boardFlip === 'heelflip' && boardSpinDeg === 180 && boardSpinDir === 'frontside') {
      baseName = 'Varial Heelflip';
      formula = 'Heelflip + FS 180° Shuvit';
    }
    // Inward Heelflip: Heelflip + BS 180 shuvit
    else if (boardFlip === 'heelflip' && boardSpinDeg === 180 && boardSpinDir === 'backside') {
      baseName = 'Inward Heelflip';
      formula = 'Heelflip + BS 180° Shuvit';
    }
    // 360 Flip / Tre Flip: Kickflip + BS 360 shuvit
    else if (boardFlip === 'kickflip' && boardSpinDeg === 360 && boardSpinDir === 'backside') {
      baseName = 'Tre Flip';
      formula = 'Kickflip + BS 360° Shuvit (360 Flip)';
    }
    // Laser Flip: Heelflip + FS 360 shuvit
    else if (boardFlip === 'heelflip' && boardSpinDeg === 360 && boardSpinDir === 'frontside') {
      baseName = 'Laser Flip';
      formula = 'Heelflip + FS 360° Shuvit';
    }
    // Nightmare Flip: Double kickflip + BS 180 shuvit
    else if (boardFlip === 'double_kickflip' && boardSpinDeg === 180 && boardSpinDir === 'backside') {
      baseName = 'Nightmare Flip';
      formula = 'Double Kickflip + BS 180° Shuvit';
    }
  }

  // 7. Pure Shuvits (board spin only, no flip, body 0)
  if (!baseName && boardFlip === 'none' && bodyRotationDeg === 0) {
    if (boardSpinDeg === 180) {
      if (boardSpinDir === 'frontside') {
        baseName = 'Frontside Pop Shuvit';
        formula = 'FS 180° Shuvit';
      } else {
        // Everyday name omits "backside"
        baseName = 'Pop Shuvit';
        formula = 'BS 180° Shuvit';
      }
    } else if (boardSpinDeg === 360) {
      baseName = boardSpinDir === 'frontside' ? 'Frontside 360 Shuvit' : '360 Shuvit';
      formula = `${boardSpinDir === 'frontside' ? 'FS' : 'BS'} 360° Shuvit`;
    } else if (boardSpinDeg === 540) {
      baseName = '540 Shuvit';
      formula = '540° Shuvit';
    }
  }

  // 8. Straight Flips / Moves
  if (!baseName) {
    if (boardFlip === 'kickflip' && boardSpinDeg === 0 && bodyRotationDeg === 0) {
      baseName = 'Kickflip';
      formula = 'Axial Kickflip';
    } else if (boardFlip === 'heelflip' && boardSpinDeg === 0 && bodyRotationDeg === 0) {
      baseName = 'Heelflip';
      formula = 'Axial Heelflip';
    } else if (boardFlip === 'double_kickflip' && boardSpinDeg === 0 && bodyRotationDeg === 0) {
      baseName = 'Double Kickflip';
      formula = 'Double Axial Kickflip';
    } else if (boardFlip === 'vertical_wrap') {
      baseName = 'Impossible';
      formula = 'Vertical Wrap 360°';
    } else if (boardFlip === 'none') {
      if (bodyRotationDeg === 180) {
        baseName = bodyRotationDir === 'frontside' ? 'Frontside 180' : 'Backside 180';
        formula = `${bodyRotationDir === 'frontside' ? 'FS' : 'BS'} 180° Ollie`;
      } else {
        baseName = 'Ollie';
        formula = 'Standard Ollie';
      }
    } else {
      baseName = 'Freestyle Flip';
      formula = 'Freestyle';
    }
  }

  // Apply stance prefix
  let fullCanonicalName = baseName;
  if (stance === 'switch') {
    fullCanonicalName = `Switch ${baseName}`;
  } else if (stance === 'nollie') {
    fullCanonicalName = `Nollie ${baseName}`;
  } else if (stance === 'fakie') {
    // Only prefix if not already a Cab name
    if (!baseName.includes('Cab') && !baseName.startsWith('Fakie')) {
      fullCanonicalName = `Fakie ${baseName}`;
    }
  }

  return {
    canonicalName: fullCanonicalName,
    formula,
    underlyingSummary: formatMovementsSummary(movements),
    absorbedRevert,
  };
}

/**
 * Returns a scannable, high-contrast string summarizing underlying movements.
 * Example: "BS 360° Board Spin · Kickflip · BS 180° Body Rotation"
 */
export function formatMovementsSummary(movements: UnderlyingMovements): string {
  const parts: string[] = [];

  // Board spin
  if (movements.boardSpinDeg > 0) {
    const dir =
      movements.boardSpinDir === 'frontside'
        ? 'FS'
        : movements.boardSpinDir === 'backside'
        ? 'BS'
        : '';
    parts.push(`${dir ? `${dir} ` : ''}${movements.boardSpinDeg}° Board Spin`);
  } else {
    parts.push('0° Board Spin');
  }

  // Flip
  if (movements.boardFlip === 'kickflip') {
    parts.push('Kickflip');
  } else if (movements.boardFlip === 'heelflip') {
    parts.push('Heelflip');
  } else if (movements.boardFlip === 'double_kickflip') {
    parts.push('Double Kickflip');
  } else if (movements.boardFlip === 'vertical_wrap') {
    parts.push('Vertical Wrap');
  } else {
    parts.push('No Flip');
  }

  // Body rotation
  if (movements.bodyRotationDeg > 0) {
    const dir =
      movements.bodyRotationDir === 'frontside'
        ? 'FS'
        : movements.bodyRotationDir === 'backside'
        ? 'BS'
        : '';
    parts.push(`${dir ? `${dir} ` : ''}${movements.bodyRotationDeg}° Body Rotation`);
  } else {
    parts.push('0° Body Rotation');
  }

  if (movements.isLateRotation && movements.lateRotationDeg) {
    const dir = movements.lateRotationDir === 'frontside' ? 'FS' : 'BS';
    parts.push(`Late ${dir} ${movements.lateRotationDeg}°`);
  }

  return parts.join(' + ');
}
