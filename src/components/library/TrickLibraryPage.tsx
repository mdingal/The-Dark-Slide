import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { GeneratedTrickResult, SingleTrickParameters, PracticeSession } from '../../domain/types';
import { BASE_TRICKS, CATALOG_VERSION } from '../../domain/catalog';
import { formatSingleTrickName } from '../../domain/naming';
import { generateBreakdown } from '../../domain/rules';
import { getPersonalBests, trickKey, LEARNING_STATUSES } from '../../domain/progression';
import { formatDurationMs } from '../../domain/timer';
import { getChallengeComplexity } from '../../domain/complexity';
import { ChallengeActions } from '../common/ChallengeActions';
import { TrickLibraryControl } from '../common/TrickLibraryControl';
import { SessionDetailsModal } from '../dashboard/SessionDetailsModal';

export const TrickLibraryPage:React.FC=()=>{
  const {profile,sessions,setTrickLearningStatus,resumeSession,showToast}=useApp();
  const [search,setSearch]=useState(''),[status,setStatus]=useState('all'),[selected,setSelected]=useState('');
  const [busy,setBusy]=useState(false),[inspect,setInspect]=useState<PracticeSession|null>(null);
  const library=profile?.trickLibrary || [];
  const available=useMemo(()=>{
    const map=new Map<string,GeneratedTrickResult>();
    for(const base of BASE_TRICKS){
      const p:SingleTrickParameters={stance:'regular',direction:base.applicableDirections.includes('none')?'none':base.applicableDirections[0],
        baseTrickId:base.id,bodyVarial:'none',landing:'normal',revert:'none'};
      const result:GeneratedTrickResult={mode:'single',singleTrick:p,canonicalName:formatSingleTrickName(p),breakdown:generateBreakdown(p,base),catalogVersion:CATALOG_VERSION};
      map.set(trickKey(result),result);
    }
    [...sessions.map(s=>s.trickResult),...(profile?.bookmarks || []).map(b=>b.trickResult),...library.map(t=>t.trickResult)].forEach(t=>map.set(trickKey(t),t));
    return [...map.entries()].sort((a,b)=>a[1].canonicalName.localeCompare(b[1].canonicalName));
  },[sessions,profile]);
  const entries=library.filter(t=>(status==='all'||t.status===status)&&t.trickResult.canonicalName.toLowerCase().includes(search.toLowerCase()));
  const input='rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-xs min-w-0';
  return <div className="space-y-5">
    <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-3">
      <h1 className="text-xl font-semibold">Personal Trick Library</h1>
      <p className="text-xs text-neutral-600 dark:text-neutral-300">Choose your learning status. Sessions, personal bests, and weak points link to the exact challenge, including stance, modifiers, and obstacle.</p>
      <div className="flex flex-wrap gap-2">
        {LEARNING_STATUSES.map(s=><span key={s.id} className="rounded-md bg-neutral-100 dark:bg-neutral-800 px-2 py-1 text-xs">{s.label}: {library.filter(t=>t.status===s.id).length}</span>)}
      </div>
      <form className="flex flex-col sm:flex-row sm:flex-wrap gap-2" onSubmit={async e=>{
        e.preventDefault();const result=available.find(([key])=>key===selected)?.[1];if(!result||busy)return;
        setBusy(true);try{await setTrickLearningStatus(result,'want_to_learn');setSelected('');}
        catch{showToast('Could not add this trick. Try again.');}finally{setBusy(false);}
      }}>
        <select aria-label="Trick to add to library" value={selected} onChange={e=>setSelected(e.target.value)} className={`${input} w-full sm:w-auto sm:flex-1`}>
          <option value="">Choose a trick or challenge</option>
          {available.filter(([key])=>!library.some(t=>trickKey(t.trickResult)===key)).map(([key,t])=><option key={key} value={key}>{t.canonicalName}</option>)}
        </select>
        <button type="submit" disabled={busy||!selected} className="px-3 py-2 rounded-md text-xs bg-[#D4A72C] text-[#292524] disabled:opacity-40">Add Trick</button>
      </form>
      <div className="flex flex-wrap gap-2">
        <input aria-label="Search trick library" placeholder="Search your tricks" value={search} onChange={e=>setSearch(e.target.value)} className={`${input} flex-1`}/>
        <select aria-label="Filter learning status" value={status} onChange={e=>setStatus(e.target.value)} className={input}>
          <option value="all">All statuses</option>{LEARNING_STATUSES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
    </section>
    {!entries.length&&<p className="text-sm text-neutral-600 dark:text-neutral-300">No tricks match. Add a trick above or use the learning status dropdown beside a generated challenge.</p>}
    {entries.map(entry=>{
      const linked=sessions.filter(s=>trickKey(s.trickResult)===trickKey(entry.trickResult));
      const best=getPersonalBests(linked),rate=best.highestLandingRate;
      return <article key={entry.id} className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <div><p className="text-xs text-neutral-500 capitalize">{entry.trickResult.mode} · {getChallengeComplexity(entry.trickResult)} complexity</p>
            <h2 className="text-lg font-semibold break-words">{entry.trickResult.canonicalName}</h2></div>
          <div className="shrink-0"><TrickLibraryControl result={entry.trickResult}/></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-3"><p>Fewest attempts to first land</p><p className="text-xl font-mono mt-1">{best.fewestFirstLandingAttempts!==undefined?`#${best.fewestFirstLandingAttempts}`:'—'}</p></div>
          <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-3"><p>Highest session landing rate</p><p className="text-xl font-mono mt-1">{rate?`${Math.round(rate.rate*100)}%`:'—'}</p>{rate&&<p className="mt-1 text-neutral-500">{rate.landings} / {rate.attempts} attempts</p>}</div>
          <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-3"><p>Best recorded landing streak</p><p className="text-xl font-mono mt-1">{best.bestStreak}</p></div>
        </div>
        <div className="text-xs space-y-1">
          <p><strong>Most common miss:</strong> {best.topMisses.map(t=>`${t.label} (${t.count})`).join(', ')||'No miss tags recorded'}</p>
          {best.missCounts.length>0&&<p className="text-neutral-500">{best.missCounts.map(t=>`${t.label}: ${t.count}`).join(' · ')}</p>}
        </div>
        <ChallengeActions result={entry.trickResult}/>
        <details><summary className="cursor-pointer text-xs font-semibold">Linked Session History ({linked.length})</summary>
          <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
            {!linked.length&&<p className="text-xs text-neutral-500">No sessions yet. Repeat this challenge to start practicing.</p>}
            {linked.map(s=><button type="button" key={s.id} onClick={()=>setInspect(s)}
              className="w-full text-left rounded-md bg-neutral-50 dark:bg-neutral-800 p-3 text-xs">
              {new Date(s.generatedAt).toLocaleString()} · {s.landingCount}/{s.attemptCount} landed · {formatDurationMs(s.activeDurationMs)} · {s.setupSnapshot.name}
              <span className="block mt-1 text-[#8A6500] dark:text-[#D4A72C]">View session details</span>
            </button>)}
          </div>
        </details>
      </article>;
    })}
    <SessionDetailsModal session={inspect} isOpen={inspect!==null} onClose={()=>setInspect(null)} onResume={resumeSession}/>
  </div>;
};
