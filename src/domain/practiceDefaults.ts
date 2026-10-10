import {PracticeSession,SetupData} from './types';
/** Reuse recorded configuration only; removed inventory cannot be auto-selected. */
export function practiceDefaults(session:PracticeSession,records:PracticeSession[],setups:SetupData[]){
 const last=records.filter(s=>s.sessionStartedAt&&s.id!==session.id).sort((a,b)=>Date.parse(b.sessionStartedAt!)-Date.parse(a.sessionStartedAt!))[0];
 const setup=setups.find(s=>s.id===last?.setupSnapshot.id)||setups.find(s=>s.favorite)||setups[0];
 const goal=session.goal||last?.goal||{type:'landings' as const,target:3};
 const timer=session.practiceTimer||last?.practiceTimer||{type:'regular' as const};
 const safeTimer=goal.type==='time'&&timer.type==='countdown'&&(timer.durationMs||0)<goal.target*60000?{type:'countdown' as const,durationMs:goal.target*60000}:timer;
 return {setupId:setup?.id||'',goal,timer:safeTimer,surface:last?.practiceSurface||''};
}
