export type DeckInstrument='electric_keys'|'clav'|'jazz_bell'|'saw_lead'|'marimba'|'soft_keys'|'glass_bell'|'brass'|'chip_pluck'|'warm_organ';
export interface DeckMusicTrack {
 name:string;bpm:number;root:number;chords:number[][];melody:number[];kicks:number[];swing:number;
 instrument:DeckInstrument;genre:string;melodyBeats:number[];bassBeats:number[];snares:number[];hats:number[];
 kit:'boom_bap'|'clap'|'rim'|'electro'|'brush'|'trap';chordBeats:number[];
}
const minor=[[0,3,7,10],[5,8,12,15],[8,12,15,19],[7,10,14,17]];
const major=[[0,4,7,11],[5,9,12,16],[2,5,9,12],[7,11,14,17]];
const hats=(step:number)=>Array.from({length:Math.floor(8/step)},(_,i)=>i*step);
const track=(name:string,bpm:number,root:number,instrument:DeckInstrument,genre:string,kit:DeckMusicTrack['kit'],melody:number[],melodyBeats:number[],kicks:number[],snares:number[],hatPattern:number[],bassBeats:number[],chordBeats:number[],swing:number,chords=minor):DeckMusicTrack=>({name,bpm,root,instrument,genre,kit,melody,melodyBeats,kicks,snares,hats:hatPattern,bassBeats,chordBeats,swing,chords});
export const DECK_MUSIC_TRACKS:readonly DeckMusicTrack[]=[
 track('Asphalt Bounce',90,46,'electric_keys','Boom bap','boom_bap',[12,7,10,3,7,12,15,10],[0,1.5,3,4.5,6,7.5],[0,2.5,4,6.75],[1,3,5,7],hats(.5),[0,2.5,4,6.75],[0,4],.07),
 track('Pocket Groove',112,45,'clav','Funk-hop','clap',[7,10,12,10,3,7,5,3],[.5,1.25,2.75,3.5,4.5,5.25,6.75,7.5],[0,1.75,2.5,4,5.75,6.5],[1,3,5,7],hats(.5),[0,.75,2,2.75,4,4.75,6,7.25],[.5,2.5,4.5,6.5],.02),
 track('Golden Hour',82,53,'jazz_bell','Jazz-hop','rim',[12,15,19,15,12,7,10,12],[0,1.5,2.75,4,5.5,7],[0,2.75,4.5,6],[1,3,5,7],hats(1),[0,2,4,6],[0],.09,major),
 track('Rail Rhythm',126,48,'saw_lead','Electro-hop','electro',[0,7,12,7,10,7,3,10],[0,.75,1.5,2.25,3.5,4,4.75,5.5,6.25,7.5],[0,1,2,3,4,5,6,7],[1,3,5,7],hats(.5),[0,1.5,2,3.5,4,5.5,6,7.5],[0,2,4,6],0),
 track('Tail Tap',100,47,'marimba','Percussion bounce','rim',[12,10,7,3,5,7,10,7],[0,1.25,2.5,4,5.25,6.5],[0,1.5,3.25,4,5.5,7.25],[2,6],[0,.75,1.5,2.25,3.5,4,4.75,5.5,6.25,7.5],[0,3,4,7],[0,4],.04),
 track('After Hours',72,43,'soft_keys','Lo-fi hip-hop','brush',[7,3,10,7,12,10,5,3],[0,2.5,4,6.5],[0,2.75,4,6.25],[1,3,5,7],hats(1),[0,3,4,7],[0],.11),
 track('Concrete Candy',144,43,'glass_bell','Half-time trap','trap',[12,19,15,12,10,15,7,12],[0,1.5,3,4,5.5,7],[0,1.75,3.5,4,5.75,7.25],[2,6],[0,.5,1,1.5,2,2.5,3,3.25,3.5,3.75,4,4.5,5,5.5,6,6.5,7,7.25,7.5,7.75],[0,3.5,4,7.25],[0,4],0),
 track('Nose Pop',118,46,'brass','Brass bounce','clap',[3,7,12,15,10,7,5,10],[.5,1.5,2.5,3.5,4.5,5.5,6.5,7.5],[0,2.5,3.75,4,6.5],[1,3,5,7],hats(.5),[0,1.75,2.5,4,5.75,6.5],[.5,2.5,4.5,6.5],.035,major),
 track('Shuffle Street',132,49,'chip_pluck','Breakbeat hip-hop','electro',[12,7,15,10,7,3,10,12],[0,.75,1.75,2.5,3.25,4,4.75,5.75,6.5,7.25],[0,1.5,2.75,4,4.75,6.5,7.75],[1,2.5,3,5,6.5,7],hats(.5),[0,1.5,3.5,4,5.5,7],[0,3,4,7],.01),
 track('Clean Catch',76,52,'warm_organ','Dubby trip-hop','boom_bap',[7,12,10,5,3,10,12,7],[0,2,4,6],[0,3.5,4,7.5],[2,6],[.5,1.5,2.5,3.5,4.5,5.5,6.5,7.5],[0,3.5,4,7.5],[0],.06)
];
export function shuffledMusicQueue(current:number,random=Math.random):number[]{
 const ids=DECK_MUSIC_TRACKS.map((_,i)=>i).filter(i=>i!==current);
 for(let i=ids.length-1;i>0;i--){const j=Math.min(i,Math.floor(random()*(i+1)));[ids[i],ids[j]]=[ids[j],ids[i]];}
 return ids;
}
