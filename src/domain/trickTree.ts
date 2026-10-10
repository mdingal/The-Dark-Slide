import {PracticeSession,GeneratedTrickResult} from './types';
import {TRICK_TREE_CATALOG,TrickTreeDefinition} from './trickTreeCatalog';
import {referenceChallenge} from './referenceChallenge';
import {enumerateSingleOptions} from './challengeGeneration';
import {getBaseTrickById} from './catalog';
import {formatSingleTrickName} from './naming';
import {generateBreakdown} from './rules';
import {resolveUnderlyingMovements} from './movements';
import {trickKey,getStreaks} from './progression';
import {createTarget} from './practiceTargets';
import {progressionSessions} from './riderProgression';
export const TREE_MASTERY_LANDINGS=100;
export const TREE_UNLOCK_LANDINGS=10;
export type TreeState='locked'|'unlocked'|'learning'|'mastered';
export interface TrickTreeNode extends TrickTreeDefinition {
 challenge:GeneratedTrickResult; depth:number; state:TreeState; unlocked:boolean; mastered:boolean;
 totalLandings:number; established:boolean; sessionCount:number; landingSessions:number; bestStreak:number; bestRate:number|null;
 criteria:{label:string;done:boolean;detail:string}[]; missingPrerequisites:string[];
}
export function treeGuideId(node:TrickTreeDefinition):string {
 const base=node.guideId||node.id;
 return node.stance?`${node.stance}:${base}`:base;
}
const cache=new Map<string,GeneratedTrickResult>();
export function treeChallenge(node:TrickTreeDefinition):GeneratedTrickResult {
 const cached=cache.get(node.id);if(cached)return structuredClone(cached);
 const result=referenceChallenge(node.guideId||node.id);
 if(node.stance){
  if(!result.singleTrick)throw Error('Stance branches need a single trick.');
  const p=enumerateSingleOptions({...result.singleTrick,stance:node.stance},{})[0];
  if(!p)throw Error(`Unsupported tree stance: ${node.id}`);
  const params={...p,movements:resolveUnderlyingMovements(p)};
  result.singleTrick=params;result.movements=params.movements;result.canonicalName=formatSingleTrickName(params);result.breakdown=generateBreakdown(params,getBaseTrickById(params.baseTrickId)!);
 }
 cache.set(node.id,result);return structuredClone(result);
}
export function treeDepths(definitions:TrickTreeDefinition[]=TRICK_TREE_CATALOG):Map<string,number>{
 const nodes=new Map(definitions.map(n=>[n.id,n])),depths=new Map<string,number>(),visiting=new Set<string>();
 const visit=(id:string):number=>{
  if(depths.has(id))return depths.get(id)!;
  const node=nodes.get(id);if(!node)throw Error(`Unknown prerequisite: ${id}`);
  if(visiting.has(id))throw Error(`Circular tree prerequisite: ${id}`);
  visiting.add(id);const depth=node.prerequisites.length?1+Math.max(...node.prerequisites.map(visit)):0;
  visiting.delete(id);depths.set(id,depth);return depth;
 };definitions.forEach(n=>visit(n.id));return depths;
}
export function trickTree(records:PracticeSession[],now=Date.now()):TrickTreeNode[]{
 const depths=treeDepths(),groups=new Map<string,PracticeSession[]>();
 for(const session of progressionSessions(records,now)){const key=trickKey(session.trickResult);groups.set(key,[...(groups.get(key)||[]),session]);}
 const nodes=TRICK_TREE_CATALOG.map(node=>{
  const challenge=treeChallenge(node),history=groups.get(trickKey(challenge))||[],landed=history.filter(s=>s.landingCount>0);
  const bestStreak=Math.max(0,...history.map(s=>getStreaks(s).best));
  const rates=history.filter(s=>s.attemptCount>=10).map(s=>s.landingCount/s.attemptCount);
  const bestRate=rates.length?Math.max(...rates):null;
  const totalLandings=history.reduce((sum,s)=>sum+s.landingCount,0);
  const criteria=[{label:'100 successful landings',done:totalLandings>=TREE_MASTERY_LANDINGS,detail:`${totalLandings}/${TREE_MASTERY_LANDINGS} successful landings across finished sessions`}];
  return {...node,challenge,depth:depths.get(node.id)!,mastered:criteria.every(c=>c.done),established:totalLandings>=TREE_UNLOCK_LANDINGS,totalLandings,sessionCount:history.length,landingSessions:landed.length,bestStreak,bestRate,criteria};
 });
 const established=new Set(nodes.filter(n=>n.established).map(n=>n.id));
 return nodes.map(node=>{const missingPrerequisites=node.prerequisites.filter(id=>!established.has(id));const unlocked=node.established||missingPrerequisites.length===0;const state:TreeState=node.mastered?'mastered':!unlocked?'locked':node.sessionCount>0?'learning':'unlocked';return {...node,missingPrerequisites,unlocked,state};});
}
export function newlyUnlockedTricks(records:PracticeSession[],sessionId:string,now=Date.now()):TrickTreeNode[]{
 const history=progressionSessions(records,now),index=history.findIndex(s=>s.id===sessionId);if(index<0)return [];
 const before=trickTree(history.slice(0,index),now),after=trickTree(history.slice(0,index+1),now),old=new Map(before.map(n=>[n.id,n.unlocked]));
 return after.filter(n=>n.unlocked&&!old.get(n.id)&&n.prerequisites.length>0);
}
export function treeView(nodes:TrickTreeNode[],branch='Foundations',search='',state='all',stances=false):TrickTreeNode[]{
 const wanted=nodes.filter(n=>(stances||!n.stance)&&(branch==='All'||(branch==='Foundations'?((n.depth<=1&&!n.stance)||(stances&&!!n.stance)):n.family===branch))&&(!search||n.name.toLowerCase().includes(search.toLowerCase().trim()))&&(state==='all'||n.state===state));
 const byId=new Map(nodes.map(n=>[n.id,n])),included=new Set<string>();
 const add=(id:string)=>{if(included.has(id))return;const node=byId.get(id);if(!node)return;included.add(id);node.prerequisites.forEach(add);};wanted.forEach(n=>add(n.id));
 return nodes.filter(n=>included.has(n.id)).sort((a,b)=>a.depth-b.depth||a.name.localeCompare(b.name));
}

