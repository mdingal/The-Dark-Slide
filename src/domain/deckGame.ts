import {GeneratedTrickResult,PracticeSession,SetupData,Stance,Direction} from './types';
import {enumerateSingleOptions} from './challengeGeneration';
import {getBaseTrickById,getReservedTrickById,CATALOG_VERSION} from './catalog';
import {generateBreakdown} from './rules';
import {resolveUnderlyingMovements} from './movements';
import {formatSingleTrickName} from './naming';
import {createPracticeSession,recordCounterAction} from './practiceActions';
import {startConfiguredSession,closePractice} from './sessionPlan';
export type DeckMode='normal'|'skate'|'wildcard';
export const WILDCARD_TYPES=['revert','body_varial','double','triple','one_attempt','opposite_stance','sudden_death'] as const;
export type WildcardType=typeof WILDCARD_TYPES[number];
export interface Wildcard {cardIndex:number;type:WildcardType;}
export const WILDCARD_LABELS:Record<WildcardType,string>={revert:'Add a revert after landing',body_varial:'Add a body varial / sex change after landing',double:'Land it twice',triple:'Land it three times',one_attempt:'One attempt only',opposite_stance:'Land it, then land it in the opposite stance',sudden_death:'One attempt — miss it and the game ends'};
export const deckModeLabel=(mode:DeckMode)=>mode==='normal'?'Normal':mode==='skate'?'Game of SKATE':'Wildcard';
export function assignWildcards(total:number,random?:()=>number):Wildcard[]{if(!Number.isInteger(total)||total<3)throw Error('Wildcard decks need at least three cards.');const types=shuffleCards([...WILDCARD_TYPES],random);return shuffleCards(Array.from({length:total},(_,i)=>String(i)),random).slice(0,3).map((index,i)=>({cardIndex:Number(index),type:types[i] as WildcardType}));}
export function currentWildcard(game:DeckGameLink):WildcardType|undefined{return game.mode==='wildcard'?game.wildcards?.find(w=>w.cardIndex===game.cardIndex)?.type:undefined;}
export function cardTarget(game:DeckGameLink){const type=currentWildcard(game);return type==='triple'?3:type==='double'||type==='opposite_stance'?2:1;}
export function cardPassed(s:PracticeSession){return s.landingCount>=cardTarget(s.deckGame!);}

