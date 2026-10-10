import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import './PlayingCards.css';
import {deckBackDesign} from './deckBackDesigns';
import {BrandLogo} from '../common/BrandLogo';
import {playDeckSound,unlockDeckSound} from './deckSounds';
import {WildcardType} from '../../domain/deckGame';
import {Play,Check,X} from 'lucide-react';

export function CardBack({deckId}:{deckId?:string}){
 const art=deckBackDesign(deckId),v=art.variation,offset=v*6;
 return <div className={`playing-card-back playing-back-design-${art.index}`} style={{'--deck-ink':art.color} as React.CSSProperties} aria-hidden="true"><svg className="playing-back-art" viewBox="0 0 200 280" fill="none" aria-hidden="true">
 <rect x="10" y="10" width="180" height="260" rx="12" stroke="currentColor" strokeOpacity=".6"/>
 <rect x="17" y="17" width="166" height="246" rx="7" stroke="currentColor" strokeOpacity=".2"/>
 <g stroke="currentColor" strokeWidth={v===2?1.3:.9} strokeOpacity=".34">
 {art.pattern===0&&Array.from({length:9},(_,i)=><path key={i} d={`M22 ${48+i*22} L100 ${28+i*22-offset} L178 ${48+i*22}`}/>)}
 {art.pattern===1&&Array.from({length:7},(_,i)=><rect key={i} x={29+i*7} y={55+i*10} width={142-i*14} height={170-i*20} rx={v===1?14:2} transform={`rotate(${v*12} 100 140)`}/>)}
 {art.pattern===2&&Array.from({length:8},(_,i)=><ellipse key={i} cx="100" cy="140" rx={20+i*9} ry={26+i*(12+v)}/>)}
 {art.pattern===3&&Array.from({length:12},(_,i)=><path key={i} d={`M24 ${40+i*17} Q${60+offset} ${20+i*17} 100 ${40+i*17} T176 ${40+i*17}`}/>)}
 {art.pattern===4&&Array.from({length:8},(_,i)=><g key={i}><path d={`M${25+i*21} 36V244 M24 ${42+i*27}H176`}/>{v>0&&<path d={`M24 ${42+i*27}L176 ${76+i*22}`} strokeOpacity=".5"/>}</g>)}
 {art.pattern===5&&Array.from({length:7},(_,i)=><path key={i} d={`M100 ${28+i*14} L${179-i*10} 140 L100 ${252-i*14} L${21+i*10} 140Z`} transform={`rotate(${v*8} 100 140)`}/>)}
 </g><rect x="56" y="108" width="88" height="64" rx={v===0?32:v===1?12:2} fill="#101114" stroke="currentColor" strokeOpacity=".55"/>
 <g fill="currentColor" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="8" letterSpacing="2" textAnchor="middle"><text x="100" y="34">DARK SLIDE</text><text x="100" y="253">SESSION / {art.code}</text></g>
 </svg><BrandLogo monogram className="playing-back-logo"/></div>;
}
export function CardStack({count,label='Draw pile',played=false,deckId}:{deckId?:string;count:number;label?:string;played?:boolean}){
 return <div className={`playing-stack-wrap ${played?'playing-played-pile':''}`}><div className={`playing-stack ${count===0?'playing-stack-empty':''}`} aria-label={`${label}: ${count} cards, face down`}>{count>0?<>{count>2&&<span className="playing-stack-layer layer-two"><CardBack deckId={deckId}/></span>}{count>1&&<span className="playing-stack-layer layer-one"><CardBack deckId={deckId}/></span>}<CardBack deckId={deckId}/></>:<span className="playing-empty-label">EMPTY</span>}</div><p className="playing-pile-label">{label}<strong>{count} {count===1?'card':'cards'}</strong></p></div>;
}
export function DeckPicker({name,count,disabled,onChoose,deckId,normalStatus,skateStatus,wildcardStatus,resumes,onResume}:{deckId?:string;name:string;count:number;disabled:boolean;onChoose:()=>void;normalStatus:string;skateStatus:string;wildcardStatus:string;resumes:{id:string;label:string}[];onResume:(id:string)=>void}){
 return <section className="playing-deck-picker"><button type="button" className="playing-deck-hitbox" disabled={disabled} onPointerDown={unlockDeckSound} onPointerEnter={()=>{if(!disabled&&window.matchMedia?.('(hover: hover)').matches)playDeckSound('fan');}} onClick={onChoose} aria-label={`Play ${name}, ${count} cards`}><div className="playing-deck-fan" aria-hidden="true">{[-2,-1,0,1,2].map((position,i)=><div key={position} className="playing-fan-card" style={{'--fan-position':position,zIndex:i} as React.CSSProperties}><CardBack deckId={deckId}/></div>)}</div></button><h2>{name}</h2><div className="playing-deck-count-row"><p className="playing-deck-count">{count} cards</p>{resumes.length?resumes.map(r=><button key={r.id} type="button" className="playing-deck-resume" disabled={disabled} onClick={()=>onResume(r.id)} title={r.label} aria-label={r.label}><Play size={15} aria-hidden="true"/></button>):<button type="button" className="playing-deck-resume" disabled title="No session to resume" aria-label="No session to resume"><Play size={15} aria-hidden="true"/></button>}</div><div className="playing-deck-completion">{[['Normal',normalStatus],['SKATE',skateStatus],['Wildcard',wildcardStatus]].map(([mode,status])=><span key={mode} title={`${mode}: ${status}`} aria-label={`${mode}: ${status}`} className={`playing-deck-badge ${status==='Completed'?'is-complete':''}`}>{status==='Completed'?<Check size={11} aria-hidden="true"/>:<X size={11} aria-hidden="true"/>}{mode}</span>)}</div></section>;
}
export function DrawnTrickCard({name,number,total,status,onReveal,departing=false,shaking=false,wildcard,targetLabel,deckId}:{deckId?:string;wildcard?:WildcardType;targetLabel?:string;shaking?:boolean;departing?:boolean;name:string;number:number;total:number;status:'live'|'passed'|'missed';onReveal:()=>void}){
 const displayName=wildcard==='body_varial'?name.replace(/\s+\+\s+Body Varial \/ Sex Change$/,''):wildcard==='revert'?name.replace(/\s+\+\s+Revert$/,''):name;
 const [revealed,setRevealed]=useState(false);
 const cardRef=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{
  if(!departing||!cardRef.current)return;
  const card=cardRef.current,pile=card.closest('.playing-table')?.querySelector('.playing-stack-wrap:last-child .playing-stack');
  if(!pile)return;
  const from=card.getBoundingClientRect(),to=pile.getBoundingClientRect();
  card.style.setProperty('--discard-x',`${to.left+to.width/2-from.left-from.width/2}px`);
  card.style.setProperty('--discard-y',`${to.top+to.height/2-from.top-from.height/2}px`);
  card.style.setProperty('--discard-scale',String(to.width/from.width));
 },[departing]);
 useEffect(()=>{
  const reveal=()=>{setRevealed(true);onReveal();};
  if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){reveal();return;}
  const timer=window.setTimeout(reveal,1100);return()=>window.clearTimeout(timer);
 },[onReveal]);
 return <div ref={cardRef} className={`playing-draw ${revealed?'is-revealed':''} ${departing?'is-departing':''} ${shaking?'is-shaking':''}`} aria-live="polite"><div className="playing-flip"><div className="playing-back-face"><CardBack deckId={deckId}/></div><div className={`playing-front-face ${wildcard?`playing-wildcard-face playing-wildcard-${wildcard}`:''}`}><div className="playing-front-ornament" aria-hidden="true"/><div className="playing-card-content"><p className="playing-card-small">{wildcard?WILDCARD_TITLES[wildcard]:'SESSION CHALLENGE'}</p>{wildcard&&<WildcardEmblem type={wildcard}/>}<span className="playing-front-diamond" aria-hidden="true"/><h2>{displayName}</h2>{targetLabel&&<p className="playing-wildcard-rule">{targetLabel}</p>}<span className={`playing-card-status status-${status}`}>{status==='passed'?'PASSED':status==='missed'?'MISSED':wildcard?'JOKER RULE':'LAND IT ONCE'}</span></div></div></div></div>;
}

