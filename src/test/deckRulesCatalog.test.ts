import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {GAME_DECKS} from '../domain/deckGame';
it('keeps the Firestore deck allowlist synchronized with every playable deck',()=>{
 const rules=readFileSync('firestore.rules','utf8');
 const map=rules.match(/let decks = (\{[\s\S]*?\n\});/)![1];
 const decks=JSON.parse(map);
 expect(Object.keys(decks).sort()).toEqual(GAME_DECKS.map(d=>d.id).sort());
 for(const deck of GAME_DECKS)expect(decks[deck.id]).toEqual(deck.cards.map(c=>c.id));
});
