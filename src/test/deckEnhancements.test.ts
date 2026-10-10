import {describe,it,expect} from 'vitest';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {BASE_TRICKS} from '../domain/catalog';
import {referenceChallenge} from '../domain/referenceChallenge';
import {referenceStanceIds,parseReferenceId} from '../domain/referenceVariations';
import {hasLandedReference} from '../domain/referenceProgress';
import {createPracticeSession} from '../domain/practiceActions';
import {validateTrickParameters} from '../domain/rules';
import {GAME_DECKS,freshDeckGame,validDeckGame,newDeckCard} from '../domain/deckGame';
import {DECK_MUSIC_TRACKS,shuffledMusicQueue} from '../components/games/deckMusic';
import {currentDeckMusic,nextDeckMusic} from '../components/games/deckSounds';
import {deckBackDesign} from '../components/games/deckBackDesigns';
import {CardBack} from '../components/games/PlayingCards';
const setup={id:'guide-board',name:'Board',deckWidthMm:34,wheelMaterial:'urethane' as const};
describe('stance guide practice',()=>{
 it('opens exact fakie, nollie and switch challenges for every supported base trick',()=>{
  for(const base of BASE_TRICKS)for(const id of referenceStanceIds(base.id)){
   const parsed=parseReferenceId(id),result=referenceChallenge(id);
   expect(result.singleTrick!.stance).toBe(parsed.stance);
   expect(result.singleTrick!.baseTrickId).toBe(base.id);
   expect(validateTrickParameters(result.singleTrick!).isValid).toBe(true);
  }
  expect(referenceChallenge('nollie:ollie').canonicalName).toBe('Nollie');
  expect(referenceChallenge('fakie:pop-shuvit').canonicalName).toBe('Fakie Pop Shuvit');
  expect(referenceStanceIds('50-50')).toEqual([]);
 });
 it('keeps landed markers specific to stance',()=>{
  const session={...createPracticeSession(referenceChallenge('switch:kickflip'),setup),landingCount:1};
  expect(hasLandedReference('switch:kickflip',[session])).toBe(true);
  expect(hasLandedReference('kickflip',[session])).toBe(false);
  expect(hasLandedReference('nollie:kickflip',[session])).toBe(false);
 });
});
describe('deck music shuffle',()=>{
 it('has ten distinct musical arrangements and visits all other tracks before repeating',()=>{
  expect(DECK_MUSIC_TRACKS).toHaveLength(10);
  expect(new Set(DECK_MUSIC_TRACKS.map(t=>t.instrument)).size).toBe(10);
  expect(Math.max(...DECK_MUSIC_TRACKS.map(t=>t.bpm))-Math.min(...DECK_MUSIC_TRACKS.map(t=>t.bpm))).toBeGreaterThanOrEqual(70);
  expect(new Set(DECK_MUSIC_TRACKS.map(t=>JSON.stringify([t.kicks,t.snares,t.hats,t.bassBeats,t.chordBeats]))).size).toBe(10);
  expect(new Set(DECK_MUSIC_TRACKS.map(t=>t.name)).size).toBe(10);
  expect(new Set(DECK_MUSIC_TRACKS.map(t=>JSON.stringify([t.bpm,t.root,t.melody,t.kicks]))).size).toBe(10);
  for(let current=0;current<10;current++){
   const queue=shuffledMusicQueue(current,()=>.5);
   expect(queue).toHaveLength(9);expect(new Set(queue).size).toBe(9);expect(queue).not.toContain(current);
  }
  const first=currentDeckMusic().name,seen=new Set([first]);
  for(let i=0;i<9;i++)seen.add(nextDeckMusic().name);
  expect(seen.size).toBe(10);
  const previous=currentDeckMusic().name;expect(nextDeckMusic().name).not.toBe(previous);
 });
});
it('renders a unique card back for every deck without leaking the trick pool',()=>{
 const backs=GAME_DECKS.map(deck=>renderToStaticMarkup(React.createElement(CardBack,{deckId:deck.id})));
 expect(new Set(backs).size).toBe(GAME_DECKS.length);
 for(const deck of GAME_DECKS){expect(deckBackDesign(deck.id).color).toMatch(/^#[0-9a-f]{6}$/i);}
});
it('swaps hardflip for kickflip late impossible and can still resume previous orders',()=>{
 const deck=GAME_DECKS.find(d=>d.id==='see-you-later-alligator')!;
 expect(deck.cards).toHaveLength(8);
 expect(deck.cards.some(c=>c.id==='kickflip_late_impossible')).toBe(true);
 expect(deck.cards.some(c=>c.id==='hardflip_late_flip')).toBe(false);
 const order=deck.cards.map(c=>c.id==='kickflip_late_impossible'?'hardflip_late_flip':c.id);
 const old={...freshDeckGame(deck.id,'normal'),order,cardIndex:order.indexOf('hardflip_late_flip')};
 expect(validDeckGame(old)).toBe(true);
 expect(newDeckCard(old,setup,'Marble',1000).trickResult.canonicalName).toBe('Hardflip Late Flip');
});
