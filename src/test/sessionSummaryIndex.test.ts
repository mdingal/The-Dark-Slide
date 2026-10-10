import {CHARTS,chartData} from '../domain/dashboardAnalytics';
import {describe,it,expect} from 'vitest';
import {sessionSummary,encodeSummary,partitionBucket,summaryHash,mergeMissingSummaries,SUMMARY_BUCKET_BYTES,summaryBucketSize} from '../services/sessionSummaryIndex';
import {PracticeSession} from '../domain/types';
import {getPersonalBests,compareSetups} from '../domain/progression';
import {riderProgression} from '../domain/riderProgression';
import {GAME_DECKS} from '../domain/deckGame';
import {createPracticeSession} from '../domain/practiceActions';
const record=(id:string)=>({...createPracticeSession(GAME_DECKS[0].cards[0].trick,{id:'board',name:'Daily',deckWidthMm:34,wheelMaterial:'urethane'},1000),id,sessionStartedAt:new Date(1000).toISOString(),sessionEndedAt:new Date(61000).toISOString(),activeDurationMs:60000,status:'success' as const,currentLandingStreak:undefined,bestLandingStreak:undefined,attemptCount:5,landingCount:3,firstLandingAttemptNumber:2,history:[{action:'landing'},{action:'landing'},{action:'attempt'},{action:'landing'},{action:'attempt'}] as PracticeSession['history']});
describe('compact all-time session summaries',()=>{
 it('preserves all-time personal bests, comparisons, and rewards without attempt logs',()=>{
  const full=[record('a'),record('b')],summaries=full.map(sessionSummary);
  expect(summaries[0].history).toEqual([]);expect(summaries[0].bestLandingStreak).toBe(2);
  expect(getPersonalBests(summaries)).toEqual(getPersonalBests(full));
  expect(compareSetups(summaries,'setup')).toEqual(compareSetups(full,'setup'));
  expect(riderProgression(summaries,100000)).toEqual(riderProgression(full,100000));
  expect(summaries[0].trickResult).toEqual(full[0].trickResult);
 });
 it('keeps notes searchable and marks exceptionally large records for complete loading',()=>{
  const s={...record('a'),notes:'My catch needs work'};
  expect(JSON.parse(encodeSummary(s)).notes).toBe(s.notes);
  expect(JSON.parse(encodeSummary({...s,notes:'x'.repeat(250000)}))).toEqual({id:'a',loadFull:true});
 });
 it('splits crowded buckets before the document limit and retains every entry',()=>{
  const ids=Array.from({length:1000},(_,i)=>'session-'+i).filter(id=>summaryHash(id)[0]===summaryHash('session-0')[0]);
  const rows=Object.fromEntries(ids.map(id=>[id,'x'.repeat(100000)]));
  const prefix=summaryHash(ids[0])[0],buckets=partitionBucket(prefix,rows);
  expect(buckets.get(prefix)?.split).toBe(true);
  expect(Object.assign({},...[...buckets.values()].map(b=>b.rows))).toEqual(rows);
  for(const b of buckets.values())expect(summaryBucketSize(b)).toBeLessThanOrEqual(SUMMARY_BUCKET_BYTES);
 });
 it('migration preserves concurrent edits and deleted-session tombstones',()=>{
  expect(mergeMissingSummaries({old:'newer',deleted:'null'},{old:'stale',deleted:'stale',missing:'first'})).toEqual({old:'newer',deleted:'null',missing:'first'});
 });
});

it('every analytics chart returns the same data from summaries as from full records',()=>{
 const full=[{...record('a'),goal:{type:'streak' as const,target:2},missTagCounts:{underflip:2},difficultyRating:3,firstLandingElapsedMs:1500},record('b')];
 const summaries=full.map(sessionSummary),now=new Date(100000);
 for(const chart of CHARTS)expect(chartData(chart.id,summaries,now)).toEqual(chartData(chart.id,full,now));
});
