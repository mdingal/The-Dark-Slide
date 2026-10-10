import {it,expect} from 'vitest';
import {GAME_DECKS,DeckGameLink,newDeckCard,recordDeckAttempt,deckRun,cardBudget,shuffleCards,validDeckGame,deckCompletion,latestDeckResume,finishLegacySuddenDeath,deckPickerSummary,freshDeckGame} from '../domain/deckGame';
import {validateTrickParameters} from '../domain/rules';
import {pauseTimer} from '../domain/timer';
const setup={id:'board',name:'Board',deckWidthMm:34,wheelMaterial:'urethane' as const};
const game=(mode:'normal'|'skate'='normal'):DeckGameLink=>({gameId:'game',deckId:'fundamentals',mode,order:GAME_DECKS[0].cards.map(c=>c.id),cardIndex:0,lettersBefore:0,gameStartedAt:new Date(1000).toISOString(),endedEarly:false});
it('keeps the original sixteen decks with valid trick variations',()=>{
 expect(GAME_DECKS.slice(0,16).map(d=>d.cards.length)).toEqual(Array(16).fill(8));
 for(const d of GAME_DECKS.slice(0,16))for(const c of d.cards)expect(validateTrickParameters(c.trick.singleTrick!).isValid,c.name).toBe(true);
 expect(GAME_DECKS[0].cards.map(c=>c.name)).toEqual(['Ollie','BS 180','FS 180','Fakie Ollie','Pop Shuvit','Fakie Pop Shuvit','Half Cab','Fakie FS 180']);
 expect(GAME_DECKS[1].cards[5].trick.singleTrick?.stance).toBe('fakie');
});
it('shuffles without mutating, omitting, or duplicating fixed cards',()=>{
 const order=game().order,shuffled=shuffleCards(order,()=>0);
 expect(shuffled).not.toEqual(order);expect([...shuffled].sort()).toEqual([...order].sort());expect(new Set(shuffled).size).toBe(8);
 expect(validDeckGame({...game(),order:[...order.slice(1),order[1]]})).toBe(false);
});
it('normal mode allows five misses and closes immediately on one landing',()=>{
 let s=newDeckCard(game(),setup,'Marble',1000);
 for(let i=0;i<4;i++){s=recordDeckAttempt(s,false,2000+i*1000);expect(s.sessionEndedAt).toBeUndefined();}
 s=recordDeckAttempt(s,false,7000);expect(s.status).toBe('failed');expect(s.attemptCount).toBe(5);expect(()=>recordDeckAttempt(s,true,8000)).toThrow();
 const landed=recordDeckAttempt(newDeckCard(game(),setup,'Marble',1000),true,3000);
 expect(landed.status).toBe('success');expect(landed.firstLandingAttemptNumber).toBe(1);expect(landed.firstLandingElapsedMs).toBe(2000);
});
it('SKATE gives a letter per missed card and two attempts before E',()=>{
 const records=[];
 for(let i=0;i<4;i++){const s=recordDeckAttempt(newDeckCard({...game('skate'),cardIndex:i,lettersBefore:i},setup,'Marble',1000+i*10000),false,2000+i*10000);records.push(s);}
 expect(deckRun(records,'game')?.letters).toBe(4);expect(deckRun(records,'game')?.done).toBe(false);
 let last=newDeckCard({...game('skate'),cardIndex:4,lettersBefore:4},setup,'Marble',50000);
 expect(cardBudget(last.deckGame!)).toBe(2);last=recordDeckAttempt(last,false,51000);expect(last.sessionEndedAt).toBeUndefined();
 const landed=recordDeckAttempt(last,true,52000);expect(deckRun([...records,landed],'game')?.letters).toBe(4);
 last=recordDeckAttempt(last,false,52000);const run=deckRun([...records,last],'game')!;
 expect(run.letters).toBe(5);expect(run.done).toBe(true);expect(run.total-run.dealt).toBe(3);
});
it('finishes a deck when all cards are played and flags missing or conflicting records',()=>{
 const records=game().order.map((_,i)=>recordDeckAttempt(newDeckCard({...game(),cardIndex:i},setup,'Metal',1000+i*10000),true,2000+i*10000));
 expect(deckRun(records,'game')?.landed).toBe(8);expect(deckRun(records,'game')?.done).toBe(true);
 expect(deckRun(records.slice(1),'game')?.conflict).toBe(true);expect(deckRun([records[0],records[0]],'game')?.conflict).toBe(true);
});
it('paused games cannot accept attempts and preserve cloud-resumable order',()=>{
 const s=newDeckCard(game(),setup,'Marble',1000),paused={...s,timerState:pauseTimer(s.timerState,2000)};
 expect(()=>recordDeckAttempt(paused,true,3000)).toThrow();expect(deckRun([paused],'game')?.game.order).toEqual(game().order);expect(deckRun([paused],'game')?.done).toBe(false);
});

