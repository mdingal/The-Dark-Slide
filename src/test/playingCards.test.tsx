import React from 'react';
import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {CardStack,DrawnTrickCard} from '../components/games/PlayingCards';
describe('hidden practice deck cards',()=>{
 it('shows the drawn challenge immediately without a loading placeholder',()=>{
  const html=renderToStaticMarkup(<DrawnTrickCard name="Fakie Tre Flip" number={2} total={8} status="live" onReveal={()=>{}}/>);
  expect(html).toContain('Fakie Tre Flip');
  expect(html).not.toContain('Drawing');
  expect(html).not.toContain('DRAWING CARD');
  expect(html).toContain('LAND IT ONCE');
  expect(html).not.toContain('aria-busy="true"');
 });
 it('shows only a face-down pile and count, including an empty pile',()=>{
  expect(renderToStaticMarkup(<CardStack count={7}/>)).toContain('Draw pile: 7 cards, face down');
  const empty=renderToStaticMarkup(<CardStack count={0}/>);
  expect(empty).toContain('EMPTY');
  expect(empty).not.toContain('playing-card-monogram');
 });
});


it('wildcard faces show their joker symbol and rule without exposing other cards',()=>{
 const html=renderToStaticMarkup(<DrawnTrickCard name="Kickflip" number={2} total={8} status="live" wildcard="triple" targetLabel="Land it three times" onReveal={()=>{}}/>);
 expect(html).toContain('playing-wildcard-face');expect(html).toContain('aria-label="Joker"');expect(html).toContain('Land it three times');expect(html).not.toContain('LAND IT ONCE');
});

it('each joker has its own named face and emblem',()=>{
 const types=['revert','body_varial','double','triple','one_attempt','opposite_stance','sudden_death'] as const;
 const faces=types.map(wildcard=>renderToStaticMarkup(<DrawnTrickCard name="Kickflip" number={1} total={8} status="live" wildcard={wildcard} onReveal={()=>{}}/>));
 expect(new Set(faces).size).toBe(7);
 faces.forEach((html,i)=>{expect(html).toContain(`playing-wildcard-${types[i]}`);expect(html).toContain('playing-wildcard-symbol');expect(html).toContain('aria-label="Joker"');});
});

it('keeps the body-varial requirement in help text without crowding the card title',()=>{
 const html=renderToStaticMarkup(<DrawnTrickCard name="Fakie Tre Flip + Body Varial / Sex Change" number={4} total={8} status="live" wildcard="body_varial" targetLabel="Add a body varial / sex change after landing" onReveal={()=>{}}/>);
 expect(html).toContain('<h2>Fakie Tre Flip</h2>');expect(html).not.toContain('+ Body Varial / Sex Change');expect(html).toContain('Add a body varial / sex change after landing');
});

it('keeps the revert requirement in help text without adding it to the card title',()=>{
 const html=renderToStaticMarkup(<DrawnTrickCard name="Fakie Kickflip + Revert" number={4} total={8} status="live" wildcard="revert" targetLabel="Add a revert after landing" onReveal={()=>{}}/>);
 expect(html).toContain('<h2>Fakie Kickflip</h2>');expect(html).not.toContain('+ Revert');expect(html).toContain('Add a revert after landing');
 const regular=renderToStaticMarkup(<DrawnTrickCard name="Kickflip + Revert" number={1} total={8} status="live" onReveal={()=>{}}/>);
 expect(regular).toContain('<h2>Kickflip + Revert</h2>');
});
