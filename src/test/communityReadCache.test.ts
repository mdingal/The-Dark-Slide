import {beforeEach,describe,it,expect,vi} from 'vitest';
const state=vi.hoisted(()=>({user:{uid:'rider',emailVerified:true}}));
vi.mock('../services/firebase',()=>({db:{},auth:{get currentUser(){return state.user;}}}));
vi.mock('../domain/communityChallenges',()=>({challengeCompleted:(_c:unknown,s:any)=>s.complete}));
vi.mock('firebase/firestore',()=>({doc:(_db:unknown,...p:string[])=>p.join('/'),collection:(_db:unknown,...p:string[])=>p.join('/'),getDocFromServer:vi.fn(),getCountFromServer:vi.fn(),setDoc:vi.fn(),deleteDoc:vi.fn()}));
import {getDocFromServer,getCountFromServer,setDoc,deleteDoc} from 'firebase/firestore';
import type {SharedChallenge} from '../domain/communityChallenges';
let service:typeof import('../services/communityChallengeService');
const challenge={id:'daily-test',kind:'daily',published:true,startsAt:'2026-10-07',endsAt:'2026-10-08',targetLandings:1,primary:{}} as SharedChallenge;
describe('community read budget',()=>{
 beforeEach(async()=>{vi.resetModules();vi.clearAllMocks();state.user={uid:'rider',emailVerified:true};service=await import('../services/communityChallengeService');vi.mocked(getDocFromServer).mockResolvedValue({exists:()=>false} as any);vi.mocked(getCountFromServer).mockResolvedValue({data:()=>({count:7})} as any);});
 it('shares concurrent challenge reads, returns isolated copies and honors force refresh',async()=>{
  vi.mocked(getDocFromServer).mockResolvedValue({exists:()=>true,data:()=>challenge} as any);
  const [a,b]=await Promise.all([service.loadSharedChallenge(challenge.id),service.loadSharedChallenge(challenge.id)]);expect(getDocFromServer).toHaveBeenCalledTimes(1);a!.published=false;expect(b!.published).toBe(true);
  await service.loadSharedChallenge(challenge.id);expect(getDocFromServer).toHaveBeenCalledTimes(1);await service.loadSharedChallenge(challenge.id,true);expect(getDocFromServer).toHaveBeenCalledTimes(2);
 });
 it('keeps scheduled challenges for five minutes while manual refresh bypasses memory',async()=>{
  const clock=vi.spyOn(Date,'now').mockReturnValue(1000);vi.mocked(getDocFromServer).mockResolvedValue({exists:()=>true,data:()=>challenge} as any);
  try{await service.loadSharedChallenge(challenge.id);clock.mockReturnValue(62000);await service.loadSharedChallenge(challenge.id);expect(getDocFromServer).toHaveBeenCalledTimes(1);clock.mockReturnValue(302000);await service.loadSharedChallenge(challenge.id);expect(getDocFromServer).toHaveBeenCalledTimes(2);await service.loadSharedChallenge(challenge.id,true);expect(getDocFromServer).toHaveBeenCalledTimes(3);}finally{clock.mockRestore();}
 });
 it('reuses counts for a minute and retries failed reads',async()=>{
  const clock=vi.spyOn(Date,'now').mockReturnValue(1000);
  try{await Promise.all([service.challengeSubmissionCount('x'),service.challengeSubmissionCount('x')]);expect(getCountFromServer).toHaveBeenCalledTimes(1);clock.mockReturnValue(62000);await service.challengeSubmissionCount('x');expect(getCountFromServer).toHaveBeenCalledTimes(2);
   vi.mocked(getCountFromServer).mockRejectedValueOnce(new Error('quota'));await expect(service.challengeSubmissionCount('x',true)).rejects.toThrow('quota');await service.challengeSubmissionCount('x',true);expect(getCountFromServer).toHaveBeenCalledTimes(4);
  }finally{clock.mockRestore();}
 });
 it('coalesces submission checks and writes changes immediately, invalidating counts',async()=>{
  await service.challengeSubmissionCount(challenge.id);
  await Promise.all([service.syncChallengeSubmission(challenge,[]),service.syncChallengeSubmission(challenge,[])]);expect(getDocFromServer).toHaveBeenCalledTimes(1);expect(setDoc).not.toHaveBeenCalled();
  await service.syncChallengeSubmission(challenge,[{id:'s1',complete:true}] as any);expect(setDoc).toHaveBeenCalledTimes(1);expect(getDocFromServer).toHaveBeenCalledTimes(1);
  await service.challengeSubmissionCount(challenge.id);expect(getCountFromServer).toHaveBeenCalledTimes(2);
  await service.syncChallengeSubmission(challenge,[]);expect(deleteDoc).toHaveBeenCalledTimes(1);
 });
 it('isolates riders and refuses unverified submission writes',async()=>{
  await service.syncChallengeSubmission(challenge,[]);state.user.uid='other';await service.syncChallengeSubmission(challenge,[]);expect(getDocFromServer).toHaveBeenCalledTimes(2);
  state.user.emailVerified=false;await service.syncChallengeSubmission(challenge,[{id:'s1',complete:true}] as any);expect(setDoc).not.toHaveBeenCalled();
 });
});
