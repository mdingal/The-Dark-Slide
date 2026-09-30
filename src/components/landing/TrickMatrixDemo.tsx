import React, { useState } from 'react';
import {
  Stance,
  Direction,
  BodyVarial,
  LandingPosition,
  RevertDirection,
  ParameterLocks,
  SingleTrickParameters,
} from '../../domain/types';
import { BASE_TRICKS } from '../../domain/catalog';
import { formatSingleTrickName, explainSingleTrick } from '../../domain/naming';
import { generateSingleTrick, getCompatibleOptionsForLocks } from '../../domain/rules';
import { useApp } from '../../context/AppContext';
import {
  Dices,
  Lock,
  Unlock,
  Sparkles,
  ArrowRight,
  UserPlus,
  LogIn,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Modal } from '../common/Modal';

interface TrickMatrixDemoProps {
  onPromptAuth: () => void;
}

export const TrickMatrixDemo: React.FC<TrickMatrixDemoProps> = ({ onPromptAuth }) => {
  const { isLoggedIn, setActiveTab } = useApp();

  const [locks, setLocks] = useState<ParameterLocks>({});
  const [params, setParams] = useState<SingleTrickParameters>({
    stance: 'regular',
    direction: 'none',
    baseTrickId: 'kickflip',
    bodyVarial: 'none',
    landing: 'normal',
    revert: 'none',
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [lastGeneratedName, setLastGeneratedName] = useState<string | null>(null);

  // Compute live compatible options based on current locks
  const compatible = getCompatibleOptionsForLocks(locks, {});

  // Compute live trick name & explanation based on current tweaked parameters
  const currentFormattedName = formatSingleTrickName(params);
  const currentBreakdown = explainSingleTrick(params);

  const toggleLock = (key: keyof ParameterLocks, value: any) => {
    setLocks((prev) => {
      const next = { ...prev };
      if (next[key] !== undefined) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  const updateParam = (key: keyof SingleTrickParameters, value: any) => {
    setParams((prev) => {
      const updated = { ...prev, [key]: value };
      // If parameter is locked, update the lock value too
      if (key in locks && locks[key as keyof ParameterLocks] !== undefined) {
        setLocks((l) => ({ ...l, [key]: value }));
      }
      return updated;
    });
  };

  const handleGenerateClick = () => {
    if (!isLoggedIn) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const result = generateSingleTrick(locks, {});
      if ('params' in result) {
        setParams(result.params);
        setLastGeneratedName(formatSingleTrickName(result.params));
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="bg-neutral-900 dark:bg-black text-white rounded-2xl p-6 sm:p-8 border border-neutral-800 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-mono font-medium mb-1.5 border border-amber-500/20">
            <Sparkles className="w-3 h-3" />
            <span>Interactive Physics Demo</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white">
            Live Trick Generator Sandbox
          </h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Tweak any parameter or lock specific categories. Experience our deterministic trick rules and rotational mechanics before signing in.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleGenerateClick}
            className="px-5 py-2.5 bg-white text-neutral-950 hover:bg-neutral-200 font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Dices className="w-4 h-4 text-neutral-900" />
            <span>Generate Random Trick</span>
          </button>
        </div>
      </div>

      {/* Prominent Trick Preview Card */}
      <div className="bg-neutral-800/80 rounded-xl p-5 border border-neutral-700 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
            Live Configured Result
          </span>
          {lastGeneratedName && (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3" /> Randomized via Deterministic Rules
            </span>
          )}
        </div>

        <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          {currentFormattedName}
        </div>

        {/* Breakdown tags */}
        <div className="flex flex-wrap gap-2 pt-1">
          {currentBreakdown.map((item, idx) => (
            <span
              key={idx}
              className="text-xs px-2.5 py-1 rounded-md bg-neutral-900 text-neutral-300 border border-neutral-700 font-mono"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Interactive Parameter Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Stance */}
        <div className="bg-neutral-800/40 p-3.5 rounded-xl border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-neutral-200">Stance</label>
            <button
              type="button"
              onClick={() => toggleLock('stance', params.stance)}
              title={locks.stance ? 'Unlock Stance' : 'Lock Stance'}
              className={`p-1 rounded cursor-pointer transition-colors ${
                locks.stance ? 'text-amber-400 bg-amber-500/10' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {locks.stance ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
          </div>
          <select
            value={params.stance}
            onChange={(e) => updateParam('stance', e.target.value as Stance)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-neutral-500"
          >
            {(['regular', 'fakie', 'switch', 'nollie'] as Stance[]).map((st) => (
              <option key={st} value={st} disabled={!compatible.compatibleStances.includes(st)}>
                {st.toUpperCase()} {!compatible.compatibleStances.includes(st) ? '(Incompatible)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Direction */}
        <div className="bg-neutral-800/40 p-3.5 rounded-xl border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-neutral-200">Direction</label>
            <button
              type="button"
              onClick={() => toggleLock('direction', params.direction)}
              title={locks.direction ? 'Unlock Direction' : 'Lock Direction'}
              className={`p-1 rounded cursor-pointer transition-colors ${
                locks.direction ? 'text-amber-400 bg-amber-500/10' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {locks.direction ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
          </div>
          <select
            value={params.direction}
            onChange={(e) => updateParam('direction', e.target.value as Direction)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-neutral-500"
          >
            <option value="none">None / Straight</option>
            <option value="frontside" disabled={!compatible.compatibleDirections.includes('frontside')}>
              Frontside (FS) {!compatible.compatibleDirections.includes('frontside') ? '(Incompatible)' : ''}
            </option>
            <option value="backside" disabled={!compatible.compatibleDirections.includes('backside')}>
              Backside (BS) {!compatible.compatibleDirections.includes('backside') ? '(Incompatible)' : ''}
            </option>
          </select>
        </div>

        {/* Base Trick */}
        <div className="bg-neutral-800/40 p-3.5 rounded-xl border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-neutral-200">Base Trick</label>
            <button
              type="button"
              onClick={() => toggleLock('baseTrickId', params.baseTrickId)}
              title={locks.baseTrickId ? 'Unlock Base Trick' : 'Lock Base Trick'}
              className={`p-1 rounded cursor-pointer transition-colors ${
                locks.baseTrickId ? 'text-amber-400 bg-amber-500/10' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {locks.baseTrickId ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
          </div>
          <select
            value={params.baseTrickId}
            onChange={(e) => updateParam('baseTrickId', e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-neutral-500"
          >
            {BASE_TRICKS.map((trick) => (
              <option key={trick.id} value={trick.id} disabled={!compatible.compatibleBaseTricks.includes(trick.id)}>
                {trick.name} {!compatible.compatibleBaseTricks.includes(trick.id) ? '(Incompatible)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Body Varial */}
        <div className="bg-neutral-800/40 p-3.5 rounded-xl border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-neutral-200">Body Varial</label>
            <button
              type="button"
              onClick={() => toggleLock('bodyVarial', params.bodyVarial)}
              title={locks.bodyVarial ? 'Unlock Body Varial' : 'Lock Body Varial'}
              className={`p-1 rounded cursor-pointer transition-colors ${
                locks.bodyVarial ? 'text-amber-400 bg-amber-500/10' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {locks.bodyVarial ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
          </div>
          <select
            value={params.bodyVarial}
            onChange={(e) => updateParam('bodyVarial', e.target.value as BodyVarial)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-neutral-500"
          >
            <option value="none">None</option>
            <option value="frontside" disabled={!compatible.compatibleBodyVarials.includes('frontside')}>
              Frontside (Sex Change) {!compatible.compatibleBodyVarials.includes('frontside') ? '(Incompatible)' : ''}
            </option>
            <option value="backside" disabled={!compatible.compatibleBodyVarials.includes('backside')}>
              Backside (BS Varial) {!compatible.compatibleBodyVarials.includes('backside') ? '(Incompatible)' : ''}
            </option>
          </select>
        </div>

        {/* Landing */}
        <div className="bg-neutral-800/40 p-3.5 rounded-xl border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-neutral-200">Landing Position</label>
            <button
              type="button"
              onClick={() => toggleLock('landing', params.landing)}
              title={locks.landing ? 'Unlock Landing' : 'Lock Landing'}
              className={`p-1 rounded cursor-pointer transition-colors ${
                locks.landing ? 'text-amber-400 bg-amber-500/10' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {locks.landing ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
          </div>
          <select
            value={params.landing}
            onChange={(e) => updateParam('landing', e.target.value as LandingPosition)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-neutral-500"
          >
            <option value="normal">Normal Clean Landing</option>
            <option value="manual" disabled={!compatible.compatibleLandings.includes('manual')}>
              Manual (Tail Down) {!compatible.compatibleLandings.includes('manual') ? '(Incompatible)' : ''}
            </option>
            <option value="nose_manual" disabled={!compatible.compatibleLandings.includes('nose_manual')}>
              Nose Manual (Nose Down) {!compatible.compatibleLandings.includes('nose_manual') ? '(Incompatible)' : ''}
            </option>
          </select>
        </div>

        {/* Revert */}
        <div className="bg-neutral-800/40 p-3.5 rounded-xl border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-neutral-200">Revert Exit</label>
            <button
              type="button"
              onClick={() => toggleLock('revert', params.revert)}
              title={locks.revert ? 'Unlock Revert' : 'Lock Revert'}
              className={`p-1 rounded cursor-pointer transition-colors ${
                locks.revert ? 'text-amber-400 bg-amber-500/10' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {locks.revert ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
          </div>
          <select
            value={params.revert}
            onChange={(e) => updateParam('revert', e.target.value as RevertDirection)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-neutral-500"
          >
            <option value="none">None</option>
            <option value="frontside" disabled={!compatible.compatibleReverts.includes('frontside')}>
              Frontside Revert {!compatible.compatibleReverts.includes('frontside') ? '(Incompatible)' : ''}
            </option>
            <option value="backside" disabled={!compatible.compatibleReverts.includes('backside')}>
              Backside Revert {!compatible.compatibleReverts.includes('backside') ? '(Incompatible)' : ''}
            </option>
          </select>
        </div>
      </div>

      {/* Action footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-neutral-800 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-neutral-400 shrink-0" />
          <span>
            {Object.keys(locks).length > 0
              ? `${Object.keys(locks).length} parameter${Object.keys(locks).length > 1 ? 's' : ''} locked. Unlocked values will be randomized.`
              : 'All parameters unlocked. Random generation explores the full catalog.'}
          </span>
        </div>

        {isLoggedIn ? (
          <button
            type="button"
            onClick={() => setActiveTab('generator')}
            className="text-white hover:text-amber-400 font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <span>Open in Full Generator Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsAuthModalOpen(true);
            }}
            className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <span>Sign in to unlock two-trick combos & timers</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Auth Prompt Modal for non-users */}
      <Modal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title="Create Rider Account to Generate Tricks"
      >
        <div className="space-y-4 text-neutral-800 dark:text-neutral-200">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
            <p className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 text-sm">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Full Laboratory Access Required
            </p>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
              You are currently viewing the sandbox demo. To roll randomized tricks, practice combos, start active session timers, log landing counts, and save custom deck specs, please create a free rider account or sign in.
            </p>
          </div>

          <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Full deterministic random trick generation</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Two-trick combo transitions with strict stance physics</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Session timers, undo history, and landing percentage analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Custom deck width, mold, shape, and wheel material tracking</span>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAuthModalOpen(false);
                onPromptAuth();
              }}
              className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Go to Account Sign-Up</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(false)}
              className="w-full sm:w-auto py-2.5 px-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg text-xs hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
            >
              Continue Tweaking Demo
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
