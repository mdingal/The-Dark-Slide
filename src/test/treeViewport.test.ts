import {expect,it} from 'vitest';
import {trickTree} from '../domain/trickTree';
import {layoutScrollableTrickTree,TREE_FIXED_SCALE,constrainTreeView,treeZoomLimits,layoutTrickTree,fitTreeBox,treeBounds,zoomTree,connectedTricks} from '../domain/treeViewport';
it('lays out the whole flatground tree once, with every shared prerequisite edge',()=>{
 const nodes=trickTree([]).filter(n=>n.family!=='Grinds & slides'),layout=layoutTrickTree(nodes);
 expect(layout.boxes.size).toBe(nodes.length);
 expect(layout.edges.length).toBe(nodes.reduce((sum,n)=>sum+n.prerequisites.filter(id=>layout.boxes.has(id)).length,0));
 for(const n of nodes){const box=layout.boxes.get(n.id)!;expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(layout.width);expect(box.y+box.height).toBeLessThanOrEqual(layout.height);for(const p of n.prerequisites){const parent=layout.boxes.get(p);if(parent)expect(parent.y+parent.height).toBeLessThan(box.y);}}
 const boxes=[...layout.boxes.values()];for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)if(boxes[i].y===boxes[j].y)expect(Math.abs(boxes[i].x-boxes[j].x)).toBeGreaterThanOrEqual(boxes[i].width);
});
it('zooms around the pointer and clamps the zoom range',()=>{
 const view={x:-120,y:60,scale:.5},anchor={x:160,y:180},next=zoomTree(view,1,anchor);
 expect((anchor.x-next.x)/next.scale).toBe((anchor.x-view.x)/view.scale);expect((anchor.y-next.y)/next.scale).toBe((anchor.y-view.y)/view.scale);
 expect(zoomTree(view,20,anchor).scale).toBe(2);expect(zoomTree(view,.001,anchor).scale).toBe(.01);
});
it('fit and reset center the requested bounds inside desktop and mobile viewports',()=>{
 const box={x:260,y:300,width:520,height:380};for(const size of [{width:900,height:560},{width:340,height:400}]){const v=fitTreeBox(box,size);expect(box.x*v.scale+v.x).toBeGreaterThanOrEqual(0);expect((box.x+box.width)*v.scale+v.x).toBeLessThanOrEqual(size.width);expect((box.y+box.height)*v.scale+v.y).toBeLessThanOrEqual(size.height);}
 expect(treeBounds([{x:20,y:30,width:50,height:70},{x:100,y:150,width:80,height:90}])).toEqual({x:20,y:30,width:160,height:210});
});
it('highlights descendants and direct prerequisites without including unrelated branches',()=>{
 const nodes=trickTree([]),connected=connectedTricks(nodes,'kickflip');
 expect(connected.has('ollie')).toBe(true);expect(connected.has('double_kickflip')).toBe(true);expect(connected.has('nightmare_flip')).toBe(true);expect(connected.has('heelflip')).toBe(false);expect(connectedTricks(nodes,'').size).toBe(0);
});

it('fits the complete tree on a narrow phone screen',()=>{
 const nodes=trickTree([]).filter(n=>n.family!=='Grinds & slides'),layout=layoutTrickTree(nodes),size={width:280,height:360};
 const v=fitTreeBox({x:0,y:0,width:layout.width,height:layout.height},size);expect(v.x).toBeGreaterThanOrEqual(0);expect(v.x+layout.width*v.scale).toBeLessThanOrEqual(size.width);expect(v.y+layout.height*v.scale).toBeLessThanOrEqual(size.height);
});

