import { describe,it,expect } from 'vitest';
import { baseChallengePool,selectPoolChallenge,expandSelectedVariations } from '../domain/selectedChallengePool';
import { getChallengeComplexity } from '../domain/complexity';
const pool=baseChallengePool().filter(t=>['kickflip','tre_flip','impossible','heelflip'].includes(t.singleTrick!.baseTrickId));
describe('selected challenge pools',()=>{
 it('only draws selected exact tricks, without adding modifiers',()=>{
  for(let i=0;i<pool.length;i++){
   const result=selectPoolChallenge(pool,'single','all',()=>i/pool.length);
   expect(result).toEqual({...pool[i],complexity:getChallengeComplexity(pool[i])});
  }
 });
 it('does not mutate library challenges while practicing',()=>{
  const result=selectPoolChallenge(pool,'single','all',()=>0);
  if('error' in result)throw new Error(result.error);
  result.singleTrick!.stance='switch';expect(pool[0].singleTrick!.stance).toBe('regular');
 });
 it('rejects empty or incompatible pools without falling back to unrelated tricks',()=>{
  expect(selectPoolChallenge([],'single','all')).toHaveProperty('error');
  expect(selectPoolChallenge(pool,'obstacle','all')).toHaveProperty('error');
 });
 it('filters complexity and deduplicates repeated challenges',()=>{
  const result=selectPoolChallenge([...pool,...pool],'single','beginner',()=>0.99);
  if('error' in result)throw new Error(result.error);
  expect(getChallengeComplexity(result)).toBe('beginner');
 });
});

it('expands allowed stances and only requested applicable rotations',()=>{
 const kickflip=pool.filter(t=>t.singleTrick!.baseTrickId==='kickflip');
 const variants=expandSelectedVariations(kickflip,true,['frontside']);
 expect(new Set(variants.map(t=>t.singleTrick!.stance))).toEqual(new Set(['regular','fakie','switch','nollie']));
 expect(variants.every(t=>t.singleTrick!.direction==='frontside')).toBe(true);
 expect(variants.every(t=>t.singleTrick!.bodyVarial==='none')).toBe(true);
 const tre=baseChallengePool().filter(t=>t.singleTrick!.baseTrickId==='tre_flip');
 expect(expandSelectedVariations(tre,true,['frontside'])).toEqual([]);
 expect(expandSelectedVariations(kickflip,false,[])).toEqual([]);
});

it('honors individual stance selections and reports an empty stance pool',()=>{
 const kickflip=pool.filter(t=>t.singleTrick!.baseTrickId==='kickflip');
 const variants=expandSelectedVariations(kickflip,true,null,['nollie','switch']);
 expect(variants.map(t=>t.singleTrick!.stance).sort()).toEqual(['nollie','switch']);
 expect(expandSelectedVariations(kickflip,true,null,[])).toEqual([]);
 expect(expandSelectedVariations(kickflip,false,null,[])[0].singleTrick!.stance).toBe('regular');
});
