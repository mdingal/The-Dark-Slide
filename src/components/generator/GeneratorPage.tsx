import {SharedChallengeBar} from '../common/SharedChallengeBar';
import {ChallengeSessionStatus} from '../common/ChallengeCompletionPanel';
import {MilestoneMoment} from '../common/MilestonePanel';
import { SelectedTrickPool, PoolSource } from './SelectedTrickPool';
import { baseChallengePool, uniqueChallenges, selectPoolChallenge, expandSelectedVariations } from '../../domain/selectedChallengePool';
import { trickKey } from '../../domain/progression';
import { getChallengeComplexity } from '../../domain/complexity';
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
import { PoolPresets } from './PoolPresets';
import { GeneratorPresetConfig, ComplexityFilter } from '../../domain/types';
import { generateChallenge } from '../../domain/challengeGeneration';

export const GeneratorPage: React.FC = () => {
  const {
    sessions,
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

  const [stances,setStances] = useState<SingleTrickParameters['stance'][]>(['regular','nollie','fakie','switch']);
  const [stanceVariations,setStanceVariations] = useState(false);
  const [rotationVariations,setRotationVariations] = useState(false);
  const [rotations,setRotations] = useState<('none'|'frontside'|'backside')[]>(['none','frontside','backside']);
  const [poolSource,setPoolSource] = useState<PoolSource>('parameters');
  const [customSelection,setCustomSelection] = useState<string[]>([]);
  const [librarySelection,setLibrarySelection] = useState<string[]>([]);
  const [libraryStatus,setLibraryStatus] = useState('all');
  const [mode, setMode] = useState<TrickMode>('single');
  const [complexityFilter, setComplexityFilter] = useState<ComplexityFilter>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const generationBusyRef = React.useRef(false);

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
      setFinishedSession(null);
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

  const libraryPool = (profile?.trickLibrary || []).filter(t=>libraryStatus==='all'||t.status===libraryStatus).map(t=>t.trickResult);
  const customPool = uniqueChallenges([...baseChallengePool(),...sessions.map(s=>s.trickResult),...(profile?.bookmarks || []).map(b=>b.trickResult),...(profile?.trickLibrary || []).map(t=>t.trickResult)]);
  const poolItems = (poolSource==='library'?libraryPool:customPool).filter(t=>t.mode===mode&&(poolSource==='custom'||complexityFilter==='all'||getChallengeComplexity(t)===complexityFilter));
  const poolSelection = poolSource==='library'?librarySelection:customSelection;
  const handleGenerate = async () => {
    if (generationBusyRef.current) return;
    generationBusyRef.current = true;
    setIsGenerating(true); setConflictError(null);
    try {
      const result = poolSource !== 'parameters' ? selectPoolChallenge(expandSelectedVariations(poolItems.filter(t=>poolSelection.includes(trickKey(t))),poolSource==='custom'&&stanceVariations,poolSource==='custom'&&rotationVariations?rotations:null,stances),mode,complexityFilter) : generateChallenge({ mode, complexityFilter,
        singleLocks, singleExclusions, step1Locks, step2Locks, step1Exclusions, step2Exclusions,
        obstacleLocks, obstacleExclusions, activeParams, step1Params, step2Params, selectedObstacle, obstacleData });
      if ('error' in result) { setConflictError(result.error); return; }
      await startNewSession(result);
    } catch { setConflictError('Could not save the new challenge. Please try again.'); }
    finally { generationBusyRef.current = false; setIsGenerating(false); }
  };

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

  const presetConfig: GeneratorPresetConfig = {
    mode, complexityFilter, singleLocks, singleExclusions, step1Locks, step2Locks,
    step1Exclusions, step2Exclusions, obstacleLocks, obstacleExclusions,
    activeParams, step1Params, step2Params, selectedObstacle, obstacleData,
  };
  const applyPreset = (config: GeneratorPresetConfig) => {
    setMode(config.mode);
    setComplexityFilter(config.complexityFilter || 'all');
    setSingleLocks(config.singleLocks); setSingleExclusions(config.singleExclusions);
    setStep1Locks(config.step1Locks); setStep2Locks(config.step2Locks);
    setStep1Exclusions(config.step1Exclusions); setStep2Exclusions(config.step2Exclusions);
    setObstacleLocks(config.obstacleLocks); setObstacleExclusions(config.obstacleExclusions);
    setActiveParams(config.activeParams); setStep1Params(config.step1Params); setStep2Params(config.step2Params);
    setSelectedObstacle(config.selectedObstacle); setObstacleData(config.obstacleData);
    setConflictError(null);
  };

  return (
    <div className="space-y-6">
      <SharedChallengeBar />
      <section
        aria-label="Challenge and practice session"
        className="trick-practice-workspace bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl"
      >
      {/* 1. Main Trick Presentation */}
      <TrickDisplay
        trickResult={currentSession?.trickResult || finishedSession?.trickResult || null}
        complexityControl={
      <div className="ml-auto shrink-0" title="Filters generated challenges by complexity; separate from your session difficulty rating.">
        <div className="flex flex-col items-end gap-1">
          <label htmlFor="challenge-complexity" className="text-[11px] font-semibold">Challenge Complexity</label>
          <select id="challenge-complexity" value={complexityFilter} onChange={e => setComplexityFilter(e.target.value as ComplexityFilter)}
            className="text-xs px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
            <option value="all">All levels</option><option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
          </select>
        </div>
        <p className="sr-only">Based on catalog complexity, stance, modifiers, combos, and obstacle sequences. Your difficulty rating after practice stays separate.</p>
      </div>
        }
        mode={mode}
        onChangeMode={setMode}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
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


      <ChallengeSessionStatus session={currentSession || finishedSession} />
      <MilestoneMoment sessionId={(currentSession || finishedSession)?.id} />
      <SelectedTrickPool stances={stances} onStances={setStances} stanceVariations={stanceVariations} onStanceVariations={setStanceVariations} rotationVariations={rotationVariations} onRotationVariations={setRotationVariations} rotations={rotations} onRotations={setRotations} source={poolSource} onSource={setPoolSource} items={poolItems} selected={poolSelection} onSelected={poolSource==='library'?setLibrarySelection:setCustomSelection} status={libraryStatus} onStatus={setLibraryStatus} />
      {poolSource === 'parameters' && <PoolPresets config={presetConfig} onApply={applyPreset} />}


      {/* 3. Controls & Lock Configuration */}
      {poolSource === 'parameters' && mode === 'single' && (
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

      {poolSource === 'parameters' && mode === 'combo' && (
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

      {poolSource === 'parameters' && mode === 'obstacle' && (
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