export function ShufflingDeck({name,disabled,onDraw,deckId}:{deckId?:string;name:string;disabled:boolean;onDraw:()=>void}){
 const [ready,setReady]=useState(false);
 useEffect(()=>{playDeckSound('shuffle');const timer=window.setTimeout(()=>setReady(true),2000);return()=>window.clearTimeout(timer);},[]);
 return <div className="playing-shuffle-stage"><p className="text-xs uppercase tracking-widest text-[#D4A72C]">{name}</p><button type="button" className={`playing-shuffle-deck ${ready?'is-ready':'is-shuffling'}`} disabled={!ready||disabled} onClick={onDraw} aria-label={ready?'Draw the first card':'Shuffling deck'} aria-busy={!ready}>{[0,1,2,3,4].map(i=><span key={i} className="playing-shuffle-card" style={{'--shuffle-index':i} as React.CSSProperties}><CardBack deckId={deckId}/></span>)}</button><p role="status" className="text-base font-semibold">{ready?'Click the deck to draw your first card.':'Shuffling…'}</p></div>;
}

function JokerMark(){return <svg className="playing-joker-mark" viewBox="0 0 64 52" role="img" aria-label="Joker"><path d="M16 34L8 12Q20 8 28 25L32 5L37 25Q46 8 56 12L48 34Z" fill="currentColor"/><circle cx="8" cy="10" r="4" fill="currentColor"/><circle cx="32" cy="5" r="4" fill="currentColor"/><circle cx="56" cy="10" r="4" fill="currentColor"/><path d="M17 37Q32 50 47 37M22 30H26M38 30H42" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>;}

