import {doc,getDocFromServer,collection,getCountFromServer,setDoc,deleteDoc} from 'firebase/firestore';
import {trackFirebaseRead} from './firebaseReadDiagnostics';
import {db,auth} from './firebase';
import {SharedChallenge,challengeCompleted} from '../domain/communityChallenges';
// Memory only. Navigation shares reads; reloads and manual refresh still use Firebase.
const ttl=60000;
function memoryRead<T>(lifetime=ttl){
 const values=new Map<string,{at:number;value:T}>(),pending=new Map<string,Promise<T>>();
 return {
  async read(key:string,fetch:()=>Promise<T>,force=false):Promise<T>{
   const cached=values.get(key);
   if(!force&&cached&&Date.now()-cached.at<lifetime)return structuredClone(cached.value);
   let request=pending.get(key);
   if(!request){request=fetch().then(value=>{values.set(key,{at:Date.now(),value});return value;}).finally(()=>pending.delete(key));pending.set(key,request);}
   return structuredClone(await request);
  },
  invalidate(key:string){values.delete(key);}
 };
}
const challenges=memoryRead<SharedChallenge|null>(5*60000),counts=memoryRead<number>();
const submissions=new Map<string,{at:number;sessionId:string|null}>();
const queues=new Map<string,Promise<void>>();
export async function loadSharedChallenge(id:string,force=false):Promise<SharedChallenge|null>{
 return challenges.read(id,async()=>{
  const snapshot=await getDocFromServer(doc(db,'communityChallenges',id));trackFirebaseRead('Community challenge loads',1);if(!snapshot.exists())return null;
  const c=snapshot.data() as SharedChallenge;
  if(c.id!==id||!c.published||!['daily','weekly'].includes(c.kind)||!c.primary||!Number.isFinite(Date.parse(c.startsAt))||!Number.isFinite(Date.parse(c.endsAt))||![1,3].includes(c.targetLandings))throw new Error('Challenge schedule is invalid.');
  return c;
 },force);
}
export async function challengeSubmissionCount(id:string,force=false):Promise<number>{
 return counts.read(id,async()=>{const count=await getCountFromServer(collection(db,'communityChallenges',id,'submissions'));trackFirebaseRead('Aggregation: submission counts',0);return count.data().count;},force);
}
export async function syncChallengeSubmission(c:SharedChallenge,sessions:import('../domain/types').PracticeSession[],force=false):Promise<void>{
 const user=auth.currentUser;if(!user?.emailVerified)return;
 const key=user.uid+'/'+c.id,desired=sessions.find(s=>challengeCompleted(c,s))?.id||null;
 // Serialize per rider/challenge so simultaneous cards cannot duplicate writes.
 const previous=queues.get(key)||Promise.resolve();
 const request=previous.catch(()=>{}).then(async()=>{
  if(auth.currentUser?.uid!==user.uid||!auth.currentUser.emailVerified)return;
  let cached=submissions.get(key);
  if(force||!cached||Date.now()-cached.at>=ttl){
   const snapshot=await getDocFromServer(doc(db,'communityChallenges',c.id,'submissions',user.uid));trackFirebaseRead('Community submission checks',1);
   if(auth.currentUser?.uid!==user.uid||!auth.currentUser.emailVerified)return;
   cached={at:Date.now(),sessionId:snapshot.exists()?snapshot.data().sessionId:null};submissions.set(key,cached);
  }
  if(cached.sessionId===desired)return;
  const ref=doc(db,'communityChallenges',c.id,'submissions',user.uid);
  if(desired)await setDoc(ref,{sessionId:desired});else await deleteDoc(ref);
  submissions.set(key,{at:Date.now(),sessionId:desired});counts.invalidate(c.id);
 });
 queues.set(key,request);
 try{await request;}finally{if(queues.get(key)===request)queues.delete(key);}
}
