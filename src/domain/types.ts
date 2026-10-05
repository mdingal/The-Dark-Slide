import type {InventoryPart,PartKind,OnboardingData} from './hardware';
import type {SharedChallengeLink} from './communityChallenges';
import type { DashboardPreferences } from './dashboardAnalytics';
export type Stance = 'regular' | 'fakie' | 'switch' | 'nollie';
export type Direction = 'none' | 'frontside' | 'backside';
export type BodyVarial = 'none' | 'frontside' | 'backside';
export type LandingPosition = 'normal' | 'manual' | 'nose_manual';
export type RevertDirection = 'none' | 'frontside' | 'backside';

export type ObstacleType = 'flatground' | 'ledge' | 'rail' | 'manual_pad';
export type WheelMaterial = 'plastic' | 'urethane' | 'resin' | 'unknown';

export type SessionStatus = 'pending' | 'success' | 'failed';
export type ComplexityTier = 'beginner' | 'intermediate' | 'advanced';
export type ComplexityFilter = 'all' | ComplexityTier;
export type TrickLearningStatus = 'want_to_learn' | 'learning' | 'landed' | 'consistent';
export type MissTag = 'underflip' | 'overflip' | 'missed_catch' | 'missed_lock_in' | 'slipped_out';
export type MissTagCounts = Partial<Record<MissTag, number>>;

export interface BaseTrickDefinition {
  id: string;
  name: string;
  allowedStances: Stance[];
  applicableDirections: Direction[];
  boardRotationDeg: number; // e.g., 0, 180, 360
  boardFlip: 'none' | 'kickflip' | 'double_kickflip' | 'heelflip' | 'vertical_wrap';
  difficulty: number; // 1-5
  allowedModifiers: {
    bodyVarial: boolean;
    landingManual: boolean;
    revert: boolean;
  };
  supportedObstacleTypes: ObstacleType[];
  description: string;
}

export type ContactPoint =
  | 'both_trucks'
  | 'rear_truck'
  | 'front_truck'
  | 'center_deck'
  | 'nose_deck'
  | 'tail_deck'
  | 'tail_blunt'
  | 'nose_blunt'
  | 'griptape'
  | 'primo'
  | 'double_contact';

export type BoardAngle =
  | 'parallel'
  | 'crooked_near'
  | 'crooked_far'
  | 'dipped_near'
  | 'dipped_far'
  | 'raised_near'
  | 'raised_far'
  | 'perpendicular';

export type TruckCrossing = 'none' | 'front_truck' | 'rear_truck' | 'both_trucks';

export type EntryRotation = 'none' | '180' | 'fs_180' | 'bs_180' | 'alley_oop_180';

export interface ObstacleMechanics {
  approach: 'frontside' | 'backside';
  entryRotation: EntryRotation;
  whichTruckCrosses: TruckCrossing;
  contactPoint: ContactPoint;
  boardAngle: BoardAngle;
  isSpecialRotationalEntry?: boolean;
  specialEntryName?: string;
}

export interface ObstacleTrickDefinition {
  id: string;
  name: string;
  category: 'basic_grind' | 'angled_grind' | 'slide' | 'rotational_entry';
  supportedObstacles: ObstacleType[];
  applicableApproaches: ('frontside' | 'backside')[];
  contactPoint: ContactPoint;
  boardAngle: BoardAngle;
  whichTruckCrosses: TruckCrossing;
  entryRotation?: EntryRotation;
  landingPositionsAllowed: LandingPosition[]; // e.g., nosegrind usually lands normal or nose manual
  allowedEntryTricks: string[]; // ids of base tricks or 'ollie'
  allowedExitTricks: string[]; // e.g., 'none', 'revert', 'kickflip', 'shuvit'
  difficulty: number;
  description: string;
}

export type DeckShape = 'popsicle' | 'boxy' | 'cruiser' | 'egg' | 'old_school';
export type DeckMold = 'medium' | 'low' | 'high' | 'flat';

