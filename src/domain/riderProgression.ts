import {PracticeSession} from './types';
import {trickKey} from './progression';
import {progressMilestones} from './milestones';
import {challengePeriod} from '../../shared/challengePeriods.mjs';

export interface XPReward {
  id: string;
  label: string;
  xp: number;
  date: string;
  sessionId: string;
}
export interface SessionReward {
  sessionId:string;
  trickName: string;
  rewards: XPReward[];
  xp: number;
  levelBefore: number;
  levelAfter: number;
  totalXP: number;
}
const OFFSET = 8 * 60 * 60 * 1000;
export function practiceDay(timestamp: number): string {
  return new Date(timestamp + OFFSET).toISOString().slice(0, 10);
}
export function levelProgress(total: number) {
  const xp = Math.max(0, Math.floor(Number.isFinite(total) ? total : 0));
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const floor = 100 * (level - 1) ** 2, ceiling = 100 * level ** 2;
  const title = level < 3 ? 'Building momentum' : level < 6 ? 'Finding your rhythm' : level < 10 ? 'Putting in the work' : 'In your element';
  return {level, title, xp, floor, ceiling, remaining: ceiling - xp, fraction: (xp - floor) / (ceiling - floor)};
}
// A finished, internally valid record counts; generated, paused and future records do not.
export function progressionSessions(records: PracticeSession[], now = Date.now()): PracticeSession[] {
  const ids = new Set<string>();
  return [...records].sort((a,b) => (Date.parse(a.sessionEndedAt || '') || 0) - (Date.parse(b.sessionEndedAt || '') || 0) || a.id.localeCompare(b.id))
    .filter(session => {
      const start = Date.parse(session.sessionStartedAt || ''), end = Date.parse(session.sessionEndedAt || '');
      if (ids.has(session.id) || !session.id || (session.status !== 'success' && session.status !== 'failed') || !Number.isFinite(start) || !Number.isFinite(end) || end < start || end > now || !session.trickResult) return false;
      if (!Number.isSafeInteger(session.attemptCount) || session.attemptCount < 0 || (session.attemptCount === 0 && session.goal?.type !== 'time') || !Number.isSafeInteger(session.landingCount) || session.landingCount < 0 || session.landingCount > session.attemptCount) return false;
      ids.add(session.id);
      return true;
    });
}
export function focusedPractice(session: PracticeSession): boolean {
  return session.attemptCount > 0 && (session.attemptCount >= 5 || (session.activeDurationMs >= 60000 && Number.isFinite(session.activeDurationMs)));
}
export function riderProgression(records: PracticeSession[], now = Date.now()) {
  const sessions = progressionSessions(records, now);
  const focused = sessions.filter(focusedPractice);
  const events: XPReward[] = [];
  const byId = new Map(sessions.map(session => [session.id, session]));
  const dailyCounts = new Map<string,number>();
  for (const session of focused) {
    const end = Date.parse(session.sessionEndedAt!), day = practiceDay(end);
    const count = dailyCounts.get(day) || 0;
    if (count < 5) events.push({id:`practice:${session.id}`,label:'Focused session finished',xp:20,date:session.sessionEndedAt!,sessionId:session.id});
    dailyCounts.set(day,count+1);
  }
  // Compare achievements in finishing order; only completed sessions earn rewards.
  const completedMilestones = progressMilestones(sessions.map(session => ({...session,sessionStartedAt:new Date(Date.parse(session.sessionEndedAt!)).toISOString(),sessionEndedAt:new Date(Date.parse(session.sessionEndedAt!)).toISOString()})));
  const rewarded = new Set<string>();
  for (const milestone of [...completedMilestones].sort((a,b) => Date.parse(a.date)-Date.parse(b.date) || a.id.localeCompare(b.id))) {
    if (milestone.kind === 'consistency') continue; // Streak records already earn a bonus.
    const session = byId.get(milestone.sessionId);
    if (!session) continue;
    const period = challengePeriod('weekly',Date.parse(session.sessionEndedAt!)).id;
    const key = milestone.kind === 'community' ? `community:${session.sharedChallenge!.id}` : `${milestone.kind}:${milestone.trickKey}${milestone.kind === 'first' ? '' : ':'+period}`;
    if (rewarded.has(key)) continue;
    rewarded.add(key);
    events.push({id:key,label:milestone.title,xp:milestone.kind==='first'?40:milestone.kind==='streak'?20:25,date:session.sessionEndedAt!,sessionId:session.id});
  }
  const week = challengePeriod('weekly',now);
  const totalXP = events.reduce((sum,reward) => sum+reward.xp,0);
  return {level:levelProgress(totalXP),totalXP,events:events.sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)||a.id.localeCompare(b.id)),week,finishedSessions:sessions.length};
}
export function sessionRewards(records: PracticeSession[], sessionId: string, now = Date.now()): SessionReward | null {
  const progress = riderProgression(records,now);
  const session = records.find(record=>record.id===sessionId);
  const rewards = progress.events.filter(reward=>reward.sessionId===sessionId);
  if (!session || !progressionSessions(records,now).some(s=>s.id===sessionId)) return null;
  const xp = rewards.reduce((sum,reward)=>sum+reward.xp,0);
  // Level at this finish, excluding later sessions when viewing an older record.
  const totalXP = progress.events.filter(reward=>Date.parse(reward.date) < Date.parse(session.sessionEndedAt!) || (Date.parse(reward.date)===Date.parse(session.sessionEndedAt!) && reward.sessionId.localeCompare(sessionId)<=0)).reduce((sum,reward)=>sum+reward.xp,0);
  return {sessionId,trickName:session.trickResult.canonicalName,rewards,xp,levelBefore:levelProgress(totalXP-xp).level,levelAfter:levelProgress(totalXP).level,totalXP};
}
