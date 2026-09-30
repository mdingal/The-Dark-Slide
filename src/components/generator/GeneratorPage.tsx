import React, { useState, useEffect, useCallback } from 'react';
import { getTransferChoices } from '../../domain/obstacleTransfers';
import { useApp } from '../../context/AppContext';
import {
  PracticeSession,
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
    setCurrentSession,
    startNewSession,
    updateSession,
    showToast,
  } = useApp();

  const [finishedSession, setFinishedSession] = useState<PracticeSession | null>(null);

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
    (activeSetup?.obstacleType && activeSetup.obstacleType !== 'flatground') ? activeSetup.obstacleType : 'ledge'
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
      const pick = <T,>(items: T[]): T =>
        items[Math.floor(Math.random() * items.length)];

      const filterValues = <T extends string,>(
        values: T[], excluded?: string[], locked?: string
      ): T[] => values.filter(
        (value) => !excluded?.includes(value) && (!locked || value === locked)
      );

      const typeLock = (obstacleLocks as ParameterLocks & {
        obstacleType?: ObstacleType
      }).obstacleType;

      const candidates = (['ledge', 'rail'] as ObstacleType[])
        .filter((type) =>
          !obstacleExclusions.obstacles?.includes(type) &&
          (!typeLock || type === typeLock)
        )
        .map((type) => ({
          type,
          tricks: getObstacleTricksForObstacle(type).filter((trick) =>
            !obstacleExclusions.obstacleTrickIds?.includes(trick.id) &&
            (!obstacleLocks.obstacleTrickId ||
              obstacleLocks.obstacleTrickId === trick.id) &&
            filterValues(trick.applicableApproaches,
              obstacleExclusions.approaches, obstacleLocks.approach).some(approach =>
                getTransferChoices(type, trick.id, approach, obstacleLocks, obstacleExclusions).length > 0) &&
            filterValues(trick.allowedEntryTricks,
              obstacleExclusions.entryTrickIds, obstacleLocks.entryTrickId).length > 0
          )
        }))
        .filter((candidate) => candidate.tricks.length > 0);

      if (!candidates.length) {
        setConflictError('No compatible ledge or rail challenge matches your locks and exclusions.');
        return;
      }

      const chosenObstacle = pick(candidates);
      const chosenTrick = pick(chosenObstacle.tricks);
      const chosenApproach = pick(filterValues(
        chosenTrick.applicableApproaches,
        obstacleExclusions.approaches, obstacleLocks.approach
      ).filter(approach => getTransferChoices(chosenObstacle.type, chosenTrick.id,
        approach, obstacleLocks, obstacleExclusions).length > 0));
      const chosenEntry = pick(filterValues(
        chosenTrick.allowedEntryTricks,
        obstacleExclusions.entryTrickIds, obstacleLocks.entryTrickId
      ));
      const chosenTransfer = pick(getTransferChoices(chosenObstacle.type,
        chosenTrick.id, chosenApproach, obstacleLocks, obstacleExclusions));
      const chosenExit = pick(chosenTransfer.exits);

      setSelectedObstacle(chosenObstacle.type);

      const comp: ObstacleComponent = {
        obstacleType: chosenObstacle.type,
        approach: chosenApproach,
        obstacleTrickId: chosenTrick.id,
        entryTrickId: chosenEntry,
        exitTrick: chosenExit,
        transferTrickId: chosenTransfer.id || undefined,
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
      <section
        aria-label="Challenge and practice session"
        className="trick-practice-workspace bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl"
      >
      {/* 1. Main Trick Presentation */}
      <TrickDisplay
        trickResult={currentSession?.trickResult || finishedSession?.trickResult || null}
        mode={mode}
        onChangeMode={setMode}
        onGenerate={handleGenerate}
        conflictError={conflictError}
        onClearLocks={handleClearLocks}
        activeSetupName={activeSetup?.name}
      />

      {/* 2. Interactive Practice Tracking Panel */}
      {(currentSession || finishedSession) && (
        <PracticePanel
          key={(currentSession || finishedSession)!.id}
          session={(currentSession || finishedSession)!}
          onFinishSession={(finished) => {
            setFinishedSession(finished);
            setCurrentSession(null);
            showToast('Session saved. Generate a new challenge when ready.');
          }}
          onUpdateSession={updateSession}
          savedSetups={profile?.savedSetups || []}
          onSelectSetup={(s) => setActiveSetup(s)}
        />
      )}


      </section>

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
