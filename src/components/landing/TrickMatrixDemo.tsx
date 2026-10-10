import './TrickLabPreview.css';
import {BrandLogo} from '../common/BrandLogo';
import {TrickDisplay} from '../generator/TrickDisplay';
import {PracticePanel} from '../generator/PracticePanel';
import {createPracticeSession} from '../../domain/practiceActions';
import {Modal} from '../common/Modal';
import React,{useState,useEffect} from 'react';
import {HW_BUTTON} from '../settings/HardwareManager';
import {ParameterSelector} from '../generator/ParameterSelector';
import {generateChallenge} from '../../domain/challengeGeneration';
import {baseChallengePool,selectPoolChallenge} from '../../domain/selectedChallengePool';
import {minimumSkateClass} from '../../domain/skateClasses';
import {trickKey} from '../../domain/progression';
import {GeneratedTrickResult,GeneratorPresetConfig,ParameterLocks,ParameterExclusions,SingleTrickParameters,SkateClass,TrickMode,SetupData,PracticeSession} from '../../domain/types';
export const TrickMatrixDemo:React.FC<{onPromptAuth:()=>void;onExpandedChange?:(expanded:boolean)=>void;embedded?:boolean}>=({onPromptAuth,onExpandedChange,embedded=false})=>{
 const [step,S]=useState(0),[mode,M]=useState<TrickMode>('single'),[source,F]=useState('parameters'),[tier,C]=useState<SkateClass>('C'),[locks,L]=useState<ParameterLocks>({}),[excluded,E]=useState<ParameterExclusions>({}),[selected,P]=useState<string[]>([]),[result,R]=useState<GeneratedTrickResult|null>(null),[error,X]=useState('');
 useEffect(()=>{onExpandedChange?.(step>0);},[step,onExpandedChange]);
 const [demoSession,Q]=useState<PracticeSession|null>(null),[auth,A]=useState(false);
 const demoSetups:SetupData[]=[{id:'demo-34',name:'Demo 34 mm setup',deckWidthMm:34,wheelMaterial:'urethane'},{id:'demo-32',name:'Demo 32 mm setup',deckWidthMm:32,wheelMaterial:'plastic'}];
 const [params,V]=useState<SingleTrickParameters>({stance:'regular',direction:'none',baseTrickId:'kickflip',bodyVarial:'none',landing:'normal',revert:'none'});
 const pool=baseChallengePool().filter(t=>t.mode===mode);
 const generate=()=>{
  const config:GeneratorPresetConfig={mode,skateClass:tier,complexityFilter:'all',singleLocks:locks,singleExclusions:excluded,step1Locks:locks,step2Locks:{},step1Exclusions:excluded,step2Exclusions:{},obstacleLocks:{},obstacleExclusions:{},activeParams:params,step1Params:params,step2Params:params,selectedObstacle:'ledge',obstacleData:{obstacleType:'ledge',approach:'frontside',obstacleTrickId:'50_50',entryTrickId:'ollie',exitTrick:'clean'}};
  const next=source==='selected'?selectPoolChallenge(pool.filter(t=>selected.includes(trickKey(t))),mode,'all'):generateChallenge(config);
  if('error' in next){X(next.error);return;}const generated={...next,skateClass:source==='parameters'?tier:minimumSkateClass(next)};R(generated);Q(createPracticeSession(generated,demoSetups[0]));X('');
 };
 const totalSteps=source==='parameters'?4:3,shownStep=step===4?totalSteps:step;
 const emptyPool=step===2&&source==='selected'&&!pool.some(t=>selected.includes(trickKey(t)));
 const choice=(active:boolean)=>`${HW_BUTTON} ${active?'bg-[#D4A72C]/10':''}`;
 const requestAuth=()=>{S(0);onPromptAuth();};
 const flow=<section aria-label="Trick Lab demo" className={`demo-white-controls bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-8 space-y-5 w-full mx-auto max-w-none`}>
 <header className="space-y-2"><p className="text-xs uppercase tracking-wider text-[#8A6500] dark:text-[#D4A72C]">Interactive Trick Lab preview</p><h3 className={step===0 ? "text-2xl sm:text-3xl font-semibold" : "text-xl font-semibold"}>{['Start a practice session','Choose your session mode','Choose your trick pool','Select your skate class','Generate & practice'][step]}</h3><p className="text-sm text-neutral-500">Try the current challenge flow. Sign in to configure your setup, goal, timer, and surface and save your practice.</p>{step>0&&<div role="progressbar" aria-label="Demo setup progress" aria-valuemin={0} aria-valuemax={totalSteps} aria-valuenow={shownStep} className="h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden"><div className="h-full bg-[#D4A72C]" style={{width:`${shownStep/totalSteps*100}%`}}/></div>}</header>
 {step===0&&<button className="demo-start-cta w-full sm:w-auto rounded-xl px-8 py-3.5 text-base font-bold cursor-pointer" onClick={()=>S(1)}><span aria-hidden="true" className="demo-edge demo-edge-top"/><span aria-hidden="true" className="demo-edge demo-edge-right"/><span aria-hidden="true" className="demo-edge demo-edge-bottom"/><span aria-hidden="true" className="demo-edge demo-edge-left"/>Try a Session</button>}
 {step===1&&<div className="flex flex-wrap gap-3">{([['single','Single Trick'],['combo','Two-Trick Combo'],['obstacle','Obstacle']] as const).map(([id,label])=><button key={id} aria-pressed={mode===id} className={choice(mode===id)} onClick={()=>{M(id);R(null);X('');}}>{label}</button>)}</div>}
 {step===2&&<div className="space-y-4"><div className="flex flex-wrap gap-3">{[['parameters','Parameters & Locks'],['selected','Selected Trick Pool']].map(([id,label])=><button key={id} className={choice(source===id)} aria-pressed={source===id} onClick={()=>F(id)}>{label}</button>)}<button className={HW_BUTTON} onClick={requestAuth}>Personal Trick Library · Sign in</button></div>
 {source==='selected'?<fieldset className="grid sm:grid-cols-2 gap-3"><legend className="text-sm mb-3">Select the tricks to shuffle</legend>{pool.map(t=><label key={trickKey(t)} className="flex gap-2 items-start text-sm cursor-pointer"><input type="checkbox" className="accent-[#D4A72C] mt-1" checked={selected.includes(trickKey(t))} onChange={()=>P(selected.includes(trickKey(t))?selected.filter(k=>k!==trickKey(t)):[...selected,trickKey(t)])}/>{t.canonicalName}</label>)}{!pool.length&&<p className="text-sm text-neutral-500">The full Trick Lab supports saved combos and obstacle challenges in your pool. Try Parameters & Locks for this mode.</p>}</fieldset>:mode==='obstacle'?<p className="text-sm text-neutral-500">This preview shuffles valid ledge and rail challenges. Sign in for obstacle locks, transfers, and custom pools.</p>:<><p className="text-xs text-neutral-500">{mode==='combo'?'Configure the first trick; the second trick is generated to match its landing.':'Lock any parameter or customize its pool.'}</p><ParameterSelector locks={locks} exclusions={excluded} activeValues={params} onToggleLock={(k,v)=>L(prev=>{const next={...prev};if(v===undefined)delete next[k];else next[k]=v;return next;})} onClearLocks={()=>L({})} onToggleExclude={(k,id)=>E(prev=>({...prev,[k]:(prev[k]||[]).includes(id)?(prev[k]||[]).filter(v=>v!==id):[...(prev[k]||[]),id]}))} onResetExclusions={k=>E(prev=>({...prev,[k]:[]}))} onChangeValue={(k,v)=>{V(prev=>({...prev,[k]:v}));if(locks[k]!==undefined)L(prev=>({...prev,[k]:v}));}}/></>}
 </div>}
 {step===3&&<div className="grid sm:grid-cols-3 gap-3">{(['C','B','A'] as const).map(c=><button key={c} aria-pressed={tier===c} className={`${choice(tier===c)} text-left p-4`} onClick={()=>C(c)}><strong>Class {c}</strong><span className="block text-xs mt-2">{c==='C'?'Regular and fakie · standard tricks':c==='B'?'All four stances · standard tricks':'All four stances · adds specialty tricks'}</span></button>)}</div>}
 {step===4&&<section aria-label="Challenge and practice session" className="ds-surface trick-practice-workspace bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
 <TrickDisplay demo trickResult={result} mode={mode} onChangeMode={M} onGenerate={generate} conflictError={error} onClearLocks={()=>L({})}/>
 {result&&demoSession&&<PracticePanel key={demoSession.id} session={demoSession} savedSetups={demoSetups} onSelectSetup={()=>{}} onUpdateSession={async()=>{}} demo={{setups:demoSetups,onStart:()=>{S(0);A(true);}}}/>}
 </section>}

 {emptyPool&&<p role="status" className="text-sm text-[#8A6500] dark:text-[#D4A72C]">Select at least one trick to continue.</p>}
 {step>0&&<nav aria-label="Demo steps" className="flex justify-between gap-3 border-t border-neutral-200 dark:border-neutral-800 pt-4"><button data-demo-navigation className={HW_BUTTON} onClick={()=>S(step===4&&source!=='parameters'?2:step-1)}>Back</button>{step<4&&<button data-demo-navigation disabled={emptyPool} className={`${HW_BUTTON} disabled:cursor-not-allowed`} onClick={()=>{if(emptyPool)return;R(null);X('');S(step===2&&source!=='parameters'?4:step+1);}}>Continue</button>}</nav>}
 </section>;
 return <>
 <section aria-label="Start a demo practice session" className={`demo-white-controls space-y-8 ${embedded?'':'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-8 max-w-xl mx-auto'}`}>
   <div className="flex items-center gap-4">
     <BrandLogo monogram className="w-16 sm:w-20 shrink-0" />
     <div className="border-l border-neutral-300 dark:border-neutral-700 pl-4">
       <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] font-semibold text-neutral-500 dark:text-neutral-400">Fingerboard Lab</p>
       <p className="text-xs text-[#8A6500] dark:text-[#D4A72C] mt-1">Find your next breakthrough.</p>
     </div>
   </div>
   <header className="space-y-4">
     <h2 className="text-base sm:text-xl xl:text-2xl whitespace-nowrap font-bold tracking-tight text-neutral-900 dark:text-white">Everything You Need to Progress</h2>
     <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed">Find your next challenge, make every attempt count,<span className="inline sm:block"> and see how your riding evolves.</span></p>
   </header>
   <ol aria-label="Your practice flow" className="grid grid-cols-3 gap-2 sm:gap-3">
     {[['01','Choose','Your tricks'],['02','Generate','Your challenge'],['03','Practice','Your progress']].map(([number,title,detail])=><li key={number} className="ds-surface rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-white/[0.025] p-3 sm:p-4 space-y-3">
       <span className="block text-[10px] font-mono tracking-widest text-[#8A6500] dark:text-[#D4A72C]">{number}</span>
       <div><span className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</span><span className="block text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-1">{detail}</span></div>
     </li>)}
   </ol>
   <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6 space-y-4">
     <div className="space-y-2">
       <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Start a Demo Practice Session</h3>
       <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">Try the generator and preview your session settings. Sign in when you’re ready to save your progress.</p>
     </div>
     <button type="button" className="demo-start-cta w-full sm:w-auto rounded-xl px-8 py-3.5 text-base font-bold cursor-pointer inline-flex items-center justify-center gap-3" onClick={()=>{R(null);Q(null);X('');S(1);}}>Try a Session<svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-5-5 5 5-5 5"/></svg></button>
   </div>
 </section>

 <Modal isOpen={step>0} onClose={()=>S(0)} title="Configure your demo session" wide>{flow}</Modal>
 <Modal isOpen={auth} onClose={()=>A(false)} title="Sign in to start your practice session"><div className="space-y-4"><p className="text-sm text-neutral-600 dark:text-neutral-300">Sign in or create a rider account to start your timer and save your attempts, landings, and progress.</p><button className="demo-auth-button demo-start-cta rounded-xl px-6 py-3 text-sm font-bold cursor-pointer" onClick={()=>{A(false);requestAuth();}}>Sign in / Create an account</button></div></Modal>
 </>;
};