it('only awards completion for a cleared deck and keeps modes separate',()=>{
 const records=game().order.map((_,i)=>recordDeckAttempt(newDeckCard({...game(),cardIndex:i},setup,'Metal',1000+i*10000),true,2000+i*10000));
 expect(deckCompletion(records,'fundamentals','normal')).toBe('Completed');
 expect(deckCompletion(records,'fundamentals','skate')).toBe('Not yet completed');
 expect(deckCompletion(records.slice(0,1),'fundamentals','normal')).toBe('In progress');
 expect(deckCompletion(records.map(s=>({...s,deckGame:{...s.deckGame!,endedEarly:true}})),'fundamentals','normal')).toBe('Not yet completed');
 const missed={...records[7],landingCount:0,attemptCount:5};
 expect(deckCompletion([...records.slice(0,7),missed],'fundamentals','normal')).toBe('Not yet completed');
 const skate=records.map(s=>({...s,deckGame:{...s.deckGame!,mode:'skate' as const}}));
 expect(deckCompletion(skate,'fundamentals','skate')).toBe('Completed');
});

it('all decks have valid unique cloud-resumable orders',()=>{
 expect(GAME_DECKS.slice(4,8).map(d=>d.name)).toEqual(['Shuv Shuffle','Spin Cycle','Going Varial','Dr. Tre']);
 for(const d of GAME_DECKS){
  const g={...game(),deckId:d.id,order:d.cards.map(c=>c.id)};
  expect(validDeckGame(g)).toBe(true);
  expect(new Set(d.cards.map(c=>c.name)).size).toBe(d.cards.length);
  expect(newDeckCard(g,setup,'Marble',1000).deckGame?.deckId).toBe(d.id);
 }
});

it('keeps only the newest game resumable across decks and modes',()=>{
 const old=newDeckCard(game(),setup,'wood',1000);
 const nextGame={...game('skate'),gameId:'new',deckId:'basic-flips',order:GAME_DECKS[1].cards.map(c=>c.id),gameStartedAt:new Date(2000).toISOString()};
 const next=newDeckCard(nextGame,setup,'wood',2000);
 expect(latestDeckResume([old,next])?.game.gameId).toBe('new');
 expect(deckCompletion([old,next],'fundamentals','normal')).toBe('Not yet completed');
 expect(deckCompletion([old,next],'basic-flips','skate')).toBe('In progress');
 expect(old.attemptCount).toBe(0);
 const finished={...next,deckGame:{...nextGame,endedEarly:true}};
 expect(latestDeckResume([old,finished])).toBeNull();
 expect(latestDeckResume([])).toBeNull();
});

