import {GeneratedTrickResult,SingleTrickParameters,SkateClass} from './types';
export const CLASS_A_TRICKS=new Set(['feather_flip','unpossible','nightmare_flip','shuvit_540','gazelle_spin','gazelle_flip','bigger_flip','bigspin_inward_heelflip']);
export const CLASS_A_OBSTACLES=new Set(['darkslide','primo_slide']);
export function singleFitsClass(p:SingleTrickParameters,tier:SkateClass):boolean {
 return (tier!=='C'||p.stance==='regular'||p.stance==='fakie')&&(tier==='A'||!CLASS_A_TRICKS.has(p.baseTrickId));
}
export function challengeFitsClass(t:GeneratedTrickResult,tier:SkateClass):boolean {
 if(t.singleTrick)return singleFitsClass(t.singleTrick,tier);
 if(t.comboSteps)return t.comboSteps.every(s=>singleFitsClass(s.parameters,tier));
 const o=t.obstacleData;return !o||tier==='A'||(!CLASS_A_TRICKS.has(o.entryTrickId)&&![o.obstacleTrickId,o.transferTrickId||''].some(id=>CLASS_A_OBSTACLES.has(id)));
}
export function minimumSkateClass(t:GeneratedTrickResult):SkateClass{return !challengeFitsClass(t,'B')?'A':!challengeFitsClass(t,'C')?'B':'C';}
export function classLabel(t:GeneratedTrickResult){return `Class ${t.skateClass||minimumSkateClass(t)}`;}
