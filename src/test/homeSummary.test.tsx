import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it,vi} from 'vitest';
vi.mock('../context/AppContext',()=>({useApp:()=>({sessions:[],profile:{savedSetups:[]},setActiveTab:vi.fn()})}));
import {homePracticeStats,RiderHomeSummary} from '../components/landing/RiderHomeSummary';
import {TrickMatrixDemo} from '../components/landing/TrickMatrixDemo';
import {PracticeSession} from '../domain/types';
it('counts only started sessions and weights landing rate by attempts',()=>{
 const s=(id:string,attemptCount:number,landingCount:number,date?:string,bestLandingStreak=0)=>({id,attemptCount,landingCount,sessionStartedAt:date,bestLandingStreak}) as PracticeSession;
 const stats=homePracticeStats([s('draft',20,20),s('one',2,2,'2026-10-01',2),s('two',8,2,'2026-10-02',1),s('invalid',9,9,'invalid')]);
 expect(stats).toMatchObject({count:2,landings:4,rate:'40.0%',best:2});expect(stats.recent.id).toBe('two');
});
it('handles empty accounts without demo stats or an invented featured setup',()=>{
 expect(homePracticeStats([])).toMatchObject({count:0,landings:0,rate:'—',best:0});
 const html=renderToStaticMarkup(<RiderHomeSummary/>);expect(html).toContain('Choose featured setup');expect(html).toContain('Start your first session');
});
it('starts the signed-out demo with the guided flow',()=>{
 const html=renderToStaticMarkup(<TrickMatrixDemo onPromptAuth={()=>{}}/>);expect(html).toContain('Try a Session');expect(html).not.toContain('Live Trick Generator Sandbox');expect(html).not.toContain('Generate New Challenge');
});
