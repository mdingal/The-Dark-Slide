import React from 'react';
import {
  ComboStep,
  ParameterLocks,
  ParameterExclusions,
  SingleTrickParameters,
  Stance,
  Direction,
  BodyVarial,
  LandingPosition,
  RevertDirection,
} from '../../domain/types';
import { BASE_TRICKS } from '../../domain/catalog';
import { Lock, Unlock, RotateCcw } from 'lucide-react';
import { ItemPoolSelector } from './ItemPoolSelector';

interface ComboStepEditorProps {
  steps?: ComboStep[];
  step1Locks: ParameterLocks;
  step2Locks: ParameterLocks;
  step1Exclusions?: ParameterExclusions;
  step2Exclusions?: ParameterExclusions;
  step1Params: SingleTrickParameters;
  step2Params: SingleTrickParameters;
  onToggleStep1Lock: (key: keyof ParameterLocks, value?: any) => void;
  onToggleStep2Lock: (key: keyof ParameterLocks, value?: any) => void;
  onToggleStep1Exclude: (category: keyof ParameterExclusions, id: string) => void;
  onToggleStep2Exclude: (category: keyof ParameterExclusions, id: string) => void;
  onResetStep1Exclusions: (category: keyof ParameterExclusions) => void;
  onResetStep2Exclusions: (category: keyof ParameterExclusions) => void;
  onChangeStep1Param: (key: keyof ParameterLocks, value: any) => void;
  onChangeStep2Param: (key: keyof ParameterLocks, value: any) => void;
}

