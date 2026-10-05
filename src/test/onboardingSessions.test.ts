import {describe,it,expect} from 'vitest';
import {startConfiguredSession,closePractice,goalReached,remainingTime} from '../domain/sessionPlan';
import {setupFromParts,setupUsed,InventoryPart} from '../domain/hardware';
import {singleFitsClass,challengeFitsClass} from '../domain/skateClasses';
import {createPracticeSession,recordCounterAction,undoCounterAction} from '../domain/practiceActions';
import {baseChallengePool,expandSelectedVariations} from '../domain/selectedChallengePool';
import {generateChallenge} from '../domain/challengeGeneration';
import {GeneratorPresetConfig} from '../domain/types';
import {chartData} from '../domain/dashboardAnalytics';
const trick=baseChallengePool().find(t=>t.singleTrick?.baseTrickId==='kickflip')!;
const setup=setupFromParts('Test board',{},[]);
const draft=()=>createPracticeSession(trick,setup,1000);
const start=(type:'landings'|'streak'='landings',target=2)=>startConfiguredSession(draft(),setup,{type,target},{type:'countdown',durationMs:60000},'Marble',1000);
describe('configured practice sessions',()=>{
 it('requires a valid goal, countdown, and surface',()=>{
  expect(()=>startConfiguredSession(draft(),setup,{type:'landings',target:0},{type:'regular'},'Marble',1000)).toThrow();
  expect(()=>startConfiguredSession(draft(),setup,{type:'landings',target:1},{type:'countdown',durationMs:0},'Marble',1000)).toThrow();
  expect(()=>startConfiguredSession(draft(),setup,{type:'landings',target:1},{type:'regular'},'',1000)).toThrow();
 });
 it('keeps generated challenges unstarted and freezes setup snapshots on start',()=>{
  expect(draft().sessionStartedAt).toBeUndefined();const s=start();expect(s.sessionStartedAt).toBe(new Date(1000).toISOString());expect(s.timerState.isRunning).toBe(true);expect(s.setupSnapshot).not.toBe(setup);
 });
 it('computes successful totals and failed totals without a manual status',()=>{
  let s=recordCounterAction(start(),'landing',2000);expect(closePractice(s,false,3,'',3000).status).toBe('failed');s=recordCounterAction(s,'landing',4000);expect(closePractice(s,false,3,'',5000).status).toBe('success');
 });
 it('uses best streak, including after a later miss, and respects undo',()=>{
  let s=start('streak');s=recordCounterAction(s,'landing',2000);s=recordCounterAction(s,'landing',3000);s=recordCounterAction(s,'attempt',4000);expect(goalReached(s)).toBe(true);s=undoCounterAction(undoCounterAction(s));expect(goalReached(s)).toBe(false);
 });
 it('parks as pending, retaining goal and remaining countdown for resume',()=>{
  const s=closePractice(start(),true,4,'Catch timing',21000);expect(s.status).toBe('pending');expect(s.sessionEndedAt).toBeUndefined();expect(s.timerState.isRunning).toBe(false);expect(remainingTime(s,100000)).toBe(40000);expect(s.notes).toBe('Catch timing');
 });
 it('caps countdown duration and excludes parked sessions from goal achievement',()=>{
  const s=closePractice(start(),false,3,'',90000,'countdown');expect(s.activeDurationMs).toBe(60000);expect(remainingTime(s)).toBe(0);expect(s.status).toBe('failed');expect(chartData('sessionGoals',[s,closePractice(start(),true,3,'',4000)]).rows[0].Sessions).toBe(1);
 });
});
describe('hardware and skate classes',()=>{
 it('reuses inventory parts while retaining frozen specifications per configuration',()=>{
  const part:InventoryPart={id:'deck',kind:'deck',name:'Deck',brand:'Test',location:'installed',quantity:1,specs:{'Width (mm)':'34'}};
  const a=setupFromParts('A',{deck:part.id},[part]),b=setupFromParts('B',{deck:part.id},[part]);part.specs['Width (mm)']='32';expect(a.deckWidthMm).toBe(34);expect(b.partIds?.deck).toBe('deck');expect(a.partsSnapshot?.deck?.specs['Width (mm)']).toBe('34');expect(setupUsed(a.id,[{...start(),setupSnapshot:a}])).toBe(true);
 });
 it('keeps modifiers available while restricting stances and specialty tricks',()=>{
  const p={...trick.singleTrick!,bodyVarial:'frontside' as const,revert:'backside' as const};expect(singleFitsClass(p,'C')).toBe(true);expect(singleFitsClass({...p,stance:'nollie'},'C')).toBe(false);expect(singleFitsClass({...p,stance:'nollie'},'B')).toBe(true);expect(singleFitsClass({...p,baseTrickId:'feather_flip'},'B')).toBe(false);expect(singleFitsClass({...p,baseTrickId:'feather_flip'},'A')).toBe(true);
 });
 it('filters selected variations before drawing a class C challenge',()=>{
  const options=expandSelectedVariations([trick],true,null).filter(t=>challengeFitsClass(t,'C'));expect(options).toHaveLength(2);expect(options.every(t=>['regular','fakie'].includes(t.singleTrick!.stance))).toBe(true);
 });
 it('honors class restrictions in all generator modes without bypassing incompatible locks',()=>{
  const p=trick.singleTrick!;const config:GeneratorPresetConfig={mode:'single',skateClass:'C',singleLocks:{},singleExclusions:{},step1Locks:{},step2Locks:{},step1Exclusions:{},step2Exclusions:{},obstacleLocks:{},obstacleExclusions:{},activeParams:p,step1Params:p,step2Params:p,selectedObstacle:'ledge',obstacleData:{obstacleType:'ledge',approach:'frontside',obstacleTrickId:'50_50',entryTrickId:'ollie',exitTrick:'clean'}};
  for(const mode of ['single','combo','obstacle'] as const){const t=generateChallenge({...config,mode});expect('error' in t).toBe(false);if(!('error' in t))expect(challengeFitsClass(t,'C')).toBe(true);}
  expect(generateChallenge({...config,singleLocks:{stance:'switch'}})).toHaveProperty('error');
 });
 it('compares hardware and surfaces with weighted attempt counts',()=>{
  const s={...start(),attemptCount:4,landingCount:2,setupSnapshot:{...setup,partsSnapshot:{deck:{id:'d',kind:'deck' as const,name:'D',brand:'Test',location:'reserve' as const,quantity:1,specs:{}}}}};expect(chartData('hardware_deck_Brand',[s]).rows[0]).toMatchObject({name:'Test',value:50,Attempts:4});expect(chartData('surfaceRate',[s]).rows[0].name).toBe('Marble');
 });
});
