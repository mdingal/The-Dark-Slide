import {describe,it,expect} from 'vitest';
import {chartData,CHARTS,dashboardPreferences,sessionStance,sessionDay} from '../domain/dashboardAnalytics';
import {createPracticeSession} from '../domain/practiceActions';
import {GeneratedTrickResult,SetupData,PracticeSession} from '../domain/types';
const trick:GeneratedTrickResult={mode:'single',canonicalName:'Kickflip',singleTrick:{stance:'regular',direction:'none',baseTrickId:'kickflip',bodyVarial:'none',landing:'normal',revert:'none'},breakdown:[],catalogVersion:'1'};
const setup:SetupData={id:'a',name:'A',deckWidthMm:34,wheelMaterial:'urethane',truckModel:'Model A'};
const make=(patch:Partial<PracticeSession>={}):PracticeSession=>({...createPracticeSession(trick,setup,Date.parse('2026-09-28T12:00:00')),attemptCount:10,landingCount:5,...patch});
describe('Dashboard analytics',()=>{
  it('weights landing rate by attempts rather than averaging session rates',()=>{
    const d=chartData('landing',[make({attemptCount:1,landingCount:1}),make({attemptCount:9,landingCount:0})]);expect(d.rows[0].value).toBe(10);expect(d.rows[0].Attempts).toBe(10);
  });
  it('uses median first landings and exposes unlanded/missing measurements',()=>{
    const d=chartData('firstAttempts',[make({firstLandingAttemptNumber:1}),make({firstLandingAttemptNumber:3}),make({firstLandingAttemptNumber:90}),make({landingCount:0}),make()]);
    expect(d.rows[0].value).toBe(3);expect(d.note).toContain('1 unlanded');expect(d.note).toContain('1 landed with missing');
  });
  it('retains a zero-minute first landing',()=>expect(chartData('firstTime',[make({firstLandingElapsedMs:0})]).rows[0].value).toBe(0));
  it('counts unlanded sessions in first-try denominator and excludes unknown legacy lands',()=>{
    const d=chartData('firstTry',[make({firstLandingAttemptNumber:1}),make({landingCount:0}),make()]);expect(d.rows[0].value).toBe(50);expect(d.rows[0].Sessions).toBe(2);expect(d.note).toContain('1 legacy');
  });
  it('only uses finished rated sessions for perceived difficulty',()=>{
    const d=chartData('difficulty',[make({difficultyRating:5}),make({difficultyRating:3,sessionEndedAt:'2026-09-28T13:00:00'})]);expect(d.rows[0].value).toBe(3);expect(d.rows[0].Rated).toBe(1);
  });
  it('excludes missing goals rather than inventing a target',()=>{
    const d=chartData('goal',[make({consistencyGoal:3,currentLandingStreak:0,bestLandingStreak:3}),make({consistencyGoal:3,bestLandingStreak:2,currentLandingStreak:0}),make({consistencyGoal:undefined})]);expect(d.rows[0].value).toBe(50);expect(d.note).toContain('1 records without');
  });
  it('normalizes miss tags against misses with overlapping tags allowed',()=>{
    const d=chartData('missTrend',[make({attemptCount:10,landingCount:5,missTagCounts:{underflip:2,missed_catch:4}})]);expect(d.rows[0].Underflip).toBe(40);expect(d.rows[0]['Missed catch']).toBe(80);
  });
  it('shows an empty state when there are no miss tags',()=>expect(chartData('missTrend',[make()]).rows).toHaveLength(0));
  it('keeps years separate in activity and uses session-start dates',()=>{
    const a=make({generatedAt:'2025-09-28T12:00:00'}),b=make({generatedAt:'2026-09-28T12:00:00',sessionStartedAt:'2026-09-29T12:00:00'});
    const d=chartData('activity',[a,b]);expect(d.rows.map(x=>x.name)).toEqual(['2025-09-28','2026-09-29']);expect(sessionDay(b)).toBe('2026-09-29');
  });
  it('groups weekly volume by Monday and counts distinct practice days',()=>{
    const d=chartData('weekly',[make({activeDurationMs:60000}),make({generatedAt:'2026-09-30T12:00:00',activeDurationMs:120000})]);expect(d.rows[0].name).toBe('2026-09-28');expect(d.rows[0].value).toBe(3);expect(d.rows[0]['Practice days']).toBe(2);
  });
  it('renders a complete 91-day calendar including zero-data days',()=>{
    const d=chartData('calendar',[make({activeDurationMs:60000})],new Date('2026-09-30T12:00:00'));expect(d.rows).toHaveLength(91);expect(d.rows.at(-1)?.name).toBe('2026-09-30');expect(d.rows.find(x=>x.name==='2026-09-28')?.value).toBe(1);
  });
  it('classifies flatground independently of a setup obstacle and does not confuse obstacle approach with rider stance',()=>{
    const flat=make({setupSnapshot:{...setup,obstacleType:'rail'}});
    const obstacle=make({trickResult:{...trick,mode:'obstacle',singleTrick:undefined,obstacleData:{approach:'frontside',obstacleType:'ledge',obstacleTrickId:'50_50',entryTrickId:'ollie',exitTrick:'clean'} as any}});
    expect(sessionStance(obstacle)).toBe('not_recorded');expect(chartData('approach',[obstacle]).rows[0].name).toBe('FS');expect(chartData('obstacles',[flat,obstacle]).rows.map(x=>x.name)).toEqual(['flatground','ledge']);
  });
  it('attributes combo attempts to each constituent catalog trick',()=>{
    const combo=make({trickResult:{...trick,mode:'combo',singleTrick:undefined,comboSteps:[{parameters:trick.singleTrick},{parameters:{...trick.singleTrick,baseTrickId:'heelflip'}}] as any}});
    const d=chartData('trickFrequency',[combo]);expect(d.rows).toHaveLength(2);expect(d.rows.every(r=>r.Attempts===10)).toBe(true);
  });
  it('computes follow-through from all generated records',()=>expect(chartData('followThrough',[make(),make({attemptCount:0,landingCount:0})]).rows.map(r=>r.value)).toEqual([1,1]));
  it('computes setup rates from snapshots with counts',()=>{
    const d=chartData('setupRate',[make({attemptCount:1,landingCount:1}),make({attemptCount:9,landingCount:0})]);expect(d.rows[0].value).toBe(10);expect(d.rows[0].Attempts).toBe(10);
  });
  it('tracks most recent attempted record rather than last generated challenge',()=>{
    const d=chartData('lastPracticed',[make(),make({generatedAt:'2026-09-30T12:00:00',attemptCount:0,landingCount:0})],new Date('2026-09-30T12:00:00'));expect(d.rows[0]['Days since']).toBe(2);
  });
  it('normalizes saved preferences, enforces pin limit, preserves empty selections',()=>{
    const p=dashboardPreferences({pinned:CHARTS.map(c=>c.id).concat('missing'),selected:{Progress:[]} as any,collapsed:['missing','bookmarks','landing']});
    expect(p.pinned).toHaveLength(4);expect(p.selected.Progress).toEqual([]);expect(p.collapsed).toEqual(['bookmarks','landing']);expect(dashboardPreferences().pinned).toEqual(['landing','weekly','misses']);
  });
  it('returns finite chart values for every registered chart and handles empty histories',()=>{
    for(const c of CHARTS){const d=chartData(c.id,[make()]);expect(d.rows.every(r=>Number.isFinite(r.value))).toBe(true);const empty=chartData(c.id,[]);if(c.kind!=='calendar'&&c.id!=='attempts'&&c.id!=='duration')expect(empty.rows).toHaveLength(0);}
  });
});
