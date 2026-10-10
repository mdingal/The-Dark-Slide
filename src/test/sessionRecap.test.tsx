import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it,vi} from 'vitest';
import {createPracticeSession} from '../domain/practiceActions';
import {referenceChallenge} from '../domain/referenceChallenge';
import {sessionRecap} from '../domain/sessionRecap';
import {sessionRewards} from '../domain/riderProgression';
import {PracticeSession} from '../domain/types';
vi.mock('../components/common/Modal',()=>({Modal:({isOpen,title,children}:any)=>isOpen?<section><h2>{title}</h2>{children}</section>:null}));
import {ProgressionReward} from '../components/common/ProgressionReward';
const NOW=Date.parse('2026-10-10T08:00:00Z');
function record(id:string,lands:number,end=NOW-1000):PracticeSession {
 return {...createPracticeSession(referenceChallenge('ollie'),{id:'board',name:'Test board',deckWidthMm:34,wheelMaterial:'urethane'},end-60000),id,sessionStartedAt:new Date(end-60000).toISOString(),sessionEndedAt:new Date(end).toISOString(),status:'failed',attemptCount:20,landingCount:lands,activeDurationMs:60000,goal:{type:'landings',target:15},currentLandingStreak:0,bestLandingStreak:2,firstLandingAttemptNumber:3,firstLandingElapsedMs:12000};
}
it('summarizes a failed goal and reports only newly earned unlocks',()=>{
 const first=record('first',6,NOW-100000),last=record('last',4);
 const recap=sessionRecap([first,last],'last',NOW)!;
 expect(recap.reached).toBe(false);expect(recap.landingRate).toBe(.2);expect(recap.bestStreak).toBe(2);
 expect(recap.firstAttempt).toBe(3);expect(recap.firstTime).toBe(12000);
 expect(recap.unlocked.map(n=>n.id)).toContain('kickflip');
 expect(recap.unlocked.some(n=>n.stance==='switch')).toBe(false);
 expect(sessionRecap([first,last,record('later',1,NOW-500)],'later',NOW)!.unlocked).toEqual([]);
});
it('does not invent a first landing or show an unfinished recap',()=>{
 const s=record('s',0);
 expect(sessionRecap([s],'s',NOW)).toMatchObject({firstAttempt:null,firstTime:null});
 expect(sessionRecap([{...s,status:'pending'}],'s',NOW)).toBeNull();
 expect(sessionRecap([{...s,outcomeReviewPending:true}],'s',NOW)).toBeNull();
 expect(sessionRecap([{...s,sessionEndedAt:undefined}],'s',NOW)).toBeNull();
});
it('handles timed sessions with zero attempts without a fake landing rate',()=>{
 const s={...record('timed',0),attemptCount:0,status:'success' as const,goal:{type:'time' as const,target:1}};
 expect(sessionRecap([s],'timed',NOW)).toMatchObject({reached:true,landingRate:null});
});
it('renders the goal result, metrics and next actions without missed-card rematches',()=>{
 const s=record('s',10),reward=sessionRewards([s],s.id,NOW)!;
 const html=renderToStaticMarkup(<ProgressionReward reward={reward} records={[s]} onClose={()=>{}} onProgress={()=>{}} onSaveTarget={async()=>{}} onRetry={async()=>{}}/>);
 for(const label of ['Session recap','Goal not reached','Landing rate','Active time','Best streak','New tricks unlocked','Repeat this session','View session history','Save next target'])expect(html).toContain(label);
 expect(html).not.toContain('Rematch the misses');
});