// Small session missions contribute to the cumulative mastery goal, independently of session success.
export function treeMission(node:TrickTreeNode,now=Date.now()) {
 const remaining=Math.max(0,TREE_MASTERY_LANDINGS-node.totalLandings);
 const target=node.mastered?5:Math.min(node.totalLandings===0?1:5,remaining);
 return createTarget(node.challenge,{type:'landings',target},node.mastered?`Keep ${node.name} sharp with five landings.`:`${node.name}: ${node.totalLandings}/100 landings toward mastery. Record ${target} more in this session.`,now);
}
export function treeBranchAchievements(nodes:TrickTreeNode[]) {
 return (['regular','fakie','nollie','switch'] as const).map(stance=>{
  const ids=['ollie','pop-shuvit','kickflip','heelflip'].map(id=>stance==='regular'?id:`${id}:${stance}`);
  const members=ids.map(id=>nodes.find(n=>n.id===id)).filter((n):n is TrickTreeNode=>!!n);
  const mastered=members.filter(n=>n.mastered).length;
  return {id:stance,title:`${stance[0].toUpperCase()+stance.slice(1)} Foundations`,members,mastered,total:ids.length,complete:mastered===ids.length};
 });
}

export function searchTreeNodes(nodes:TrickTreeNode[],query:string):TrickTreeNode[] {
 const terms=query.toLowerCase().trim().split(/[^a-z0-9]+/).filter(Boolean);if(!terms.length)return [];
 const compact=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
 const target=compact(query);
 return nodes.filter(n=>terms.every(term=>compact(`${n.name} ${n.stance||'regular'} ${n.challenge.canonicalName}`).includes(term)))
 .sort((a,b)=>Number(compact(b.name)===target)-Number(compact(a.name)===target)||Number(compact(b.name).startsWith(target))-Number(compact(a.name).startsWith(target))||a.name.localeCompare(b.name));
}
