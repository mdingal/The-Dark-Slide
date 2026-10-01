import { GeneratedTrickResult, MissTag, PracticeSession, SetupData } from './types';

export const MISS_TAGS: { id: MissTag; label: string }[] = [
  { id: 'underflip', label: 'Underflip' }, { id: 'overflip', label: 'Overflip' },
  { id: 'missed_catch', label: 'Missed catch' }, { id: 'missed_lock_in', label: 'Missed lock-in' },
  { id: 'slipped_out', label: 'Slipped out' },
];
export const LEARNING_STATUSES = [
  { id: 'want_to_learn', label: 'Want to Learn' }, { id: 'learning', label: 'Learning' },
  { id: 'landed', label: 'Landed' }, { id: 'consistent', label: 'Consistent' },
] as const;

export function trickKey(result: GeneratedTrickResult): string {
  const paramsKey = (p: NonNullable<GeneratedTrickResult['singleTrick']>) =>
    [p.stance, p.direction, p.baseTrickId, p.bodyVarial, p.landing, p.revert];
  if (result.mode === 'single' && result.singleTrick) return JSON.stringify(['single', paramsKey(result.singleTrick)]);
  if (result.mode === 'combo' && result.comboSteps?.length) return JSON.stringify(['combo', result.comboSteps.map(s => paramsKey(s.parameters))]);
  const o = result.obstacleData;
  if (result.mode === 'obstacle' && o) return JSON.stringify(['obstacle', o.obstacleType,
    o.approach, o.obstacleTrickId, o.entryTrickId, o.exitTrick, o.transferTrickId || '',
    o.transferApproach || o.approach]);
  return JSON.stringify([result.mode, result.canonicalName.trim().toLowerCase()]);
}

// Counter history is newest-first. Replay older logs to recover streaks without inventing missing attempts.
export function getStreaks(session: PracticeSession): { current: number; best: number } {
  if (session.currentLandingStreak !== undefined && session.bestLandingStreak !== undefined) {
    return { current: session.currentLandingStreak, best: session.bestLandingStreak };
  }
  let current = 0, best = 0;
  for (const item of [...(session.history || [])].reverse()) {
    if (item.action === 'landing') { current++; best = Math.max(best, current); }
    else if (item.action === 'attempt') current = 0;
  }
  return { current, best };
}

export function getPersonalBests(sessions: PracticeSession[]) {
  const attempted = sessions.filter(s => s.attemptCount > 0);
  const landed = attempted.filter(s => s.landingCount > 0);
  const firstAttempts = landed.map(s => s.firstLandingAttemptNumber).filter((n): n is number => n !== undefined && n > 0);
  const rates = landed.map(s => ({ sessionId: s.id, attempts: s.attemptCount,
    landings: s.landingCount, rate: s.landingCount / s.attemptCount })).sort((a,b) => b.rate-a.rate || b.attempts-a.attempts);
  const missCounts = MISS_TAGS.map(tag => ({ ...tag,
    count: sessions.reduce((sum,s) => sum + (s.missTagCounts?.[tag.id] || 0), 0) }))
    .filter(t => t.count > 0).sort((a,b) => b.count-a.count || a.label.localeCompare(b.label));
  return { fewestFirstLandingAttempts: firstAttempts.length ? Math.min(...firstAttempts) : undefined,
    highestLandingRate: rates[0], bestStreak: Math.max(0,...sessions.map(s => getStreaks(s).best)),
    missCounts, topMisses: missCounts.filter(t => t.count === missCounts[0]?.count),
    totalAttempts: attempted.reduce((sum,s) => sum+s.attemptCount,0),
    totalLandings: attempted.reduce((sum,s) => sum+s.landingCount,0) };
}

export type ComparisonGroup = 'setup' | 'deck' | 'trucks' | 'wheels';
export function compareSetups(sessions: PracticeSession[], group: ComparisonGroup, exactTrick?: string) {
  const groups = new Map<string, { label: string; sessions: number; attempts: number; landings: number; durationMs: number; first: number[] }>();
  const clean = (s?: string) => s?.trim() || 'Not recorded';
  for (const session of sessions) {
    if (session.attemptCount <= 0 || (exactTrick && trickKey(session.trickResult) !== exactTrick)) continue;
    const s = session.setupSnapshot;
    let label: string, key: string;
    if (group === 'deck') { label = `${clean(s.deckModel)} · ${s.deckWidthMm}mm`; key = JSON.stringify([clean(s.deckModel).toLowerCase(),s.deckWidthMm,s.shape || '',s.mold || '']); }
    else if (group === 'trucks') { label = clean(s.truckModel); key = label.toLowerCase(); }
    else if (group === 'wheels') { label = `${clean(s.wheelModel)} · ${s.wheelMaterial}`; key = JSON.stringify([clean(s.wheelModel).toLowerCase(),s.wheelMaterial]); }
    else { label = `${s.name} · ${s.deckWidthMm}mm · ${clean(s.truckModel)} · ${clean(s.wheelModel)} ${s.wheelMaterial}`;
      key = JSON.stringify([s.id,s.deckWidthMm,clean(s.deckModel).toLowerCase(),clean(s.truckModel).toLowerCase(),clean(s.wheelModel).toLowerCase(),s.wheelMaterial,s.shape || '',s.mold || '']); }
    const record = groups.get(key) || { label, sessions: 0, attempts: 0, landings: 0, durationMs: 0, first: [] };
    record.sessions++; record.attempts+=session.attemptCount; record.landings+=session.landingCount;
    record.durationMs+=session.activeDurationMs;
    if (session.firstLandingAttemptNumber !== undefined && session.landingCount > 0) record.first.push(session.firstLandingAttemptNumber);
    groups.set(key,record);
  }
  return [...groups.entries()].map(([key,g]) => ({ ...g, key,
    landingRate: g.landings/g.attempts,
    averageFirstLandingAttempts: g.first.length ? g.first.reduce((a,b)=>a+b,0)/g.first.length : undefined,
    firstLandingSamples: g.first.length })).sort((a,b) => b.landingRate-a.landingRate || b.attempts-a.attempts);
}
