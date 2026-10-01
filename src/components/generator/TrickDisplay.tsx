import React from 'react';
import { getChallengeComplexity } from '../../domain/complexity';
import { ChallengeActions } from '../common/ChallengeActions';
import { GeneratedTrickResult, TrickMode } from '../../domain/types';
import { Sparkles, Dices, AlertTriangle, Layers, ShieldAlert, Cpu, Compass } from 'lucide-react';
import { formatMovementsSummary } from '../../domain/movements';
import { formatObstacleMechanicsSummary } from '../../domain/obstacleMechanics';

interface TrickDisplayProps {
  trickResult: GeneratedTrickResult | null;
  mode: TrickMode;
  onChangeMode: (m: TrickMode) => void;
  onGenerate: () => void;
  isGenerating?: boolean;
  conflictError?: string | null;
  onClearLocks: () => void;
  activeSetupName?: string;
  complexityControl?: React.ReactNode;
}

export const TrickDisplay: React.FC<TrickDisplayProps> = ({
  trickResult,
  mode,
  onChangeMode,
  onGenerate,
  isGenerating,
  conflictError,
  onClearLocks,
  activeSetupName,
  complexityControl,
}) => {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
      {/* Mode Segmented Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold">Session Mode</span>
          <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-lg">
          <button
            onClick={() => onChangeMode('single')}
              style={{ animation: "none", boxShadow: "none" }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              mode === 'single'
                ? 'bg-[#D4A72C] text-[#292524] font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Single Trick
          </button>
          <button
            onClick={() => onChangeMode('combo')}
              style={{ animation: "none", boxShadow: "none" }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              mode === 'combo'
                ? 'bg-[#D4A72C] text-[#292524] font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Two-Trick Combo
          </button>
          <button
            onClick={() => onChangeMode('obstacle')}
              style={{ animation: "none", boxShadow: "none" }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              mode === 'obstacle'
                ? 'bg-[#D4A72C] text-[#292524] font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Obstacle
          </button>
        </div>

        </div>
        {complexityControl}
      </div>

      {/* Conflict Notice if locks conflict */}
      {conflictError ? (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-700 dark:text-rose-400 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            Lock Incompatibility Detected
          </div>
          <p className="text-xs leading-relaxed">{conflictError}</p>
          <div className="pt-2">
            <button
              onClick={onClearLocks}
              className="text-xs font-semibold underline underline-offset-2 hover:opacity-80 cursor-pointer"
            >
              Clear locked values to resolve
            </button>
          </div>
        </div>
      ) : (
        /* Trick Presentation Area */
        <div className="space-y-4">
          <div className="text-xs text-neutral-700 dark:text-neutral-300 uppercase tracking-wider font-mono font-medium">
            {(trickResult?.mode || mode) === 'single'
              ? 'Target Challenge'
              : (trickResult?.mode || mode) === 'combo'
              ? 'Two-Step Combo Routine'
              : 'Obstacle Grind / Slide Sequence'}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-950 dark:text-white text-balance leading-tight">
            {(() => {
              const name = trickResult?.canonicalName || 'Click Generate to Begin';
              const match = trickResult?.mode === 'obstacle'
                ? name.match(/^\[\s*([^\]]+?)\s*\]\s*(.*)$/)
                : null;

              if (!match) return name;

              return (
                <>
                  <span className="inline-flex align-middle items-center rounded-md border border-[#8A6500]/40 dark:border-[#D4A72C]/40 bg-[#D4A72C]/10 px-3 py-1.5 mr-2 text-sm sm:text-base font-normal tracking-wide text-[#8A6500] dark:text-[#D4A72C] whitespace-nowrap">
                    {match[1].trim().toUpperCase()}
                  </span>
                  {' '}{match[2]}
                </>
              );
            })()}
          </h1>

          {/* Stored Underlying Movements Badge */}
          {trickResult?.movements && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[11px] font-mono text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                <Cpu className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <strong className="text-neutral-900 dark:text-white font-semibold">Underlying:</strong>
                <span>{formatMovementsSummary(trickResult.movements)}</span>
              </span>
            </div>
          )}

          {/* Stored Obstacle Mechanics Badge */}
          {trickResult?.obstacleData?.mechanics && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[11px] font-mono text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                <Compass className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <strong className="text-neutral-900 dark:text-white font-semibold">Obstacle Kinematics:</strong>
                <span>{formatObstacleMechanicsSummary(trickResult.obstacleData.mechanics)}</span>
              </span>
            </div>
          )}

          {/* Breakdown tags / text */}
          {trickResult && trickResult.breakdown && trickResult.breakdown.length > 0 && (
            <div className="pt-2">
              <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Trick Breakdown & Mechanics:
              </div>
              <ul className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1 list-disc list-inside">
                {trickResult.breakdown.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {trickResult && <p className="text-xs text-neutral-600 dark:text-neutral-300">Complexity: <span className="capitalize font-medium text-[#8A6500] dark:text-[#D4A72C]">{getChallengeComplexity(trickResult)}</span></p>}
      {trickResult && <ChallengeActions result={trickResult} />}

      {/* Main Action Bar */}
      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-neutral-700 dark:text-neutral-300">
          Catalog v{trickResult?.catalogVersion || '1.0'} · Deterministic compatibility rules
        </div>

        <button
          type="button"
          disabled={isGenerating}
          onClick={onGenerate}
          className="px-6 py-3 bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-semibold text-sm rounded-xl flex items-center gap-2.5 transition-all shadow-md active:scale-98 cursor-pointer"
        >
          <Dices className="w-4 h-4" />
          {isGenerating ? 'Generating...' : 'Generate New Challenge'}
        </button>
      </div>
    </div>
  );
};
