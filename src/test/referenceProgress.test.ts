import { expect, it } from 'vitest';
import { hasLandedReference } from '../domain/referenceProgress';
import { referenceChallenge } from '../domain/referenceChallenge';
import { createPracticeSession } from '../domain/practiceActions';
import { SetupData, TrickLibraryEntry } from '../domain/types';
const setup={deckWidthMm:34,wheelMaterial:'urethane'} as SetupData;
it('marks a recorded landing, but not a failed session with no landings',()=>{
 const s=createPracticeSession(referenceChallenge('kickflip'),setup);
 expect(hasLandedReference('kickflip',[s])).toBe(false);
 expect(hasLandedReference('kickflip',[{...s,landingCount:1}])).toBe(true);
 expect(hasLandedReference('ollie',[{...s,landingCount:1}])).toBe(false);
});
it('does not infer the regular trick from a switch landing',()=>{
 const s=createPracticeSession(referenceChallenge('kickflip'),setup);s.trickResult.singleTrick!.stance='switch';s.landingCount=1;
 expect(hasLandedReference('kickflip',[s])).toBe(false);
});
it('recognizes landed and consistent library statuses',()=>{
 const entry={trickResult:referenceChallenge('heelflip'),status:'landed'} as TrickLibraryEntry;
 expect(hasLandedReference('heelflip',[],[entry])).toBe(true);
 expect(hasLandedReference('heelflip',[],[{...entry,status:'consistent'}])).toBe(true);
 expect(hasLandedReference('heelflip',[],[{...entry,status:'learning'}])).toBe(false);
});
