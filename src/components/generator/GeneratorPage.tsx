import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrickMode,
  ParameterLocks,
  ParameterExclusions,
  ObstacleExclusions,
  SingleTrickParameters,
  GeneratedTrickResult,
  ObstacleType,
  ObstacleComponent,
} from '../../domain/types';
import { generateSingleTrick, detectLockConflict } from '../../domain/rules';
import { generateTwoTrickCombo } from '../../domain/comboEngine';
import {
  formatSingleTrickName,
  formatComboName,
  formatObstacleTrickName,
  explainObstacleTrick,
} from '../../domain/naming';
import { resolveObstacleMechanics } from '../../domain/obstacleMechanics';
import { getObstacleTricksForObstacle, OBSTACLE_TRICKS } from '../../domain/obstacleCatalog';
import { CATALOG_VERSION, BASE_TRICKS } from '../../domain/catalog';
import { TrickDisplay } from './TrickDisplay';
import { ParameterSelector } from './ParameterSelector';
import { ComboStepEditor } from './ComboStepEditor';
import { ObstaclePicker } from './ObstaclePicker';
import { PracticePanel } from './PracticePanel';

export const GeneratorPage: React.FC = () => {
  const {
    activeSetup,
    setActiveSetup,
    profile,
    currentSession,
    startNewSession,
    updateSession,
    showToast,
  } = useApp();

  const [mode, setMode] = useState<TrickMode>('single');

  // Locks state
  const [singleLocks, setSingleLocks] = useState<ParameterLocks>({});
  const [step1Locks, setStep1Locks] = useState<ParameterLocks>({});
  const [step2Locks, setStep2Locks] = useState<ParameterLocks>({});
  const [obstacleLocks, setObstacleLocks] = useState<ParameterLocks>({});

  // Exclusions state (pool filtering)
  const [singleExclusions, setSingleExclusions] = useState<ParameterExclusions>({});
  const [step1Exclusions, setStep1Exclusions] = useState<ParameterExclusions>({});
  const [step2Exclusions, setStep2Exclusions] = useState<ParameterExclusions>({});
  const [obstacleExclusions, setObstacleExclusions] = useState<ObstacleExclusions>({});

  // Active parameter values (for display & manual selection)
  const [activeParams, setActiveParams] = useState<SingleTrickParameters>({
    stance: 'regular',
    direction: 'none',
    baseTrickId: 'kickflip',
    bodyVarial: 'none',
    landing: 'normal',
    revert: 'none',
  });

  const [step1Params, setStep1Params] = useState<SingleTrickParameters>({
    stance: 'regular',
    direction: 'none',
    baseTrickId: 'ollie',
    bodyVarial: 'none',
    landing: 'normal',
    revert: 'none',
  });

  const [step2Params, setStep2Params] = useState<SingleTrickParameters>({
    stance: 'regular',
    direction: 'none',
    baseTrickId: 'kickflip',
    bodyVarial: 'none',
    landing: 'normal',
    revert: 'none',
  });

  const [selectedObstacle, setSelectedObstacle] = useState<ObstacleType>(
    activeSetup?.obstacleType || 'flatground'
  );

  const [obstacleData, setObstacleData] = useState<ObstacleComponent>({
    obstacleType: 'ledge',
    approach: 'frontside',
    obstacleTrickId: '50_50',
    entryTrickId: 'ollie',
    exitTrick: 'clean',
  });

  const [conflictError, setConflictError] = useState<string | null>(null);

  // Sync with currentSession if resuming
  useEffect(() => {
    if (currentSession) {
      setMode(currentSession.trickResult.mode);
      if (currentSession.trickResult.singleTrick) {
        setActiveParams(currentSession.trickResult.singleTrick);
      }
      if (currentSession.trickResult.comboSteps) {
        if (currentSession.trickResult.comboSteps[0]) {
          setStep1Params(currentSession.trickResult.comboSteps[0].parameters);
        }
        if (currentSession.trickResult.comboSteps[1]) {
          setStep2Params(currentSession.trickResult.comboSteps[1].parameters);
        }
      }
      if (currentSession.trickResult.obstacleData) {
        setObstacleData(currentSession.trickResult.obstacleData);
        setSelectedObstacle(currentSession.trickResult.obstacleData.obstacleType);
      }
    }
  }, [currentSession?.id]);

  // Handle generating a new trick / combo / obstacle
  const handleGenerate = useCallback(async () => {
    setConflictError(null);

    if (mode === 'single') {
      const res = generateSingleTrick(singleLocks, singleExclusions);
      if ('error' in res) {
        setConflictError(res.error);
        return;
      }

      setActiveParams(res.params);
      const canonicalName = formatSingleTrickName(res.params);

      const result: GeneratedTrickResult = {
        mode: 'single',
        canonicalName,
        breakdown: res.breakdown,
        singleTrick: res.params,
        movements: res.params.movements,
        catalogVersion: CATALOG_VERSION,
      };

      await startNewSession(result);
    } else if (mode === 'combo') {
      const res = generateTwoTrickCombo(step1Locks, step2Locks, step1Exclusions, step2Exclusions);
      if ('error' in res) {
        setConflictError(res.error);
        return;
      }

      setStep1Params(res.steps[0].parameters);
      setStep2Params(res.steps[1].parameters);

      const canonicalName = formatComboName(res.steps);
      const breakdown = [
        `Step 1: ${res.steps[0].resolvedName} (${res.steps[0].breakdown})`,
        `Transition: Lands in ${res.steps[0].landingState.resultStance} stance (${res.steps[0].landingState.boardPosition})`,
        `Step 2: ${res.steps[1].resolvedName} (${res.steps[1].breakdown})`,
      ];

      const result: GeneratedTrickResult = {
        mode: 'combo',
        canonicalName,
        breakdown,
        comboSteps: res.steps,
        catalogVersion: CATALOG_VERSION,
      };

      await startNewSession(result);
    } else if (mode === 'obstacle') {
      if (selectedObstacle === 'flatground') {
        const res = generateSingleTrick(singleLocks, singleExclusions);
        if ('error' in res) {
          setConflictError(res.error);
          return;
        }
        const canonicalName = formatSingleTrickName(res.params);
        const result: GeneratedTrickResult = {
          mode: 'single',
          canonicalName,
          breakdown: res.breakdown,
          singleTrick: res.params,
          movements: res.params.movements,
          catalogVersion: CATALOG_VERSION,
        };
        await startNewSession(result);
        return;
      }

      // Generate obstacle trick respecting locks and exclusions
      let availableTricks = getObstacleTricksForObstacle(selectedObstacle);
      if (obstacleExclusions.obstacleTrickIds) {
        availableTricks = availableTricks.filter(
          (t) => !obstacleExclusions.obstacleTrickIds?.includes(t.id)
        );
      }

      if (availableTricks.length === 0) {
        setConflictError(`All tricks for ${selectedObstacle} are excluded. Please include at least one.`);
        return;
      }

      const chosenTrick = obstacleLocks.obstacleTrickId
        ? OBSTACLE_TRICKS.find((t) => t.id === obstacleLocks.obstacleTrickId) || availableTricks[0]
        : availableTricks[Math.floor(Math.random() * availableTricks.length)];

      let approaches = (['frontside', 'backside'] as const).filter(
        (a) => !obstacleExclusions.approaches?.includes(a)
      );
      if (approaches.length === 0) approaches = ['frontside'];
      const chosenApproach = obstacleLocks.approach || approaches[Math.floor(Math.random() * approaches.length)];

      let allowedEntries = chosenTrick.allowedEntryTricks.filter(
        (id) => !obstacleExclusions.entryTrickIds?.includes(id)
      );
      if (allowedEntries.length === 0) allowedEntries = chosenTrick.allowedEntryTricks;
      const chosenEntry = obstacleLocks.entryTrickId || allowedEntries[Math.floor(Math.random() * allowedEntries.length)];

      let allowedExits = chosenTrick.allowedExitTricks.filter(
        (e) => !obstacleExclusions.exitTricks?.includes(e)
      );
      if (allowedExits.length === 0) allowedExits = chosenTrick.allowedExitTricks;
      const chosenExit = obstacleLocks.exitTrick || allowedExits[Math.floor(Math.random() * allowedExits.length)];

      const comp: ObstacleComponent = {
        obstacleType: selectedObstacle,
        approach: chosenApproach,
        obstacleTrickId: chosenTrick.id,
        entryTrickId: chosenEntry,
        exitTrick: chosenExit,
        transferTrickId: obstacleLocks.transferTrickId || obstacleData?.transferTrickId,
      };

      comp.mechanics = resolveObstacleMechanics(comp);
      setObstacleData(comp);
      const canonicalName = formatObstacleTrickName(comp);
      const breakdown = explainObstacleTrick(comp);

      const result: GeneratedTrickResult = {
        mode: 'obstacle',
        canonicalName,
        breakdown,
        obstacleData: comp,
        catalogVersion: CATALOG_VERSION,
      };

      await startNewSession(result);
    }
  }, [
    mode,
    singleLocks,
    singleExclusions,
    step1Locks,
    step2Locks,
    step1Exclusions,
    step2Exclusions,
    obstacleLocks,
    obstacleExclusions,
    selectedObstacle,
    startNewSession,
  ]);

  const handleToggleSingleLock = (key: keyof ParameterLocks, value?: any) => {
    setSingleLocks((prev) => {
      const next = { ...prev };
      if (value === undefined) delete next[key];
      else next[key] = value;
      return next;
    });
  };

  const handleToggleSingleExclude = (category: keyof ParameterExclusions, id: string) => {
    setSingleExclusions((prev) => {
      const currentList = (prev[category] as string[]) || [];
      const nextList = currentList.includes(id)
        ? currentList.filter((item) => item !== id)
        : [...currentList, id];
      return { ...prev, [category]: nextList };
    });
  };

  const handleResetSingleExclusions = (category: keyof ParameterExclusions) => {
    setSingleExclusions((prev) => ({ ...prev, [category]: [] }));
  };

  const handleClearLocks = () => {
    setSingleLocks({});
    setStep1Locks({});
    setStep2Locks({});
    setObstacleLocks({});
    setConflictError(null);
    showToast('Locks cleared.');
  };

  const handleChangeSingleParam = (key: keyof ParameterLocks, val: any) => {
    setActiveParams((prev) => ({
      ...prev,
      [key === 'baseTrickId' ? 'baseTrickId' : key]: val,
    }));
    if (singleLocks[key] !== undefined) {
      setSingleLocks((prev) => ({ ...prev, [key]: val }));
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Main Trick Presentation */}
      <TrickDisplay
        trickResult={currentSession?.trickResult || null}
        mode={mode}
        onChangeMode={setMode}
        onGenerate={handleGenerate}
        conflictError={conflictError}
        onClearLocks={handleClearLocks}
        activeSetupName={activeSetup?.name}
      />

      {/* 2. Interactive Practice Tracking Panel */}
      {currentSession && (
        <PracticePanel
          session={currentSession}
          onUpdateSession={updateSession}
          savedSetups={profile?.savedSetups || []}
          onSelectSetup={(s) => setActiveSetup(s)}
        />
      )}

      {/* 3. Controls & Lock Configuration */}
      {mode === 'single' && (
        <ParameterSelector
          locks={singleLocks}
          exclusions={singleExclusions}
          onToggleLock={handleToggleSingleLock}
          onClearLocks={handleClearLocks}
          onToggleExclude={handleToggleSingleExclude}
          onResetExclusions={handleResetSingleExclusions}
          activeValues={activeParams}
          onChangeValue={handleChangeSingleParam}
        />
      )}

      {mode === 'combo' && (
        <ComboStepEditor
          steps={currentSession?.trickResult?.comboSteps}
          step1Locks={step1Locks}
          step2Locks={step2Locks}
          step1Exclusions={step1Exclusions}
          step2Exclusions={step2Exclusions}
          step1Params={step1Params}
          step2Params={step2Params}
          onToggleStep1Lock={(key, val) =>
            setStep1Locks((prev) => {
              const next = { ...prev };
              if (val === undefined) delete next[key];
              else next[key] = val;
              return next;
            })
          }
          onToggleStep2Lock={(key, val) =>
            setStep2Locks((prev) => {
              const next = { ...prev };
              if (val === undefined) delete next[key];
              else next[key] = val;
              return next;
            })
          }
          onToggleStep1Exclude={(cat, id) =>
            setStep1Exclusions((prev) => {
              const curr = (prev[cat] as string[]) || [];
              const next = curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id];
              return { ...prev, [cat]: next };
            })
          }
          onToggleStep2Exclude={(cat, id) =>
            setStep2Exclusions((prev) => {
              const curr = (prev[cat] as string[]) || [];
              const next = curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id];
              return { ...prev, [cat]: next };
            })
          }
          onResetStep1Exclusions={(cat) => setStep1Exclusions((prev) => ({ ...prev, [cat]: [] }))}
          onResetStep2Exclusions={(cat) => setStep2Exclusions((prev) => ({ ...prev, [cat]: [] }))}
          onChangeStep1Param={(k, v) => setStep1Params((p) => ({ ...p, [k]: v }))}
          onChangeStep2Param={(k, v) => setStep2Params((p) => ({ ...p, [k]: v }))}
        />
      )}

      {mode === 'obstacle' && (
        <ObstaclePicker
          selectedObstacle={selectedObstacle}
          onChangeObstacle={(obs) => {
            setSelectedObstacle(obs);
          }}
          obstacleData={obstacleData}
          onChangeObstacleData={setObstacleData}
          availableObstacles={profile?.availableObstacles || ['flatground', 'ledge', 'rail', 'manual_pad']}
          locks={obstacleLocks}
          exclusions={obstacleExclusions}
          onToggleLock={(k, v) =>
            setObstacleLocks((prev) => {
              const next = { ...prev };
              if (v === undefined) delete next[k];
              else next[k] = v;
              return next;
            })
          }
          onToggleExclude={(cat, id) =>
            setObstacleExclusions((prev) => {
              const curr = (prev[cat] as string[]) || [];
              const next = curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id];
              return { ...prev, [cat]: next };
            })
          }
          onResetExclusions={(cat) => setObstacleExclusions((prev) => ({ ...prev, [cat]: [] }))}
        />
      )}
    </div>
  );
};
