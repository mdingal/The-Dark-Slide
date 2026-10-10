import {it,expect} from 'vitest';
import {trickTree} from '../domain/trickTree';
import {trickSubtree} from '../domain/trickSubtree';
it('follows all descendants without adding unrelated parent branches',()=>{
 const nodes=trickTree([]),branch=trickSubtree(nodes,'kickflip');
 expect(branch.some(n=>n.id==='double_kickflip')).toBe(true);
 expect(branch.some(n=>n.id==='nightmare_flip')).toBe(true);
 expect(branch.some(n=>n.id==='ollie')).toBe(false);
 expect(branch.some(n=>n.id==='heelflip')).toBe(false);
 expect(branch.find(n=>n.id==='kickflip')?.depth).toBe(0);
 expect(branch.find(n=>n.id==='nightmare_flip')?.unlocked).toBe(false);
});
it('shows multiple-parent descendants once and returns empty for unknown roots',()=>{
 const nodes=trickTree([]),branch=trickSubtree(nodes,'ollie');
 expect(branch.length).toBe(new Set(branch.map(n=>n.id)).size);
 for(const node of branch)for(const parent of node.prerequisites){const p=branch.find(n=>n.id===parent);if(p)expect(node.depth).toBeGreaterThan(p.depth);}
 expect(trickSubtree(nodes,'missing')).toEqual([]);
});
