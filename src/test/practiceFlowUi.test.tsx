import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({currentSession:null as any}));
vi.mock('../context/AppContext',()=>({useApp:()=>({...state,sessions:[],profile:{availableObstacles:['ledge','rail'],savedSetups:[],trickLibrary:[],bookmarks:[]},showToast:vi.fn()})}));
vi.mock('../components/common/SharedChallengeBar',()=>({SharedChallengeBar:()=>null}));
vi.mock('../components/common/ChallengeCompletionPanel',()=>({ChallengeSessionStatus:()=>null}));
vi.mock('../components/common/MilestonePanel',()=>({MilestoneMoment:()=>null}));
vi.mock('../components/generator/PracticePanel',()=>({PracticePanel:()=> <div>Practice counters</div>}));
import {GeneratorPage} from '../components/generator/GeneratorPage';
it('starts with one introduction instead of every configuration card',()=>{
 state.currentSession=null;const html=renderToStaticMarkup(<GeneratorPage/>);
 expect(html).toContain('START A SESSION');expect(html).not.toContain('Select your skate class');expect(html).not.toContain('Generate New Challenge');expect(html).not.toContain('Practice counters');
});
it('opens resumed sessions directly to practice and prevents replacing an active challenge',()=>{
 state.currentSession={id:'session',sessionStartedAt:'2026-10-04',trickResult:{mode:'single',canonicalName:'Kickflip',breakdown:[],warnings:[]}};
 const html=renderToStaticMarkup(<GeneratorPage/>);expect(html).toContain('Practice counters');expect(html).toContain('Generate &amp; practice');expect(html).toContain('disabled=""');expect(html).not.toContain('Selected Trick Pool');state.currentSession=null;
});
