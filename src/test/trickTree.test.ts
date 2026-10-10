import {treeGuideId} from '../domain/trickTree';
import {it,expect} from 'vitest';
import {TRICK_TREE_CATALOG} from '../domain/trickTreeCatalog';
import {trickTree,treeChallenge,treeDepths,treeView,newlyUnlockedTricks,treeMission,treeBranchAchievements,searchTreeNodes} from '../domain/trickTree';
import {createPracticeSession} from '../domain/practiceActions';
import {validateTrickParameters} from '../domain/rules';
import {PracticeSession} from '../domain/types';
const NOW=Date.parse('2026-10-08T12:00:00Z');
function mastered(id:string,day=1):PracticeSession[]{
 const trick=treeChallenge(TRICK_TREE_CATALOG.find(n=>n.id===id)!);
 return [0,1].map(i=>{const time=Date.UTC(2026,9,day+i);return {...createPracticeSession(trick,{id:'setup',name:'Board',deckWidthMm:34,wheelMaterial:'urethane'},time-600000),id:`${id}-${i}`,sessionStartedAt:new Date(time-600000).toISOString(),sessionEndedAt:new Date(time).toISOString(),attemptCount:60,landingCount:50,bestLandingStreak:3,activeDurationMs:600000,status:'success'};});
}
it('starts with four independent Ollie foundations and validates every catalog challenge',()=>{
 const nodes=trickTree([],NOW);expect(nodes).toHaveLength(112);expect(nodes.filter(n=>n.unlocked).map(n=>n.id)).toEqual(['ollie','ollie:fakie','ollie:switch','ollie:nollie']);
 expect(new Set(nodes.map(n=>n.id)).size).toBe(nodes.length);
 for(const n of nodes){if(n.challenge.singleTrick)expect(validateTrickParameters(n.challenge.singleTrick).isValid,n.id).toBe(true);expect(n.prerequisites.every(id=>nodes.some(p=>p.id===id))).toBe(true);}
});
it('masters at exactly 100 cumulative landings without rate or streak requirements',()=>{
 const records=mastered('ollie');expect(trickTree(records.slice(0,1),NOW).find(n=>n.id==='ollie')?.totalLandings).toBe(50);
 expect(trickTree(records.slice(0,1),NOW).find(n=>n.id==='ollie')?.mastered).toBe(false);
 const below=[records[0],{...records[1],landingCount:49}];expect(trickTree(below,NOW).find(n=>n.id==='ollie')?.mastered).toBe(false);
 const exact=records.map(s=>({...s,bestLandingStreak:1,attemptCount:200,status:'failed' as const}));const node=trickTree(exact,NOW).find(n=>n.id==='ollie')!;
 expect(node.mastered).toBe(true);expect(node.totalLandings).toBe(100);
 const one={...records[0],attemptCount:100,landingCount:100};expect(trickTree([one],NOW).find(n=>n.id==='ollie')?.mastered).toBe(true);
});
it('unlocks children only after all their prerequisites are mastered',()=>{
 const history=[...mastered('ollie'),...mastered('kickflip',3)];
 let node=trickTree(history,NOW).find(n=>n.id==='varial_kickflip')!;expect(node.state).toBe('locked');expect(node.missingPrerequisites).toEqual(['pop-shuvit']);
 node=trickTree([...history,...mastered('pop-shuvit',5)],NOW).find(n=>n.id==='varial_kickflip')!;expect(node.state).toBe('unlocked');
});
it('treats stance nodes independently and never infers mastery of unrecorded prerequisites',()=>{
 const nodes=trickTree(mastered('kickflip'),NOW);
 expect(nodes.find(n=>n.id==='kickflip')?.mastered).toBe(true);
 expect(nodes.find(n=>n.id==='ollie')?.mastered).toBe(false);
 expect(nodes.find(n=>n.id==='kickflip:switch')?.state).toBe('locked');
 expect(trickTree([...mastered('kickflip'),...mastered('ollie:switch')],NOW).find(n=>n.id==='kickflip:switch')?.state).toBe('unlocked');
 expect(nodes.find(n=>n.id==='kickflip:fakie')?.mastered).toBe(false);
});
it('ignores parked, generated and duplicate records and revokes unlocks after correction',()=>{
 const records=mastered('ollie');expect(trickTree([records[0],records[0]],NOW).find(n=>n.id==='kickflip')?.state).toBe('locked');
 expect(trickTree(records.map(s=>({...s,status:'pending'})),NOW).find(n=>n.id==='kickflip')?.state).toBe('locked');
 const corrected=[records[0],{...records[1],landingCount:0,bestLandingStreak:0}];expect(trickTree(corrected,NOW).find(n=>n.id==='kickflip')?.state).toBe('locked');
});
it('includes ancestor context in branch and search filters and reveals stance branches',()=>{
 const nodes=trickTree([],NOW),search=treeView(nodes,'All','tre flip');
 expect(search.some(n=>n.id==='tre_flip')).toBe(true);expect(search.some(n=>n.id==='ollie')).toBe(true);expect(search.some(n=>n.id==='shuvit_360')).toBe(true);
 expect(treeView(nodes).some(n=>n.stance)).toBe(false);expect(treeView(nodes,'Foundations','','all',true).some(n=>n.id==='kickflip:switch')).toBe(true);
});
it('detects invalid dependency graphs instead of drawing a broken tree',()=>{
 expect(()=>treeDepths([{id:'a',name:'A',family:'F',prerequisites:['missing']}])).toThrow('Unknown');
 expect(()=>treeDepths([{id:'a',name:'A',family:'F',prerequisites:['b']},{id:'b',name:'B',family:'F',prerequisites:['a']}])).toThrow('Circular');
});
it('reports only the new unlocks supported by the finishing session',()=>{
 const history=mastered('ollie');expect(newlyUnlockedTricks(history,history[0].id,NOW)).toEqual([]);
 const unlocked=newlyUnlockedTricks(history,history[1].id,NOW);expect(unlocked.some(n=>n.id==='kickflip')).toBe(true);expect(unlocked.some(n=>n.id==='tre_flip')).toBe(false);
});

