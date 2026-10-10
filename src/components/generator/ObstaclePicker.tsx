import React from 'react';
import { TRANSFER_OPTIONS } from '../../domain/obstacleTransfers';
import {
  ObstacleType,
  ObstacleComponent,
  ParameterLocks,
  ObstacleExclusions,
} from '../../domain/types';
import { getObstacleTricksForObstacle, OBSTACLE_TRICKS, getObstacleTrickById } from '../../domain/obstacleCatalog';
import { BASE_TRICKS } from '../../domain/catalog';
import { Lock, Unlock, Layers, Compass, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { ItemPoolSelector } from './ItemPoolSelector';
import {
  resolveObstacleMechanics,
  formatObstacleTrickCanonicalName,
  formatObstacleMechanicsSummary,
} from '../../domain/obstacleMechanics';

interface ObstaclePickerProps {
  selectedObstacle: ObstacleType;
  onChangeObstacle: (obs: ObstacleType) => void;
  obstacleData?: ObstacleComponent;
  onChangeObstacleData?: (data: ObstacleComponent) => void;
  availableObstacles: ObstacleType[];
  locks: ParameterLocks;
  exclusions?: ObstacleExclusions;
  onToggleLock: (key: keyof ParameterLocks, value?: any) => void;
  onToggleExclude: (category: keyof ObstacleExclusions, id: string) => void;
  onResetExclusions: (category: keyof ObstacleExclusions) => void;
}

export const ObstaclePicker: React.FC<ObstaclePickerProps> = ({
  selectedObstacle,
  onChangeObstacle,
  obstacleData,
  onChangeObstacleData,
  locks,
  exclusions = {},
  onToggleLock,
  onToggleExclude,
  onResetExclusions,
}) => {
  const allObstacles: { id: ObstacleType; label: string }[] = [
    { id: 'ledge', label: 'Ledge' },
    { id: 'rail', label: 'Rail' },
  ];

  const currentAvailableTricks = getObstacleTricksForObstacle(selectedObstacle);

  const handleUpdateField = (field: keyof ObstacleComponent, value: any) => {
    if (!obstacleData || !onChangeObstacleData) return;
    onChangeObstacleData({
      ...obstacleData,
      [field]: value,
    });
  };

  // Derive live preview and mechanics
  const liveMechanics = obstacleData ? resolveObstacleMechanics(obstacleData) : null;
  const liveCanonicalName = obstacleData ? formatObstacleTrickCanonicalName(obstacleData) : '';

  const exitOptions = [
    { id: 'clean', label: 'Clean Landing' },
    { id: 'kickflip_out', label: 'Kickflip Out' },
    { id: 'nollie_flip_out', label: 'Nollie Flip Out' },
    { id: 'shuvit_out', label: 'Shuvit Out' },
    { id: 'revert_fs', label: 'to FS Revert' },
    { id: 'revert_bs', label: 'to BS Revert' },
    { id: 'to_fakie', label: 'to Fakie' },
    { id: 'ollie_out', label: 'Ollie Out' },
    { id: 'nollie_out', label: 'Nollie Out' },
  ];

  const entryTrickOptions = [
    { id: 'ollie', label: 'Ollie' },
    { id: 'kickflip', label: 'Kickflip' },
    { id: 'heelflip', label: 'Heelflip' },
    { id: 'pop_shuvit', label: 'Pop Shuvit' },
    { id: 'frontside_pop_shuvit', label: 'FS Pop Shuvit' },
    { id: 'varial_kickflip', label: 'Varial Kickflip' },
    { id: 'hardflip', label: 'Hardflip' },
    { id: 'tre_flip', label: 'Tre Flip' },
  ];

  // Group current available tricks by category
  const basicGrinds = currentAvailableTricks.filter((t) => t.category === 'basic_grind');
  const angledGrinds = currentAvailableTricks.filter((t) => t.category === 'angled_grind');
  const slides = currentAvailableTricks.filter((t) => t.category === 'slide');
  const rotationalEntries = currentAvailableTricks.filter((t) => t.category === 'rotational_entry');

  return (
    <div className="ds-surface bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 gap-2">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            Obstacle Setup, Mechanics & Locks
          </h2>
          <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-0.5">
            Configures approach side (chest vs back facing), contact point, board angle, truck crossing, and exits.
          </p>
        </div>
      </div>

      {/* Primary Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Obstacle Type */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Obstacle Type
            </label>
            <ItemPoolSelector
              label="Obstacles"
              items={allObstacles}
              excludedIds={exclusions.obstacles || []}
              onToggleExclude={(id) => onToggleExclude('obstacles', id)}
              onResetExclusions={() => onResetExclusions('obstacles')}
            />
          </div>
          <select
            value={selectedObstacle}
            onChange={(e) => onChangeObstacle(e.target.value as ObstacleType)}
            className="w-full text-xs font-medium bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md px-2.5 py-1.5 text-neutral-900 dark:text-white"
          >
            {allObstacles.map((obs) => (
              <option key={obs.id} value={obs.id}>
                {obs.label} {exclusions.obstacles?.includes(obs.id) ? '(Excluded)' : ''}
              </option>
            ))}
          </select>
        </div>

        {selectedObstacle !== 'flatground' && obstacleData && (
          <>
            {/* 2. Approach Side */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Approach Side (FS / BS)
                </label>
                <div className="flex items-center gap-1">
                  <ItemPoolSelector
                    label="Approach"
                    items={[
                      { id: 'frontside', label: 'Frontside (Chest Facing)' },
                      { id: 'backside', label: 'Backside (Back Facing)' },
                    ]}
                    excludedIds={exclusions.approaches || []}
                    onToggleExclude={(id) => onToggleExclude('approaches', id)}
                    onResetExclusions={() => onResetExclusions('approaches')}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onToggleLock(
                        'approach',
                        locks.approach ? undefined : obstacleData.approach
                      )
                    }
                    className={`p-1 rounded cursor-pointer ${
                      locks.approach
                        ? 'text-amber-700 dark:text-amber-400 bg-amber-500/10'
                        : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900'
                    }`}
                  >
                    {locks.approach ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <select
                value={locks.approach || obstacleData.approach}
                onChange={(e) => handleUpdateField('approach', e.target.value)}
                className="w-full text-xs font-medium bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md px-2.5 py-1.5 text-neutral-900 dark:text-white"
              >
                <option value="frontside">
                  Frontside (Chest Facing) {exclusions.approaches?.includes('frontside') ? '(Excluded)' : ''}
                </option>
                <option value="backside">
                  Backside (Back Facing) {exclusions.approaches?.includes('backside') ? '(Excluded)' : ''}
                </option>
              </select>
            </div>

            {/* 3. Obstacle Grind / Slide */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Grind / Slide Lock
                </label>
                <div className="flex items-center gap-1">
                  <ItemPoolSelector
                    label="Grinds & Slides"
                    items={currentAvailableTricks.map((t) => ({ id: t.id, label: t.name }))}
                    excludedIds={exclusions.obstacleTrickIds || []}
                    onToggleExclude={(id) => onToggleExclude('obstacleTrickIds', id)}
                    onResetExclusions={() => onResetExclusions('obstacleTrickIds')}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onToggleLock(
                        'obstacleTrickId',
                        locks.obstacleTrickId ? undefined : obstacleData.obstacleTrickId
                      )
                    }
                    className={`p-1 rounded cursor-pointer ${
                      locks.obstacleTrickId
                        ? 'text-amber-700 dark:text-amber-400 bg-amber-500/10'
                        : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900'
                    }`}
                  >
                    {locks.obstacleTrickId ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <select
                value={locks.obstacleTrickId || obstacleData.obstacleTrickId}
                onChange={(e) => handleUpdateField('obstacleTrickId', e.target.value)}
                className="w-full text-xs font-medium bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md px-2.5 py-1.5 text-neutral-900 dark:text-white"
              >
                {basicGrinds.length > 0 && (
                  <optgroup label="Basic Grinds & Angles">
                    {basicGrinds.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {exclusions.obstacleTrickIds?.includes(t.id) ? '(Excluded)' : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
                {angledGrinds.length > 0 && (
                  <optgroup label="Dipped & Angled Grinds">
                    {angledGrinds.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {exclusions.obstacleTrickIds?.includes(t.id) ? '(Excluded)' : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
                {slides.length > 0 && (
                  <optgroup label="Slides (Center, Nose, Tail, Blunt)">
                    {slides.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {exclusions.obstacleTrickIds?.includes(t.id) ? '(Excluded)' : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
                {rotationalEntries.length > 0 && (
                  <optgroup label="Rotational Entries (Special Names)">
                    {rotationalEntries.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {exclusions.obstacleTrickIds?.includes(t.id) ? '(Excluded)' : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* 4. Entry Trick */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Entry Trick (Pop / Flip)
                </label>
                <div className="flex items-center gap-1">
                  <ItemPoolSelector
                    label="Entry Tricks"
                    items={entryTrickOptions}
                    excludedIds={exclusions.entryTrickIds || []}
                    onToggleExclude={(id) => onToggleExclude('entryTrickIds', id)}
                    onResetExclusions={() => onResetExclusions('entryTrickIds')}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onToggleLock(
                        'entryTrickId',
                        locks.entryTrickId ? undefined : obstacleData.entryTrickId
                      )
                    }
                    className={`p-1 rounded cursor-pointer ${
                      locks.entryTrickId
                        ? 'text-amber-700 dark:text-amber-400 bg-amber-500/10'
                        : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900'
                    }`}
                  >
                    {locks.entryTrickId ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <select
                value={locks.entryTrickId || obstacleData.entryTrickId}
                onChange={(e) => handleUpdateField('entryTrickId', e.target.value)}
                className="w-full text-xs font-medium bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md px-2.5 py-1.5 text-neutral-900 dark:text-white capitalize"
              >
                {entryTrickOptions.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label} {exclusions.entryTrickIds?.includes(entry.id) ? '(Excluded)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {selectedObstacle !== 'flatground' && obstacleData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-neutral-200 dark:border-neutral-800">
          {/* 5. Exit Trick */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Exit Trick / Landing
              </label>
              <button
                type="button"
                onClick={() =>
                  onToggleLock(
                    'exitTrick',
                    locks.exitTrick ? undefined : obstacleData.exitTrick
                  )
                }
                className={`p-1 rounded cursor-pointer ${
                  locks.exitTrick
                    ? 'text-amber-700 dark:text-amber-400 bg-amber-500/10'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900'
                }`}
              >
                {locks.exitTrick ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>
            </div>
            <select
              value={locks.exitTrick || obstacleData.exitTrick}
              onChange={(e) => handleUpdateField('exitTrick', e.target.value)}
              className="w-full text-xs font-medium bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md px-2.5 py-1.5 text-neutral-900 dark:text-white"
            >
              {exitOptions.map((exit) => (
                <option key={exit.id} value={exit.id}>
                  {exit.label}
                </option>
              ))}
            </select>
          </div>

          {/* 6. Combo Transfer (Optional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Transfer to Second Grind / Slide (Optional)
              </label>
              <div className="flex items-center gap-1 shrink-0">
                <ItemPoolSelector
                  label="Transfers"
                  items={TRANSFER_OPTIONS}
                  excludedIds={exclusions.transferTrickIds || []}
                  onToggleExclude={(id) => onToggleExclude('transferTrickIds', id)}
                  onResetExclusions={() => onResetExclusions('transferTrickIds')}
                />
                <button
                  type="button"
                  aria-label={locks.transferTrickId !== undefined ? 'Unlock transfer' : 'Lock transfer'}
                  aria-pressed={locks.transferTrickId !== undefined}
                  onClick={() => onToggleLock('transferTrickId',
                    locks.transferTrickId !== undefined ? undefined : (obstacleData.transferTrickId || ''))}
                  className={`p-1 rounded cursor-pointer ${locks.transferTrickId !== undefined
                    ? 'text-amber-700 dark:text-amber-400 bg-amber-500/10'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900'}`}
                >
                  {locks.transferTrickId !== undefined ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <select
              value={locks.transferTrickId ?? obstacleData.transferTrickId ?? ''}
              onChange={(e) => {
                handleUpdateField('transferTrickId', e.target.value || undefined);
                if (locks.transferTrickId !== undefined) onToggleLock('transferTrickId', e.target.value);
              }}
              className="w-full text-xs font-medium bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md px-2.5 py-1.5 text-neutral-900 dark:text-white"
            >
              {TRANSFER_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label} {exclusions.transferTrickIds?.includes(option.id) ? '(Excluded)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Real-time Physical Mechanics Badge / Card */}
      {selectedObstacle !== 'flatground' && obstacleData && liveMechanics && (
        <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/90 dark:border-neutral-800/90 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-500" />
              <span>Obstacle Kinematics & Physical Lock Matrix</span>
            </div>
            {liveMechanics.isSpecialRotationalEntry && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                Special Rotational Entry
              </span>
            )}
          </div>

          <div className="text-base font-bold text-neutral-950 dark:text-white">
            {liveCanonicalName}
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800">
              Approach: {liveMechanics.approach === 'frontside' ? 'Frontside (Chest Facing)' : 'Backside (Back Facing)'}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800">
              Contact: {liveMechanics.contactPoint.replace('_', ' ')}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800">
              Angle: {liveMechanics.boardAngle.replace('_', ' ')}
            </span>
            {liveMechanics.whichTruckCrosses !== 'none' && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800">
                Truck Crosses: {liveMechanics.whichTruckCrosses.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
