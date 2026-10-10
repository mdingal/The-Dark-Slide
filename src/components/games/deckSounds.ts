import {DECK_MUSIC_TRACKS,shuffledMusicQueue} from './deckMusic';
type DeckSound='draw'|'discard'|'fan'|'miss'|'letter'|'shuffle'|'victory'|'failure';
let context:AudioContext|undefined;
let enabled=true;
let lastFan=0;
let shuffleRecording:Promise<AudioBuffer>|undefined;
function loadShuffleRecording(){
 if(!context)return Promise.reject(new Error('Audio is not initialized.'));
 const ctx=context;
 shuffleRecording??=fetch('/audio/card-shuffle.mp3').then(response=>{if(!response.ok)throw Error('Shuffle recording unavailable.');return response.arrayBuffer();}).then(bytes=>ctx.decodeAudioData(bytes)).catch(error=>{shuffleRecording=undefined;throw error;});
 return shuffleRecording;
}
let musicTrackIndex=Math.floor(Math.random()*DECK_MUSIC_TRACKS.length),musicQueue:number[]=[];
export function currentDeckMusic(){return DECK_MUSIC_TRACKS[musicTrackIndex];}
export function nextDeckMusic(){
 if(!musicQueue.length)musicQueue=shuffledMusicQueue(musicTrackIndex);
 musicTrackIndex=musicQueue.shift()!;stopMusic();startMusic();return currentDeckMusic();
}
let musicRequested=false,musicBus:GainNode|undefined;
let musicTimer:ReturnType<typeof setInterval>|undefined;
const musicVoices=new Set<OscillatorNode|AudioBufferSourceNode>();
export function setDeckMusicEnabled(value:boolean){
 musicRequested=value;
 if(value)startMusic();else stopMusic();
}
function stopMusic(){
 if(musicTimer!==undefined){clearInterval(musicTimer);musicTimer=undefined;}
 if(musicBus&&context){musicBus.gain.cancelScheduledValues(context.currentTime);musicBus.gain.setValueAtTime(musicBus.gain.value,context.currentTime);musicBus.gain.linearRampToValueAtTime(0,context.currentTime+.10);}
 for(const voice of musicVoices){try{voice.stop((context?.currentTime||0)+.12);}catch{}}
 musicVoices.clear();musicBus=undefined;
}
function startMusic(){
 if(!musicRequested||!context||context.state!=='running'||musicTimer!==undefined)return;
 const ctx=context,bus=ctx.createGain();bus.gain.value=.35;bus.connect(ctx.destination);musicBus=bus;
 const profile=currentDeckMusic(),hz=(midi:number)=>440*Math.pow(2,(midi-69)/12),beat=60/profile.bpm;
 const chords=profile.chords.map(chord=>chord.map(interval=>hz(profile.root+interval)));
 let chordIndex=0,nextTime=ctx.currentTime+.10;
 // Each patch uses its own oscillator mix, envelope and tone filter.
 const patches={
  electric_keys:{wave:'sine',partials:[1,2,3],levels:[1,.28,.08],cutoff:1800,attack:.006,decay:1.2,fm:0},
  clav:{wave:'square',partials:[1,2],levels:[1,.12],cutoff:1300,attack:.003,decay:.13,fm:0},
  jazz_bell:{wave:'sine',partials:[1,2.01,3.5],levels:[1,.25,.08],cutoff:4200,attack:.004,decay:1.5,fm:1.1},
  saw_lead:{wave:'sawtooth',partials:[1,1.006],levels:[.6,.4],cutoff:1250,attack:.025,decay:.27,fm:0},
  marimba:{wave:'sine',partials:[1,4],levels:[1,.16],cutoff:2600,attack:.002,decay:.22,fm:0},
  soft_keys:{wave:'triangle',partials:[1,2],levels:[1,.10],cutoff:650,attack:.04,decay:1.8,fm:0},
  glass_bell:{wave:'sine',partials:[1,2.76,5.4],levels:[1,.22,.07],cutoff:5400,attack:.002,decay:.95,fm:.45},
  brass:{wave:'sawtooth',partials:[1,2],levels:[.8,.2],cutoff:1900,attack:.055,decay:.24,fm:0},
  chip_pluck:{wave:'square',partials:[1],levels:[1],cutoff:2600,attack:.001,decay:.105,fm:0},
  warm_organ:{wave:'sine',partials:[1,2,3,4],levels:[1,.35,.23,.09],cutoff:1100,attack:.06,decay:1.4,fm:0}
 } as const;
 const note=(frequency:number,time:number,length:number,role:'lead'|'chord'|'bass')=>{
  const patch=patches[profile.instrument],gain=ctx.createGain(),filter=ctx.createBiquadFilter();
  filter.type='lowpass';filter.frequency.setValueAtTime(role==='bass'?380:patch.cutoff,time);filter.frequency.exponentialRampToValueAtTime(role==='bass'?180:Math.max(300,patch.cutoff*.55),time+length);filter.Q.value=.65;
  const volume=role==='chord'?.010:role==='bass'?.055:profile.instrument==='saw_lead'||profile.instrument==='brass'?.021:.034;
  const attack=Math.min(patch.attack,length*.15),decay=Math.min(patch.decay,length*.8);
  gain.gain.setValueAtTime(.0001,time);gain.gain.linearRampToValueAtTime(volume,time+attack);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume*.22),time+attack+decay);gain.gain.linearRampToValueAtTime(0,time+length);
  filter.connect(gain);gain.connect(bus);
  const partials=role==='bass'?[1]:patch.partials,oscillators:OscillatorNode[]=[];
  let remaining=partials.length;
  partials.forEach((partial,i)=>{
   const osc=ctx.createOscillator(),mix=ctx.createGain();osc.type=role==='bass'?'sine':patch.wave;osc.frequency.value=frequency*partial;mix.gain.value=role==='bass'?1:patch.levels[i];
   osc.connect(mix);mix.connect(filter);oscillators.push(osc);musicVoices.add(osc);
   osc.onended=()=>{musicVoices.delete(osc);osc.disconnect();mix.disconnect();if(--remaining===0){filter.disconnect();gain.disconnect();}};
   osc.start(time);osc.stop(time+length+.02);
  });
  if(role==='lead'&&patch.fm){
   const mod=ctx.createOscillator(),depth=ctx.createGain();mod.frequency.value=frequency*2.01;depth.gain.setValueAtTime(frequency*patch.fm,time);depth.gain.exponentialRampToValueAtTime(.01,time+Math.min(length,.18));mod.connect(depth);depth.connect(oscillators[0].frequency);musicVoices.add(mod);mod.onended=()=>{musicVoices.delete(mod);mod.disconnect();depth.disconnect();};mod.start(time);mod.stop(time+length+.02);
  }
 };
 const noise=(length:number)=>{const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*length),ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;return buffer;};
 const snareNoise=noise(.28),hatNoise=noise(.12);
 const drum=(kind:'kick'|'snare'|'hat',time:number,accent=1)=>{
  const kit=profile.kit;
  if(kind==='kick'||(kind==='snare'&&kit==='rim')){
   const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type='sine';
   const rim=kind==='snare',duration=rim?.08:kit==='trap'?.42:kit==='electro'?.15:.24;
   oscillator.frequency.setValueAtTime(rim?920:kit==='electro'?170:kit==='trap'?90:125,time);oscillator.frequency.exponentialRampToValueAtTime(rim?620:kit==='trap'?38:52,time+duration*.7);
   gain.gain.setValueAtTime(.001,time);gain.gain.exponentialRampToValueAtTime((rim?.04:.12)*accent,time+.003);gain.gain.exponentialRampToValueAtTime(.001,time+duration);
   oscillator.connect(gain);gain.connect(bus);musicVoices.add(oscillator);oscillator.onended=()=>{musicVoices.delete(oscillator);oscillator.disconnect();gain.disconnect();};oscillator.start(time);oscillator.stop(time+duration+.01);return;
  }
  const clap=kind==='snare'&&kit==='clap',bursts=clap?3:1;
  for(let i=0;i<bursts;i++){
   const at=time+i*.012,source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
   const length=kind==='hat'?(kit==='trap'?.025:kit==='brush'?.09:.045):kit==='brush'?.25:clap?.07:.15;
   source.buffer=kind==='snare'?snareNoise:hatNoise;filter.type=kind==='snare'?'bandpass':'highpass';filter.frequency.value=kind==='hat'?(kit==='trap'?7200:kit==='brush'?3200:5200):kit==='brush'?1800:clap?1400:kit==='electro'?2400:1100;filter.Q.value=kind==='snare'?.7:.35;
   gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime((kind==='hat'?.023:clap?.026:kit==='brush'?.035:.075)*accent,at+.004);gain.gain.exponentialRampToValueAtTime(.0001,at+length);
   source.connect(filter);filter.connect(gain);gain.connect(bus);musicVoices.add(source);source.onended=()=>{musicVoices.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};source.start(at);source.stop(at+length+.01);
  }
 };
 const schedule=()=>{
  if(!musicRequested||ctx.state!=='running')return;
  if(nextTime<ctx.currentTime)nextTime=ctx.currentTime+.10;
  if(nextTime>ctx.currentTime+.5)return;
  const chord=chords[chordIndex++%chords.length];
  profile.chordBeats.forEach(at=>chord.forEach(f=>note(f,nextTime+at*beat,beat*(profile.chordBeats.length===1?7.8:profile.instrument==='clav'||profile.instrument==='brass'?.45:1.6),'chord')));
  profile.melodyBeats.forEach((at,i)=>note(hz(profile.root+profile.melody[(i+Math.floor((chordIndex-1)/4))%profile.melody.length]+12),nextTime+at*beat+(i%2?profile.swing:0),beat*(profile.instrument==='soft_keys'||profile.instrument==='warm_organ'?1.65:profile.instrument==='jazz_bell'?1.1:.65),'lead'));
  profile.bassBeats.forEach((at,i)=>note(chord[i%2===0?0:2]/2,nextTime+at*beat,beat*(profile.kit==='trap'?1.3:.65),'bass'));
  profile.kicks.forEach(b=>drum('kick',nextTime+b*beat));
  profile.snares.forEach(b=>drum('snare',nextTime+b*beat+(profile.kit==='boom_bap'?.02:0)));
  profile.hats.forEach((at,i)=>drum('hat',nextTime+at*beat+(i%2?profile.swing:0),i%2?.5:.8));
  nextTime+=beat*8;
 };
 schedule();musicTimer=setInterval(schedule,250);
}
export function setDeckSoundEnabled(value:boolean){enabled=value;}
export function unlockDeckSound(){
 if(!enabled&&!musicRequested)return;
 try{context??=new AudioContext();void loadShuffleRecording().catch(()=>{});if(context.state==='suspended')void context.resume().then(startMusic).catch(()=>{});else startMusic();}catch{/* Audio is optional. */}
}
export function playDeckSound(kind:DeckSound){
 if(!enabled)return;
 if(kind==='fan'&&performance.now()-lastFan<250)return;
 unlockDeckSound();
 if(!context||context.state!=='running')return;
 if(kind==='fan')lastFan=performance.now();
 const ctx=context,start=ctx.currentTime;
 if(kind==='shuffle'||kind==='fan'){
  void loadShuffleRecording().then(buffer=>{
   if(!enabled||ctx.state!=='running')return;
   const source=ctx.createBufferSource();source.buffer=buffer;
   if(kind==='fan'){
    const gain=ctx.createGain(),now=ctx.currentTime,duration=Math.min(.25,buffer.duration);
    gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.8,now+.025);gain.gain.setValueAtTime(.8,now+duration-.06);gain.gain.linearRampToValueAtTime(0,now+duration);
    source.connect(gain);gain.connect(ctx.destination);source.onended=()=>{source.disconnect();gain.disconnect();};source.start(now,0,duration);
   }else{source.connect(ctx.destination);source.onended=()=>source.disconnect();source.start();}
  }).catch(()=>{});return;
 }
 if(kind==='victory'||kind==='failure'){
  const notes=kind==='victory'?[523.25,659.25,783.99,1046.5]:[392,329.63,261.63];
  notes.forEach((frequency,i)=>{
   const time=start+.15+i*.13,tone=ctx.createOscillator(),gain=ctx.createGain();
   tone.type='sine';tone.frequency.value=frequency;
   gain.gain.setValueAtTime(.001,time);gain.gain.exponentialRampToValueAtTime(.085,time+.015);gain.gain.exponentialRampToValueAtTime(.001,time+.38);
   tone.connect(gain);gain.connect(ctx.destination);tone.start(time);tone.stop(time+.4);
  });return;
 }
 if(kind==='letter'){
  for(const [frequency,volume] of [[1568,.09],[3136,.025]]){
   const tone=ctx.createOscillator(),gain=ctx.createGain();tone.type='sine';tone.frequency.value=frequency;
   gain.gain.setValueAtTime(.001,start);gain.gain.exponentialRampToValueAtTime(volume,start+.008);gain.gain.exponentialRampToValueAtTime(volume*.7,start+.30);gain.gain.exponentialRampToValueAtTime(.0001,start+(frequency===1568?2.05:1.35));gain.gain.linearRampToValueAtTime(0,start+2.12);
   tone.connect(gain);gain.connect(ctx.destination);tone.start(start);tone.stop(start+2.15);
  }return;
 }
 if(kind==='miss'){
  const tone=ctx.createOscillator(),gain=ctx.createGain();
  tone.type='sine';tone.frequency.setValueAtTime(180,start);tone.frequency.exponentialRampToValueAtTime(85,start+.14);
  gain.gain.setValueAtTime(.075,start);gain.gain.exponentialRampToValueAtTime(.001,start+.17);
  tone.connect(gain);gain.connect(ctx.destination);tone.start(start);tone.stop(start+.18);return;
 }
 // Drawing and discarding retain their separate swipe envelopes.
 const swipes=1;
 for(let swipe=0;swipe<swipes;swipe++){
 const time=start+swipe*.08;
 const duration=kind==='draw'?.38:kind==='discard'?.27:.30;
 const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate),data=buffer.getChannelData(0);
 let smooth=0;
 for(let j=0;j<data.length;j++){smooth=.35*smooth+.65*(Math.random()*2-1);data[j]=smooth;}
 const source=ctx.createBufferSource(),highpass=ctx.createBiquadFilter(),lowpass=ctx.createBiquadFilter(),gain=ctx.createGain();
 source.buffer=buffer;
 // Remove low thumps while retaining the broad paper/air texture, without a resonant tone.
 highpass.type='highpass';highpass.frequency.value=kind==='discard'?600:500;highpass.Q.value=.35;
 lowpass.type='lowpass';lowpass.Q.value=.35;
 // Drawing rises gently; discarding sweeps down with a quicker, softer finish.
 lowpass.frequency.setValueAtTime(kind==='draw'?1200:2600,time);lowpass.frequency.exponentialRampToValueAtTime(kind==='draw'?2600:kind==='discard'?850:1200,time+duration);
 const envelope=new Float32Array(160),volume=.15;
 for(let i=0;i<envelope.length;i++){
  const t=i/(envelope.length-1),progress=kind==='discard'?Math.pow(t,.7):t,softEdge=Math.pow(Math.sin(Math.PI*progress),1.5);
  // Fanning flutters rapidly; shuffle returns to a gentler continuous rustle.
  const flutter=false;
  const texture=flutter?.15+.85*Math.pow(Math.sin(Math.PI*30*(t*duration+swipe*.08)),2):1;
  envelope[i]=volume*softEdge*texture;
 }
 envelope[0]=0;envelope[envelope.length-1]=0;
 gain.gain.setValueCurveAtTime(envelope,start,duration);
 source.connect(highpass);highpass.connect(lowpass);lowpass.connect(gain);gain.connect(ctx.destination);source.start(time);source.stop(time+duration);
 }
}
