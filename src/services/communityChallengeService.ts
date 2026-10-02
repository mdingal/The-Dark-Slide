import {doc,getDocFromServer,collection,getCountFromServer,setDoc,deleteDoc} from 'firebase/firestore';
import {db,auth} from './firebase';
import {SharedChallenge,challengeCompleted} from '../domain/communityChallenges';
export async function loadSharedChallenge(id:string):Promise<SharedChallenge|null>{
 const snapshot=await getDocFromServer(doc(db,'communityChallenges',id));if(!snapshot.exists())return null;
 const c=snapshot.data() as SharedChallenge;
 if(c.id!==id||!c.published||!['daily','weekly'].includes(c.kind)||!c.primary||!Number.isFinite(Date.parse(c.startsAt))||!Number.isFinite(Date.parse(c.endsAt))||![1,3].includes(c.targetLandings))throw new Error('Challenge schedule is invalid.');
 return c;
}

export async function challengeSubmissionCount(id:string):Promise<number>{
 const count=await getCountFromServer(collection(db,'communityChallenges',id,'submissions'));return count.data().count;
}
export async function syncChallengeSubmission(c:SharedChallenge,sessions:import('../domain/types').PracticeSession[]):Promise<void>{
 const user=auth.currentUser;if(!user?.emailVerified)return;
 const ref=doc(db,'communityChallenges',c.id,'submissions',user.uid),eligible=sessions.find(s=>challengeCompleted(c,s));
 const previous=await getDocFromServer(ref);
 if(auth.currentUser?.uid!==user.uid)return;
 if(eligible){if(previous.data()?.sessionId!==eligible.id)await setDoc(ref,{sessionId:eligible.id});}
 else if(previous.exists())await deleteDoc(ref);
}
