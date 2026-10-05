import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {PracticePanel} from '../components/generator/PracticePanel';
import {createPracticeSession} from '../domain/practiceActions';
import {baseChallengePool} from '../domain/selectedChallengePool';
it('renders the identical practice panel before starting in the demo and signed-in app',()=>{
 const setups=[{id:'sample',name:'Sample',deckWidthMm:34,wheelMaterial:'urethane' as const}];
 const session=createPracticeSession(baseChallengePool()[0],setups[0]);
 const props={session,savedSetups:setups,onSelectSetup:()=>{},onUpdateSession:async()=>{}};
 const live=renderToStaticMarkup(<PracticePanel {...props}/>);
 const demo=renderToStaticMarkup(<PracticePanel {...props} demo={{setups,onStart:()=>{}}}/>);
 expect(demo).toBe(live);expect(demo).toContain('Miss tags');expect(demo).toContain('Session Notes');
});
