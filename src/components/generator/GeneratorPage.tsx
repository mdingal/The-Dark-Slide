import './TrickLabFlow.css';
import {Target, Layers, Shuffle, Trophy, Sparkles, SlidersHorizontal, Check, ArrowRight} from 'lucide-react';
import {consumeLabStart} from '../../domain/dashboardEntry';
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
import '../landing/TrickLabPreview.css';
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
    currentSession: savedCurrentSession,
    setCurrentSession,
    startNewSession,
    updateSession,
    showToast,
    setActiveTab,
  } = useApp();
  const currentSession=savedCurrentSession?.deckGame?null:savedCurrentSession;

  const [startAtIntro]=useState(()=>consumeLabStart());
  const [flowStep,setFlowStep]=useState(startAtIntro?0:currentSession ? 4 : 0);
  useEffect(()=>{const reset=()=>{consumeLabStart();setFlowStep(0);};const target=()=>setFlowStep(4);window.addEventListener('lab-start-entry',reset);window.addEventListener('lab-target-entry',target);return()=>{window.removeEventListener('lab-start-entry',reset);window.removeEventListener('lab-target-entry',target);};},[]);
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
      if(!startAtIntro)setFlowStep(4);
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

  const StepIcon=[Target,Layers,SlidersHorizontal,Trophy,Sparkles][flowStep];
  return (
    <div className={`lab-achievement-flow space-y-6 ${flowStep===0?'lab-start-layout':''}`}>
      <div className={flowStep===0?'lab-start-combined':'block lg:contents'}>
      {flowStep===0&&<section aria-label="Your practice flow" className="practice-flow-visual rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 lg:p-8 space-y-6">
        <div className="space-y-2"><p className="text-xs uppercase tracking-widest text-[#8A6500] dark:text-[#D4A72C]">Your next session</p><h2 className="text-xl lg:text-2xl font-semibold">Make every session count.</h2></div>
        <div className="grid grid-cols-3 gap-3 lg:gap-8"><div className="practice-flow-step min-w-0"><div aria-hidden="true" className="practice-flow-icon"><svg viewBox="0 0 100 100" className="w-full h-full max-w-32 text-[#D4A72C]" fill="none"><g transform="rotate(-28 50 50)"><rect x="35" y="12" width="30" height="76" rx="15" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity=".07"/><path d="M40 32h20M40 68h20" stroke="currentColor" strokeOpacity=".5"/><circle cx="42" cy="28" r="1.5" fill="currentColor"/><circle cx="58" cy="28" r="1.5" fill="currentColor"/><circle cx="42" cy="72" r="1.5" fill="currentColor"/><circle cx="58" cy="72" r="1.5" fill="currentColor"/><path d="M44 47h12M44 53h12" stroke="currentColor" strokeLinecap="round"/></g></svg></div><div><span className="text-xs font-mono text-[#8A6500] dark:text-[#D4A72C]">01</span><h3 className="text-sm lg:text-lg font-semibold mt-2">Choose your challenge</h3><p className="text-xs lg:text-base text-neutral-600 dark:text-neutral-400 mt-2">Pick a trick pool that fits your session.</p></div></div><div className="practice-flow-step min-w-0"><div aria-hidden="true" className="practice-flow-icon"><svg viewBox="0 0 100 100" className="w-full h-full max-w-32 text-[#D4A72C]" fill="none"><circle cx="50" cy="50" r="32" stroke="currentColor" strokeOpacity=".15" strokeWidth="5"/><path d="M50 18a32 32 0 1 1-30.4 22" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/><path d="m36 50 10 10 20-22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg></div><div><span className="text-xs font-mono text-[#8A6500] dark:text-[#D4A72C]">02</span><h3 className="text-sm lg:text-lg font-semibold mt-2">Practice with a goal</h3><p className="text-xs lg:text-base text-neutral-600 dark:text-neutral-400 mt-2">Choose your setup, target, and timer.</p></div></div><div className="practice-flow-step min-w-0"><div aria-hidden="true" className="practice-flow-icon"><svg viewBox="0 0 100 100" className="w-full h-full max-w-32 text-[#D4A72C]" fill="none"><path d="M18 26h64M18 50h64M18 74h64" stroke="currentColor" strokeOpacity=".12"/><path d="M20 72 37 58 53 63 68 40 81 28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 72 37 58 53 63 68 40 81 28v51H20Z" fill="currentColor" fillOpacity=".07"/><circle cx="81" cy="28" r="4" fill="currentColor"/></svg></div><div><span className="text-xs font-mono text-[#8A6500] dark:text-[#D4A72C]">03</span><h3 className="text-sm lg:text-lg font-semibold mt-2">Review your progress</h3><p className="text-xs lg:text-base text-neutral-600 dark:text-neutral-400 mt-2">See your landings, streaks, and results.</p></div></div></div>
      </section>}
      <header className="ds-surface lab-step-header lab-session-intro bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-3">
        <span className="lab-step-medal" aria-hidden="true"><StepIcon size={28}/></span>
        <p className="text-xs uppercase tracking-wider text-[#8A6500] dark:text-[#D4A72C]">Trick Lab{flowStep>0?` · Step ${shownStep} / ${totalSteps}`:''}</p>
        <h1 ref={flowHeading} tabIndex={-1} className="text-2xl font-semibold focus:outline-none">{['Start a practice session','Choose your session mode','Choose your trick pool','Select your skate class','Generate & practice'][flowStep]}</h1>
        {flowStep===0&&<><p className="text-sm text-neutral-600 dark:text-neutral-300">Choose a challenge, set your goal, and make your next session count.</p><button className="session-flow-primary homepage-launch-cta" onClick={()=>goToStep(practicing?4:1)}>{practicing?'RESUME CURRENT SESSION':'START A SESSION'}</button></>}
        {flowStep>0&&<p className="lab-step-description">{['','One trick, a two-trick combo, or an obstacle challenge.','Choose what goes into your next challenge.','Choose the stances and trick range for your session.','Generate your challenge, then choose your setup and goal.'][flowStep]}</p>}
        {flowStep>0&&<div role="progressbar" aria-label="Challenge setup progress" aria-valuemin={0} aria-valuemax={totalSteps} aria-valuenow={shownStep} className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden"><div className="h-full bg-[#D4A72C]" style={{width:`${shownStep/totalSteps*100}%`}}/></div>}
      </header>
      </div>
      {flowStep===0&&<SharedChallengeBar />}
      {flowStep===1&&<section className="ds-surface bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
      <div className="lab-option-grid">{([{id:'single',label:'Single Trick',description:'Focus on one trick, with the variations you choose.',tag:'ONE CHALLENGE',Icon:Layers},{id:'combo',label:'Two-Trick Combo',description:'Connect two tricks into a valid sequence.',tag:'LINK YOUR TRICKS',Icon:Shuffle},{id:'obstacle',label:'Obstacle',description:'Build challenges around grinds, slides, and transfers.',tag:'TAKE IT TO AN OBSTACLE',Icon:SlidersHorizontal}] as const).map(({id,label,description,tag,Icon})=><button type="button" key={id} aria-pressed={mode===id} onClick={()=>setMode(id)} className={`lab-choice-card ${mode===id?'is-selected':''}`}><span className="lab-choice-top"><span className="lab-choice-medal"><Icon size={25}/></span><span className="lab-choice-heading"><span className="lab-choice-status">{mode===id?'SELECTED':'CHOOSE MODE'}</span><strong>{label}</strong></span><span className="lab-choice-check" aria-hidden="true">{mode===id&&<Check size={13}/>}</span></span><span className="lab-choice-description">{description}</span><span className="lab-choice-tag">{tag}</span></button>)}</div>
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
      {flowStep===3&&<section className="ds-surface lab-class-section bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-3"><div className="lab-option-grid">{(['C','B','A'] as const).map(c=><button type="button" aria-pressed={skateClass===c} key={c} className={`lab-choice-card ${skateClass===c?'is-selected':''}`} onClick={()=>setSkateClass(c)}><span className="lab-choice-top"><span className="lab-choice-medal lab-class-medal">{c}</span><span className="lab-choice-heading"><span className="lab-choice-status">{skateClass===c?'SELECTED':'CHOOSE CLASS'}</span><strong>Class {c}</strong></span><span className="lab-choice-check" aria-hidden="true">{skateClass===c&&<Check size={13}/>}</span></span><span className="lab-choice-description">{c==='C'?'Regular and fakie · standard tricks':c==='B'?'All four stances · standard tricks':'All four stances · adds specialty tricks'}</span><span className="lab-choice-tag">{c==='C'?'TWO STANCES':c==='B'?'FOUR STANCES':'SPECIALTY TRICKS'}</span></button>)}</div><p className="lab-class-note text-xs text-neutral-500">Body varials and reverts remain available in every class where valid for the trick. Perceived difficulty is rated after practice.</p></section>}
      {flowStep===4&&<section
        aria-label="Challenge and practice session"
        className="ds-surface trick-practice-workspace bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl"
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
            showToast(finished.status==='pending'?'Session parked. Resume it from History.':'Session saved. Review your results in History.');
            setActiveTab('history');
            window.scrollTo({top:0,behavior:'instant'});
          }}
          onUpdateSession={updateSession}
          savedSetups={profile?.savedSetups || []}
          onSelectSetup={(s) => setActiveSetup(s)}
        />
      )}


      </section>}

      {emptyPool&&<p role="status" className="text-sm text-[#8A6500] dark:text-[#D4A72C]">Select at least one trick from this pool to continue.</p>}
      {flowStep>0&&<nav aria-label="Practice setup steps" className="lab-step-navigation flex justify-between gap-3">
        <button className="session-flow-back" disabled={isGenerating||practicing} onClick={()=>goToStep(flowStep===4&&poolSource!=='parameters'?2:flowStep-1)}>Back</button>
        <button type="button" className="session-flow-back lab-flow-reset" disabled={isGenerating} onClick={()=>goToStep(0)}>Reset</button>
        {flowStep<4&&<button disabled={emptyPool} className="session-flow-primary lab-flow-continue disabled:cursor-not-allowed" onClick={()=>{if(emptyPool)return;goToStep(flowStep===2&&poolSource!=='parameters'?4:flowStep+1);}}>Continue<ArrowRight size={17} aria-hidden="true"/></button>}
      </nav>}
      {flowStep===4&&<>
      <ChallengeSessionStatus session={currentSession || finishedSession} />
      <MilestoneMoment sessionId={(currentSession || finishedSession)?.id} />
      </>}

    </div>
  );
};
