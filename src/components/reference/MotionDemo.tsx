import React, { useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';

export const MotionDemo: React.FC<{trickId:string; name:string}> = ({trickId,name}) => {
  const [playing,setPlaying]=useState(false),[run,setRun]=useState(0);
  return <figure className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
    <div className="flex justify-between items-center gap-3"><figcaption className="text-sm font-semibold">{name} · motion sketch</figcaption><button type="button" className="guide-filter inline-flex gap-2 items-center" onClick={()=>{setRun(n=>n+1);setPlaying(true);}}>{run?<RotateCcw className="w-3.5 h-3.5"/>:<Play className="w-3.5 h-3.5"/>}{run?'Replay':'Play demo'}</button></div>
    <div className="guide-motion-stage" aria-label={`${name} board movement illustration`} role="img">
      <div className="guide-motion-ground"/>
      {trickId==='50-50'&&<div className="guide-motion-ledge"/>}
      <div key={run} className={`guide-motion-board guide-motion-${trickId} ${playing?'guide-motion-playing':''}`} onAnimationEnd={()=>setPlaying(false)}><span/><span/></div>
    </div>
    <p className="text-xs leading-5 text-neutral-500 dark:text-neutral-400">{trickId==='50-50'?'Pop → engage both trucks → grind → exit':'Pop → rotation / leveling → catch → landing'}. Simplified motion, not an exact finger-technique demonstration.</p>
    <p className="guide-reduced-motion text-xs text-neutral-500">Animation is disabled by your reduced-motion setting. Use the step-by-step instructions below.</p>
  </figure>;
};
