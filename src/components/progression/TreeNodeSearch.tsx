import React,{useId,useMemo,useRef,useState} from 'react';
import {Search,X} from 'lucide-react';
import {searchTreeNodes,TrickTreeNode} from '../../domain/trickTree';
export function TreeNodeSearch({nodes,onSelect,busy}:{nodes:TrickTreeNode[];onSelect:(id:string)=>void;busy:boolean}){
 const [query,setQuery]=useState(''),[open,setOpen]=useState(false),[index,setIndex]=useState(0);
 const input=useRef<HTMLInputElement>(null),root=useRef<HTMLDivElement>(null),id=useId();
 const results=useMemo(()=>searchTreeNodes(nodes,query),[nodes,query]);
 const visible=open&&query.trim().length>0;
 const choose=(node:TrickTreeNode)=>{if(busy)return;setOpen(false);setQuery(node.name);onSelect(node.id);};
 const move=(next:number)=>{const i=Math.max(0,Math.min(results.length-1,next));setIndex(i);requestAnimationFrame(()=>document.getElementById(`${id}-${i}`)?.scrollIntoView({block:'nearest'}));};
 return <div className="tree-node-search" ref={root} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setOpen(false);}}>
  <div className="tree-search-field"><Search size={16} aria-hidden="true"/><input ref={input} type="search" disabled={busy} placeholder="Find a trick…" aria-label="Search trick tree nodes" role="combobox" aria-autocomplete="list" aria-expanded={visible} aria-controls={`${id}-results`} aria-activedescendant={visible&&results[index]?`${id}-${index}`:undefined} value={query} onFocus={()=>setOpen(true)} onChange={e=>{setQuery(e.target.value);setIndex(0);setOpen(true);}} onKeyDown={e=>{
   if(e.key==='Escape'){setOpen(false);return;}
   if(e.key==='ArrowDown'){e.preventDefault();setOpen(true);move(visible?index+1:0);}
   if(e.key==='ArrowUp'){e.preventDefault();move(index-1);}
   if(e.key==='Enter'){e.preventDefault();if(visible&&results[index])choose(results[index]);}
  }}/>{query&&<button type="button" disabled={busy} aria-label="Clear node search" onClick={()=>{setQuery('');setIndex(0);setOpen(false);input.current?.focus();}}><X size={15}/></button>}</div>
  {visible&&<div className="tree-search-dropdown"><p className="tree-search-count" role="status">{results.length?`${results.length} matching trick${results.length===1?'':'s'}`:'No matching tricks. Try a trick or stance name.'}</p><div className="tree-search-results" id={`${id}-results`} role="listbox" aria-label="Matching tree nodes">{results.map((node,i)=><button type="button" tabIndex={-1} role="option" id={`${id}-${i}`} aria-selected={i===index} className={i===index?'is-highlighted':''} key={node.id} disabled={busy} onMouseDown={e=>e.preventDefault()} onMouseEnter={()=>setIndex(i)} onClick={()=>choose(node)}><span>{node.name}<small>{node.mastered?'Mastered':node.unlocked?'Ready to learn':'Prerequisites needed'}</small></span><span className="tree-search-landings">{node.totalLandings}/100</span></button>)}</div></div>}
 </div>;
}