export interface ParameterExclusions {
  stances?: Stance[];
  directions?: Direction[];
  baseTrickIds?: string[];
  bodyVarials?: BodyVarial[];
  landings?: LandingPosition[];
  reverts?: RevertDirection[];
}

export interface ObstacleExclusions {
  transferTrickIds?: string[];
  obstacles?: ObstacleType[];
  approaches?: ('frontside' | 'backside')[];
  obstacleTrickIds?: string[];
  entryTrickIds?: string[];
  exitTricks?: string[];
  contactPoints?: ContactPoint[];
  boardAngles?: BoardAngle[];
}

export interface ParameterLocks {
  stance?: Stance;
  direction?: Direction;
  baseTrickId?: string;
  bodyVarial?: BodyVarial;
  landing?: LandingPosition;
  revert?: RevertDirection;
  // Obstacle mode locks
  approach?: 'frontside' | 'backside';
  obstacleTrickId?: string;
  entryTrickId?: string;
  exitTrick?: string;
  contactPoint?: ContactPoint;
  boardAngle?: BoardAngle;
  whichTruckCrosses?: TruckCrossing;
  entryRotation?: EntryRotation;
  transferTrickId?: string;
}

export interface UnderlyingMovements {
  boardSpinDeg: number; // 0, 180, 360, 540
  boardSpinDir: Direction; // 'none' | 'frontside' | 'backside'
  boardFlip: 'none' | 'kickflip' | 'double_kickflip' | 'heelflip' | 'double_heelflip' | 'vertical_wrap';
  bodyRotationDeg: number; // 0, 180, 360
  bodyRotationDir: Direction; // 'none' | 'frontside' | 'backside'
  isLateRotation?: boolean;
  lateRotationDeg?: number;
  lateRotationDir?: Direction;
  isBodyVarialOnly?: boolean;
  landingPosition?: LandingPosition;
  revertDirection?: RevertDirection;
}

export interface SingleTrickParameters {
  stance: Stance;
  direction: Direction;
  baseTrickId: string;
  bodyVarial: BodyVarial;
  landing: LandingPosition;
  revert: RevertDirection;
  movements?: UnderlyingMovements;
}

export interface ObstacleComponent {
  obstacleType: ObstacleType;
  approach: 'frontside' | 'backside';
  obstacleTrickId: string;
  entryTrickId: string;
  exitTrick: string; // 'clean' | 'revert_fs' | 'revert_bs' | 'kickflip_out' | 'shuvit_out'
  transferTrickId?: string; // Optional combo transfer: e.g. "to BS 50-50"
  transferApproach?: 'frontside' | 'backside';
  mechanics?: ObstacleMechanics;
}

export interface ComboStep {
  stepNumber: number;
  parameters: SingleTrickParameters;
  resolvedName: string;
  landingState: {
    resultStance: Stance;
    travelDirection: 'forward' | 'backward';
    boardPosition: LandingPosition;
  };
  breakdown: string;
  movements?: UnderlyingMovements;
}

export type TrickMode = 'single' | 'combo' | 'obstacle';

export type SkateClass = 'C' | 'B' | 'A';
export interface GeneratedTrickResult {
  skateClass?: SkateClass;
  complexity?: ComplexityTier;
  mode: TrickMode;
  canonicalName: string;
  breakdown: string[];
  singleTrick?: SingleTrickParameters;
  movements?: UnderlyingMovements;
  comboSteps?: ComboStep[];
  obstacleData?: ObstacleComponent;
  catalogVersion: string;
}

export interface SetupData {
  favorite?: boolean;
  usedAt?: string;
  partIds?: Partial<Record<PartKind,string>>;
  partsSnapshot?: Partial<Record<PartKind,InventoryPart>>;
  deckModel?: string;
  truckModel?: string;
  wheelModel?: string;
  id: string;
  name: string;
  deckWidthMm: number; // 26, 29, 31, 32, 33, 33.6, 34, 36, or custom
  isCustomDeckWidth?: boolean;
  wheelMaterial: WheelMaterial;
  shape?: DeckShape;
  mold?: DeckMold;
  surface?: string;
  obstacleType?: ObstacleType;
  difficultyRating?: number; // 1-5
  notes?: string;
}

