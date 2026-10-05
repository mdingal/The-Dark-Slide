import type {SetupData,ObstacleType} from './types';
export function riderSetupAnswers(answers:Record<string,string|string[]>|undefined,setups:SetupData[]):Record<string,string|string[]> {
 const result:Record<string,string|string[]>={...answers,setupCount:String(setups.length)};
 if(Array.isArray(result.obstacles))result.obstacles=[...new Set(result.obstacles.map(v=>v==='Flatground only'?'Flatground':v))];
 return result;
}
export function riderObstacles(values:string[]):ObstacleType[]{return [...new Set(values.flatMap(v=>v==='Ledge'?['ledge' as const]:v==='Rail'?['rail' as const]:v==='Flatground'||v==='Flatground only'?['flatground' as const]:[]))];}
export const RIDER_DETAIL_LABELS:Record<string,string>={setupCount:'Fingerboard setups',experience:'Experience',obstacles:'Practice obstacles',source:'How you found Dark Slide',sourceOther:'Other source',goals:'Practice goals',sessionLength:'Typical session length (minutes)',practiceFocus:'Tricks to learn',preferredStance:'Preferred stance'};
