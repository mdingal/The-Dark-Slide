import {goalLabel} from './practiceTargets';
import {classLabel} from './skateClasses';
import {goalReached} from './sessionPlan';
import {PART_KINDS,PART_LABELS,PART_FIELDS} from './hardware';
import { PracticeSession } from './types';
import { getChallengeComplexity } from './complexity';
import { compareSetups, getPersonalBests, getStreaks, MISS_TAGS, trickKey } from './progression';
import { BASE_TRICKS } from './catalog';
import { OBSTACLE_TRICKS } from './obstacleCatalog';

export const CATEGORIES = ['Progress', 'Consistency', 'Practice Habits', 'Tricks & Obstacles', 'Weak Points', 'Hardware'] as const;
export type Category = typeof CATEGORIES[number];
export type ChartKind = 'line' | 'bar' | 'donut' | 'calendar' | 'table';
export interface ChartDefinition { id: string; title: string; category: Category; kind: ChartKind; description: string; exact?: boolean; unit?: string; series?: string[]; }
export const CHARTS: ChartDefinition[] = [
  { id:'landing', title:'Landing Rate Over Time', category:'Progress', kind:'line', exact:true, unit:'%', description:'Daily landings ÷ attempts. Each point includes its attempt count; a small sample can fluctuate.' },
  { id:'firstAttempts', title:'Attempts to First Landing', category:'Progress', kind:'line', exact:true, description:'Daily median from measured first landings. Unlanded sessions and missing measurements are listed below.' },
  { id:'firstTime', title:'Time to First Landing', category:'Progress', kind:'line', exact:true, unit:'min', description:'Daily median active minutes to first landing, excluding pauses. Only measured landed sessions contribute.' },
  { id:'firstTry', title:'First-Try Landing Rate', category:'Progress', kind:'bar', exact:true, unit:'%', description:'First-attempt landings ÷ sessions with known first-landing outcomes, including unlanded sessions. Legacy landed sessions without a measurement are excluded.' },
  { id:'difficulty', title:'Perceived Difficulty', category:'Progress', kind:'line', exact:true, description:'Daily median rider rating (1–5) from finished sessions. This is separate from generated challenge complexity.' },
  { id:'bests', title:'Personal Bests by Trick', category:'Progress', kind:'table', exact:true, description:'Exact trick variations: fewest attempts to first land, best session landing rate with its sample, and longest recorded streak.' },
  { id:'streak', title:'Best Streak Over Time', category:'Consistency', kind:'line', exact:true, description:'Longest recorded consecutive landing streak among sessions on each day. Missing legacy logs cannot recover earlier streaks.' },
  { id:'goal', title:'Consistency Goal Achievement', category:'Consistency', kind:'bar', exact:true, unit:'%', description:'Share of attempted sessions meeting their recorded streak goal, grouped by goal. Sessions without a recorded goal are excluded.' },
  { id:'streakDistribution', title:'Landing Streak Distribution', category:'Consistency', kind:'bar', exact:true, description:'Attempted sessions grouped by their best recorded streak.' },
  { id:'weekly', title:'Weekly Practice Volume', category:'Practice Habits', kind:'bar', unit:'min', description:'Active minutes by Monday-start week, with attempts, landings, and practice-day counts in the data table.' },
  { id:'calendar', title:'Practice Calendar', category:'Practice Habits', kind:'calendar', description:'Active minutes over the past 13 weeks, ending today. Records are assigned to the session start date, or generation date for older records.' },
  { id:'activity', title:'Practice Activity Over Time', category:'Practice Habits', kind:'line', series:['Attempts','Landings'], description:'Daily attempt and landing totals, assigned to each session’s start date. Calendar dates include the year.' },
  { id:'attempts', title:'Attempt Count Histogram', category:'Practice Habits', kind:'bar', description:'How many session records fall into each attempt-count range, including unattempted records.' },
  { id:'duration', title:'Duration Histogram', category:'Practice Habits', kind:'bar', description:'Session counts by active-duration range. Includes unattempted records.' },
  { id:'followThrough', title:'Challenge Follow-Through', category:'Practice Habits', kind:'donut', description:'Records with at least one attempt versus unattempted records. Repeated challenges count as separate records.' },
  { id:'lastPracticed', title:'Last Practiced by Trick', category:'Practice Habits', kind:'table', description:'Exact variations ordered by days since their most recent attempted session. Never-attempted challenges are identified separately.' },
  { id:'status', title:'Session Status Distribution', category:'Practice Habits', kind:'donut', description:'Success, Pending, and Failed records. Pending can include active or unfinished challenges.' },
  { id:'stanceFrequency', title:'Stance Distribution', category:'Tricks & Obstacles', kind:'bar', series:['Generated','Attempts'], description:'Record counts and attempts by starting stance; obstacle records without a rider stance appear as Not recorded. FS / BS approach is shown separately.' },
  { id:'stanceRate', title:'Landing Rate by Stance', category:'Tricks & Obstacles', kind:'bar', unit:'%', description:'Landings ÷ attempts by starting stance. Mixed tricks can influence differences between stances.' },
  { id:'trickFrequency', title:'Trick Frequency', category:'Tricks & Obstacles', kind:'bar', series:['Generated','Attempts'], description:'Top eight catalog tricks by attempts. Each combo step gets the full session attempt count; obstacles count their entry trick. These bars are not a partition of all attempts.' },
  { id:'complexity', title:'Performance by Skate Class', category:'Tricks & Obstacles', kind:'bar', unit:'%', description:'Landings ÷ attempts by the recorded Class C, B, or A pool. Older sessions show their minimum compatible class.' },
  { id:'obstacles', title:'Obstacle Coverage', category:'Tricks & Obstacles', kind:'bar', description:'Record counts for flatground, ledges, and rails. Flatground and combo modes are classified independently of setup metadata.' },
  { id:'approach', title:'Obstacle Approach', category:'Tricks & Obstacles', kind:'bar', description:'FS and BS approach directions for obstacle records, separate from Regular, Fakie, Switch, and Nollie rider stances.' },
  { id:'grinds', title:'Grind & Slide Coverage', category:'Tricks & Obstacles', kind:'bar', description:'Starting and transfer grinds/slides counted separately. Session attempts are attributed to every included grind or slide.' },
  { id:'misses', title:'Common Miss Reasons', category:'Weak Points', kind:'bar', exact:true, description:'Each bar is a tagged miss count. A single miss may carry multiple tags, so categories can overlap.' },
  { id:'missTrend', title:'Miss Reasons Over Time', category:'Weak Points', kind:'line', exact:true, unit:'%', series:MISS_TAGS.map(t=>t.label), description:'Tagged issues as a percentage of recorded misses per day. Multi-tag misses overlap; untagged misses stay in the denominator.' },
  { id:'deck', title:'Deck Width Frequency', category:'Hardware', kind:'bar', description:'Session counts by recorded deck width, including custom sizes.' },
  { id:'wheel', title:'Wheel Material Frequency', category:'Hardware', kind:'bar', description:'Session counts by Plastic, Urethane, and Resin wheel material.' },
  { id:'setupRate', title:'Setup Performance', category:'Hardware', kind:'bar', exact:true, unit:'%', description:'Weighted landing rates using archived setup snapshots. Choose one exact trick for a more useful comparison.' },
  { id:'truckRate', title:'Truck Performance', category:'Hardware', kind:'bar', exact:true, unit:'%', description:'Weighted landing rates by recorded truck model. Older sessions with no model are grouped as Not recorded.' },
  { id:'wheelRate', title:'Wheel Performance', category:'Hardware', kind:'bar', exact:true, unit:'%', description:'Weighted landing rates by wheel model and material. Sample counts are shown with each result.' },
  {id:'surfaceRate',title:'Performance by Practice Surface',category:'Hardware',kind:'bar',exact:true,unit:'%',description:'Landing rates by session surface, with attempt counts. Compare the same trick for a useful comparison.'},
  {id:'sessionGoals',title:'Session Goal Achievement',category:'Progress',kind:'bar',exact:true,unit:'%',description:'Finished sessions reaching their configured total-landings or best-streak target. Parked sessions are excluded.'},
  {id:'timerGoals',title:'Goal Achievement by Timer',category:'Practice Habits',kind:'bar',exact:true,unit:'%',description:'Finished sessions reaching their goal, grouped by regular or countdown timer.'},
  {id:'timerEnds',title:'How Sessions End',category:'Practice Habits',kind:'donut',description:'Completed sessions ended manually or by countdown, with parked sessions separate.'},
  ...PART_KINDS.flatMap(kind=>['Brand','Model',...Object.keys(PART_FIELDS[kind])].map(field=>({id:`hardware_${kind}_${field}`,title:`${PART_LABELS[kind]}: ${field}`,category:'Hardware' as const,kind:'bar' as const,exact:true,unit:'%',description:`Landing rate by ${field.toLowerCase()} from the frozen ${PART_LABELS[kind].toLowerCase()} snapshot. Missing specifications appear as Not recorded; these comparisons are descriptive, not proof of cause.`}))),
];
export const DEFAULT_PINS = ['landing','weekly','misses'];
export interface DashboardPreferences {
  view: 'overview'|'history'|'analytics'|'setups'; category: Category;
  pinned: string[]; selected: Record<string,string[]>; collapsed: string[]; filtersCollapsed: boolean;
}
export function dashboardPreferences(raw?: Partial<DashboardPreferences>): DashboardPreferences {
  const defaults = Object.fromEntries(CATEGORIES.map(c=>[c,CHARTS.filter(x=>x.category===c).slice(0,2).map(x=>x.id)]));
  const selected = {...defaults};
  for (const c of CATEGORIES) if (Array.isArray(raw?.selected?.[c])) selected[c]=[...new Set(raw.selected[c])].filter(id=>CHARTS.some(x=>x.id===id&&x.category===c));
  return { view:['overview','history','analytics','setups'].includes(raw?.view||'')?raw!.view!:'overview',
    category:CATEGORIES.includes(raw?.category as Category)?raw!.category!:'Progress', selected,
    pinned:Array.isArray(raw?.pinned)?[...new Set(raw.pinned)].filter(id=>CHARTS.some(x=>x.id===id)).slice(0,4):DEFAULT_PINS,
    collapsed:Array.isArray(raw?.collapsed)?raw.collapsed.filter(id=>id==='bookmarks'||CHARTS.some(x=>x.id===id)):[],
    filtersCollapsed:raw?.filtersCollapsed??true };
}
export function sessionDay(s:PracticeSession): string { return dayKey(new Date(s.sessionStartedAt || s.generatedAt)); }
export function dayKey(d:Date):string { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export function sessionStance(s:PracticeSession) { return (s.trickResult.mode==='obstacle'?'not_recorded':undefined) || s.trickResult.singleTrick?.stance || s.trickResult.comboSteps?.[0]?.parameters.stance || 'regular'; }
const median=(values:number[])=>{const a=[...values].sort((a,b)=>a-b);return a.length?(a[Math.floor(a.length/2)]+a[Math.floor((a.length-1)/2)])/2:0;};
const round=(n:number)=>Math.round(n*10)/10;
const rate=(s:PracticeSession[])=>{const a=s.reduce((n,s)=>n+s.attemptCount,0);return a?round(s.reduce((n,s)=>n+s.landingCount,0)/a*100):0;};
export type AnalyticsRow = Record<string,string|number> & { name:string; value:number };
export interface AnalyticsData { rows:AnalyticsRow[]; note:string; empty:string; }
export function chartData(id:string, sessions:PracticeSession[], now=new Date()):AnalyticsData {
  const attempted=sessions.filter(s=>s.attemptCount>0), landed=attempted.filter(s=>s.landingCount>0);
  const sum=(s:PracticeSession[],key:'attemptCount'|'landingCount'|'activeDurationMs')=>s.reduce((n,s)=>n+s[key],0);
  const group=(source:PracticeSession[],key:(s:PracticeSession)=>string)=>{
    const map=new Map<string,PracticeSession[]>();source.forEach(s=>{const k=key(s);map.set(k,[...(map.get(k)||[]),s]);});return [...map.entries()].sort(([a],[b])=>a.localeCompare(b));};
  const daily=group(attempted,sessionDay), row=(name:string,value:number,extra:Record<string,string|number>={}):AnalyticsRow=>({name,value:round(value),...extra});
  let rows:AnalyticsRow[]=[],note=`${sessions.length} records · ${attempted.length} attempted · ${sum(attempted,'attemptCount')} attempts`, empty='No matching data yet. Record an attempted session or adjust the filters.';
  if(id==='surfaceRate'||id.startsWith('hardware_')) {
    const [kind,field]=id.startsWith('hardware_')?(()=>{const key=id.slice(9);const kind=PART_KINDS.find(k=>key.startsWith(k+'_'))!;return [kind,key.slice(kind.length+1)] as const;})():[null,null];
    rows=group(attempted,s=>id==='surfaceRate'?s.practiceSurface||'Not recorded':kind?(field==='Brand'?(s.setupSnapshot.partsSnapshot?.[kind]?.brand||s.setupSnapshot.partsSnapshot?.[kind]?.name):field==='Model'?s.setupSnapshot.partsSnapshot?.[kind]?.name:s.setupSnapshot.partsSnapshot?.[kind]?.specs[field!])||'Not recorded':'Not recorded').map(([k,s])=>row(k,rate(s),{Sessions:s.length,Attempts:sum(s,'attemptCount'),Landings:sum(s,'landingCount')}));
  } else if(id==='sessionGoals'||id==='timerGoals') {
    const finished=sessions.filter(s=>s.sessionEndedAt&&s.goal);
    rows=group(finished,s=>id==='timerGoals'?s.practiceTimer?.type||'Not recorded':goalLabel(s.goal!)).map(([k,s])=>row(k,s.filter(goalReached).length/s.length*100,{Achieved:s.filter(goalReached).length,Sessions:s.length}));
  } else if(id==='timerEnds') rows=group(sessions,s=>s.sessionEndedAt?s.endedReason||'Legacy / not recorded':s.parkedAt?'Parked':'Active').map(([k,s])=>row(k,s.length));
  else if(id==='landing') rows=daily.map(([d,s])=>row(d,rate(s),{Attempts:sum(s,'attemptCount'),Landings:sum(s,'landingCount')}));
  else if(id==='activity') rows=daily.map(([d,s])=>row(d,sum(s,'attemptCount'),{Attempts:sum(s,'attemptCount'),Landings:sum(s,'landingCount')}));
  else if(id==='firstAttempts'||id==='firstTime') {
    const measured=landed.filter(s=>id==='firstAttempts'?s.firstLandingAttemptNumber!==undefined:s.firstLandingElapsedMs!==undefined);
    rows=group(measured,sessionDay).map(([d,s])=>row(d,median(s.map(x=>id==='firstAttempts'?x.firstLandingAttemptNumber!:x.firstLandingElapsedMs!/60000)),{Measured:s.length}));
    note=`${measured.length} measured landed sessions · ${attempted.filter(s=>s.landingCount===0).length} unlanded · ${landed.length-measured.length} landed with missing measurements`;
    empty='Land a trick and record its first-landing measurement to see this trend.';
  } else if(id==='difficulty') {
    rows=group(sessions.filter(s=>s.sessionEndedAt&&!s.outcomeReviewPending&&s.difficultyRating>=1&&s.difficultyRating<=5),sessionDay).map(([d,s])=>row(d,median(s.map(x=>x.difficultyRating)),{Rated:s.length}));
    empty='Finish a session and give it a difficulty rating (1–5).';
  } else if(id==='firstTry') {
    const known=attempted.filter(s=>s.landingCount===0||s.firstLandingAttemptNumber!==undefined);
    rows=group(known,s=>s.trickResult.mode).map(([mode,s])=>row(mode,s.filter(x=>x.firstLandingAttemptNumber===1).length/s.length*100,{Sessions:s.length,'First try':s.filter(x=>x.firstLandingAttemptNumber===1).length}));
    note+=` · ${attempted.length-known.length} legacy landed records excluded`;
  } else if(id==='bests') rows=group(attempted,s=>trickKey(s.trickResult)).map(([,s])=>{const p=getPersonalBests(s);return row(s[0].trickResult.canonicalName,p.highestLandingRate?round(p.highestLandingRate.rate*100):0,{'Fewest to first':p.fewestFirstLandingAttempts??'—','Best rate':p.highestLandingRate?`${round(p.highestLandingRate.rate*100)}% (${p.highestLandingRate.landings}/${p.highestLandingRate.attempts})`:'—','Best streak':p.bestStreak,Sessions:s.length});});
  else if(id==='streak') rows=daily.map(([d,s])=>row(d,Math.max(...s.map(x=>getStreaks(x).best)),{Sessions:s.length}));
  else if(id==='goal') {
    const recorded=attempted.filter(s=>s.goal?s.goal.type==='streak':s.consistencyGoal!==undefined);
    rows=group(recorded,s=>String(s.consistencyGoal)).map(([g,s])=>{const hit=s.filter(x=>getStreaks(x).best>=Number(g)).length;return row(`${g} in a row`,hit/s.length*100,{Achieved:hit,Sessions:s.length});});
    note+=` · ${attempted.length-recorded.length} records without a goal excluded`;
  } else if(id==='streakDistribution') rows=group(attempted,s=>String(getStreaks(s).best)).map(([k,s])=>row(`${k} consecutive`,s.length));
  else if(id==='weekly') rows=group(attempted,s=>{const d=new Date(`${sessionDay(s)}T12:00:00`);d.setDate(d.getDate()-(d.getDay()+6)%7);return dayKey(d);}).map(([d,s])=>row(d,sum(s,'activeDurationMs')/60000,{Attempts:sum(s,'attemptCount'),Landings:sum(s,'landingCount'),'Practice days':new Set(s.map(sessionDay)).size}));
  else if(id==='calendar') {
    const days=new Map(daily), end=new Date(now);end.setHours(12,0,0,0);
    rows=Array.from({length:91},(_,i)=>{const d=new Date(end);d.setDate(end.getDate()-90+i);const key=dayKey(d),s=days.get(key)||[];return row(key,sum(s,'activeDurationMs')/60000,{Attempts:sum(s,'attemptCount'),Sessions:s.length});});
    note+=' · Past 13 weeks; shared filters still apply';
  } else if(id==='attempts'||id==='duration') {
    const labels=id==='attempts'?['0 (Unattempted)','1–5','6–15','16–30','31+']:['< 2 min','2–5 min','5–10 min','10–20 min','20+ min'];
    const counts=[0,0,0,0,0];sessions.forEach(s=>{const n=id==='attempts'?s.attemptCount:s.activeDurationMs/60000;const i=id==='attempts'?(n===0?0:n<=5?1:n<=15?2:n<=30?3:4):(n<2?0:n<5?1:n<10?2:n<20?3:4);counts[i]++;});rows=labels.map((l,i)=>row(l,counts[i]));
  } else if(id==='followThrough') rows=[row('Attempted',attempted.length),row('Unattempted',sessions.length-attempted.length)].filter(r=>r.value>0);
  else if(id==='status') rows=group(sessions,s=>s.status).map(([k,s])=>row(k,s.length));
  else if(id==='lastPracticed') rows=group(sessions,s=>trickKey(s.trickResult)).map(([,s])=>{const a=s.filter(x=>x.attemptCount>0).sort((a,b)=>sessionDay(b).localeCompare(sessionDay(a))),last=a[0]?sessionDay(a[0]):undefined;
    const days=last?Math.max(0,Math.floor((Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())-Date.parse(`${last}T00:00:00Z`))/86400000)):null;
    return row(s[0].trickResult.canonicalName,days??-1,{'Last practiced':last||'Never','Days since':days??'Never',Attempts:sum(s,'attemptCount')});}).sort((a,b)=>b.value-a.value);
  else if(id==='stanceFrequency'||id==='stanceRate'||id==='complexity') rows=group(id==='stanceFrequency'?sessions:attempted,id==='complexity'?s=>classLabel(s.trickResult):sessionStance).map(([k,s])=>row(k==='not_recorded'?'Not recorded':k,id==='stanceFrequency'?s.length:rate(s),{Generated:s.length,Attempts:sum(s,'attemptCount'),Landings:sum(s,'landingCount')}));
  else if(id==='trickFrequency'||id==='grinds') {
    const counts=new Map<string,{Generated:number;Attempts:number}>();
    for(const s of sessions){let ids:string[]=[];
      if(id==='grinds') {const o=s.trickResult.obstacleData;if(o)ids=[o.obstacleTrickId,...(o.transferTrickId?[o.transferTrickId]:[])];}
      else {const t=s.trickResult;ids=t.singleTrick?[t.singleTrick.baseTrickId]:t.comboSteps?t.comboSteps.map(x=>x.parameters.baseTrickId):t.obstacleData?[t.obstacleData.entryTrickId]:[];}
      ids.forEach(key=>{const name=(id==='grinds'?OBSTACLE_TRICKS:BASE_TRICKS).find(x=>x.id===key)?.name||key;const c=counts.get(name)||{Generated:0,Attempts:0};c.Generated++;c.Attempts+=s.attemptCount;counts.set(name,c);});}
    rows=[...counts].map(([k,c])=>row(k,c.Attempts,c)).sort((a,b)=>b.value-a.value).slice(0,id==='trickFrequency'?8:20);
  } else if(id==='approach') rows=group(sessions.filter(s=>s.trickResult.mode==='obstacle'),s=>s.trickResult.obstacleData?.approach==='frontside'?'FS':s.trickResult.obstacleData?.approach==='backside'?'BS':'Not recorded').map(([k,s])=>row(k,s.length,{Attempts:sum(s,'attemptCount')}));
  else if(id==='obstacles') rows=group(sessions,s=>s.trickResult.mode==='obstacle'?(s.trickResult.obstacleData?.obstacleType||'Not recorded'):'flatground').map(([k,s])=>row(k,s.length,{Attempts:sum(s,'attemptCount')}));
  else if(id==='misses') rows=MISS_TAGS.map(t=>row(t.label,sessions.reduce((n,s)=>n+(s.missTagCounts?.[t.id]||0),0))).filter(r=>r.value>0);
  else if(id==='missTrend') rows=daily.filter(([,s])=>sum(s,'attemptCount')>sum(s,'landingCount')).map(([d,s])=>{const misses=sum(s,'attemptCount')-sum(s,'landingCount');return row(d,misses,{Misses:misses,...Object.fromEntries(MISS_TAGS.map(t=>[t.label,round(s.reduce((n,s)=>n+(s.missTagCounts?.[t.id]||0),0)/misses*100)]))});});
  else if(id==='deck'||id==='wheel') rows=group(sessions,s=>id==='deck'?s.setupSnapshot.deckWidthMm?`${s.setupSnapshot.deckWidthMm}mm`:'Not recorded':s.setupSnapshot.wheelMaterial).map(([k,s])=>row(k,s.length));
  else if(['setupRate','truckRate','wheelRate'].includes(id)) rows=compareSetups(sessions,id==='setupRate'?'setup':id==='truckRate'?'trucks':'wheels').map(g=>row(g.label,g.landingRate*100,{Attempts:g.attempts,Landings:g.landings,Sessions:g.sessions}));
  if(id==='misses'||id==='missTrend') {
    const misses=sum(attempted,'attemptCount')-sum(attempted,'landingCount');
    if(!sessions.some(s=>MISS_TAGS.some(t=>(s.missTagCounts?.[t.id]||0)>0)))rows=[];
    note+=` · ${misses} recorded misses; tag coverage varies. Tag totals can overlap.`;
    empty='Tag missed attempts during practice to identify recurring issues.';
  }
  return {rows,note,empty};
}
