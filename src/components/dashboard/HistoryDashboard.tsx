import {classLabel} from '../../domain/skateClasses';
import {ChallengeCompletionPanel} from '../common/ChallengeCompletionPanel';
import {MilestonePanel} from '../common/MilestonePanel';
import React, { useState, useMemo } from 'react';
import { BookmarksPanel } from '../generator/BookmarksPanel';
import { SetupComparisons } from './SetupComparisons';
import { useApp } from '../../context/AppContext';
import { PracticeSession } from '../../domain/types';
import { formatDurationMs } from '../../domain/timer';
import { HistoryFilters, FilterState } from './HistoryFilters';
import { HistoryTable } from './HistoryTable';
import { SessionDetailsModal } from './SessionDetailsModal';
import { AnalyticsChart, ExpandedAnalytics } from './AnalyticsChart';
import { CATEGORIES, CHARTS, Category, ChartDefinition, DashboardPreferences, dashboardPreferences, sessionStance, sessionDay, dayKey } from '../../domain/dashboardAnalytics';
import { trickKey } from '../../domain/progression';

const INITIAL_FILTERS:FilterState={search:'',status:'all',dateRange:'all',stance:'all',deckWidth:'all',wheelMaterial:'all',obstacle:'all',sortBy:'date',sortOrder:'desc'};
const INPUT='rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm min-w-0 max-w-full';
const CARD='bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5';
export const HistoryDashboard:React.FC=()=>{
  const {sessions,profile,resumeSession,deleteSession,deleteSessions,saveDashboardPreferences,showToast}=useApp();
  const [surface,setSurface]=useState('all'),[tier,setTier]=useState('all'),[timerFilter,setTimerFilter]=useState('all'),[goalFilter,setGoalFilter]=useState('all'),[setupFilter,setSetupFilter]=useState('all');
  const [filters,setFilters]=useState<FilterState>(INITIAL_FILTERS),[mode,setMode]=useState('all');
  const [preferences,setPreferences]=useState(()=>dashboardPreferences(profile?.dashboardPreferences));
  const prefRef=React.useRef(preferences),revision=React.useRef(0);
  const [exact,setExact]=useState(''),[expanded,setExpanded]=useState<ChartDefinition|null>(null);
  const [inspectSession,setInspectSession]=useState<PracticeSession|null>(null);
  const [saving,setSaving]=useState(false);
  const save=(patch:Partial<DashboardPreferences>)=>{
    const next=dashboardPreferences({...prefRef.current,...patch}),previous=prefRef.current,version=++revision.current;
    prefRef.current=next;setPreferences(next);setSaving(true);
    void saveDashboardPreferences(next).catch(()=>{if(revision.current===version){prefRef.current=previous;setPreferences(previous);}showToast('Could not save dashboard preferences. Please try again.');}).finally(()=>{if(revision.current===version)setSaving(false);});
  };
  // Filter & Sort Sessions
  const filteredSessions = useMemo(() => {
    // Generated challenges become history records only after practice starts.
    let result = sessions.filter(s => !!s.sessionStartedAt && Number.isFinite(Date.parse(s.sessionStartedAt)));

    if(surface!=='all')result=result.filter(s=>s.practiceSurface===surface);
    if(tier!=='all')result=result.filter(s=>classLabel(s.trickResult)===tier);
    if(timerFilter!=='all')result=result.filter(s=>s.practiceTimer?.type===timerFilter);
    if(goalFilter!=='all')result=result.filter(s=>s.goal?.type===goalFilter);
    if(setupFilter!=='all')result=result.filter(s=>s.setupSnapshot.id===setupFilter);
    if (mode !== 'all') result = result.filter(s => s.trickResult.mode === mode);

    // 1. Search text
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (s) =>
          s.trickResult.canonicalName.toLowerCase().includes(q) ||
          s.setupSnapshot.name.toLowerCase().includes(q) ||
          s.notes?.toLowerCase().includes(q)
      );
    }

    // 2. Status
    if (filters.status !== 'all') {
      result = result.filter((s) => s.status === filters.status);
    }

    // 3. Date range
    if (filters.dateRange !== 'all') {
      const now = Date.now();
      result = result.filter((s) => {
        const time = new Date(s.sessionStartedAt || s.generatedAt).getTime();
        if (filters.dateRange === 'today') {
          return sessionDay(s) === dayKey(new Date());
        } else if (filters.dateRange === 'week') {
          return now - time <= 86400000 * 7;
        } else if (filters.dateRange === 'month') {
          return now - time <= 86400000 * 30;
        }
        return true;
      });
    }

    // 4. Stance
    if (filters.stance !== 'all') {
      result = result.filter((s) => {
        const stance = sessionStance(s);
        return stance === filters.stance;
      });
    }

    // 5. Deck width
    if (filters.deckWidth !== 'all') {
      if (filters.deckWidth === 'custom') {
        result = result.filter((s) => s.setupSnapshot.isCustomDeckWidth);
      } else {
        const targetWidth = parseFloat(filters.deckWidth);
        result = result.filter((s) => Math.abs(s.setupSnapshot.deckWidthMm - targetWidth) < 0.05);
      }
    }

    // 6. Wheel material
    if (filters.wheelMaterial !== 'all') {
      result = result.filter((s) => s.setupSnapshot.wheelMaterial === filters.wheelMaterial);
    }

    // 7. Obstacle
    if (filters.obstacle !== 'all') {
      result = result.filter((s) => {
        const obs =
          s.trickResult.mode === 'obstacle'
            ? s.trickResult.obstacleData?.obstacleType
            : 'flatground';
        return obs === filters.obstacle;
      });
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (filters.sortBy === 'date') {
        comparison = new Date(a.sessionStartedAt!).getTime() - new Date(b.sessionStartedAt!).getTime();
      } else if (filters.sortBy === 'attempts') {
        comparison = a.attemptCount - b.attemptCount;
      } else if (filters.sortBy === 'duration') {
        comparison = a.activeDurationMs - b.activeDurationMs;
      }
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [sessions, filters, mode, surface, tier, timerFilter, goalFilter, setupFilter]);

  const challenges=useMemo(()=>[...new Map(filteredSessions.map(s=>[trickKey(s.trickResult),s.trickResult.canonicalName])).entries()].sort((a,b)=>a[1].localeCompare(b[1])),[filteredSessions]);
  const validExact=challenges.some(([k])=>k===exact)?exact:'';
  const exactSessions=useMemo(()=>validExact?filteredSessions.filter(s=>trickKey(s.trickResult)===validExact):filteredSessions,[filteredSessions,validExact]);
  const totals=useMemo(()=>{
    const attempted=filteredSessions.filter(s=>s.attemptCount>0),attempts=attempted.reduce((n,s)=>n+s.attemptCount,0),landings=attempted.reduce((n,s)=>n+s.landingCount,0);
    return {attempted:attempted.length,attempts,landings,time:filteredSessions.reduce((n,s)=>n+s.activeDurationMs,0),rate:attempts?Math.round(landings/attempts*100):null,days:new Set(attempted.map(sessionDay)).size};
  },[filteredSessions]);
  const pin=(id:string)=>{
    const pinned=prefRef.current.pinned;
    if(!pinned.includes(id)&&pinned.length>=4){showToast('You can pin up to four charts. Unpin one first.');return;}
    save({pinned:pinned.includes(id)?pinned.filter(x=>x!==id):[...pinned,id]});
  };
  const toggleCollapse=(id:string)=>save({collapsed:prefRef.current.collapsed.includes(id)?prefRef.current.collapsed.filter(x=>x!==id):[...prefRef.current.collapsed,id]});
  const selected=preferences.selected[preferences.category]||[];
  const toggleChart=(id:string)=>{const c=preferences.category,ids=prefRef.current.selected[c]||[];save({selected:{...prefRef.current.selected,[c]:ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]}});};
  const exactControl=<label className="flex flex-col gap-1 text-xs font-medium min-w-0">Exact trick variation
    <select aria-label="Exact trick variation for analytics" value={validExact} onChange={e=>setExact(e.target.value)} className={INPUT}><option value="">All matching challenges</option>{challenges.map(([key,name])=><option key={key} value={key}>{name}</option>)}</select>
    <span className="font-normal text-neutral-600 dark:text-neutral-400">Applies to progress, consistency, weak-point, and hardware-performance charts.</span>
  </label>;
  const sharedControls=<div className="flex flex-wrap gap-3">
    <label className="text-xs font-medium flex flex-col gap-1">Date range<select aria-label="Dashboard date range" className={INPUT} value={filters.dateRange} onChange={e=>setFilters({...filters,dateRange:e.target.value})}><option value="all">All time</option><option value="today">Today</option><option value="week">Past 7 days</option><option value="month">Past 30 days</option></select></label>
    <label className="text-xs font-medium flex flex-col gap-1">Session mode<select aria-label="Dashboard session mode" className={INPUT} value={mode} onChange={e=>setMode(e.target.value)}><option value="all">All modes</option><option value="single">Single Trick</option><option value="combo">Two-Trick Combo</option><option value="obstacle">Obstacle</option></select></label>
    {[
      {label:'Practice surface',value:surface,set:setSurface,options:[...new Set(sessions.filter(s=>s.sessionStartedAt).map(s=>s.practiceSurface).filter((s):s is string=>!!s))].map(s=>[s,s])},
      {label:'Skate class',value:tier,set:setTier,options:['Class C','Class B','Class A'].map(s=>[s,s])},
      {label:'Timer',value:timerFilter,set:setTimerFilter,options:[['regular','Regular'],['countdown','Countdown']]},
      {label:'Goal',value:goalFilter,set:setGoalFilter,options:[['landings','Total landings'],['streak','In a row']]},
      {label:'Fingerboard setup',value:setupFilter,set:setSetupFilter,options:[...new Map(sessions.filter(s=>s.sessionStartedAt).map(s=>[s.setupSnapshot.id,s.setupSnapshot.name])).entries()]}
    ].map(control=><label key={control.label} className="text-xs font-medium flex flex-col gap-1">{control.label}<select aria-label={control.label} className={INPUT} value={control.value} onChange={e=>control.set(e.target.value)}><option value="all">All</option>{control.options.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>)}
    <button type="button" onClick={()=>{setFilters(INITIAL_FILTERS);setMode('all');setExact('');setSurface('all');setTier('all');setTimerFilter('all');setGoalFilter('all');setSetupFilter('all');}} className="text-xs underline underline-offset-4 self-end py-2">Reset filters</button>
  </div>;
  const charts=(ids:string[])=>ids.map(id=>CHARTS.find(c=>c.id===id)).filter((c):c is ChartDefinition=>!!c).map(c=><AnalyticsChart key={c.id} definition={c} sessions={c.exact?exactSessions:filteredSessions} pinned={preferences.pinned.includes(c.id)} collapsed={preferences.collapsed.includes(c.id)} onPin={()=>pin(c.id)} onCollapse={()=>toggleCollapse(c.id)} onExpand={()=>setExpanded(c)} />);
  const activeCharts=preferences.view==='overview'?preferences.pinned:selected;
  const needsExact=activeCharts.some(id=>CHARTS.find(c=>c.id===id)?.exact);
  const views=[['overview','Overview'],['history','Session History'],['analytics','Analytics'],['setups','Setup Comparisons']] as const;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl sm:text-3xl font-bold">Your Progress Dashboard</h1><p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2">Explore your practice, focus on a trick, and keep your favorite insights close.</p></div><p className="text-xs text-neutral-600 dark:text-neutral-400" aria-live="polite">{saving?'Saving preferences…':'Dashboard preferences saved with this rider'}</p></div>
    <nav aria-label="Dashboard views" className="flex flex-wrap gap-2">{views.map(([id,label])=><button key={id} type="button" aria-current={preferences.view===id?'page':undefined} onClick={()=>save({view:id})} className={`px-4 py-2 rounded-lg text-sm border ${preferences.view===id?'bg-[#D4A72C] text-neutral-950 border-[#D4A72C] font-semibold':'border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'}`}>{label}</button>)}</nav>
    <section className={`${CARD} space-y-4`} aria-label="Shared dashboard filters">
      {sharedControls}
      <button type="button" className="text-xs underline underline-offset-4" aria-expanded={!preferences.filtersCollapsed} onClick={()=>save({filtersCollapsed:!preferences.filtersCollapsed})}>{preferences.filtersCollapsed?'Show':'Hide'} search and advanced filters</button>
      {!preferences.filtersCollapsed&&<HistoryFilters filters={filters} onChangeFilters={setFilters} onResetFilters={()=>setFilters(INITIAL_FILTERS)} />}
      <p className="text-xs text-neutral-600 dark:text-neutral-400">{filteredSessions.length} matching practice sessions · only started sessions appear here. Shared filters apply to every view; dates use session start.</p>
    </section>
    {preferences.view==='overview'&&<>
      <MilestonePanel />
      <ChallengeCompletionPanel />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[
        ['Landing rate',totals.rate===null?'—':`${totals.rate}%`,`${totals.landings} landings / ${totals.attempts} attempts`],
        ['Active practice',formatDurationMs(totals.time),'Excludes paused time'],
        ['Practice days',String(totals.days),`${totals.attempted} attempted sessions`],
        ['Challenge follow-through',filteredSessions.length?`${Math.round(totals.attempted/filteredSessions.length*100)}%`:'—',`${totals.attempted} / ${filteredSessions.length} started sessions with attempts`]
      ].map(([label,value,hint])=><div key={label} className={CARD}><p className="text-xs text-neutral-600 dark:text-neutral-300">{label}</p><p className="text-2xl font-bold font-mono my-2">{value}</p><p className="text-xs text-neutral-600 dark:text-neutral-400">{hint}</p></div>)}</div>
      <div className="flex flex-wrap justify-between gap-2"><h2 className="text-lg font-semibold">Pinned insights <span className="text-sm text-neutral-500">({preferences.pinned.length}/4)</span></h2><button type="button" onClick={()=>save({view:'analytics'})} className="text-sm underline underline-offset-4">Browse all analytics</button></div>
      {needsExact&&exactControl}<div className="grid grid-cols-1 xl:grid-cols-2 gap-5">{charts(preferences.pinned)}</div>
      {!preferences.pinned.length&&<p className={`${CARD} text-sm`}>No pinned charts. Open Analytics and use a chart’s pin button to add it here.</p>}
    </>}
    {preferences.view==='history'&&<>
      <details open={!preferences.collapsed.includes('bookmarks')} onToggle={e=>{const open=e.currentTarget.open;if(open===preferences.collapsed.includes('bookmarks'))toggleCollapse('bookmarks');}} className={CARD}><summary className="font-semibold cursor-pointer">Bookmarked Challenges</summary><div className="mt-4"><BookmarksPanel /></div></details>
      <HistoryTable sessions={filteredSessions} onResume={resumeSession} onOpenDetails={setInspectSession} onDelete={deleteSession} onBatchDelete={deleteSessions} />
    </>}
    {preferences.view==='analytics'&&<>
      <nav aria-label="Analytics categories" className="flex flex-wrap gap-2">{CATEGORIES.map(c=><button type="button" key={c} aria-pressed={preferences.category===c} onClick={()=>save({category:c})} className={`px-3 py-2 text-sm rounded-lg border ${preferences.category===c?'border-[#D4A72C] text-[#8A6500] dark:text-[#D4A72C]':'border-neutral-300 dark:border-neutral-700'}`}>{c}</button>)}</nav>
      <section className={`${CARD} space-y-4`}><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Choose charts · {preferences.category}</h2><div className="flex gap-4 text-xs"><button type="button" className="underline underline-offset-4" onClick={()=>save({selected:{...preferences.selected,[preferences.category]:CHARTS.filter(c=>c.category===preferences.category).map(c=>c.id)}})}>Select All</button><button type="button" className="underline underline-offset-4" onClick={()=>save({selected:{...preferences.selected,[preferences.category]:[]}})}>Select None</button></div></div><p className="text-xs text-neutral-600 dark:text-neutral-300">Two charts start selected in each category. Choose more when useful; pin up to four to Overview.</p><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{CHARTS.filter(c=>c.category===preferences.category).map(c=><label key={c.id} className="flex gap-2 items-start text-sm cursor-pointer"><input type="checkbox" checked={selected.includes(c.id)} onChange={()=>toggleChart(c.id)} className="mt-1 accent-[#D4A72C]" />{c.title}</label>)}</div></section>
      {needsExact&&exactControl}<div className="grid grid-cols-1 xl:grid-cols-2 gap-5">{charts(selected)}</div>{!selected.length&&<p className={`${CARD} text-sm`}>Choose a chart above to start exploring.</p>}
    </>}
    {preferences.view==='setups'&&<SetupComparisons sessions={filteredSessions} expanded />}
    <SessionDetailsModal session={inspectSession} isOpen={inspectSession!==null} onClose={()=>setInspectSession(null)} onResume={resumeSession} />
    {expanded&&<ExpandedAnalytics definition={expanded} sessions={expanded.exact?exactSessions:filteredSessions} onClose={()=>setExpanded(null)} filterControls={<div className="space-y-3">{sharedControls}{expanded.exact&&exactControl}</div>} />}
  </div>;
};
