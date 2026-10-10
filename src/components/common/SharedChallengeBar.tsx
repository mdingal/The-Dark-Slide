import React,{useState,useEffect,useRef} from 'react';
import {useApp} from '../../context/AppContext';
import {challengePeriod} from '../../../shared/challengePeriods.mjs';
import {loadSharedChallenge,challengeSubmissionCount,syncChallengeSubmission} from '../../services/communityChallengeService';
import {SharedChallenge,challengeActive,challengeProgress,challengeSessions} from '../../domain/communityChallenges';
import {getChallengeComplexity} from '../../domain/complexity';
import {Modal} from './Modal';
export const SharedChallengeBar:React.FC<{inline?:boolean}>=({inline=false})=>{
 const {sessions,isLoggedIn,authLoading,profile,startNewSession,resumeSession,setActiveTab,setIsSignInModalOpen,showToast}=useApp();
 const [now,setNow]=useState(Date.now()),[challenges,setChallenges]=useState<SharedChallenge[]>([]),[error,setError]=useState(false),[loading,setLoading]=useState(true),[refresh,setRefresh]=useState(0),[selected,setSelected]=useState<SharedChallenge|null>(null),[variant,setVariant]=useState<'primary'|'alternative'>('primary'),[busy,setBusy]=useState(false);
 const countRefresh=useRef(0),forceRefresh=useRef(false);
 const requestRefresh=(force=false)=>{forceRefresh.current=force;setRefresh(v=>v+1);};
 const [counts,setCounts]=useState<Record<string,number>>({});
 const daily=challengePeriod('daily',now),weekly=challengePeriod('weekly',now);
 useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),30000);return()=>window.clearInterval(timer);},[]);
 useEffect(()=>{let active=true;setLoading(true);setError(false);void Promise.all([loadSharedChallenge(daily.id,forceRefresh.current),loadSharedChallenge(weekly.id,forceRefresh.current)]).then(rows=>{if(active)setChallenges(rows.filter((c):c is SharedChallenge=>!!c));}).catch(()=>{if(active){setChallenges([]);setError(true);}}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[daily.id,weekly.id,refresh]);
 const completionSignature=JSON.stringify(sessions.filter(s=>s.sharedChallenge).map(s=>[s.id,s.sharedChallenge,s.sessionEndedAt,s.landingCount]));
 useEffect(()=>{if(authLoading)return;const force=refresh!==countRefresh.current&&forceRefresh.current;countRefresh.current=refresh;let active=true;void Promise.all(challenges.map(async c=>{if(isLoggedIn)await syncChallengeSubmission(c,sessions,force);return [c.id,await challengeSubmissionCount(c.id,force)] as const;})).then(rows=>{if(active)setCounts(Object.fromEntries(rows));}).catch(()=>{if(active)setCounts({});});return()=>{active=false;};},[challenges,completionSignature,isLoggedIn,authLoading,profile?.id,refresh]);
 // Focus refreshes are throttled; opening another tab must not trigger repeated reads.
 useEffect(()=>{let last=Date.now();const refreshCounts=()=>{if(Date.now()-last<60000)return;last=Date.now();requestRefresh();};window.addEventListener('focus',refreshCounts);return()=>window.removeEventListener('focus',refreshCounts);},[]);
 const timeLeft=(c:SharedChallenge)=>{const minutes=Math.max(0,Math.ceil((Date.parse(c.endsAt)-now)/60000)),days=Math.floor(minutes/1440),hours=Math.floor(minutes%1440/60),mins=minutes%60;return `${days?days+'d ':''}${hours}h ${mins}m`;};
 const visible=challenges.filter(c=>challengeActive(c,now));
 const begin=async()=>{
  if(!selected||busy)return;
  if(!isLoggedIn){setSelected(null);setActiveTab('home');setIsSignInModalOpen(true);return;}
  if(!challengeActive(selected,Date.now())){showToast('This challenge has ended. Choose the new challenge.');setSelected(null);requestRefresh(true);return;}
  const result=variant==='alternative'?selected.alternative:selected.primary;if(!result)return;
  setBusy(true);try{const session=await startNewSession(result,{id:selected.id,kind:selected.kind,variant,startsAt:selected.startsAt,endsAt:selected.endsAt,targetLandings:selected.targetLandings});setActiveTab('generator');setSelected(null);showToast(`${selected.kind==='daily'?'Daily':'Weekly'} challenge started. Land ${selected.targetLandings} ${selected.targetLandings===1?'time':'times'} in this session, then finish it.`);}catch(e){showToast(e instanceof Error?e.message:'Could not start challenge.');}finally{setBusy(false);}
 };
 const target=selected&&(variant==='alternative'?selected.alternative:selected.primary);
 return <>
  <aside aria-label="Daily and weekly community challenges" className={`${inline?'community-challenges-inline':'community-challenge-dock'} ${isLoggedIn&&!inline?'community-challenge-dock-signed-in':''} rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white/50 dark:bg-neutral-950/70 backdrop-blur-md`}>
   <div className="px-4 py-3">
    <div className="flex items-center justify-between gap-3 mb-1"><span className="text-[10px] uppercase tracking-widest text-neutral-600 dark:text-neutral-400">Community challenges</span></div>
    <>
     {loading&&<p className="text-xs text-neutral-500 py-1">Loading challenges…</p>}
     {!loading&&(error||!visible.length)&&<div className="flex gap-3 items-center text-xs text-neutral-500 py-1"><span>{error?'Challenges unavailable.':'The next challenges haven’t been published yet.'}</span><button type="button" className="cursor-pointer underline underline-offset-4" onClick={()=>requestRefresh(true)}>Refresh</button></div>}
     <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{visible.map(c=><button key={c.id} type="button" onClick={()=>{setSelected(c);setVariant('primary');}} className="group cursor-pointer w-full min-w-0 text-left rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2 hover:bg-[#D4A72C]/10 hover:border-[#D4A72C] transition-colors duration-150 motion-reduce:transition-none focus-visible:outline focus-visible:outline-[#D4A72C]"><div className="flex justify-between gap-2 text-[10px]"><span className="uppercase font-semibold text-[#8A6500] dark:text-[#D4A72C] ">{c.kind} · {isLoggedIn?challengeProgress(c,sessions):'Join the challenge'}</span><span className="text-neutral-500">{counts[c.id]===undefined?'Submissions unavailable':`${counts[c.id]} ${counts[c.id]===1?'submission':'submissions'}`} · {timeLeft(c)} left</span></div><span className="block text-[10px] text-neutral-500 mt-1">Self-reported results</span><p className="text-xs font-semibold mt-1 break-words group-hover:text-[#8A6500] dark:group-hover:text-[#D4A72C]">{c.primary.canonicalName}</p></button>)}</div>
    </>
   </div>
  </aside>
  <Modal isOpen={selected!==null} onClose={()=>{if(!busy)setSelected(null);}} title={selected?`${selected.kind==='daily'?'Daily':'Weekly'} community challenge`:'Community challenge'}>
   {selected&&target&&<div className="space-y-4">
    <p className="text-xl font-semibold break-words">{target.canonicalName}</p><p className="text-xs capitalize text-neutral-500">{getChallengeComplexity(target)} complexity · {challengeProgress(selected,sessions)}</p>
    <p className="text-sm">Land this exact challenge {selected.targetLandings} {selected.targetLandings===1?'time':'times'} in one linked practice session, then stop and finish the session before the deadline. Landings don’t need to be consecutive.</p>
    {selected.alternative&&<div role="group" aria-label="Weekly challenge option" className="flex flex-wrap gap-2">{(['primary','alternative'] as const).map(v=><button key={v} type="button" onClick={()=>setVariant(v)} aria-pressed={variant===v} className={`cursor-pointer rounded-lg border px-3 py-2 text-xs ${variant===v?'border-[#D4A72C] text-[#8A6500] dark:text-[#D4A72C]':'border-neutral-300 dark:border-neutral-700'}`}>{v==='primary'?'Obstacle challenge':'Flatground alternative'}</button>)}</div>}
    <ul className="text-xs space-y-2 text-neutral-500">{target.breakdown.map((line,i)=><li key={i}>{line}</li>)}</ul>
    <p className="text-xs text-neutral-500">Ends {new Date(selected.endsAt).toLocaleString()} in your device’s timezone. Daily reset: midnight Philippines. Weekly reset: Monday midnight Philippines.</p>
    <p className="text-xs text-neutral-500">Completion is self-reported. Your participation and results stay private to your account. Other practice sessions don’t count toward this challenge.</p>
    <div className="flex flex-wrap gap-2"><button type="button" disabled={busy||!challengeActive(selected,now)} onClick={()=>void begin()} className="cursor-pointer rounded-lg bg-[#D4A72C] text-neutral-950 px-4 py-2 text-sm font-semibold disabled:opacity-50">{busy?'Starting…':!isLoggedIn?'Sign in to participate':challengeProgress(selected,sessions)==='Completed'?'Practice again':'Start challenge'}</button>
     {isLoggedIn&&challengeSessions(selected,sessions).some(s=>!s.sessionEndedAt)&&<button type="button" disabled={busy} className="cursor-pointer rounded-lg border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm" onClick={()=>{const s=challengeSessions(selected,sessions).find(s=>!s.sessionEndedAt);if(s){resumeSession(s);setActiveTab('generator');setSelected(null);}}}>Resume challenge session</button>}
    </div>
   </div>}
  </Modal>
 </>;
};
