import type {PracticeSession,SetupData} from './types';
import {startTimer,stopTimer,calculateActiveDurationMs} from './timer';
import {getStreaks} from './progression';
export function goalReached(s:PracticeSession):boolean {return s.goal?.type==='time'?Math.min(Math.max(s.activeDurationMs,calculateActiveDurationMs(s.timerState)),s.practiceTimer?.type==='countdown'?(s.practiceTimer.durationMs||Infinity):Infinity)>=s.goal.target*60000:s.goal?.type==='streak'?getStreaks(s).best>=s.goal.target:s.landingCount>=(s.goal?.target||1);}
export function remainingTime(s:PracticeSession,now=Date.now()):number {return Math.max(0,(s.practiceTimer?.durationMs||0)-calculateActiveDurationMs(s.timerState,now));}
export function startConfiguredSession(s:PracticeSession,setup:SetupData,goal:NonNullable<PracticeSession['goal']>,timer:NonNullable<PracticeSession['practiceTimer']>,surface:string,now=Date.now()):PracticeSession {
 if(!Number.isInteger(goal.target)||goal.target<1||goal.target>10000)throw Error('Choose a goal between 1 and 10,000.');
 if(goal.type==='time'&&goal.target>1440)throw Error('Choose a practice goal of up to 1,440 minutes.');
 if(timer.type==='countdown'&&(!timer.durationMs||timer.durationMs<1000||timer.durationMs>86400000))throw Error('Countdown must be between 1 second and 24 hours.');
 if(goal.type==='time'&&timer.type==='countdown'&&timer.durationMs!<goal.target*60000)throw Error('The countdown must be at least as long as your time goal.');
 if(!surface.trim())throw Error('Choose a practice surface.');
 return {...s,setupSnapshot:structuredClone(setup),goal,consistencyGoal:goal.type==='streak'?goal.target:s.consistencyGoal,practiceTimer:timer,practiceSurface:surface,sessionStartedAt:new Date(now).toISOString(),timerState:startTimer(s.timerState,now),status:'pending'};
}
export function closePractice(s:PracticeSession,park:boolean,rating:number,notes:string,now=Date.now(),reason:'manual'|'countdown'='manual'):PracticeSession {
 let duration=calculateActiveDurationMs(s.timerState,now);
 if(s.practiceTimer?.type==='countdown')duration=Math.min(duration,s.practiceTimer.durationMs||duration);
 const timerState={...stopTimer(s.timerState,now),accumulatedMs:duration};
 return {...s,status:park?'pending':goalReached({...s,timerState,activeDurationMs:duration})?'success':'failed',timerState,activeDurationMs:duration,difficultyRating:rating,notes,...(park?{parkedAt:new Date(now).toISOString(),sessionEndedAt:undefined}:{parkedAt:undefined,sessionEndedAt:new Date(now).toISOString(),endedReason:reason})};
}
