import React from 'react';
import {
  Stance,
  Direction,
  BodyVarial,
  LandingPosition,
  RevertDirection,
  ParameterLocks,
  ParameterExclusions,
} from '../../domain/types';
import { BASE_TRICKS } from '../../domain/catalog';
import { getCompatibleOptionsForLocks } from '../../domain/rules';
import { Lock, Unlock, RotateCcw } from 'lucide-react';
import { ItemPoolSelector } from './ItemPoolSelector';

interface ParameterSelectorProps {
  locks: ParameterLocks;
  exclusions?: ParameterExclusions;
  onToggleLock: (key: keyof ParameterLocks, value?: any) => void;
  onClearLocks: () => void;
  onToggleExclude: (category: keyof ParameterExclusions, id: string) => void;
  onResetExclusions: (category: keyof ParameterExclusions) => void;
  activeValues: {
    stance: Stance;
    direction: Direction;
    baseTrickId: string;
    bodyVarial: BodyVarial;
    landing: LandingPosition;
    revert: RevertDirection;
  };
  onChangeValue: (key: keyof ParameterLocks, value: any) => void;
}

export const ParameterSelector: React.FC<ParameterSelectorProps> = ({
  locks,
  exclusions = {},
  onToggleLock,
  onClearLocks,
  onToggleExclude,
  onResetExclusions,
  activeValues,
  onChangeValue,
}) => {
  const compatible = getCompatibleOptionsForLocks(locks, exclusions);
  const activeLockCount = Object.keys(locks).filter((k) => locks[k as keyof ParameterLocks] !== undefined).length;
  const totalExcludedCount = Object.values(exclusions).reduce(
    (acc, arr) => acc + (arr ? arr.length : 0),
    0
  );

  return (
    <div className="mobile-parameter-card bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-neutral-200 dark:border-neutral-800 gap-2">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Trick parameters
          </h2>
          <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-0.5">
            Choose a value, lock it, or customize its pool.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeLockCount > 0 && (
            <button
              onClick={onClearLocks}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 rounded-md transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Clear {activeLockCount} Lock{activeLockCount > 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Stance */}
        <ParameterRow
          label="Stance"
          isLocked={locks.stance !== undefined}
          onToggleLock={() =>
            onToggleLock('stance', locks.stance !== undefined ? undefined : activeValues.stance)
          }
          poolControl={
            <ItemPoolSelector
              label="Stance"
              items={[
                { id: 'regular', label: 'Regular' },
                { id: 'fakie', label: 'Fakie' },
                { id: 'switch', label: 'Switch' },
                { id: 'nollie', label: 'Nollie' },
              ]}
              excludedIds={exclusions.stances || []}
              onToggleExclude={(id) => onToggleExclude('stances', id)}
              onResetExclusions={() => onResetExclusions('stances')}
            />
          }
        >
          <select
            value={locks.stance || activeValues.stance}
            onChange={(e) => onChangeValue('stance', e.target.value as Stance)}
            className="w-full text-xs font-medium bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md px-2.5 py-1.5 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
          >
            {(['regular', 'fakie', 'switch', 'nollie'] as Stance[]).map((s) => {
              const isExcluded = exclusions.stances?.includes(s);
              return (
                <option key={s} value={s}>
                  {capitalize(s)} {isExcluded ? '(Excluded from random)' : ''}
                </option>
              );
            })}
          </select>
        </ParameterRow>

        {/* 2. Direction */}
        <ParameterRow
          label="Direction / Rotation"
          isLocked={locks.direction !== undefined}
          onToggleLock={() =>
            onToggleLock('direction', locks.direction !== undefined ? undefined : activeValues.direction)
          }
          poolControl={
            <ItemPoolSelector
              label="Direction"
              items={[
                { id: 'none', label: 'Straight (None)' },
                { id: 'frontside', label: 'Frontside 180' },
                { id: 'backside', label: 'Backside 180' },
              ]}
              excludedIds={exclusions.directions || []}
              onToggleExclude={(id) => onToggleExclude('directions', id)}
              onResetExclusions={() => onResetExclusions('directions')}
            />
          }
        >
          <select
            value={locks.direction || activeValues.direction}
            onChange={(e) => onChangeValue('direction', e.target.value as Direction)}
            className="w-full text-xs font-medium bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md px-2.5 py-1.5 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
          >
            <option value="none">
              Straight (None) {exclusions.directions?.includes('none') ? '(Excluded)' : ''}
            </option>
            <option
              value="frontside"
              disabled={!compatible.compatibleDirections.includes('frontside')}
            >
              Frontside 180 {exclusions.directions?.includes('frontside') ? '(Excluded)' : ''} {!compatible.compatibleDirections.includes('frontside') ? '(Incompatible)' : ''}
            </option>
            <option
              value="backside"
              disabled={!compatible.compatibleDirections.includes('backside')}
            >
              Backside 180 {exclusions.directions?.includes('backside') ? '(Excluded)' : ''} {!compatible.compatibleDirections.includes('backside') ? '(Incompatible)' : ''}
            </option>
          </select>
        </ParameterRow>

        {/* 3. Base Trick */}
        <ParameterRow
          label="Base Trick"
          isLocked={locks.baseTrickId !== undefined}
          onToggleLock={() =>
            onToggleLock('baseTrickId', locks.baseTrickId !== undefined ? undefined : activeValues.baseTrickId)
          }
          poolControl={
            <ItemPoolSelector
              label="Base Trick"
              items={BASE_TRICKS.map((t) => ({ id: t.id, label: t.name }))}
              excludedIds={exclusions.baseTrickIds || []}
              onToggleExclude={(id) => onToggleExclude('baseTrickIds', id)}
              onResetExclusions={() => onResetExclusions('baseTrickIds')}
            />
          }
        >
          <select
            value={locks.baseTrickId || activeValues.baseTrickId}
            onChange={(e) => onChangeValue('baseTrickId', e.target.value)}
            className="w-full text-xs font-medium bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md px-2.5 py-1.5 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
          >
            {BASE_TRICKS.map((t) => {
              const isComp = compatible.compatibleBaseTricks.includes(t.id);
              const isExcluded = exclusions.baseTrickIds?.includes(t.id);
              return (
                <option key={t.id} value={t.id} disabled={!isComp}>
                  {t.name} {isExcluded ? '(Excluded)' : ''} {!isComp ? '(Incompatible)' : ''}
                </option>
              );
            })}
          </select>
        </ParameterRow>

        {/* 4. Body Varial */}
        <ParameterRow
          label="Body Varial"
          isLocked={locks.bodyVarial !== undefined}
          onToggleLock={() =>
            onToggleLock('bodyVarial', locks.bodyVarial !== undefined ? undefined : activeValues.bodyVarial)
          }
          poolControl={
            <ItemPoolSelector
              label="Body Varial"
              items={[
                { id: 'none', label: 'None' },
                { id: 'frontside', label: 'FS Body Varial' },
                { id: 'backside', label: 'BS Body Varial (Sex Change)' },
              ]}
              excludedIds={exclusions.bodyVarials || []}
              onToggleExclude={(id) => onToggleExclude('bodyVarials', id)}
              onResetExclusions={() => onResetExclusions('bodyVarials')}
            />
          }
        >
          <select
            value={locks.bodyVarial || activeValues.bodyVarial}
            onChange={(e) => onChangeValue('bodyVarial', e.target.value as BodyVarial)}
            className="w-full text-xs font-medium bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md px-2.5 py-1.5 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
          >
            <option value="none">None {exclusions.bodyVarials?.includes('none') ? '(Excluded)' : ''}</option>
            <option
              value="frontside"
              disabled={!compatible.compatibleBodyVarials.includes('frontside')}
            >
              Frontside 180° {exclusions.bodyVarials?.includes('frontside') ? '(Excluded)' : ''} {!compatible.compatibleBodyVarials.includes('frontside') ? '(Incompatible)' : ''}
            </option>
            <option
              value="backside"
              disabled={!compatible.compatibleBodyVarials.includes('backside')}
            >
              Backside 180° (Sex Change) {exclusions.bodyVarials?.includes('backside') ? '(Excluded)' : ''} {!compatible.compatibleBodyVarials.includes('backside') ? '(Incompatible)' : ''}
            </option>
          </select>
        </ParameterRow>

        {/* 5. Landing */}
        <ParameterRow
          label="Landing Position"
          isLocked={locks.landing !== undefined}
          onToggleLock={() =>
            onToggleLock('landing', locks.landing !== undefined ? undefined : activeValues.landing)
          }
          poolControl={
            <ItemPoolSelector
              label="Landing"
              items={[
                { id: 'normal', label: 'Normal (All wheels)' },
                { id: 'manual', label: 'Manual (Back wheels)' },
                { id: 'nose_manual', label: 'Nose Manual (Front wheels)' },
              ]}
              excludedIds={exclusions.landings || []}
              onToggleExclude={(id) => onToggleExclude('landings', id)}
              onResetExclusions={() => onResetExclusions('landings')}
            />
          }
        >
          <select
            value={locks.landing || activeValues.landing}
            onChange={(e) => onChangeValue('landing', e.target.value as LandingPosition)}
            className="w-full text-xs font-medium bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md px-2.5 py-1.5 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
          >
            <option value="normal">Normal (All wheels) {exclusions.landings?.includes('normal') ? '(Excluded)' : ''}</option>
            <option
              value="manual"
              disabled={!compatible.compatibleLandings.includes('manual')}
            >
              to Manual {exclusions.landings?.includes('manual') ? '(Excluded)' : ''} {!compatible.compatibleLandings.includes('manual') ? '(Incompatible)' : ''}
            </option>
            <option
              value="nose_manual"
              disabled={!compatible.compatibleLandings.includes('nose_manual')}
            >
              to Nose Manual {exclusions.landings?.includes('nose_manual') ? '(Excluded)' : ''} {!compatible.compatibleLandings.includes('nose_manual') ? '(Incompatible)' : ''}
            </option>
          </select>
        </ParameterRow>

        {/* 6. Revert */}
        <ParameterRow
          label="Exit Revert"
          isLocked={locks.revert !== undefined}
          onToggleLock={() =>
            onToggleLock('revert', locks.revert !== undefined ? undefined : activeValues.revert)
          }
          poolControl={
            <ItemPoolSelector
              label="Revert"
              items={[
                { id: 'none', label: 'None' },
                { id: 'frontside', label: 'FS Revert (180°)' },
                { id: 'backside', label: 'BS Revert (180°)' },
              ]}
              excludedIds={exclusions.reverts || []}
              onToggleExclude={(id) => onToggleExclude('reverts', id)}
              onResetExclusions={() => onResetExclusions('reverts')}
            />
          }
        >
          <select
            value={locks.revert || activeValues.revert}
            onChange={(e) => onChangeValue('revert', e.target.value as RevertDirection)}
            className="w-full text-xs font-medium bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md px-2.5 py-1.5 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
          >
            <option value="none">None {exclusions.reverts?.includes('none') ? '(Excluded)' : ''}</option>
            <option
              value="frontside"
              disabled={!compatible.compatibleReverts.includes('frontside')}
            >
              FS Revert {exclusions.reverts?.includes('frontside') ? '(Excluded)' : ''} {!compatible.compatibleReverts.includes('frontside') ? '(Incompatible)' : ''}
            </option>
            <option
              value="backside"
              disabled={!compatible.compatibleReverts.includes('backside')}
            >
              BS Revert {exclusions.reverts?.includes('backside') ? '(Excluded)' : ''} {!compatible.compatibleReverts.includes('backside') ? '(Incompatible)' : ''}
            </option>
          </select>
        </ParameterRow>
      </div>
    </div>
  );
};

interface ParameterRowProps {
  label: string;
  isLocked: boolean;
  onToggleLock: () => void;
  poolControl?: React.ReactNode;
  children: React.ReactNode;
}

const ParameterRow: React.FC<ParameterRowProps> = ({
  label,
  isLocked,
  onToggleLock,
  poolControl,
  children,
}) => {
  return (
    <div className="mobile-parameter-row space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
        <div className="flex items-center gap-1">
          {poolControl}
          <button
            type="button"
            onClick={onToggleLock}
            title={isLocked ? `Unlock ${label}` : `Lock ${label}`}
            aria-label={isLocked ? `Unlock ${label}` : `Lock ${label}`}
            className={`p-1 rounded transition-colors cursor-pointer ${
              isLocked
                ? 'text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      {children}
    </div>
  );
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