export interface CounterActionHistoryItem {
  action: 'attempt' | 'landing' | 'status_change';
  timestamp: number;
  prevAttemptCount: number;
  prevLandingCount: number;
  prevFirstLandingAttemptNumber?: number;
  prevFirstLandingElapsedMs?: number;
  prevCurrentLandingStreak?: number;
  prevBestLandingStreak?: number;
  prevMissTagCounts?: MissTagCounts;
  missTags?: MissTag[];
  prevStatus: SessionStatus;
}

export interface PracticeSession {
  goal?: {type:'landings'|'streak';target:number};
  practiceTimer?: {type:'regular'|'countdown';durationMs?:number};
  practiceSurface?:string;
  parkedAt?:string;
  outcomeReviewPending?:boolean;
  endedReason?:'manual'|'countdown';
  sharedChallenge?: SharedChallengeLink;
  cloudRevision?: number;
  currentLandingStreak?: number;
  bestLandingStreak?: number;
  consistencyGoal?: number;
  missTagCounts?: MissTagCounts;
  id: string;
  trickResult: GeneratedTrickResult;
  setupSnapshot: SetupData;
  status: SessionStatus;
  generatedAt: string; // ISO
  sessionStartedAt?: string; // ISO
  sessionEndedAt?: string; // ISO
  attemptCount: number;
  landingCount: number;
  firstLandingAttemptNumber?: number;
  firstLandingElapsedMs?: number; // Active practice time at first landing; excludes pauses
  activeDurationMs: number;
  timerState: {
    isRunning: boolean;
    lastStartedTimestamp?: number;
    accumulatedMs: number;
  };
  difficultyRating: number; // 1-5
  notes: string;
  history: CounterActionHistoryItem[];
}

export interface ChallengeBookmark {
  id: string;
  savedAt: string;
  trickResult: GeneratedTrickResult;
}

export interface GeneratorPresetConfig {
  skateClass?: SkateClass;
  complexityFilter?: ComplexityFilter;
  mode: TrickMode;
  singleLocks: ParameterLocks;
  singleExclusions: ParameterExclusions;
  step1Locks: ParameterLocks;
  step2Locks: ParameterLocks;
  step1Exclusions: ParameterExclusions;
  step2Exclusions: ParameterExclusions;
  obstacleLocks: ParameterLocks;
  obstacleExclusions: ObstacleExclusions;
  activeParams: SingleTrickParameters;
  step1Params: SingleTrickParameters;
  step2Params: SingleTrickParameters;
  selectedObstacle: ObstacleType;
  obstacleData: ObstacleComponent;
}

export interface PoolPreset {
  id: string;
  name: string;
  savedAt: string;
  config: GeneratorPresetConfig;
}

export interface TrickLibraryEntry {
  id: string;
  trickResult: GeneratedTrickResult;
  status: TrickLearningStatus;
  addedAt: string;
  updatedAt: string;
}

export interface RiderShowcaseSettings { bio:string; goal:string; accent:'mustard'|'blue'|'purple'|'green'; featuredTricks:string[]; featuredMilestones:string[]; featuredSetupId:string; showStats:boolean; }

export interface UserProfile {
  partsInventory?: InventoryPart[];
  onboarding?: OnboardingData;
  showcase?: RiderShowcaseSettings;
  cloudRevision?: number;
  importedLocalProfiles?: string[];
  dashboardPreferences?: DashboardPreferences;
  trickLibrary?: TrickLibraryEntry[];
  bookmarks?: ChallengeBookmark[];
  poolPresets?: PoolPreset[];
  id: string;
  displayName: string;
  instagramHandle?: string;
  email?: string;
  preferredTheme: 'light' | 'dark' | 'system';
  defaultSetupId?: string;
  savedSetups: SetupData[];
  availableObstacles: ObstacleType[];
  preferredDifficultyRange?: [number, number]; // e.g. [1, 5]
}
