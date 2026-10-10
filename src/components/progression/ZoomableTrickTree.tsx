import React,{useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {Check,Lock,RotateCcw} from 'lucide-react';
import {TrickTreeNode} from '../../domain/trickTree';
import {connectedTricks,layoutScrollableTrickTree,TREE_FIXED_SCALE,TREE_CARD_WIDTH} from '../../domain/treeViewport';
import './TrickTree.css';
import {TreeNodeSearch} from './TreeNodeSearch';
// Retain the component name for compatibility with the existing page import.
export function ZoomableTrickTree({nodes,selectedId,onSelect,busy,journey,celebratingIds=[],onPanelSideChange,headerActions}:{nodes:TrickTreeNode[];selectedId:string;onSelect:(id:string)=>void;busy:boolean;journey?:React.ReactNode;headerActions?:React.ReactNode;celebratingIds?:string[];onPanelSideChange?:(side:'left'|'right')=>void}){
 const viewport=useRef<HTMLDivElement>(null),buttons=useRef(new Map<string,HTMLButtonElement>());
 const [width,setWidth]=useState(1200),[hover,setHover]=useState(''),[focus,setFocus]=useState('');
 const scale=width<640?Math.max(TREE_FIXED_SCALE,Math.min(1.2,(width-24)/(TREE_CARD_WIDTH+48))):TREE_FIXED_SCALE;
 const layout=useMemo(()=>layoutScrollableTrickTree(nodes,width,scale),[nodes,width,scale]);
 const active=hover||focus||selectedId,connected=useMemo(()=>connectedTricks(nodes,active),[nodes,active]);
 useLayoutEffect(()=>{
  const el=viewport.current;if(!el)return;const observer=new ResizeObserver(entries=>setWidth(entries[0].contentRect.width));observer.observe(el);return()=>observer.disconnect();
 },[]);
 useLayoutEffect(()=>{
  const section=viewport.current?.closest<HTMLElement>('.zoom-tree-surface');if(!section)return;
  const header=document.querySelector<HTMLElement>('.cutting-mat-page > .sticky'),nav=document.querySelector<HTMLElement>('.mobile-bottom-navigation');
  const measure=()=>{const headerHeight=header?.getBoundingClientRect().height||76,navHeight=nav&&getComputedStyle(nav).display!=='none'?nav.getBoundingClientRect().height:0;section.parentElement?.style.setProperty('--tree-shell-space',`${headerHeight+navHeight}px`);section.parentElement?.style.setProperty('--tree-header-height',`${headerHeight}px`);};
  const observer=new ResizeObserver(measure);if(header)observer.observe(header);if(nav)observer.observe(nav);measure();window.addEventListener('resize',measure);return()=>{observer.disconnect();window.removeEventListener('resize',measure);};
 },[]);
 const reveal=useCallback((id:string,alignTop=false)=>{
  const el=viewport.current,box=layout.boxes.get(id);if(!el||!box)return;
  const top=box.y*scale,bottom=(box.y+box.height)*scale;
  if(alignTop||top<el.scrollTop||bottom>el.scrollTop+el.clientHeight)el.scrollTo({top:Math.max(0,top-24),behavior:'instant'});
 },[layout,scale]);
 useEffect(()=>{if(selectedId)reveal(selectedId);},[selectedId,reveal]);
 useLayoutEffect(()=>{
  const box=layout.boxes.get(selectedId);if(!box||!onPanelSideChange)return;
  const columns=[...new Set([...layout.boxes.values()].map(b=>b.x))].sort((a,b)=>a-b);
  const rightmostTwo=columns.slice(-2);
  onPanelSideChange(rightmostTwo.includes(box.x)?'left':'right');
 },[selectedId,layout,onPanelSideChange]);
 const jump=(stance:string)=>{const id=stance==='regular'?'ollie':`ollie:${stance}`;reveal(id,true);buttons.current.get(id)?.focus({preventScroll:true});};
 return <section className="trick-tree-surface zoom-tree-surface fixed-scroll-tree"><header className="tree-map-header"><div className="tree-header-card clean-tree-header"><div className="zoom-tree-toolbar"><h2>Trick Tree</h2>{headerActions}</div><TreeNodeSearch nodes={nodes} busy={busy} onSelect={id=>{setHover('');setFocus('');reveal(id,true);onSelect(id);}}/><div className="fixed-tree-stance-navigation" role="group" aria-label="Jump to a stance">{layout.lanes.map(lane=><button type="button" key={lane.stance} onClick={()=>jump(lane.stance)}>{lane.label}</button>)}<button type="button" aria-label="Scroll to the start of the tree" title="Back to top" onClick={()=>{viewport.current?.scrollTo({top:0,behavior:'instant'});setHover('');setFocus('');}}><RotateCcw size={17}/></button></div><p className="zoom-tree-help" id="tree-controls-help">10 lands per prerequisite unlocks the next trick. 100 lands earns mastery.</p>{journey}</div></header><div ref={viewport} className="zoom-tree-viewport fixed-tree-viewport" tabIndex={0} role="region" aria-label="Scrollable trick tree" aria-describedby="tree-controls-help"><div className="fixed-tree-sizer" style={{width:layout.width*scale,height:layout.height*scale}}><div className="zoom-tree-world" style={{width:layout.width,height:layout.height,transform:`scale(${scale})`}}>
 {layout.lanes.map(lane=><div key={lane.stance} className="zoom-tree-stance-lane" style={{left:lane.x-12,top:lane.y,width:lane.width+24,height:lane.height}} aria-hidden="true"><span>{lane.label}</span></div>)}
 <svg className="zoom-tree-lines" width={layout.width} height={layout.height} aria-hidden="true">{layout.edges.map(edge=>{const highlighted=!!active&&connected.has(edge.from)&&connected.has(edge.to);return <g key={edge.from+':'+edge.to} className={`${active&&!highlighted?'zoom-tree-muted':''} ${celebratingIds.includes(edge.to)?'tree-new-path':''}`}><path d={edge.path} fill="none" stroke={highlighted?'var(--tree-accent)':'var(--tree-muted)'} strokeWidth={highlighted?3:1.5} opacity={highlighted?1:.4}/><path d={edge.path} fill="none" stroke="transparent" strokeWidth={16} className="zoom-tree-line-hit" onMouseEnter={()=>setHover(edge.from)} onMouseLeave={()=>setHover('')} onClick={()=>{if(!busy)onSelect(edge.to);}}/></g>;})}</svg>
 {nodes.map(node=>{const box=layout.boxes.get(node.id)!;return <button type="button" key={node.id} disabled={busy} ref={el=>{if(el)buttons.current.set(node.id,el);else buttons.current.delete(node.id);}} style={{left:box.x,top:box.y,width:box.width,height:box.height}} className={`tree-node zoom-tree-node ${node.mastered?'is-mastered':''} ${celebratingIds.includes(node.id)?'is-new-unlock':''} ${node.id===selectedId?'is-selected':''} ${active&&connected.has(node.id)?'is-connected':''} ${active&&!connected.has(node.id)?'zoom-tree-muted':''}`} aria-pressed={node.id===selectedId} onClick={()=>onSelect(node.id)} onMouseEnter={()=>setHover(node.id)} onMouseLeave={()=>setHover('')} onFocus={e=>{setFocus(node.id);if(e.currentTarget.matches(':focus-visible'))reveal(node.id);}} onBlur={()=>setFocus('')}><span className="tree-status">{node.mastered?<Check size={13}/>:!node.unlocked?<Lock size={13}/>:<i className="tree-status-dot"/>}{node.mastered?'Mastered':!node.unlocked?'Locked':node.state==='learning'?'Learning':'Ready'}</span><span className="tree-node-name">{node.name}</span><span className="tree-node-family">{node.stance||'Regular'} · {node.family}</span><span className="tree-node-progress"><progress max={100} value={Math.min(100,node.totalLandings)} aria-label={`${node.name}: ${node.totalLandings} of 100 successful landings`}/><span>{node.totalLandings}/100</span></span><span className="tree-landing-milestone">{node.mastered?'Mastery earned':node.totalLandings>=75?'75-land milestone':node.totalLandings>=50?'50-land milestone':node.totalLandings>=25?'25-land milestone':node.established?'10-land milestone':node.totalLandings>0?'First landing recorded':'Your first landing starts here'}</span></button>;})}
 </div></div></div><div className="tree-legend"><span><i className="ready"/>Ready to learn</span><span><i className="mastered"/>Mastered</span><span><Lock size={12}/>Prerequisites needed</span><span>{nodes.filter(n=>n.mastered).length}/{nodes.length} mastered</span></div></section>;
}
