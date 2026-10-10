import {describe,it,expect} from 'vitest';
import {GAME_DECKS,freshDeckGame,newDeckCard,recordDeckAttempt,deckRun,activeDeckTrick,WILDCARD_TYPES,DeckMode,validDeckGame} from '../domain/deckGame';
import {getBaseTrickById,getReservedTrickById} from '../domain/catalog';
import {enumerateSingleOptions} from '../domain/challengeGeneration';
import {baseChallengePool,selectPoolChallenge} from '../domain/selectedChallengePool';
import {getChallengeComplexity} from '../domain/complexity';
const setup={id:'late-board',name:'Late Board',deckWidthMm:34,wheelMaterial:'urethane' as const};
const decks=GAME_DECKS.filter(d=>['better-late-than-sorry','see-you-later-alligator'].includes(d.id));
describe('late trick decks',()=>{
 it('adds fixed decks with eight standalone and eight combination cards',()=>{
  expect(GAME_DECKS).toHaveLength(18);
  expect(decks.map(d=>[d.name,d.cards.length])).toEqual([['Better Late Than Sorry',8],['See You Later, Alligator',8]]);
  for(const deck of decks)for(const card of deck.cards){
   const params=card.trick.singleTrick!,definition=getReservedTrickById(params.baseTrickId)!;
   expect(card.name).toBe((params.stance==='fakie'?'Fakie ':'')+definition.name);
   expect(card.trick.breakdown).toEqual([definition.description]);
   expect(getChallengeComplexity(card.trick)).not.toBe('beginner');
   expect(getBaseTrickById(card.id)).toBeUndefined();
   expect(selectPoolChallenge([card.trick],'single','all')).toHaveProperty('error');
  }
  const ids=new Set(decks.flatMap(d=>d.cards.map(c=>c.id)));
  expect(enumerateSingleOptions({},{}).every(p=>!ids.has(p.baseTrickId))).toBe(true);
  expect(baseChallengePool().every(t=>!ids.has(t.singleTrick!.baseTrickId))).toBe(true);
 });
 it('completes and records every card without replacing late trick names',()=>{
  for(const deck of decks)for(const mode of ['normal','skate','wildcard'] as DeckMode[]){
   const game=freshDeckGame(deck.id,mode);
   const sessions=game.order.map((id,i)=>{
    let session=newDeckCard({...game,cardIndex:i, ...(mode==='wildcard'?{wildcards:[{cardIndex:0,type:'double' as const},{cardIndex:1,type:'triple' as const},{cardIndex:2,type:'one_attempt' as const}]}:{})},setup,'Marble',1000+i*10000);
    expect(session.trickResult.canonicalName).toBe(deck.cards.find(c=>c.id===id)!.name);
    while(!session.sessionEndedAt)session=recordDeckAttempt(session,true,2000+i*10000+session.attemptCount*1000);
    return session;
   });
   const run=deckRun(sessions,game.gameId)!;
   expect(run.done).toBe(true);expect(run.landed).toBe(deck.cards.length);
   expect(sessions.every(s=>s.setupSnapshot.id===setup.id&&s.status==='success')).toBe(true);
  }
 });
 it('supports all jokers, including correctly named opposite stance landings',()=>{
  for(const type of WILDCARD_TYPES){
   const game=freshDeckGame(decks[0].id,'wildcard');game.wildcards=[{cardIndex:0,type},{cardIndex:1,type:'double'},{cardIndex:2,type:'triple'}];
   let session=newDeckCard(game,setup,'Marble',1000);
   session=recordDeckAttempt(session,true,2000);
   if(type==='opposite_stance'){
    const p=session.trickResult.singleTrick!;const opposite=p.stance==='fakie'?'Nollie':'Switch';
    expect(activeDeckTrick(session).canonicalName).toBe(opposite+' '+getReservedTrickById(p.baseTrickId)!.name);
    session=recordDeckAttempt(session,true,3000);
    expect(session.history[0].attemptTrick?.stance).toBe(p.stance==='fakie'?'nollie':'switch');
   }
   if(type==='sudden_death')expect(recordDeckAttempt(newDeckCard(game,setup,'Marble',1000),false,2000).status).toBe('failed');
  }
 });
});

it('preserves old six-card runs while merging new late kickflip draws',()=>{
 const order=['late_kickflip_back_finger','late_kickflip_front_finger','late_heelflip','late_shove_it','late_frontside_shove_it','late_double_kickflip'];
 const game={...freshDeckGame('better-late-than-sorry','normal'),order};
 expect(validDeckGame(game)).toBe(true);
 expect(newDeckCard(game,setup,'Marble',1000).trickResult.canonicalName).toBe('Late Kickflip');
 expect(newDeckCard({...game,cardIndex:1},setup,'Marble',2000).trickResult.canonicalName).toBe('Late Kickflip');
 expect(validDeckGame({...game,order:['late_kickflip',...order.slice(1)]})).toBe(false);
 expect(freshDeckGame(game.deckId,'normal').order).toHaveLength(8);
});

it('includes three fakie cards and preserves earlier five/nine card runs',()=>{
 expect(decks[0].cards.filter(c=>c.trick.singleTrick!.stance==='fakie').map(c=>c.name)).toEqual(['Fakie Late Kickflip','Fakie Late Heelflip','Fakie Late Shuvit']);
 const short={...freshDeckGame(decks[0].id,'normal'),order:['late_kickflip','late_heelflip','late_shove_it','late_frontside_shove_it','late_double_kickflip']};
 expect(validDeckGame(short)).toBe(true);
 const long={...freshDeckGame(decks[1].id,'normal'),order:[...decks[1].cards.map(c=>c.id),'hardflip_late_flip'],cardIndex:8};
 expect(validDeckGame(long)).toBe(true);
 expect(newDeckCard(long,setup,'Marble',1000).trickResult.canonicalName).toBe('Hardflip Late Flip');
 expect(decks[1].cards.some(c=>c.id==='hardflip_late_flip')).toBe(false);
 expect(decks[1].cards.some(c=>c.id==='kickflip_late_impossible')).toBe(true);
});
