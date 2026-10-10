import {TrickTreeNode} from './trickTree';
export interface TreeView {x:number;y:number;scale:number}
export interface TreeBox {x:number;y:number;width:number;height:number}
export const TREE_CARD_WIDTH=220,TREE_CARD_HEIGHT=148;
export function zoomTree(view:TreeView,scale:number,anchor:{x:number;y:number}):TreeView{
 const next=Math.max(.01,Math.min(2,scale)),ratio=next/view.scale;
 return {scale:next,x:anchor.x-(anchor.x-view.x)*ratio,y:anchor.y-(anchor.y-view.y)*ratio};
}
export function fitTreeBox(box:TreeBox,size:{width:number;height:number},maxScale=1):TreeView{
 const scale=Math.max(.01,Math.min(maxScale,(Math.max(1,size.width-64))/box.width,(Math.max(1,size.height-64))/box.height));
 return {scale,x:(size.width-box.width*scale)/2-box.x*scale,y:(size.height-box.height*scale)/2-box.y*scale};
}
export function layoutTrickTree(nodes:TrickTreeNode[]){
 const levels=[...new Set(nodes.map(n=>n.depth))].sort((a,b)=>a-b);
 const columns=2,columnGap=24,laneGap=64,padding=48,rowGap=38,bandGap=84;
 const laneWidth=TREE_CARD_WIDTH*columns+columnGap;
 const stances=['regular','fakie','nollie','switch'] as const;
 const lanes=stances.filter(stance=>nodes.some(n=>(n.stance||'regular')===stance)).map((stance,i)=>({stance,label:stance.charAt(0).toUpperCase()+stance.slice(1),x:padding+i*(laneWidth+laneGap),width:laneWidth}));
 const width=padding*2+lanes.length*laneWidth+Math.max(0,lanes.length-1)*laneGap;
 const boxes=new Map<string,TreeBox>();let y=88;
 for(const level of levels){
  let rows=1;
  for(const lane of lanes){
   const score=(n:TrickTreeNode)=>{const parents=n.prerequisites.map(id=>boxes.get(id)).filter((p):p is TreeBox=>!!p);return parents.length?parents.reduce((sum,p)=>sum+p.x+p.width/2,0)/parents.length:lane.x+laneWidth/2;};
   const group=nodes.filter(n=>n.depth===level&&(n.stance||'regular')===lane.stance).sort((a,b)=>score(a)-score(b)||a.name.localeCompare(b.name));
   rows=Math.max(rows,Math.ceil(group.length/columns));
   group.forEach((node,i)=>boxes.set(node.id,{x:lane.x+(i%columns)*(TREE_CARD_WIDTH+columnGap),y:y+Math.floor(i/columns)*(TREE_CARD_HEIGHT+rowGap),width:TREE_CARD_WIDTH,height:TREE_CARD_HEIGHT}));
  }
  y+=rows*(TREE_CARD_HEIGHT+rowGap)-rowGap+bandGap;
 }
 const edges=nodes.flatMap(node=>node.prerequisites.filter(id=>boxes.has(id)).map(id=>{
  const from=boxes.get(id)!,to=boxes.get(node.id)!;
  // Route down the spaces between columns, then across a row gap, avoiding the stacked cards.
  const x1=from.x+from.width,y1=from.y+from.height/2,gutter=x1+12,x2=to.x+to.width/2,y2=to.y;
  return {from:id,to:node.id,path:`M${x1} ${y1} H${gutter} V${y2-18} H${x2} V${y2}`};
 }));
 return {boxes,edges,lanes,width,height:y-bandGap+padding};
}
export function treeBounds(boxes:TreeBox[]):TreeBox{
 if(!boxes.length)return {x:0,y:0,width:220,height:148};
 const x=Math.min(...boxes.map(b=>b.x)),y=Math.min(...boxes.map(b=>b.y));
 return {x,y,width:Math.max(...boxes.map(b=>b.x+b.width))-x,height:Math.max(...boxes.map(b=>b.y+b.height))-y};
}
export function connectedTricks(nodes:TrickTreeNode[],id:string){
 const result=new Set<string>();if(!id)return result;result.add(id);
 const visit=(current:string)=>{for(const node of nodes)if(node.prerequisites.includes(current)&&!result.has(node.id)){result.add(node.id);visit(node.id);}};
 visit(id);nodes.find(n=>n.id===id)?.prerequisites.forEach(parent=>result.add(parent));return result;
}

