import React,{useMemo,useState} from 'react';
import {useApp} from '../../context/AppContext';
import {progressMilestones} from '../../domain/milestones';
export const MilestonePanel:React.FC=()=>{
 const {sessions,resumeSession,setActiveTab}=useApp();const [expanded,setExpanded]=useState(false);
 const milestones=useMemo(()=>progressMilestones(sessions),[sessions]);
 return <section className="ds-surface rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-4">
  <div className="flex flex-wrap justify-between items-center gap-3"><div><h2 className="text-lg font-semibold">Progress milestones</h2><p className="text-xs text-neutral-500">From your full recorded history · exact trick variations · {milestones.length} milestones</p></div><button type="button" className="cursor-pointer text-sm text-[#8A6500] dark:text-[#D4A72C]" onClick={()=>setActiveTab('settings')}>Customize your showcase</button></div>
  {!milestones.length&&<p className="text-sm text-neutral-500">Your first recorded landing starts the story. Build a streak or beat a completed session’s landing rate to earn more.</p>}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{milestones.slice(0,expanded?milestones.length:3).map(m=><article key={m.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 space-y-2"><span className="text-[11px] uppercase tracking-wider text-[#8A6500] dark:text-[#D4A72C]">{m.kind==='first'?'Breakthrough':m.kind==='rate'?'Progress':'Consistency'}</span><h3 className="font-semibold">{m.title}</h3><p className="text-sm break-words">{m.trickName}</p><p className="text-xs text-neutral-500">{m.detail}</p><p className="text-xs text-neutral-500">{new Date(m.date).toLocaleDateString()}</p><button type="button" className="cursor-pointer text-xs underline underline-offset-4" onClick={()=>{const s=sessions.find(s=>s.id===m.sessionId);if(s){resumeSession(s);setActiveTab('generator');}}}>Open linked session</button></article>)}</div>
  {milestones.length>3&&<button type="button" className="cursor-pointer text-sm underline underline-offset-4" onClick={()=>setExpanded(v=>!v)}>{expanded?'Show recent milestones':`See all ${milestones.length} milestones`}</button>}
  <p className="text-xs text-neutral-500">Landing-rate records compare completed sessions with at least 10 attempts. Imported history counts; undoing or deleting records recalculates milestones.</p>
 </section>;
};

export const MilestoneMoment:React.FC<{sessionId?:string}>=({sessionId})=>{
 const {sessions}=useApp();const milestones=useMemo(()=>progressMilestones(sessions).filter(m=>m.sessionId===sessionId),[sessions,sessionId]);
 if(!milestones.length)return null;
 return <section role="status" className="rounded-xl border border-[#D4A72C]/40 bg-[#D4A72C]/5 p-4 space-y-2"><p className="text-xs uppercase tracking-wider font-semibold text-[#8A6500] dark:text-[#D4A72C]">A step forward · this session</p>{milestones.map(m=><p key={m.id} className="text-sm"><strong>{m.title}</strong> · {m.detail}</p>)}</section>;
};