export const ComboStepEditor: React.FC<ComboStepEditorProps> = ({
  steps,
  step1Locks,
  step2Locks,
  step1Exclusions = {},
  step2Exclusions = {},
  step1Params,
  step2Params,
  onToggleStep1Lock,
  onToggleStep2Lock,
  onToggleStep1Exclude,
  onToggleStep2Exclude,
  onResetStep1Exclusions,
  onResetStep2Exclusions,
  onChangeStep1Param,
  onChangeStep2Param,
}) => {
  const step1 = steps?.[0];
  const step2 = steps?.[1];

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Two-Trick Combo Sequence Parameters & Pools
          </h2>
          <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-0.5">
            Configure dropdowns, locks, and item pool exclusions for both Step 1 and Step 2.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1 Column */}
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <span className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
                Step 1 (Lead Trick)
              </span>
              <div className="text-sm font-bold text-neutral-900 dark:text-white mt-1">
                {step1 ? step1.resolvedName : 'Ready'}
              </div>
            </div>
            {step1 && (
              <span className="text-[10px] font-mono bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-700 dark:text-neutral-300">
                Lands: {step1.landingState.resultStance} · {step1.landingState.boardPosition}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {/* Step 1 Stance */}
            <StepParamField
              label="Stance"
              isLocked={step1Locks.stance !== undefined}
              onToggleLock={() =>
                onToggleStep1Lock('stance', step1Locks.stance ? undefined : step1Params.stance)
              }
              pool={
                <ItemPoolSelector
                  label="Step 1 Stance"
                  items={[
                    { id: 'regular', label: 'Regular' },
                    { id: 'fakie', label: 'Fakie' },
                    { id: 'switch', label: 'Switch' },
                    { id: 'nollie', label: 'Nollie' },
                  ]}
                  excludedIds={step1Exclusions.stances || []}
                  onToggleExclude={(id) => onToggleStep1Exclude('stances', id)}
                  onResetExclusions={() => onResetStep1Exclusions('stances')}
                />
              }
            >
              <select
                value={step1Locks.stance || step1Params.stance}
                onChange={(e) => onChangeStep1Param('stance', e.target.value as Stance)}
                className="w-full text-xs font-medium bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2.5 py-1.5 text-neutral-900 dark:text-white"
              >
                {(['regular', 'fakie', 'switch', 'nollie'] as Stance[]).map((s) => (
                  <option key={s} value={s}>
                    {s.toUpperCase()} {step1Exclusions.stances?.includes(s) ? '(Excluded)' : ''}
                  </option>
                ))}
              </select>
            </StepParamField>

            {/* Step 1 Base Trick */}
            <StepParamField
              label="Base Trick"
              isLocked={step1Locks.baseTrickId !== undefined}
              onToggleLock={() =>
                onToggleStep1Lock(
                  'baseTrickId',
                  step1Locks.baseTrickId ? undefined : step1Params.baseTrickId
                )
              }
              pool={
                <ItemPoolSelector
                  label="Step 1 Tricks"
                  items={BASE_TRICKS.map((t) => ({ id: t.id, label: t.name }))}
                  excludedIds={step1Exclusions.baseTrickIds || []}
                  onToggleExclude={(id) => onToggleStep1Exclude('baseTrickIds', id)}
                  onResetExclusions={() => onResetStep1Exclusions('baseTrickIds')}
                />
              }
            >
              <select
                value={step1Locks.baseTrickId || step1Params.baseTrickId}
                onChange={(e) => onChangeStep1Param('baseTrickId', e.target.value)}
                className="w-full text-xs font-medium bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2.5 py-1.5 text-neutral-900 dark:text-white"
              >
                {BASE_TRICKS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {step1Exclusions.baseTrickIds?.includes(t.id) ? '(Excluded)' : ''}
                  </option>
                ))}
              </select>
            </StepParamField>

            {/* Step 1 Direction */}
            <StepParamField
              label="Rotation / Direction"
              isLocked={step1Locks.direction !== undefined}
              onToggleLock={() =>
                onToggleStep1Lock(
                  'direction',
                  step1Locks.direction ? undefined : step1Params.direction
                )
              }
              pool={
                <ItemPoolSelector
                  label="Step 1 Direction"
                  items={[
                    { id: 'none', label: 'Straight' },
                    { id: 'frontside', label: 'Frontside 180' },
                    { id: 'backside', label: 'Backside 180' },
                  ]}
                  excludedIds={step1Exclusions.directions || []}
                  onToggleExclude={(id) => onToggleStep1Exclude('directions', id)}
                  onResetExclusions={() => onResetStep1Exclusions('directions')}
                />
              }
            >
              <select
                value={step1Locks.direction || step1Params.direction}
                onChange={(e) => onChangeStep1Param('direction', e.target.value as Direction)}
                className="w-full text-xs font-medium bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2.5 py-1.5 text-neutral-900 dark:text-white"
              >
                <option value="none">Straight</option>
                <option value="frontside">Frontside 180</option>
                <option value="backside">Backside 180</option>
              </select>
            </StepParamField>

            {/* Step 1 Landing */}
            <StepParamField
              label="Landing Position"
              isLocked={step1Locks.landing !== undefined}
              onToggleLock={() =>
                onToggleStep1Lock('landing', step1Locks.landing ? undefined : step1Params.landing)
              }
              pool={
                <ItemPoolSelector
                  label="Step 1 Landing"
                  items={[
                    { id: 'normal', label: 'Normal' },
                    { id: 'manual', label: 'Manual' },
                    { id: 'nose_manual', label: 'Nose Manual' },
                  ]}
                  excludedIds={step1Exclusions.landings || []}
                  onToggleExclude={(id) => onToggleStep1Exclude('landings', id)}
                  onResetExclusions={() => onResetStep1Exclusions('landings')}
                />
              }
            >
              <select
                value={step1Locks.landing || step1Params.landing}
                onChange={(e) => onChangeStep1Param('landing', e.target.value as LandingPosition)}
                className="w-full text-xs font-medium bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2.5 py-1.5 text-neutral-900 dark:text-white"
              >
                <option value="normal">Normal</option>
                <option value="manual">Manual (Back wheels)</option>
                <option value="nose_manual">Nose Manual (Front wheels)</option>
              </select>
            </StepParamField>
          </div>
        </div>

        {/* Step 2 Column */}
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <span className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
                Step 2 (Follow-up)
              </span>
              <div className="text-sm font-bold text-neutral-900 dark:text-white mt-1">
                {step2 ? step2.resolvedName : 'Ready'}
              </div>
            </div>
            {step2 && (
              <span className="text-[10px] font-mono bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-700 dark:text-neutral-300">
                Stance: {step2.parameters.stance} (Derived)
              </span>
            )}
          </div>

          <div className="space-y-3">
            {/* Step 2 Stance notice */}
            <div className="p-2 rounded bg-neutral-100 dark:bg-neutral-800/80 text-[11px] text-neutral-600 dark:text-neutral-400">
              Stance is physically determined by Step 1 landing mechanics ({step1?.landingState.resultStance || 'Derived'}).
            </div>

            {/* Step 2 Base Trick */}
            <StepParamField
              label="Base Trick"
              isLocked={step2Locks.baseTrickId !== undefined}
              onToggleLock={() =>
                onToggleStep2Lock(
                  'baseTrickId',
                  step2Locks.baseTrickId ? undefined : step2Params.baseTrickId
                )
              }
              pool={
                <ItemPoolSelector
                  label="Step 2 Tricks"
                  items={BASE_TRICKS.map((t) => ({ id: t.id, label: t.name }))}
                  excludedIds={step2Exclusions.baseTrickIds || []}
                  onToggleExclude={(id) => onToggleStep2Exclude('baseTrickIds', id)}
                  onResetExclusions={() => onResetStep2Exclusions('baseTrickIds')}
                />
              }
            >
              <select
                value={step2Locks.baseTrickId || step2Params.baseTrickId}
                onChange={(e) => onChangeStep2Param('baseTrickId', e.target.value)}
                className="w-full text-xs font-medium bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2.5 py-1.5 text-neutral-900 dark:text-white"
              >
                {BASE_TRICKS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {step2Exclusions.baseTrickIds?.includes(t.id) ? '(Excluded)' : ''}
                  </option>
                ))}
              </select>
            </StepParamField>

            {/* Step 2 Direction */}
            <StepParamField
              label="Rotation / Direction"
              isLocked={step2Locks.direction !== undefined}
              onToggleLock={() =>
                onToggleStep2Lock(
                  'direction',
                  step2Locks.direction ? undefined : step2Params.direction
                )
              }
              pool={
                <ItemPoolSelector
                  label="Step 2 Direction"
                  items={[
                    { id: 'none', label: 'Straight' },
                    { id: 'frontside', label: 'Frontside 180' },
                    { id: 'backside', label: 'Backside 180' },
                  ]}
                  excludedIds={step2Exclusions.directions || []}
                  onToggleExclude={(id) => onToggleStep2Exclude('directions', id)}
                  onResetExclusions={() => onResetStep2Exclusions('directions')}
                />
              }
            >
              <select
                value={step2Locks.direction || step2Params.direction}
                onChange={(e) => onChangeStep2Param('direction', e.target.value as Direction)}
                className="w-full text-xs font-medium bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2.5 py-1.5 text-neutral-900 dark:text-white"
              >
                <option value="none">Straight</option>
                <option value="frontside">Frontside 180</option>
                <option value="backside">Backside 180</option>
              </select>
            </StepParamField>

            {/* Step 2 Revert */}
            <StepParamField
              label="Exit Revert"
              isLocked={step2Locks.revert !== undefined}
              onToggleLock={() =>
                onToggleStep2Lock('revert', step2Locks.revert ? undefined : step2Params.revert)
              }
              pool={
                <ItemPoolSelector
                  label="Step 2 Revert"
                  items={[
                    { id: 'none', label: 'None' },
                    { id: 'frontside', label: 'FS Revert' },
                    { id: 'backside', label: 'BS Revert' },
                  ]}
                  excludedIds={step2Exclusions.reverts || []}
                  onToggleExclude={(id) => onToggleStep2Exclude('reverts', id)}
                  onResetExclusions={() => onResetStep2Exclusions('reverts')}
                />
              }
            >
              <select
                value={step2Locks.revert || step2Params.revert}
                onChange={(e) => onChangeStep2Param('revert', e.target.value as RevertDirection)}
                className="w-full text-xs font-medium bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2.5 py-1.5 text-neutral-900 dark:text-white"
              >
                <option value="none">None</option>
                <option value="frontside">FS Revert</option>
                <option value="backside">BS Revert</option>
              </select>
            </StepParamField>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StepParamFieldProps {
  label: string;
  isLocked: boolean;
  onToggleLock: () => void;
  pool?: React.ReactNode;
  children: React.ReactNode;
}

const StepParamField: React.FC<StepParamFieldProps> = ({
  label,
  isLocked,
  onToggleLock,
  pool,
  children,
}) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
        <div className="flex items-center gap-1">
          {pool}
          <button
            type="button"
            onClick={onToggleLock}
            className={`p-1 rounded cursor-pointer ${
              isLocked
                ? 'text-amber-700 dark:text-amber-400 bg-amber-500/10'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900'
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