import {WildcardType,assignWildcards,activeDeckTrick,cardTarget,currentWildcard} from '../domain/deckGame';
const wildcardGame=(type:WildcardType,index=0):DeckGameLink=>({...game(),mode:'wildcard',wildcards:[{cardIndex:index,type},{cardIndex:(index+1)%8,type:'double'},{cardIndex:(index+2)%8,type:'revert'}],cardIndex:index});
it('assigns exactly three distinct joker positions and preserves them when resumed',()=>{
 const wildcards=assignWildcards(8,()=>.42);expect(wildcards).toHaveLength(3);expect(new Set(wildcards.map(w=>w.cardIndex)).size).toBe(3);expect(new Set(wildcards.map(w=>w.type)).size).toBe(3);
 const g={...game(),mode:'wildcard' as const,wildcards};expect(validDeckGame(g)).toBe(true);expect(newDeckCard(g,setup,'Marble',1000).deckGame?.wildcards).toEqual(wildcards);
 expect(validDeckGame({...g,wildcards:wildcards.slice(1)})).toBe(false);expect(validDeckGame({...g,wildcards:[wildcards[0],wildcards[0],wildcards[2]]})).toBe(false);
 expect(validDeckGame({...game(),wildcards})).toBe(false);
});
it('double and triple landings share five total attempts and partial success is a failed card',()=>{
 for(const type of ['double','triple'] as const){let s=newDeckCard(wildcardGame(type),setup,'Marble',1000);const target=type==='double'?2:3;
  expect(s.goal?.target).toBe(target);s=recordDeckAttempt(s,true,2000);expect(s.sessionEndedAt).toBeUndefined();for(let i=1;i<target;i++)s=recordDeckAttempt(s,true,3000+i*1000);expect(s.status).toBe('success');expect(s.attemptCount).toBe(target);
  let failed=newDeckCard(wildcardGame(type),setup,'Marble',1000);failed=recordDeckAttempt(failed,true,2000);for(let i=0;i<4;i++)failed=recordDeckAttempt(failed,false,3000+i*1000);expect(failed.status).toBe('failed');expect(deckRun([failed],'game')?.landed).toBe(0);expect(deckRun([failed],'game')?.failed).toBe(1);
 }
});
it('one-attempt joker ends after the first miss or landing',()=>{
 const g=wildcardGame('one_attempt');expect(cardBudget(g)).toBe(1);expect(recordDeckAttempt(newDeckCard(g,setup,'Marble',1000),false,2000).status).toBe('failed');expect(recordDeckAttempt(newDeckCard(g,setup,'Marble',1000),true,2000).status).toBe('success');
});
it('sudden death allows one attempt and immediately ends the game on a miss',()=>{
 const g=wildcardGame('sudden_death');expect(cardBudget(g)).toBe(1);
 const s=recordDeckAttempt(newDeckCard(g,setup,'Marble',1000),false,2000);
 const run=deckRun([s],'game')!;expect(s.attemptCount).toBe(1);expect(s.status).toBe('failed');expect(run.done).toBe(true);expect(run.suddenDeath).toBe(true);expect(run.dealt).toBe(1);expect(latestDeckResume([s])).toBeNull();expect(deckCompletion([s],'fundamentals','wildcard')).not.toBe('Completed');
 expect(()=>recordDeckAttempt(s,true,3000)).toThrow();
 const passed=recordDeckAttempt(newDeckCard(g,setup,'Marble',1000),true,2000);expect(passed.status).toBe('success');expect(deckRun([passed],'game')?.done).toBe(false);
});
it('opposite stance switches only after the first landing and records each attempted stance',()=>{
 for(const [deckId,stance,opposite] of [['regular-mix','regular','switch'],['switch-mix','switch','regular'],['fakie-mix','fakie','nollie'],['nollie-mix','nollie','fakie']]){
  const d=GAME_DECKS.find(d=>d.id===deckId)!;const g={...wildcardGame('opposite_stance'),deckId,order:d.cards.map(c=>c.id)};let s=newDeckCard(g,setup,'Marble',1000);
  expect(activeDeckTrick(s).singleTrick?.stance).toBe(stance);s=recordDeckAttempt(s,false,2000);expect(activeDeckTrick(s).singleTrick?.stance).toBe(stance);
  s=recordDeckAttempt(s,true,3000);expect(s.sessionEndedAt).toBeUndefined();expect(activeDeckTrick(s).singleTrick?.stance).toBe(opposite);
  s=recordDeckAttempt(s,true,4000);expect(s.status).toBe('success');expect(s.history[0].attemptTrick?.stance).toBe(opposite);expect(s.history[1].attemptTrick?.stance).toBe(stance);
 }
});
it('revert and body varial jokers produce valid generator parameters across original decks',()=>{
 for(const d of GAME_DECKS.slice(0,16))for(let i=0;i<8;i++)for(const type of ['revert','body_varial','opposite_stance'] as const){const g={...wildcardGame(type,i),deckId:d.id,order:d.cards.map(c=>c.id)};const s=newDeckCard(g,setup,'Marble',1000);expect(validateTrickParameters(s.trickResult.singleTrick!).isValid,s.trickResult.canonicalName).toBe(true);
  if(type==='revert')expect(s.trickResult.canonicalName).toContain('+ Revert');if(type==='body_varial')expect(s.trickResult.canonicalName).toContain('+ Body Varial / Sex Change');if(type==='opposite_stance')expect(validateTrickParameters(activeDeckTrick(recordDeckAttempt(s,true,2000)).singleTrick!).isValid).toBe(true);
 }
});
it('wildcard completion is separate from Normal and SKATE and detects changed joker schedules',()=>{
 const g=wildcardGame('double');const records=g.order.map((_,i)=>{let s=newDeckCard({...g,cardIndex:i},setup,'Marble',1000+i*10000);for(let n=0;n<cardTarget(s.deckGame!);n++)s=recordDeckAttempt(s,true,2000+i*10000+n*1000);return s;});
 expect(deckCompletion(records,'fundamentals','wildcard')).toBe('Completed');expect(deckCompletion(records,'fundamentals','normal')).toBe('Not yet completed');
 const changed={...records[1],deckGame:{...records[1].deckGame!,wildcards:assignWildcards(8,()=>0)}};expect(deckRun([records[0],changed],'game')?.conflict).toBe(true);
 expect(currentWildcard({...g,cardIndex:7})).toBeUndefined();expect(cardBudget({...g,cardIndex:7})).toBe(5);
});


