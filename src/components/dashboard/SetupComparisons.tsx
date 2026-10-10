import React, { useState, useMemo } from 'react';
import { PracticeSession } from '../../domain/types';
import { compareSetups, ComparisonGroup, trickKey } from '../../domain/progression';
import { formatDurationMs } from '../../domain/timer';

export const SetupComparisons:React.FC<{sessions:PracticeSession[];expanded?:boolean}>=({sessions,expanded=false})=>{
  const [group,setGroup]=useState<ComparisonGroup>('setup'),[selected,setSelected]=useState('');
  const challenges=useMemo(()=>[...new Map(sessions.filter(s=>s.attemptCount>0).map(s=>[trickKey(s.trickResult),s.trickResult.canonicalName])).entries()]
    .sort((a,b)=>a[1].localeCompare(b[1])),[sessions]);
  const exact=challenges.some(([key])=>key===selected)?selected:'';
  const rows=compareSetups(sessions,group,exact||undefined);
  const input='rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-xs min-w-0';
  const Container=expanded?'section':'details';
  return <Container className="ds-surface rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
    {expanded?<h2 className="text-lg font-semibold">Setup Comparisons</h2>:<summary className="text-sm font-semibold cursor-pointer">Setup Comparisons</summary>}
    <div className="mt-3 space-y-3">
      <p className="text-xs text-neutral-600 dark:text-neutral-300">Uses the hardware recorded in each session. Comparisons describe logged practice, not proof that one setup performs better. Choose the same exact challenge for a focused comparison. Unattempted sessions are excluded.</p>
      <div className="flex flex-wrap gap-2">
        <select aria-label="Compare hardware by" value={group} onChange={e=>setGroup(e.target.value as ComparisonGroup)} className={input}>
          <option value="setup">Whole setup</option><option value="deck">Deck</option><option value="trucks">Trucks</option><option value="wheels">Wheels</option>
        </select>
        <select aria-label="Exact trick for setup comparison" value={exact} onChange={e=>setSelected(e.target.value)} className={`${input} flex-1`}>
          <option value="">All challenges</option>{challenges.map(([key,name])=><option key={key} value={key}>{name}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="mobile-data-table w-full text-left text-xs">
          <thead><tr className="border-b border-neutral-200 dark:border-neutral-800">
            {['Hardware','Sessions','Attempts','Landings','Landing rate','Avg. attempts to first land','Practice time'].map(t=><th key={t} className="p-2 whitespace-nowrap">{t}</th>)}
          </tr></thead>
          <tbody>{rows.map(row=><tr key={row.key} className="border-b border-neutral-100 dark:border-neutral-800">
            <td data-label="Hardware" className="p-2 min-w-52">{row.label}{row.sessions<3&&<span className="block text-[11px] text-neutral-500 mt-1">Early sample · fewer than 3 sessions</span>}</td><td data-label="Sessions" className="p-2">{row.sessions}</td><td data-label="Attempts" className="p-2">{row.attempts}</td><td data-label="Landings" className="p-2">{row.landings}</td>
            <td data-label="Landing rate" className="p-2 font-mono">{Math.round(row.landingRate*100)}%</td>
            <td data-label="Average attempts to first landing" className="p-2">{row.averageFirstLandingAttempts!==undefined?`${row.averageFirstLandingAttempts.toFixed(1)} (${row.firstLandingSamples} sessions)`:'—'}</td>
            <td data-label="Practice time" className="p-2 font-mono whitespace-nowrap">{formatDurationMs(row.durationMs)}</td>
          </tr>)}</tbody>
        </table>
      </div>
      {!rows.length&&<p className="text-xs text-neutral-500">No attempted sessions match this comparison yet.</p>}
      <p className="text-[11px] text-neutral-500">Add deck, truck, and wheel models in Rider Profile. Existing snapshots remain unchanged and show “Not recorded” for missing details.</p>
    </div>
  </Container>;
};
