import {PracticeSession} from './types';
import {progressionSessions} from './riderProgression';
import {getStreaks} from './progression';
import {personalWins} from './practiceTargets';
import {newlyUnlockedTricks} from './trickTree';

export function sessionRecap(records:PracticeSession[],sessionId:string,now=Date.now()) {
 const session=progressionSessions(records,now).find(s=>s.id===sessionId);
 if(!session||session.outcomeReviewPending)return null;
 return {
  session,
  reached:session.status==='success',
  landingRate:session.attemptCount>0?session.landingCount/session.attemptCount:null,
  bestStreak:getStreaks(session).best,
  firstAttempt:session.landingCount>0?Number.isInteger(session.firstLandingAttemptNumber)&&session.firstLandingAttemptNumber!>0?session.firstLandingAttemptNumber!:null:null,
  firstTime:session.landingCount>0?Number.isFinite(session.firstLandingElapsedMs)&&session.firstLandingElapsedMs!>=0?session.firstLandingElapsedMs!:null:null,
  wins:personalWins(records,sessionId,now),
  unlocked:newlyUnlockedTricks(records,sessionId,now).filter(n=>n.family!=='Grinds & slides')
 };
}