it('places three jokers anywhere in the shuffled draw without fixed first or last slots',()=>{
 const placements=new Set<string>();let early=false,late=false;
 for(const random of [()=>0,()=>.25,()=>.5,()=>.75,()=>.999]){
  const wildcards=assignWildcards(8,random);expect(wildcards).toHaveLength(3);expect(new Set(wildcards.map(w=>w.cardIndex)).size).toBe(3);expect(wildcards.every(w=>w.cardIndex>=0&&w.cardIndex<8)).toBe(true);
  placements.add(wildcards.map(w=>w.cardIndex).sort().join(','));early ||= wildcards.some(w=>w.cardIndex<3);late ||= wildcards.some(w=>w.cardIndex>=3);
  expect(validDeckGame({...game(),mode:'wildcard',wildcards})).toBe(true);
 }
 expect(early).toBe(true);expect(late).toBe(true);expect(placements.size).toBeGreaterThan(1);expect(()=>assignWildcards(2)).toThrow('at least three');
});

it('closes a legacy unfinished sudden death card without erasing recorded attempts',()=>{
 const old={...newDeckCard(wildcardGame('sudden_death'),setup,'Marble',1000),attemptCount:2,landingCount:0};
 const fixed=finishLegacySuddenDeath(old,4000);
 expect(fixed.status).toBe('failed');expect(fixed.attemptCount).toBe(2);expect(fixed.history).toEqual(old.history);expect(deckRun([fixed],'game')?.done).toBe(true);
 expect(finishLegacySuddenDeath(fixed,5000)).toBe(fixed);
 expect(finishLegacySuddenDeath(newDeckCard(wildcardGame('sudden_death'),setup,'Marble',1000))).toHaveProperty('attemptCount',0);
});

it('cached picker summary preserves completion and the single resume slot',()=>{
 const complete=game();
 const records=complete.order.map((_,cardIndex)=>recordDeckAttempt(newDeckCard({...complete,cardIndex},setup,'Marble',1000+cardIndex*1000),true,1500+cardIndex*1000));
 records.push(newDeckCard({...game('skate'),gameId:'new',gameStartedAt:new Date(20000).toISOString()},setup,'Marble',20000));
 const picker=deckPickerSummary(records);
 expect(picker.resumable?.game.gameId).toBe(latestDeckResume(records)?.game.gameId);
 for(const deck of GAME_DECKS)for(const mode of ['normal','skate','wildcard'] as const)expect(picker.statuses[deck.id][mode]).toBe(deckCompletion(records,deck.id,mode));
});
it('re-running creates a separate game without changing finished results',()=>{
 const original=game();
 const records=original.order.map((_,cardIndex)=>recordDeckAttempt(newDeckCard({...original,cardIndex},setup,'Marble',1000+cardIndex*1000),true,1500+cardIndex*1000));
 const before=JSON.stringify(records),replay=freshDeckGame(original.deckId,'wildcard');
 expect(validDeckGame(replay)).toBe(true);expect(replay.gameId).not.toBe(original.gameId);expect(replay.cardIndex).toBe(0);expect(replay.lettersBefore).toBe(0);expect(replay.wildcards).toHaveLength(3);
 const next=newDeckCard(replay,setup,'Marble',20000);
 const combined=[...records,next];
 expect(JSON.stringify(records)).toBe(before);expect(deckRun(combined,original.gameId)?.landed).toBe(8);expect(deckRun(combined,replay.gameId)?.attempts).toBe(0);expect(next.id).not.toBe(records[0].id);
});
