import {it,expect} from 'vitest';
import {practiceDefaults} from '../domain/practiceDefaults';
import {createPracticeSession} from '../domain/practiceActions';
import {referenceChallenge} from '../domain/referenceChallenge';
const a={id:'a',name:'Board A',deckWidthMm:34,wheelMaterial:'urethane' as const},b={...a,id:'b',name:'Board B',favorite:true};
const pending=createPracticeSession(referenceChallenge('kickflip'),a,1000);
const prior={...pending,id:'old',sessionStartedAt:'2026-10-06T00:00:00Z',setupSnapshot:b,goal:{type:'streak' as const,target:3},practiceTimer:{type:'countdown' as const,durationMs:125000},practiceSurface:'Marble'};
it('reuses the last recorded setup, goal, countdown, and surface',()=>{
 expect(practiceDefaults(pending,[prior],[a,b])).toEqual({setupId:'b',goal:prior.goal,timer:prior.practiceTimer,surface:'Marble'});
});
it('preserves the chosen challenge goal and lengthens a short remembered countdown',()=>{
 const s={...pending,goal:{type:'time' as const,target:10}};
 const result=practiceDefaults(s,[prior],[a,b]);expect(result.goal).toEqual(s.goal);expect(result.timer.durationMs).toBe(600000);
});
it('ignores generated challenges and falls back safely when a setup was removed',()=>{
 const neverStarted={...prior,id:'generated',sessionStartedAt:undefined,practiceSurface:'Cement'};
 expect(practiceDefaults(pending,[neverStarted,prior],[a]).setupId).toBe('a');
 expect(practiceDefaults(pending,[neverStarted],[a,b]).surface).toBe('');
 expect(practiceDefaults(pending,[],[a,b]).setupId).toBe('b');
 expect(practiceDefaults(pending,[],[]).setupId).toBe('');
});
it('chooses the most recently started session independent of list order',()=>{
 const recent={...prior,id:'recent',sessionStartedAt:'2026-10-07T00:00:00Z',setupSnapshot:a,practiceSurface:'Granite'};
 expect(practiceDefaults(pending,[recent,prior],[a,b]).surface).toBe('Granite');
});
