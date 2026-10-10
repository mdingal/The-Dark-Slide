import {afterEach,beforeEach,expect,it,vi} from 'vitest';
let sounds:typeof import('../components/games/deckSounds');
const parameter=()=>({value:0,setValueAtTime:vi.fn(),linearRampToValueAtTime:vi.fn(),exponentialRampToValueAtTime:vi.fn(),cancelScheduledValues:vi.fn()});
let voices:{stop:ReturnType<typeof vi.fn>}[];
let constructor:ReturnType<typeof vi.fn>;
beforeEach(async()=>{
 vi.useFakeTimers();vi.resetModules();voices=[];
 const node=()=>({connect:vi.fn(),disconnect:vi.fn()});
 const context={state:'running',currentTime:0,sampleRate:48000,destination:{},createBuffer:(_channels:number,length:number)=>({getChannelData:()=>new Float32Array(length)}),createBufferSource:()=>{const source={...node(),start:vi.fn(),stop:vi.fn(),onended:null};voices.push(source);return source;},createGain:()=>({...node(),gain:parameter()}),createBiquadFilter:()=>({...node(),frequency:parameter(),Q:parameter()}),createOscillator:()=>{const voice={...node(),frequency:parameter(),start:vi.fn(),stop:vi.fn(),onended:null};voices.push(voice);return voice;}};
 constructor=vi.fn(function(){return context;});vi.stubGlobal('AudioContext',constructor);
 sounds=await import('../components/games/deckSounds');
});
afterEach(()=>{sounds.setDeckMusicEnabled(false);vi.useRealTimers();vi.unstubAllGlobals();});
it('waits for an interaction before initializing background music',()=>{
 sounds.setDeckMusicEnabled(true);expect(constructor).not.toHaveBeenCalled();
 sounds.unlockDeckSound();expect(constructor).toHaveBeenCalledTimes(1);expect(voices.length).toBeGreaterThan(0);expect(vi.getTimerCount()).toBe(1);
});
it('stops scheduled voices and the loop timer when leaving or muting',()=>{
 sounds.setDeckMusicEnabled(true);sounds.unlockDeckSound();
 const before=voices.length;
 sounds.setDeckMusicEnabled(false);expect(vi.getTimerCount()).toBe(0);
 expect(voices.every(v=>v.stop.mock.calls.length===2)).toBe(true);
 vi.advanceTimersByTime(12000);expect(voices).toHaveLength(before);
});
it('keeps music independent of the sound effects mute switch without duplicate loops',()=>{
 sounds.setDeckSoundEnabled(false);sounds.setDeckMusicEnabled(true);sounds.unlockDeckSound();
 const before=voices.length;sounds.unlockDeckSound();expect(voices).toHaveLength(before);expect(vi.getTimerCount()).toBe(1);
});

it('changing tracks stops previous voices and maintains only one music scheduler',()=>{
 sounds.setDeckMusicEnabled(true);sounds.unlockDeckSound();const initial=[...voices],first=sounds.currentDeckMusic().name;
 expect(sounds.nextDeckMusic().name).not.toBe(first);
 expect(initial.every(v=>v.stop.mock.calls.length===2)).toBe(true);
 expect(voices.length).toBeGreaterThan(initial.length);expect(vi.getTimerCount()).toBe(1);
 sounds.setDeckMusicEnabled(false);const stopped=voices.length;sounds.nextDeckMusic();
 expect(voices).toHaveLength(stopped);expect(vi.getTimerCount()).toBe(0);
});

it('initializes all ten instrument patches while keeping one active music loop',()=>{
 sounds.setDeckMusicEnabled(true);sounds.unlockDeckSound();
 const visited=new Set([sounds.currentDeckMusic().name]);
 for(let i=0;i<9;i++){const before=voices.length;visited.add(sounds.nextDeckMusic().name);expect(voices.length).toBeGreaterThan(before);expect(vi.getTimerCount()).toBe(1);}
 expect(visited.size).toBe(10);expect(constructor).toHaveBeenCalledTimes(1);
});
