import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect,vi} from 'vitest';
const state=vi.hoisted(()=>({profile:{id:'rider',displayName:'Rider',savedSetups:[],partsInventory:[],onboarding:{version:1,step:0,answers:{}}} as any,sessions:[] as any[]}));
vi.mock('../context/AppContext',()=>({useApp:()=>({...state,updateProfile:vi.fn(),logout:vi.fn(),showToast:vi.fn(),isLoggedIn:true,activeTab:'settings'})}));
vi.mock('../components/common/Modal',()=>({Modal:({isOpen,children,title}:any)=>isOpen?<section><h2>{title}</h2>{children}</section>:null}));
import {RiderOnboarding} from '../components/auth/RiderOnboarding';
import {HardwareManager,PartEditor} from '../components/settings/HardwareManager';
import {SessionStartWizard} from '../components/generator/SessionStartWizard';
import {baseChallengePool} from '../domain/selectedChallengePool';
import {createPracticeSession} from '../domain/practiceActions';
import {setupFromParts,partLabel} from '../domain/hardware';
describe('onboarding and hardware entry points',()=>{
 it('makes questionnaire steps skippable but requires the final finish action',()=>{
  state.profile.onboarding.step=0;let html=renderToStaticMarkup(<RiderOnboarding/>);expect(html).toContain('Skip this step');expect(html).not.toContain('How many fingerboard setups');expect(html).toContain('Your parts inventory');expect(html.replace(/<!--.*?-->/g,'')).toContain('Step 1 / 6');
  state.profile.onboarding.step=6;html=renderToStaticMarkup(<RiderOnboarding/>);expect(html).toContain('Finish Rider Setup');expect(html).not.toContain('Skip this step');
 });
 it('offers favorites and hides editing after a setup has been used',()=>{
  const setup=setupFromParts('Board',{},[]);state.profile.savedSetups=[{...setup,usedAt:'2026-10-04T10:00:00.000Z'}];const html=renderToStaticMarkup(<HardwareManager only="setups"/>);expect(html).toContain('Favorite');expect(html).toContain('Configuration fixed');expect(html).not.toContain('>Edit<');state.profile.savedSetups=[];
 });
 it('requires selection at the session entry point and offers adding setups and parts',()=>{
  const s=createPracticeSession(baseChallengePool()[0],setupFromParts('Placeholder',{},[]));const html=renderToStaticMarkup(<SessionStartWizard session={s} onStart={async()=>{}} onClose={()=>{}}/>);expect(html).toContain('Ready to practice?');expect(html).toContain('Choose a setup');expect(html).toContain('Add setup / parts');expect(html).toContain('timer starts only when you confirm');expect(html).toContain('Goal ·');expect(html).toContain('Timer ·');expect(html).toContain('Surface Material');expect(html).not.toContain('Step 1 / 4');
 });
});

vi.mock('../context/ThemeProvider',()=>({useTheme:()=>({theme:'dark',setTheme:vi.fn()})}));
import {TopBar} from '../components/common/TopBar';
it('keeps the homepage header style during onboarding without account navigation',()=>{
 const html=renderToStaticMarkup(<TopBar onboarding currentPage={null} onNavigate={()=>{}}/>);
 expect(html).toContain('w-14');expect(html).toContain('dark-slide-ds-clean.png');expect(html).not.toContain('Main Navigation');
});
it('uses one part name and whole-number plies, with no location or quantity fields',()=>{
 const html=renderToStaticMarkup(<PartEditor kind="deck" onCancel={()=>{}} onSave={async()=>{}}/>);
 expect(html).toContain('Name/Brand');expect(html).not.toContain('Currently');expect(html).not.toContain('Quantity');expect(html).toContain('min="1"');expect(html).toContain('step="1"');expect(html).toContain('value="5"');expect(html).toContain('value="6"');expect(html).toContain('value="7"');expect(html).toContain('<option>Low</option>');
 expect(partLabel({id:'d',kind:'deck',name:'Ethical',brand:'Ethical',specs:{'Width (mm)':'34'}})).toBe('Ethical - 34mm');
});

it('deck game setup asks only for setup and surface, without configurable session goals',()=>{
 const s=createPracticeSession(baseChallengePool()[0],setupFromParts('Placeholder',{},[]));
 const html=renderToStaticMarkup(<SessionStartWizard session={s} gameSetup="Fundamentals · Normal" onStart={async()=>{}} onClose={()=>{}}/>);
 expect(html).toContain('Fundamentals · Normal');expect(html).toContain('Fingerboard setup');expect(html).toContain('Surface Material');expect(html).not.toContain('Goal type');expect(html).not.toContain('Countdown — ends automatically');
});
