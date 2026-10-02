import React from 'react';
import {useApp} from '../../context/AppContext';
import {sharedCompletionHistory} from '../../domain/communityChallenges';
export const ChallengeCompletionPanel:React.FC=()=>{
 const {sessions,resumeSession,setActiveTab}=useApp();const completed=sharedCompletionHistory(sessions);
 return <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-3"><h2 className="text-lg font-semibold">Community challenge progress</h2><div className="flex gap-5 text-sm"><span>Daily completed: <strong>{completed.filter(s=>s.sharedChallenge!.kind==='daily').length}</strong></span><span>Weekly completed: <strong>{completed.filter(s=>s.sharedChallenge!.kind==='weekly').length}</strong></span></div>{!completed.length&&<p className="text-xs text-neutral-500">Join through the challenge bar above. Finish a qualifying session to record a completion.</p>}<div className="space-y-2">{completed.slice(0,5).map(s=><button type="button" key={s.id} className="cursor-pointer block text-left w-full rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm" onClick={()=>{resumeSession(s);setActiveTab('generator');}}><span className="capitalize text-[#8A6500] dark:text-[#D4A72C]">{s.sharedChallenge!.kind} completed</span> · {s.trickResult.canonicalName}<span className="block text-xs text-neutral-500">{new Date(s.sessionEndedAt!).toLocaleDateString()} · {s.landingCount} landings · self-reported</span></button>)}</div></section>;
};

export const ChallengeSessionStatus:React.FC<{session?:import('../../domain/types').PracticeSession|null}>=({session})=>{
 const link=session?.sharedChallenge;if(!session||!link)return null;
 const completed=sharedCompletionHistory([session]).length>0,expired=Date.now()>=Date.parse(link.endsAt);
 return <div className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-4 py-3 text-sm"><span className="capitalize font-semibold text-[#8A6500] dark:text-[#D4A72C]">{link.kind} challenge</span> · {Math.min(session.landingCount,link.targetLandings)}/{link.targetLandings} landings<p className="text-xs text-neutral-500 mt-1">{completed?'Challenge completed · self-reported':expired?'The challenge deadline has passed. You can keep practicing.':session.landingCount>=link.targetLandings?'Goal reached. Finish the session before the deadline to record completion.':'Complete the landing goal in this session and finish before the deadline.'}</p></div>;
};
