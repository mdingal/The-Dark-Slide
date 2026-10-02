import React from 'react';
import './FeatureVisual.css';

type Preview = { caption:string; label:string; value:string; rows?:[string,string][]; tags?:string[]; bars?:[string,number][]; steps?:string[] };
const previews: Record<string,Preview> = {
 'Tricks That Make Sense':{caption:'Challenge generator',label:'REGULAR · FLATGROUND',value:'Kickflip',tags:['Stance locked','No modifiers'],rows:[['Next challenge','Ready to generate']]},
 'Combos & Obstacle Challenges':{caption:'Obstacle sequence',label:'LEDGE · FRONTSIDE',value:'FS 50-50',steps:['Ollie in','50-50','Clean exit']},
 'Choose Your Challenge Level':{caption:'Complexity filter',label:'CHALLENGE COMPLEXITY',value:'Intermediate',tags:['Beginner','Intermediate','Advanced']},
 'Learn with Trick Guides':{caption:'Trick reference',label:'FLIP TRICKS · BEGINNER',value:'Kickflip',rows:[['01 · Foundation','Ollie'],['02 · Technique','Pop, flick, catch'],['03 · Next step','Practice this trick']]},
 'Locks, Pools & Saved Challenges':{caption:'Pool configuration',label:'SAVED PRESET',value:'Flip-trick practice',rows:[['Stance','Regular · locked'],['Trick pool','Kickflip / Heelflip'],['Preset','Saved']]},
 'Your Personal Trick Library':{caption:'Personal library',label:'YOUR TRICK COLLECTION',value:'Learning progression',rows:[['Heelflip','Learning'],['Kickflip','Landed'],['Ollie','Consistent']]},
 'Your Rider Showcase':{caption:'Rider showcase',label:'YOUR PROFILE',value:'Make it yours',rows:[['Practice goal','Learn a clean Heelflip'],['Featured trick','Kickflip'],['Milestone','First landing']]},
 'Your Selected Trick Pool':{caption:'Selected trick pool',label:'YOUR PRACTICE MIX',value:'Kickflip',tags:['Kickflip','Tre Flip','Impossible'],rows:[['Stance','Regular / Switch'],['Rotation','None / FS']]},
 'Sessions & Share Cards':{caption:'Practice session',label:'SESSION IN PROGRESS',value:'Kickflip',rows:[['Attempts / landings','12 / 5'],['Elapsed time','04:32'],['Latest attempt','Landed']]},
 'First Lands & Consistency Goals':{caption:'Consistency tracking',label:'FIRST LANDING',value:'Attempt 4 · 01:18',rows:[['Current streak','3 consecutive landings'],['Consistency goal','3 / 3 complete']]},
 'Find Your Weak Points':{caption:'Miss analysis',label:'KICKFLIP · COMMON MISSES',value:'Underflip',bars:[['Underflip',80],['Missed catch',50],['Overflip',25]]},
 'Daily & Weekly Challenges':{caption:'Community challenges',label:'SHARED CHALLENGES',value:'Daily · Kickflip',rows:[['Daily goal','Land once'],['Weekly goal','Land three times'],['Completion','Saved to your account']]},
 'Personal Bests & Progress Dashboard':{caption:'Personal bests',label:'KICKFLIP · PROGRESS',value:'Your best sessions',rows:[['First landing','4 attempts'],['Landing rate','72%'],['Longest streak','6 landings']]},
 'Compare Your Setups':{caption:'Setup comparison',label:'SAME TRICK · LANDING RATE',value:'Kickflip',bars:[['Setup A',45],['Setup B',68],['Setup C',57]]},
 'Your Dashboard, Your Focus':{caption:'Dashboard workspace',label:'PINNED INSIGHTS',value:'Your progress at a glance',tags:['Landing rate','Best streak','Miss tags'],rows:[['Filters','Trick / date / setup']]},
 'Milestones Worth Celebrating':{caption:'Progress milestones',label:'YOUR ACHIEVEMENTS',value:'First landing',rows:[['Streak record','5 in a row'],['Landing rate','Improved by 20 points'],['Community','Weekly completed']]},
};
export const FeatureVisual: React.FC<{title:string}> = ({title}) => {
 const [frame,setFrame] = React.useState(0);
 const [playing,setPlaying] = React.useState(false);
 const root = React.useRef<HTMLDivElement>(null);
 React.useEffect(() => {
   const node=root.current; if(!node)return;
   const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
   let visible=false;
   const sync=()=>setPlaying(visible&&!motion.matches);
   const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.35});
   observer.observe(node); motion.addEventListener('change',sync);
   return ()=>{observer.disconnect();motion.removeEventListener('change',sync);};
 },[]);
 React.useEffect(()=>{if(!playing)return;const timer=window.setInterval(()=>setFrame(f=>(f+1)%4),2200);return ()=>window.clearInterval(timer);},[playing]);
 const base=previews[title]; if(!base)return null;
 const p:Preview={...base};
 const messages:Record<string,string[]>={
   'Tricks That Make Sense':['Choose your parameters','Generate a challenge','Try the new trick','Generate another challenge'],
   'Combos & Obstacle Challenges':['Choose the obstacle','Set your entry','Lock into the grind','Choose a clean exit'],
   'Choose Your Challenge Level':['Choose a complexity','Beginner challenges','Intermediate challenges','Advanced challenges'],
   'Learn with Trick Guides':['Open a guide','Learn the foundation','Read the technique','Start practicing'],
   'Locks, Pools & Saved Challenges':['Choose your pool','Lock Regular stance','Randomize the trick','Save your preset'],
   'Your Personal Trick Library':['Choose a trick','Start learning','Record a landing','Build consistency'],
   'Your Rider Showcase':['Set a practice goal','Feature a trick','Choose your accent','Showcase a milestone'],
   'Your Selected Trick Pool':['Select specific tricks','Choose stance variations','Choose valid rotations','Generate from your pool'],
   'Sessions & Share Cards':['Start the session','Log an attempt','Record a landing','Review your counters'],
   'First Lands & Consistency Goals':['Record the first landing','One successful landing','Two consecutive landings','Goal: three in a row'],
   'Find Your Weak Points':['Tag a missed attempt','Group the miss tags','Compare common issues','Focus your next session'],
   'Daily & Weekly Challenges':['Join a challenge','Record your landings','Finish the session','Completion recorded'],
   'Personal Bests & Progress Dashboard':['Practice again','Record the first landing','Compare previous sessions','Recognize a personal best'],
   'Compare Your Setups':['Choose the same trick','Compare Setup A','Compare Setup B','Compare Setup C'],
   'Your Dashboard, Your Focus':['Choose an insight','Pin landing rate','Add your streaks','Filter by trick or setup'],
   'Milestones Worth Celebrating':['Land it for the first time','Build a new streak','Improve your landing rate','Complete a shared challenge'],
 };
 const sequence=(items:string[])=>items[frame];
 if(title==='Tricks That Make Sense')p.value=sequence(['Kickflip','Heelflip','Pop Shuvit','Tre Flip']);
 if(title==='Choose Your Challenge Level')p.value=sequence(['Intermediate','Beginner','Intermediate','Advanced']);
 if(title==='Locks, Pools & Saved Challenges')p.rows=[['Stance','Regular · locked'],['Trick pool',sequence(['Kickflip / Heelflip','Kickflip / Heelflip','Heelflip selected','Preset saved'])],['Preset',frame===3?'Saved':'Flip-trick practice']];
 if(title==='Your Personal Trick Library')p.rows=[['Status filter',sequence(['Want to Learn','Learning','Landed','Consistent'])],['Selected tricks','Heelflip / Kickflip'],['Next challenge','Shuffle from library']];
 if(title==='Your Selected Trick Pool')p.value=sequence(['Kickflip','Switch Kickflip','FS Kickflip','Impossible']);
 if(title==='Sessions & Share Cards')p.rows=[['Attempts / landings',sequence(['0 / 0','1 / 0','2 / 1','3 / 2'])],['Elapsed time',sequence(['00:00','00:12','00:24','00:36'])],['Latest attempt',sequence(['Ready','Missed','Landed','Landed'])]];
 if(title==='First Lands & Consistency Goals')p.rows=[['Current streak',sequence(['0 landings','1 landing','2 consecutive landings','3 consecutive landings'])],['Consistency goal',`${frame} / 3${frame===3?' complete':''}`]];
 if(title==='Your Rider Showcase')p.rows=[['Practice goal','Learn a clean Heelflip'],['Featured trick',sequence(['Ollie','Kickflip','Heelflip','Tre Flip'])],['Accent',sequence(['Mustard','Blue','Purple','Green'])]];
 if(title==='Daily & Weekly Challenges')p.rows=[['Challenge',sequence(['Daily · Kickflip','Weekly · Combo','Daily · Kickflip','Weekly · Combo'])],['Landing goal',sequence(['0 / 1','1 / 3','1 / 1','3 / 3'])],['Status',sequence(['Not joined','In progress','Completed','Completed'])]];
 if(title==='Personal Bests & Progress Dashboard')p.rows=[['First landing',sequence(['8 attempts','6 attempts','5 attempts','4 attempts'])],['Landing rate',sequence(['42%','50%','61%','72%'])],['Longest streak',sequence(['2 landings','3 landings','4 landings','6 landings'])]];
 if(title==='Milestones Worth Celebrating')p.value=sequence(['First landing','New best streak','Landing rate improved','Weekly challenge complete']);
 if(title==='Your Dashboard, Your Focus')p.tags=[['Landing rate'],['Landing rate','Best streak'],['Landing rate','Best streak','Miss tags'],['Kickflip filter','Best streak','Miss tags']][frame];
 const message=messages[title]?.[frame]||'Explore the tool';
 return <div ref={root} className={`feature-preview ${playing?'fp-playing':''}`}>
   <div className="fp-toolbar"><span>{p.caption}</span></div>
   <div className="fp-body" aria-hidden="true"><p className="fp-eyebrow">{p.label}</p><p className="fp-heading"><span key={p.value} className="fp-update">{p.value}</span></p>
     {p.steps&&<div className="fp-flow">{p.steps.map((step,i)=><React.Fragment key={step}>{i>0&&<span className="fp-connector">→</span>}<span className={`fp-node ${frame===i+1?'fp-node-active':''}`}><span className="fp-number">0{i+1}</span>{step}</span></React.Fragment>)}</div>}
     {p.tags&&<div className="fp-tags">{p.tags.map(tag=><span key={tag} className={`fp-tag ${tag===p.value||tag==='Landed'?'fp-tag-active':''}`}>{tag}</span>)}</div>}
     {p.rows&&<div className="fp-rows">{p.rows.map(([label,value])=><div key={label} className={`fp-row ${title==='Learn with Trick Guides'&&frame===p.rows!.findIndex(row=>row[0]===label)+1?'fp-row-active':''}`}><span>{label}</span><strong><span key={value} className="fp-update">{value}</span></strong></div>)}</div>}
     {p.bars&&<div className="fp-bars">{p.bars.map(([label,value])=><div key={label} className={`fp-bar-row ${frame===p.bars!.findIndex(bar=>bar[0]===label)+1?'fp-bar-active':''}`}><span>{label}</span><div className="fp-track"><div style={{width:(title==='Find Your Weak Points'?Math.max(8,value*(.4+frame*.2)):value)+'%'}}/></div><span className="fp-bar-value">{value}%</span></div>)}</div>}
   </div>
   <div className="fp-demo-footer" aria-hidden="true"><span key={message} className="fp-update">{message}</span><span className="fp-demo-dots">{[0,1,2,3].map(i=><span key={i} className={i===frame?'fp-dot-current':''}/>)}</span></div>
 </div>;
};