it('stops panning at the outer map edges and caps zoom at 150%',()=>{
 const canvas={width:4000,height:1700},size={width:1000,height:600};
 expect(constrainTreeView({x:99999,y:99999,scale:1},canvas,size)).toEqual({x:32,y:32,scale:1});
 expect(constrainTreeView({x:-99999,y:-99999,scale:1},canvas,size)).toEqual({x:-3032,y:-1132,scale:1});
 const large=constrainTreeView({x:0,y:0,scale:99},canvas,size);expect(large.scale).toBe(1.5);
 const small=constrainTreeView({x:0,y:0,scale:.001},canvas,size);expect(small.scale).toBe(treeZoomLimits(canvas,size).min);expect(small.x).toBeCloseTo((size.width-canvas.width*small.scale)/2);expect(small.y).toBeCloseTo((size.height-canvas.height*small.scale)/2);
});
it('rechecks map boundaries when the viewport changes size',()=>{
 const canvas={width:4000,height:1700},wide={width:1000,height:600},narrow={width:340,height:500};
 const first=constrainTreeView({x:-10000,y:-10000,scale:1},canvas,narrow),resized=constrainTreeView(first,canvas,wide);
 expect(resized.x).toBeGreaterThanOrEqual(wide.width-canvas.width-32);expect(resized.y).toBeGreaterThanOrEqual(wide.height-canvas.height-32);
});

it('makes the complete tree taller than it is wide, with compact stance lanes',()=>{
 const nodes=trickTree([]).filter(n=>n.family!=='Grinds & slides'),layout=layoutTrickTree(nodes);
 expect(layout.height).toBeGreaterThan(layout.width);expect(layout.width).toBeLessThan(2300);expect(layout.lanes.map(l=>l.stance)).toEqual(['regular','fakie','nollie','switch']);
 for(const node of nodes){const lane=layout.lanes.find(l=>l.stance===(node.stance||'regular'))!,box=layout.boxes.get(node.id)!;expect(box.x).toBeGreaterThanOrEqual(lane.x);expect(box.x+box.width).toBeLessThanOrEqual(lane.x+lane.width);}
 for(const lane of layout.lanes){const rows=new Map<number,number>();for(const node of nodes.filter(n=>(n.stance||'regular')===lane.stance)){const y=layout.boxes.get(node.id)!.y;rows.set(y,(rows.get(y)||0)+1);}expect(Math.max(...rows.values())).toBeLessThanOrEqual(2);}
});

it('routes connecting lines through gutters without crossing unrelated cards',()=>{
 const layout=layoutTrickTree(trickTree([]).filter(n=>n.family!=='Grinds & slides'));
 for(const edge of layout.edges){
  const [x1,y1,gutter,gapY,x2,y2]=edge.path.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
  const segments=[[x1,y1,gutter,y1],[gutter,y1,gutter,gapY],[gutter,gapY,x2,gapY],[x2,gapY,x2,y2]];
  for(const [id,box] of layout.boxes){if(id===edge.from||id===edge.to)continue;for(const [ax,ay,bx,by] of segments){const crosses=ax===bx?ax>box.x&&ax<box.x+box.width&&Math.max(ay,by)>box.y&&Math.min(ay,by)<box.y+box.height:ay>box.y&&ay<box.y+box.height&&Math.max(ax,bx)>box.x&&Math.min(ax,bx)<box.x+box.width;expect(crosses,`${edge.from} -> ${edge.to} crosses ${id}`).toBe(false);}}
 }
});

it('keeps the 82% tree inside desktop, tablet and phone widths with native vertical stacking',()=>{
 const nodes=trickTree([]).filter(n=>n.family!=='Grinds & slides');expect(TREE_FIXED_SCALE).toBe(.82);
 for(const width of [280,340,390,768,1200,1876]){const layout=layoutScrollableTrickTree(nodes,width);expect(layout.width*TREE_FIXED_SCALE).toBeLessThanOrEqual(width);expect(layout.boxes.size).toBe(88);for(const n of nodes){const box=layout.boxes.get(n.id)!;expect(box.y+box.height).toBeLessThanOrEqual(layout.height);for(const parent of n.prerequisites)expect(layout.boxes.get(parent)!.y+148).toBeLessThan(box.y);}}
 const desktop=layoutScrollableTrickTree(nodes,1876);expect(new Set(['ollie','ollie:fakie','ollie:nollie','ollie:switch'].map(id=>desktop.boxes.get(id)!.y)).size).toBe(1);
 const mobile=layoutScrollableTrickTree(nodes,340);expect(mobile.lanes[1].y).toBeGreaterThan(mobile.lanes[0].y+mobile.lanes[0].height);
});