it('includes every flatground base in regular, fakie, switch, and nollie',()=>{
 const nodes=trickTree([],NOW).filter(n=>n.family!=='Grinds & slides'),bases=nodes.filter(n=>!n.stance);
 expect(nodes).toHaveLength(bases.length*4);
 for(const base of bases)for(const stance of ['fakie','switch','nollie'] as const){const variant=nodes.find(n=>n.id===`${base.id}:${stance}`)!;expect(variant).toBeDefined();expect(variant.challenge.singleTrick?.stance).toBe(stance);expect(variant.challenge.singleTrick?.baseTrickId).toBe(base.challenge.singleTrick?.baseTrickId);expect(variant.guideId).toBe(base.id);}
});
it('advanced stance branches depend only on same-stance prerequisites',()=>{
 const variant=TRICK_TREE_CATALOG.find(n=>n.id==='varial_kickflip:switch')!;
 expect(new Set(variant.prerequisites)).toEqual(new Set(['kickflip:switch','pop-shuvit:switch']));
 const regular=[...mastered('varial_kickflip'),...mastered('kickflip'),...mastered('pop-shuvit')];
 expect(trickTree(regular,NOW).find(n=>n.id===variant.id)?.unlocked).toBe(false);
 const combined=[...mastered('kickflip:switch'),...mastered('pop-shuvit:switch')];
 expect(trickTree(combined,NOW).find(n=>n.id===variant.id)?.unlocked).toBe(true);
 expect(trickTree(combined,NOW).find(n=>n.id===variant.id)?.mastered).toBe(false);
 const advanced=trickTree(mastered('tre_flip:nollie'),NOW);
 expect(advanced.find(n=>n.id==='tre_flip:nollie')?.mastered).toBe(true);expect(advanced.find(n=>n.id==='tre_flip:switch')?.mastered).toBe(false);expect(advanced.find(n=>n.id==='tre_flip')?.mastered).toBe(false);
});

it('places all stance Ollies at the base without awarding unrecorded mastery',()=>{
 const nodes=trickTree([],NOW);for(const id of ['ollie','ollie:fakie','ollie:nollie','ollie:switch']){const root=nodes.find(n=>n.id===id)!;expect(root.prerequisites).toEqual([]);expect(root.depth).toBe(0);expect(root.unlocked).toBe(true);expect(root.mastered).toBe(false);}
 for(const stance of ['fakie','switch','nollie']){const child=nodes.find(n=>n.id===`kickflip:${stance}`)!;expect(child.prerequisites).toEqual([`ollie:${stance}`]);}
});

it('provides small missions and caps the final step at the remaining landings',()=>{
 const root=trickTree([],NOW).find(n=>n.id==='ollie')!;expect(treeMission(root,NOW).goal.target).toBe(1);
 const history=mastered('ollie');const partial=trickTree([history[0],{...history[1],landingCount:47}],NOW).find(n=>n.id==='ollie')!;
 expect(treeMission(partial,NOW).goal).toEqual({type:'landings',target:3});
 expect(treeMission(trickTree(history,NOW).find(n=>n.id==='ollie')!,NOW).goal.target).toBe(5);
});
it('earns stance branch achievements only from all four recorded masteries',()=>{
 const records=['ollie','pop-shuvit','kickflip','heelflip'].flatMap(id=>mastered(id));const achievements=treeBranchAchievements(trickTree(records,NOW));
 expect(achievements.find(a=>a.id==='regular')?.complete).toBe(true);expect(achievements.find(a=>a.id==='switch')?.mastered).toBe(0);
 expect(treeBranchAchievements(trickTree(records.filter(s=>!s.id.startsWith('heelflip')),NOW))[0].complete).toBe(false);
});

it('searches all stance nodes without changing the tree or hiding locked results',()=>{
 const nodes=trickTree([],NOW);
 expect(searchTreeNodes(nodes,'')).toEqual([]);
 expect(searchTreeNodes(nodes,'nollie')[0].id).toBe('ollie:nollie');
 expect(searchTreeNodes(nodes,'switch kick flip').map(n=>n.id)).toContain('kickflip:switch');
 expect(searchTreeNodes(nodes,'tre flip').map(n=>n.id)).toContain('tre_flip');
 expect(searchTreeNodes(nodes,'kickflip')[0].id).toBe('kickflip');
 expect(searchTreeNodes(nodes,'no such trick')).toEqual([]);
 expect(searchTreeNodes(nodes,'switch kickflip')[0].state).toBe('locked');
 expect(nodes).toHaveLength(112);
});

it('links stance tree nodes to the matching stance guide, preserving the regular guide',()=>{
 for(const base of ['tre_flip','kickflip','ollie']){
  expect(treeGuideId(TRICK_TREE_CATALOG.find(n=>n.id===base)!)).toBe(base);
  for(const stance of ['fakie','nollie','switch']){
   const node=TRICK_TREE_CATALOG.find(n=>n.id===`${base}:${stance}`)!;
   expect(treeGuideId(node)).toBe(`${stance}:${base}`);
  }
 }
});