export interface DeckGameLink {gameId:string;deckId:string;mode:DeckMode;order:string[];cardIndex:number;lettersBefore:number;gameStartedAt:string;endedEarly:boolean;wildcards?:Wildcard[];}
export interface DeckCard {id:string;name:string;trick:GeneratedTrickResult;}
function card(id:string,base:string,stance:Stance='regular',direction:Direction='none'):DeckCard{
 const p=enumerateSingleOptions({stance,direction,baseTrickId:base,bodyVarial:'none',landing:'normal',revert:'none'},{})[0];
 if(!p)throw Error('Invalid deck card '+id);const params={...p,movements:resolveUnderlyingMovements(p)};
 const trick:GeneratedTrickResult={mode:'single',singleTrick:params,movements:params.movements,canonicalName:formatSingleTrickName(params),breakdown:generateBreakdown(params,getBaseTrickById(base)!),catalogVersion:CATALOG_VERSION};
 return {id,name:trick.canonicalName,trick};
}
export const GAME_DECKS=[{id:'fundamentals',name:'Pop Quiz',description:'Pop, rotation, and fakie control.',cards:[card('ollie','ollie'),card('bs180','ollie','regular','backside'),card('fs180','ollie','regular','frontside'),card('fakie_ollie','ollie','fakie'),card('pop_shuv','pop_shuvit'),card('fakie_pop_shuv','pop_shuvit','fakie'),card('half_cab','ollie','fakie','backside'),card('fakie_fs180','ollie','fakie','frontside')]},{id:'basic-flips',name:'Flipside',description:'Flip tricks in regular and fakie.',cards:[card('kickflip','kickflip'),card('fakie_kickflip','kickflip','fakie'),card('varial_kickflip','varial_kickflip'),card('fakie_varial_kickflip','varial_kickflip','fakie'),card('tre_flip','tre_flip'),card('fakie_tre_flip','tre_flip','fakie'),card('heelflip','heelflip'),card('fakie_heelflip','heelflip','fakie')]}];
// Dedicated flip decks explore four stances and regular/fakie rotations.
for(const [id,name,base] of [['heelflips','Heel Yeah','heelflip'],['kickflips','Kickflip Club','kickflip']]){
 GAME_DECKS.push({id,name,description:'Four stances. Frontside and backside variations.',cards:[
  card(base,base),card('fakie_'+base,base,'fakie'),card('nollie_'+base,base,'nollie'),card('switch_'+base,base,'switch'),
  card('fs_'+base,base,'regular','frontside'),card('bs_'+base,base,'regular','backside'),card('fakie_fs_'+base,base,'fakie','frontside'),card('fakie_bs_'+base,base,'fakie','backside')
 ]});
}
const deckStances:Stance[]=['regular','fakie','nollie','switch'];
const pairedDeck=(id:string,name:string,bases:string[])=>({id,name,description:'',cards:bases.flatMap(base=>deckStances.map(stance=>card(stance+'_'+base,base,stance)))});
GAME_DECKS.push(pairedDeck('shuvits','Shuv Shuffle',['pop_shuvit','frontside_pop_shuvit']));
GAME_DECKS.push({id:'spins',name:'Spin Cycle',description:'',cards:deckStances.flatMap(stance=>(['frontside','backside'] as Direction[]).map(direction=>card(stance+'_'+direction+'_180','ollie',stance,direction)))});
GAME_DECKS.push(pairedDeck('varial-flips','Going Varial',['varial_kickflip','varial_heelflip']));
GAME_DECKS.push(pairedDeck('360-flips','Dr. Tre',['tre_flip','laser_flip']));
GAME_DECKS.push(pairedDeck('hard-inward','Inside Job',['hardflip','inward_heelflip']));
GAME_DECKS.push(pairedDeck('big-flips','Big Flippin’ Deal',['bigflip','bigheel']));
GAME_DECKS.push(pairedDeck('big-spins','Big Spin Theory',['bigspin','bigger_spin']));
GAME_DECKS.push(pairedDeck('double-impossible','Against the Odds',['double_kickflip','impossible']));
for(const stance of deckStances){
 const mixNames:Record<Stance,string>={regular:'Home Turf',fakie:'Reverse Gear',nollie:'Nose First',switch:'Other Side'};
 GAME_DECKS.push({id:stance+'-mix',name:mixNames[stance],description:'',cards:['ollie','pop_shuvit','frontside_pop_shuvit','kickflip','heelflip','varial_kickflip','tre_flip','impossible'].map(base=>card(stance+'_'+base,base,stance))});
}
// Deck-only late tricks: keep BASE_TRICKS and generator pools unchanged.
function lateCard(id:string,stance:Stance='regular',baseId=id):DeckCard {
 const definition=getReservedTrickById(baseId);
 if(!definition || definition.category==='specialty')throw Error('Invalid late deck card '+id);
 const params={stance,direction:'none' as const,baseTrickId:baseId,bodyVarial:'none' as const,landing:'normal' as const,revert:'none' as const};
 const trick:GeneratedTrickResult={mode:'single',singleTrick:params,canonicalName:formatSingleTrickName(params),breakdown:[definition.description],complexity:definition.category==='core_late'?'intermediate':'advanced',catalogVersion:CATALOG_VERSION};
 return {id,name:trick.canonicalName,trick};
}
GAME_DECKS.push({id:'better-late-than-sorry',name:'Better Late Than Sorry',description:'',cards:[
 'late_kickflip','late_heelflip','late_shove_it','late_frontside_shove_it','late_double_kickflip'
].map(id=>lateCard(id)).concat(['late_kickflip','late_heelflip','late_shove_it'].map(base=>lateCard('fakie_'+base,'fakie',base)))});
GAME_DECKS.push({id:'see-you-later-alligator',name:'See You Later, Alligator',description:'',cards:[
 'pop_shove_it_late_kickflip','pop_shove_it_late_heelflip','kickflip_late_shove_it','heelflip_late_shove_it','shove_it_360_late_kickflip','tre_flip_late_kickflip','kickflip_late_impossible','inward_heelflip_late_flip'
].map(id=>lateCard(id))});
// Preserve previously started runs while new games use eight-card decks.
const LEGACY_LATE_ORDER=['late_kickflip_back_finger','late_kickflip_front_finger','late_heelflip','late_shove_it','late_frontside_shove_it','late_double_kickflip'];
const LEGACY_FIVE_LATE_ORDER=['late_kickflip','late_heelflip','late_shove_it','late_frontside_shove_it','late_double_kickflip'];
function expectedDeckOrder(deck:{id:string;cards:DeckCard[]},order:string[]){
 if(deck.id==='better-late-than-sorry'){
  if(order.some(id=>LEGACY_LATE_ORDER.slice(0,2).includes(id)))return LEGACY_LATE_ORDER;
  if(order.length===5)return LEGACY_FIVE_LATE_ORDER;
 }
 if(deck.id==='see-you-later-alligator'){
  if(order.length===9)return [...deck.cards.map(c=>c.id),'hardflip_late_flip'];
  if(order.includes('hardflip_late_flip'))return [...deck.cards.map(c=>c.id).filter(id=>id!=='kickflip_late_impossible'),'hardflip_late_flip'];
 }
 return deck.cards.map(c=>c.id);
}
export function deckCompletion(records:PracticeSession[],deckId:string,mode:DeckMode):'Completed'|'In progress'|'Not yet completed'{
 const runs=allDeckRuns(records).filter(r=>r.game.deckId===deckId&&r.game.mode===mode);
 if(runs.some(r=>r.done&&!r.conflict&&!r.game.endedEarly&&r.dealt===r.total&&(mode==='skate'?r.letters<5:r.landed===r.total)))return 'Completed';
 const resumable=latestDeckResume(records);
 return resumable?.game.deckId===deckId&&resumable.game.mode===mode?'In progress':'Not yet completed';
}
export function shuffleCards(ids:string[],random=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296){const out=[...ids];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
export function validDeckGame(g:unknown):g is DeckGameLink {
 const x=g as DeckGameLink;if(!x||typeof x!=='object')return false;const deck=GAME_DECKS.find(d=>d.id===x.deckId);const expected=deck&&Array.isArray(x.order)?expectedDeckOrder(deck,x.order):[];
 return !!deck&&typeof x.gameId==='string'&&x.gameId.length>0&&x.gameId.length<=160&&['normal','skate','wildcard'].includes(x.mode)&&Array.isArray(x.order)&& (x.mode==='wildcard'?Array.isArray(x.wildcards)&&x.wildcards.length===3&&new Set(x.wildcards.map(w=>w.cardIndex)).size===3&&x.wildcards.every(w=>!!w&&typeof w==='object'&&Number.isInteger(w.cardIndex)&&w.cardIndex>=0&&w.cardIndex<x.order.length&&w&&typeof w==='object'&&WILDCARD_TYPES.includes(w.type)):x.wildcards===undefined)&&Array.isArray(x.order)&&x.order.length===expected.length&&new Set(x.order).size===x.order.length&&x.order.every(id=>expected.includes(id))&&Number.isInteger(x.cardIndex)&&x.cardIndex>=0&&x.cardIndex<x.order.length&&Number.isInteger(x.lettersBefore)&&x.lettersBefore>=0&&x.lettersBefore<=4&&typeof x.endedEarly==='boolean'&&Number.isFinite(Date.parse(x.gameStartedAt));
}
export function cardBudget(g:DeckGameLink){return g.mode==='skate'?(g.lettersBefore===4?2:1):['one_attempt','sudden_death'].includes(currentWildcard(g)??'')?1:5;}
export function newDeckCard(game:DeckGameLink,setup:SetupData,surface:string,now=Date.now()):PracticeSession {
 if(!validDeckGame(game))throw Error('This deck game is invalid.');const cardId=game.order[game.cardIndex];const card=GAME_DECKS.find(d=>d.id===game.deckId)!.cards.find(c=>c.id===cardId) ?? lateCard(cardId);
 return {...startConfiguredSession(createPracticeSession(wildcardTrick(card.trick,currentWildcard(game)),setup,now),setup,{type:'landings',target:cardTarget(game)},{type:'regular'},surface,now),deckGame:structuredClone(game)};
}
export function recordDeckAttempt(s:PracticeSession,landed:boolean,now=Date.now()):PracticeSession {
 if(!validDeckGame(s.deckGame)||s.sessionEndedAt||!s.timerState.isRunning)throw Error('Resume the active card before recording an attempt.');
 if(s.attemptCount>=cardBudget(s.deckGame))throw Error('This card has no attempts left.');
 const attempted=activeDeckTrick(s);const next=recordCounterAction(s,landed?'landing':'attempt',now);
 next.history[0].attemptTrick=attempted.singleTrick;
 return cardPassed(next)||next.attemptCount>=cardBudget(s.deckGame)?closePractice(next,false,next.difficultyRating,next.notes,now):next;
}
export function deckRun(records:PracticeSession[],gameId:string){
 const cards=records.filter(s=>validDeckGame(s.deckGame)&&s.deckGame!.gameId===gameId).sort((a,b)=>a.deckGame!.cardIndex-b.deckGame!.cardIndex);
 if(!cards.length)return null;
 // Duplicate card indices indicate conflicting/imported history; never invent a resumable progression.
 const first=cards[0].deckGame!;
 const conflict=cards.some((s,i)=>s.deckGame!.cardIndex!==i||s.deckGame!.deckId!==first.deckId||s.deckGame!.mode!==first.mode||s.deckGame!.gameStartedAt!==first.gameStartedAt||JSON.stringify(s.deckGame!.order)!==JSON.stringify(first.order)||JSON.stringify(s.deckGame!.wildcards)!==JSON.stringify(first.wildcards));
 const latest=cards.at(-1)!,g=latest.deckGame!,landed=cards.filter(s=>s.sessionEndedAt&&cardPassed(s)).length,failed=cards.filter(s=>s.sessionEndedAt&&!cardPassed(s)).length;
 const letters=g.mode==='skate'?Math.min(5,cards.filter(s=>s.sessionEndedAt&&!cardPassed(s)&&s.attemptCount>=cardBudget(s.deckGame!)).length):0;
 const suddenDeath=cards.some(s=>s.sessionEndedAt&&currentWildcard(s.deckGame!)==='sudden_death'&&!cardPassed(s));
 const done=conflict||g.endedEarly||suddenDeath||letters>=5||(!!latest.sessionEndedAt&&g.cardIndex===g.order.length-1);
 return {cards,latest,game:g,conflict,suddenDeath,landed,failed,letters,done,dealt:cards.length,total:g.order.length,attempts:cards.reduce((n,s)=>n+s.attemptCount,0),time:cards.reduce((n,s)=>n+s.activeDurationMs,0)};
}
export function allDeckRuns(records:PracticeSession[]){return [...new Set(records.filter(s=>validDeckGame(s.deckGame)).map(s=>s.deckGame!.gameId))].map(id=>deckRun(records,id)!).sort((a,b)=>b.game.gameStartedAt.localeCompare(a.game.gameStartedAt));}

// Only the newest started game owns the resume slot, even after it finishes.
export function latestDeckResume(records:PracticeSession[]){
 const newest=allDeckRuns(records)[0];
 return newest&&!newest.done?newest:null;
}

function wildcardTrick(base:GeneratedTrickResult,type?:WildcardType,opposite=false):GeneratedTrickResult{
 const p=base.singleTrick!;
 const stance:Record<Stance,Stance>={regular:'switch',switch:'regular',fakie:'nollie',nollie:'fakie'};
 const params={...p,stance:opposite?stance[p.stance]:p.stance};
 const reserved=getReservedTrickById(params.baseTrickId);
 if(!reserved)params.movements=resolveUnderlyingMovements(params);
 const extra=type==='revert'?'Revert':type==='body_varial'?'Body Varial / Sex Change':null;
 // These are post-landing add-ons, not forbidden intrinsic modifiers (e.g. tre-flip sex changes).
 const name=formatSingleTrickName(params);
 return {...base,singleTrick:params,movements:params.movements,canonicalName:extra?`${name} + ${extra}`:name,breakdown:[...(reserved?[reserved.description]:generateBreakdown(params,getBaseTrickById(params.baseTrickId)!)),...(extra?[`Land ${name}, then add a ${extra.toLowerCase()} in either direction. Only record a landing when both parts are clean.`]:[])]};
}
export function activeDeckTrick(s:PracticeSession):GeneratedTrickResult{
 return currentWildcard(s.deckGame!)==='opposite_stance'&&s.landingCount>=1?wildcardTrick(s.trickResult,undefined,true):s.trickResult;
}

// Finish only unfinished cards left behind by the old five-try Sudden Death rule.
// Preserve counters and attempt logs; never rewrite completed historical results.
export function finishLegacySuddenDeath(s:PracticeSession,now=Date.now()):PracticeSession {
 if(!s.deckGame||currentWildcard(s.deckGame)!=='sudden_death'||s.sessionEndedAt||s.attemptCount<1)return s;
 return closePractice(s,false,s.difficultyRating,s.notes,now);
}

// Compute the picker badges once per history change, rather than once per badge/dialog render.
export function deckPickerSummary(records:PracticeSession[]){
 const runs=allDeckRuns(records),newest=runs[0],resumable=newest&&!newest.done?newest:null;
 const statuses:Record<string,Record<DeckMode,ReturnType<typeof deckCompletion>>>={};
 for(const deck of GAME_DECKS){
  statuses[deck.id]={normal:'Not yet completed',skate:'Not yet completed',wildcard:'Not yet completed'};
 }
 if(resumable)statuses[resumable.game.deckId][resumable.game.mode]='In progress';
 for(const run of runs){
  if(run.done&&!run.conflict&&!run.game.endedEarly&&run.dealt===run.total&&(run.game.mode==='skate'?run.letters<5:run.landed===run.total))statuses[run.game.deckId][run.game.mode]='Completed';
 }
 return {runs,resumable,statuses};
}
export function freshDeckGame(deckId:string,mode:DeckMode):DeckGameLink{
 const deck=GAME_DECKS.find(d=>d.id===deckId);
 if(!deck)throw Error('This deck is unavailable.');
 return {gameId:'deck_'+crypto.randomUUID(),deckId,mode,order:shuffleCards(deck.cards.map(c=>c.id)),cardIndex:0,lettersBefore:0,gameStartedAt:new Date().toISOString(),endedEarly:false,...(mode==='wildcard'?{wildcards:assignWildcards(deck.cards.length)}:{})};
}
