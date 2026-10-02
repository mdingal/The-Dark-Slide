import { PracticeSession, TrickLibraryEntry } from './types';
import { referenceChallenge } from './referenceChallenge';
import { trickKey } from './progression';

// Match the exact practice challenge; combo components and other stances do not imply a landing.
export function hasLandedReference(id:string, sessions:PracticeSession[], library:TrickLibraryEntry[]=[]):boolean {
  const key=trickKey(referenceChallenge(id));
  return sessions.some(s=>(s.landingCount>0||s.status==='success')&&trickKey(s.trickResult)===key)
    || library.some(t=>(t.status==='landed'||t.status==='consistent')&&trickKey(t.trickResult)===key);
}
