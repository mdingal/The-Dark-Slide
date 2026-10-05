import {HW_BUTTON} from '../settings/HardwareManager';
import {challengeFitsClass,minimumSkateClass} from '../../domain/skateClasses';
import type {SkateClass} from '../../domain/types';
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

  const [flowStep,setFlowStep]=useState(currentSession ? 4 : 0);
  const flowHeading=React.useRef<HTMLHeadingElement>(null);
  useEffect(()=>{flowHeading.current?.focus({preventScroll:true});},[flowStep]);
  const goToStep=(step:number)=>{setFlowStep(step);window.scrollTo({top:0,behavior:'smooth'});};
  const practicing=!!currentSession?.sessionStartedAt&&!currentSession.sessionEndedAt;

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
  const complexityFilter:ComplexityFilter='all';
  const [skateClass,setSkateClass]=useState<SkateClass>('C');
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
      setFlowStep(4);
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
  const emptyPool=flowStep===2&&poolSource!=='parameters'&&!poolItems.some(t=>poolSelection.includes(trickKey(t)));
  const totalSteps=poolSource==='parameters'?4:3;
  const shownStep=flowStep===4?totalSteps:flowStep;
  const handleGenerate = async () => {
    if (generationBusyRef.current) return;
    generationBusyRef.current = true;
    setIsGenerating(true); setConflictError(null);
    try {
      const result = poolSource !== 'parameters' ? selectPoolChallenge(expandSelectedVariations(poolItems.filter(t=>poolSelection.includes(trickKey(t))),poolSource==='custom'&&stanceVariations,poolSource==='custom'&&rotationVariations?rotations:null,stances),mode,complexityFilter) : generateChallenge({ mode, complexityFilter,skateClass,
        singleLocks, singleExclusions, step1Locks, step2Locks, step1Exclusions, step2Exclusions,
        obstacleLocks, obstacleExclusions:{...obstacleExclusions,obstacles:[...new Set([...(obstacleExclusions.obstacles||[]),...(['ledge','rail'] as const).filter(o=>!profile?.availableObstacles.includes(o))])]}, activeParams, step1Params, step2Params, selectedObstacle, obstacleData });
      if ('error' in result) { setConflictError(result.error); return; }
      if(poolSource==='parameters'&&!challengeFitsClass(result,skateClass)){setConflictError('Your selected tricks or locks do not match this class. Change the class or selection.');return;}
      await startNewSession({...result,skateClass:poolSource==='parameters'?skateClass:minimumSkateClass(result)});
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
    mode, complexityFilter, skateClass, singleLocks, singleExclusions, step1Locks, step2Locks,
    step1Exclusions, step2Exclusions, obstacleLocks, obstacleExclusions,
    activeParams, step1Params, step2Params, selectedObstacle, obstacleData,
  };
  const applyPreset = (config: GeneratorPresetConfig) => {
    setMode(config.mode);
    setSkateClass(config.skateClass||'C');
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
      <header className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-3">
        <p className="text-xs uppercase tracking-wider text-[#8A6500] dark:text-[#D4A72C]">Trick Lab{flowStep>0?` · Step ${shownStep} / ${totalSteps}`:''}</p>
        <h1 ref={flowHeading} tabIndex={-1} className="text-2xl font-semibold focus:outline-none">{['Start a practice session','Choose your session mode','Choose your trick pool','Select your skate class','Generate & practice'][flowStep]}</h1>
        {flowStep===0&&<><p className="text-sm text-neutral-600 dark:text-neutral-300">Choose a challenge, set your goal, and make your next session count.</p><button className={HW_BUTTON} onClick={()=>goToStep(1)}>Start a session</button></>}
        {flowStep>0&&<div role="progressbar" aria-label="Challenge setup progress" aria-valuemin={0} aria-valuemax={totalSteps} aria-valuenow={shownStep} className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden"><div className="h-full bg-[#D4A72C]" style={{width:`${shownStep/totalSteps*100}%`}}/></div>}
      </header>
      {flowStep===1&&<section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
      <div className="flex flex-wrap items-center gap-3"><span className="text-sm font-semibold">Session mode</span>{([['single','Single Trick'],['combo','Two-Trick Combo'],['obstacle','Obstacle']] as const).map(([id,label])=><button key={id} aria-pressed={mode===id} onClick={()=>setMode(id)} className={`rounded-lg px-4 py-2 text-sm border cursor-pointer ${mode===id?'text-[#8A6500] dark:text-[#D4A72C] border-[#D4A72C] bg-[#D4A72C]/10':'border-neutral-300 dark:border-neutral-700'}`}>{label}</button>)}</div>
      </section>}
      {flowStep===2&&<>
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
      </>}
      {flowStep===3&&<section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-3"><h2 className="font-semibold">Select your skate class</h2><div className="grid sm:grid-cols-3 gap-3">{(['C','B','A'] as const).map(c=><button aria-pressed={skateClass===c} key={c} className={`text-left rounded-lg border p-4 cursor-pointer ${skateClass===c?'border-[#D4A72C] bg-[#D4A72C]/10':'border-neutral-300 dark:border-neutral-700'}`} onClick={()=>setSkateClass(c)}><strong>Class {c}</strong><span className="block text-xs mt-2">{c==='C'?'Regular and fakie · standard tricks':c==='B'?'All four stances · standard tricks':'All four stances · adds specialty tricks'}</span></button>)}</div><p className="text-xs text-neutral-500">Body varials and reverts remain available in every class where valid for the trick. Perceived difficulty is rated after practice.</p></section>}
      {flowStep===4&&<section
        aria-label="Challenge and practice session"
        className="trick-practice-workspace bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl"
      >
      {/* 1. Main Trick Presentation */}
      <TrickDisplay
        trickResult={currentSession?.trickResult || finishedSession?.trickResult || null}

        mode={mode}
        onChangeMode={setMode}
        canGenerate={!practicing}
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
            setFinishedSession(finished.sessionEndedAt?finished:null);
            setCurrentSession(null);
            showToast(finished.status==='pending'?'Session parked. Resume it from History.':'Session saved. Generate a new challenge when ready.');
          }}
          onUpdateSession={updateSession}
          savedSetups={profile?.savedSetups || []}
          onSelectSetup={(s) => setActiveSetup(s)}
        />
      )}


      </section>}

      {emptyPool&&<p role="status" className="text-sm text-[#8A6500] dark:text-[#D4A72C]">Select at least one trick from this pool to continue.</p>}
      {flowStep>0&&<nav aria-label="Practice setup steps" className="flex justify-between gap-3">
        <button className={HW_BUTTON} disabled={isGenerating||practicing} onClick={()=>goToStep(flowStep===4&&poolSource!=='parameters'?2:flowStep-1)}>Back</button>
        {flowStep<4&&<button disabled={emptyPool} className={`${HW_BUTTON} disabled:cursor-not-allowed`} onClick={()=>{if(emptyPool)return;goToStep(flowStep===2&&poolSource!=='parameters'?4:flowStep+1);}}>Continue</button>}
      </nav>}
      {flowStep===4&&<>
      <ChallengeSessionStatus session={currentSession || finishedSession} />
      <MilestoneMoment sessionId={(currentSession || finishedSession)?.id} />
      </>}

    </div>
  );
};
