import {describe,it,expect} from 'vitest';
import {riderProgression,sessionRewards,levelProgress,practiceDay,progressionSessions} from '../domain/riderProgression';
import {createPracticeSession} from '../domain/practiceActions';
import {baseChallengePool} from '../domain/selectedChallengePool';
import {PracticeSession} from '../domain/types';

const trick=baseChallengePool().find(t=>t.singleTrick?.baseTrickId==='kickflip')!;
const NOW=Date.parse('2026-10-11T12:00:00Z');
function make(id:string,date='2026-10-05T01:00:00Z',options:Partial<PracticeSession>={}):PracticeSession {
  const timestamp=Date.parse(date);
  return {...createPracticeSession(trick,{id:'setup',name:'Setup',deckWidthMm:34,wheelMaterial:'urethane'},timestamp-60000),id,sessionStartedAt:new Date(timestamp-60000).toISOString(),sessionEndedAt:date,status:'failed',attemptCount:5,landingCount:0,activeDurationMs:60000,...options};
}
function variant(id:string,date:string,stance:'regular'|'switch'|'fakie'):PracticeSession {
 const session=make(id,date);
 session.trickResult=structuredClone(trick);
 session.trickResult.singleTrick!.stance=stance;
 return session;
}

describe('Rider progression',()=>{
 it('ignores generated, parked, invalid and future sessions',()=>{
  const records=[make('generated',undefined,{sessionStartedAt:undefined,sessionEndedAt:undefined}),make('parked',undefined,{status:'pending'}),make('empty',undefined,{attemptCount:0}),make('bad',undefined,{landingCount:6}),make('negative',undefined,{landingCount:-1}),make('fractional',undefined,{attemptCount:1.5}),make('future','2026-10-12T00:00:00Z'),make('reverse',undefined,{sessionStartedAt:'2026-10-06T00:00:00Z'})];
  expect(progressionSessions(records,NOW)).toEqual([]);
  expect(riderProgression(records,NOW).totalXP).toBe(0);
 });
 it('rewards focused effort even when a goal failed, and a one-attempt first landing earns its own bonus',()=>{
  expect(riderProgression([make('failed')],NOW).events).toMatchObject([{xp:20,label:'Focused session finished'}]);
  const short=make('quick',undefined,{attemptCount:1,activeDurationMs:0});
  expect(riderProgression([short],NOW).totalXP).toBe(0);
  const first={...short,landingCount:1,status:'success' as const};
  expect(riderProgression([first],NOW).events).toMatchObject([{xp:40,label:'First recorded landing'}]);
 });
 it('caps session XP at five per day',()=>{
  const sessions=Array.from({length:7},(_,i)=>make(`s${i}`,`2026-10-05T0${i+1}:00:00Z`));
  const progress=riderProgression(sessions,NOW);
  expect(progress.events.filter(r=>r.id.startsWith('practice:'))).toHaveLength(5);
  expect(progress.totalXP).toBe(100);
 });
 it('is deterministic, counts each session ID once, and recalculates after deletion',()=>{
  const a=make('a'),b=make('b','2026-10-06T02:00:00Z');
  expect(riderProgression([b,a,a],NOW)).toEqual(riderProgression([a,b],NOW));
  expect(riderProgression([a,b],NOW).totalXP).toBe(40);
  expect(riderProgression([a],NOW).totalXP).toBe(20);
 });
 it('awards a first landing once per exact variation and never for parked history',()=>{
  const a=make('a',undefined,{landingCount:1}),b=make('b','2026-10-06T01:00:00Z',{landingCount:1});
  const c=variant('c','2026-10-07T01:00:00Z','switch');c.landingCount=1;
  const parked=variant('parked','2026-10-04T01:00:00Z','switch');parked.status='pending';parked.landingCount=1;
  expect(riderProgression([parked,c,b,a],NOW).events.filter(r=>r.label==='First recorded landing')).toHaveLength(2);
 });
 it('limits streak and rate bonuses to one per trick per week, and ties never earn a new record',()=>{
  const sessions=[make('a','2026-10-05T01:00:00Z',{attemptCount:10,landingCount:5,bestLandingStreak:2}),make('b','2026-10-06T01:00:00Z',{attemptCount:10,landingCount:6,bestLandingStreak:3}),make('c','2026-10-07T01:00:00Z',{attemptCount:10,landingCount:7,bestLandingStreak:4}),make('d','2026-10-12T01:00:00Z',{attemptCount:10,landingCount:7,bestLandingStreak:4}),make('e','2026-10-13T01:00:00Z',{attemptCount:10,landingCount:8,bestLandingStreak:5})];
  const progress=riderProgression(sessions,Date.parse('2026-10-14T00:00:00Z'));
  expect(progress.events.filter(r=>r.label==='New best streak')).toHaveLength(2);
  expect(progress.events.filter(r=>r.label==='Landing-rate personal best')).toHaveLength(2);
  expect(progress.events.filter(r=>r.sessionId==='d').map(r=>r.label)).toEqual(['Focused session finished']);
 });
 it('credits practice XP to each finished session',()=>{
  const records=[variant('a','2026-10-05T01:00:00Z','regular'),variant('b','2026-10-05T02:00:00Z','fakie'),variant('c','2026-10-06T01:00:00Z','switch')];
  const progress=riderProgression(records,NOW);
  expect(progress.totalXP).toBe(60);
  const recap=sessionRewards(records,'c',NOW)!;
  expect(recap.xp).toBe(20);expect(recap.rewards).toHaveLength(1);
  expect(recap.levelBefore).toBe(1);expect(recap.levelAfter).toBe(1);
 });
 it('uses Monday midnight UTC+8 for bonus periods and preserves XP',()=>{
  const end='2026-10-11T15:59:59Z',records=[make('a',end)];
  const before=riderProgression(records,Date.parse(end));
  const after=riderProgression(records,Date.parse('2026-10-11T16:00:00Z'));
  expect(before.week.id).not.toBe(after.week.id);
  expect(after.totalXP).toBe(before.totalXP);
  expect(practiceDay(Date.parse('2026-10-11T16:00:00Z'))).toBe('2026-10-12');
 });
 it('counts practice on the day it finishes',()=>{
  const record=make('overnight','2026-10-11T16:01:00Z',{sessionStartedAt:'2026-10-11T15:55:00Z'});
  expect(riderProgression([record],Date.parse('2026-10-11T16:02:00Z')).events[0].date).toBe(record.sessionEndedAt);
 });
 it('does not multiply rewards on another save and shows old recaps at their historical level',()=>{
  const a=make('a'),later=Array.from({length:4},(_,i)=>make(`later${i}`,`2026-10-06T0${i+1}:00:00Z`));
  expect(sessionRewards([a,...later],'a',NOW)).toMatchObject({xp:20,totalXP:20,levelBefore:1,levelAfter:1});
  expect(riderProgression([a,{...a,notes:'changed'}],NOW).totalXP).toBe(20);
 });
 it('uses transparent level thresholds without negative or invalid XP',()=>{
  expect(levelProgress(0)).toMatchObject({level:1,remaining:100,fraction:0});
  expect(levelProgress(100)).toMatchObject({level:2,remaining:300,fraction:0});
  expect(levelProgress(400)).toMatchObject({level:3,remaining:500,fraction:0});
  expect(levelProgress(NaN).level).toBe(1);expect(levelProgress(-1).xp).toBe(0);
 });
});
