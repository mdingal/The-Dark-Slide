import {getBaseTrickById} from './catalog';
import {Stance} from './types';
export function parseReferenceId(id:string):{baseId:string;stance:Stance}{
 const match=/^(fakie|nollie|switch):(.+)$/.exec(id);
 return {baseId:match?match[2]:id,stance:match?match[1] as Stance:'regular'};
}
export function referenceStanceIds(id:string):string[]{
 const base=getBaseTrickById(id==='pop-shuvit'?'pop_shuvit':id);
 return base?(['fakie','nollie','switch'] as Stance[]).filter(s=>base.allowedStances.includes(s)).map(s=>s+':'+id):[];
}
export const STANCE_COACHING:Record<Stance,string>={
 regular:'Use your usual direction and familiar pop and guide fingers.',
 fakie:'Roll backward while keeping your regular finger arrangement. Pop from the same physical tail as your regular ollie; let your hand follow the backward travel.',
 nollie:'Roll in your usual direction and pop from the nose with your front finger. Your rear finger guides or flicks the deck; practice a small nose pop before adding rotation.',
 switch:'Reverse your usual finger roles and stance while rolling forward. The finger normally used to guide now pops; keep the movement small while learning the unfamiliar scoop or flick.'
};