const WILDCARD_TITLES:Record<WildcardType,string>={revert:'REVERT',body_varial:'BODY VARIAL',double:'DOUBLE UP',triple:'TRIPLE THREAT',one_attempt:'ONE SHOT',opposite_stance:'STANCE SWAP',sudden_death:'SUDDEN DEATH'};
function WildcardEmblem({type}:{type:WildcardType}){
 const marks:Record<WildcardType,React.ReactNode>={
  revert:<><path d="M43 22A17 17 0 1 0 46 40M43 12V24H31"/><path d="M23 36H39"/></>,
  body_varial:<><circle cx="32" cy="18" r="4"/><path d="M32 23V40M23 28L32 25L41 28M32 40L25 49M32 40L39 49M17 23L12 29L18 34M47 34L52 29L46 23"/></>,
  double:<><rect x="12" y="15" width="25" height="34" rx="4"/><rect x="27" y="10" width="25" height="34" rx="4"/><text x="39" y="34">2</text></>,
  triple:<><path d="M16 43V19Q16 15 20 15H38M23 48V14Q23 10 27 10H45"/><rect x="30" y="6" width="25" height="39" rx="4"/><text x="42" y="33">3</text></>,
  one_attempt:<><circle cx="32" cy="30" r="22"/><circle cx="32" cy="30" r="15"/><path d="M26 23L31 19H35V37H40V41H24V37H29V25L26 27Z" fill="currentColor" stroke="none"/></>,
  opposite_stance:<g transform="translate(32 30) scale(.7) translate(-32 -30)"><path d="M10 20H51L42 11M51 20L42 29M54 43H13L22 34M13 43L22 52"/></g>,
  sudden_death:<><path d="M18 32V24A14 14 0 0 1 46 24V32L41 37V47H23V37ZM28 41V47M36 41V47"/><circle cx="26" cy="28" r="3"/><circle cx="38" cy="28" r="3"/><path d="M30 35L32 32L34 35"/></>
 };
 return <div className="playing-wildcard-emblem"><svg viewBox="0 0 64 60" className="playing-wildcard-symbol" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{marks[type]}</svg><JokerMark/></div>;
}