export const TREE_MAX_ZOOM=1.5;
export function treeZoomLimits(canvas:{width:number;height:number},size:{width:number;height:number}){
 return {min:Math.max(.01,Math.min(TREE_MAX_ZOOM,(Math.max(1,size.width-64))/canvas.width,(Math.max(1,size.height-64))/canvas.height)),max:TREE_MAX_ZOOM};
}
/** Keep the map inside its outer edges, with a small margin around the boundary. */
export function constrainTreeView(view:TreeView,canvas:{width:number;height:number},size:{width:number;height:number}):TreeView{
 const limits=treeZoomLimits(canvas,size),scale=Math.max(limits.min,Math.min(limits.max,view.scale));
 const bound=(position:number,length:number,viewport:number)=>length<=viewport?(viewport-length)/2:Math.max(viewport-length-32,Math.min(32,position));
 return {scale,x:bound(view.x,canvas.width*scale,size.width),y:bound(view.y,canvas.height*scale,size.height)};
}

export const TREE_FIXED_SCALE=.82;
/** Responsive stance lanes at a fixed readable scale; narrow screens stack lanes vertically. */
export function layoutScrollableTrickTree(nodes:TrickTreeNode[],viewportWidth:number,scale=TREE_FIXED_SCALE){
 const padding=24,gap=48,columnGap=24,rowGap=38,bandGap=84;
 const stances=['regular','fakie','nollie','switch'] as const;
 const present=stances.filter(stance=>nodes.some(n=>(n.stance||'regular')===stance));
 const wideLane=2*TREE_CARD_WIDTH+columnGap;
 const columns=viewportWidth>=scale*(padding*2+4*wideLane+3*gap)?2:1;
 const laneWidth=columns*TREE_CARD_WIDTH+(columns-1)*columnGap;
 const capacity=Math.max(1,Math.floor((viewportWidth/scale-padding*2+gap)/(laneWidth+gap)));
 const perRow=Math.min(present.length,capacity>=4?4:capacity>=2?2:1);
 const boxes=new Map<string,TreeBox>(),lanes:{stance:string;label:string;x:number;y:number;width:number;height:number}[]=[];
 let rowTop=0,rowHeight=0;
 for(let index=0;index<present.length;index++){
  if(index>0&&index%perRow===0){rowTop+=rowHeight+96;rowHeight=0;}
  const stance=present[index],x=padding+(index%perRow)*(laneWidth+gap);
  const group=nodes.filter(n=>(n.stance||'regular')===stance),levels=[...new Set(group.map(n=>n.depth))].sort((a,b)=>a-b);
  let y=rowTop+88;
  for(const level of levels){
   const row=group.filter(n=>n.depth===level).sort((a,b)=>a.name.localeCompare(b.name));
   row.forEach((node,i)=>boxes.set(node.id,{x:x+(i%columns)*(TREE_CARD_WIDTH+columnGap),y:y+Math.floor(i/columns)*(TREE_CARD_HEIGHT+rowGap),width:TREE_CARD_WIDTH,height:TREE_CARD_HEIGHT}));
   y+=Math.ceil(row.length/columns)*(TREE_CARD_HEIGHT+rowGap)-rowGap+bandGap;
  }
  const height=y-rowTop-bandGap+padding;rowHeight=Math.max(rowHeight,height);
  lanes.push({stance,label:stance.charAt(0).toUpperCase()+stance.slice(1),x,y:rowTop,width:laneWidth,height});
 }
 const edges=nodes.flatMap(node=>node.prerequisites.filter(id=>boxes.has(id)).map(id=>{const from=boxes.get(id)!,to=boxes.get(node.id)!,x1=from.x+from.width,y1=from.y+from.height/2,gutter=x1+12,x2=to.x+to.width/2,y2=to.y;return {from:id,to:node.id,path:`M${x1} ${y1} H${gutter} V${y2-18} H${x2} V${y2}`};}));
 return {boxes,edges,lanes,width:padding*2+perRow*laneWidth+Math.max(0,perRow-1)*gap,height:rowTop+rowHeight};
}
