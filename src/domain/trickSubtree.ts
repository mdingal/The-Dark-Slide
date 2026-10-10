import {TrickTreeNode} from './trickTree';
/** Follow outgoing prerequisite edges only. Outside prerequisites stay requirements, not extra branches. */
export function trickSubtree(nodes:TrickTreeNode[],rootId:string){
 const included=new Set<string>(nodes.some(n=>n.id===rootId)?[rootId]:[]);
 let changed=true;while(changed){changed=false;for(const node of nodes)if(!included.has(node.id)&&node.prerequisites.some(id=>included.has(id))){included.add(node.id);changed=true;}}
 const depths=new Map<string,number>();
 const depth=(id:string):number=>{if(depths.has(id))return depths.get(id)!;const node=nodes.find(n=>n.id===id)!;const parents=id===rootId?[]:node.prerequisites.filter(p=>included.has(p));const value=parents.length?1+Math.max(...parents.map(depth)):0;depths.set(id,value);return value;};
 return nodes.filter(n=>included.has(n.id)).map(n=>({...n,depth:depth(n.id)})).sort((a,b)=>a.depth-b.depth||a.name.localeCompare(b.name));
}
