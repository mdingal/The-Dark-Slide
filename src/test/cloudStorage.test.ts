import { describe, it, expect, vi, beforeEach } from 'vitest';
const state = vi.hoisted(() => ({ user: { uid: 'rider1', email: 'rider@example.com', emailVerified: true }, data: undefined as Record<string, unknown> | undefined, setup:undefined as Record<string,unknown>|undefined, reads:[] as string[], writes: [] as unknown[][] }));
vi.mock('../services/firebase', () => ({ auth: { get currentUser() { return state.user; } }, db: {} }));
vi.mock('firebase/firestore', () => ({
 doc: (_db: unknown, ...parts: string[]) => parts.join('/'), collection: vi.fn(), getDocFromServer: vi.fn(), getDocsFromServer: vi.fn(), deleteDoc: vi.fn(),
 runTransaction: async (_db: unknown, fn: (tx: unknown) => Promise<void>) => fn({ get: async (ref:string) => (state.reads.push(ref),{ exists: () => !!(ref.includes('/savedSetups/')?state.setup:state.data), data: () => ref.includes('/savedSetups/')?state.setup:state.data }), set: (...args: unknown[]) => state.writes.push(args), delete: vi.fn(), update:(...args:unknown[])=>state.writes.push(args) }),
}));
import {getDocFromServer,getDocsFromServer} from 'firebase/firestore';
import { cleanCloudData, requireRider, storageService } from '../services/firebaseStorageService';
describe('cloud storage', () => {
 beforeEach(() => { storageService.clearMemory();state.reads=[]; state.user = { uid: 'rider1', email: 'rider@example.com', emailVerified: true }; state.data = undefined; state.setup=undefined; state.writes = []; vi.stubGlobal('navigator', { onLine: true }); });
 it('rejects another account and unverified users', () => { expect(() => requireRider('other')).toThrow(); state.user.emailVerified = false; expect(() => requireRider('rider1')).toThrow(); });
 it('rejects offline saves instead of writing local data', () => { vi.stubGlobal('navigator', { onLine: false }); expect(() => requireRider('rider1')).toThrow('offline'); });
 it('removes undefined optional properties but preserves zero and null', () => { expect(cleanCloudData({ first: 0, other: undefined, nested: { value: null } })).toEqual({ first: 0, nested: { value: null } }); });
 it('uses rider-scoped session path and advances acknowledged revision', async () => {
  const session = { id: 's1', attemptCount: 0 } as Parameters<typeof storageService.saveSession>[1];
  await storageService.saveSession('rider1', session); expect(state.writes[0][0]).toBe('users/rider1/sessions/s1'); expect(session.cloudRevision).toBe(1);
 });
 it('rejects stale session updates without overwriting newer data', async () => {
  state.data = { cloudRevision: 2 }; await expect(storageService.saveSession('rider1', { id: 's1', cloudRevision: 1 } as Parameters<typeof storageService.saveSession>[1])).rejects.toThrow('another device'); expect(state.writes).toHaveLength(0);
 });
 it('stores practice tools in separate documents and protects profile revisions', async () => {
  const p = { id: 'rider1', displayName: 'Rider', email: 'rider@example.com', preferredTheme: 'system', savedSetups: [{ id: 'setup1' }], bookmarks: [], availableObstacles: [] } as unknown as Parameters<typeof storageService.saveProfile>[0];
  await storageService.saveProfile(p); expect(state.writes.map(w => w[0])).toContain('users/rider1/savedSetups/setup1'); const root = state.writes.find(w => w[0] === 'users/rider1')![1] as Record<string, unknown>; expect(root.savedSetups).toBeUndefined(); expect(root.cloudRevision).toBe(1);
  state.data = { cloudRevision: 3 }; await expect(storageService.saveProfile(p)).rejects.toThrow('another device');
 });
});

it('locks a selected setup atomically with the first started session',async()=>{
 state.data=undefined;state.writes=[];state.setup={id:'board',name:'Board'};
 const s={id:'s1',setupSnapshot:{id:'board',name:'Board'},sessionStartedAt:'2026-10-04T10:00:00.000Z'} as Parameters<typeof storageService.saveSession>[1];
 await storageService.saveSession('rider1',s);
 expect(state.writes.some(w=>w[0]==='users/rider1/savedSetups/board')).toBe(true);
 expect(s.cloudRevision).toBe(1);
});
it('rejects a first-session setup snapshot changed on another device',async()=>{
 state.data=undefined;state.writes=[];state.setup={id:'board',name:'Updated board'};
 await expect(storageService.saveSession('rider1',{id:'s2',setupSnapshot:{id:'board',name:'Old board'},sessionStartedAt:'2026-10-04T10:00:00.000Z'} as Parameters<typeof storageService.saveSession>[1])).rejects.toThrow('changed on another device');
});


describe('quota-efficient saves',()=>{
 beforeEach(()=>{storageService.clearMemory();state.reads=[];state.writes=[];state.data=undefined;state.setup=undefined;state.user={uid:'rider1',email:'rider@example.com',emailVerified:true};vi.stubGlobal('navigator',{onLine:true});});
 const profile=()=>({id:'rider1',displayName:'Rider',email:'rider@example.com',preferredTheme:'dark',savedSetups:[{id:'board',name:'Board'}],bookmarks:[{id:'bookmark'}],partsInventory:[{id:'part',name:'Deck'}],poolPresets:[],trickLibrary:[],availableObstacles:[]} as unknown as Parameters<typeof storageService.saveProfile>[0]);
 it('a theme change writes only the profile, and an identical save writes nothing',async()=>{
  const p=profile();await storageService.saveProfile(p);state.data=state.writes.find(w=>w[0]==='users/rider1')![1] as Record<string,unknown>;state.writes=[];
  p.preferredTheme='light';await storageService.saveProfile(p);expect(state.writes.map(w=>w[0])).toEqual(['users/rider1']);
  state.data=state.writes[0][1] as Record<string,unknown>;state.writes=[];await storageService.saveProfile(p);expect(state.writes).toHaveLength(0);expect(p.cloudRevision).toBe(2);
 });
 it('editing one inventory item leaves unrelated tools untouched',async()=>{
  const p=profile();await storageService.saveProfile(p);state.data=state.writes.find(w=>w[0]==='users/rider1')![1] as Record<string,unknown>;state.writes=[];
  p.partsInventory![0].name='Updated deck';await storageService.saveProfile(p);expect(state.writes.map(w=>w[0])).toEqual(['users/rider1/partsInventory/part','users/rider1']);
 });
 it('existing started sessions do not reread their immutable setup',async()=>{
  state.data={cloudRevision:1,sessionStartedAt:'2026-10-04T10:00:00.000Z'};
  const s={id:'s1',cloudRevision:1,sessionStartedAt:'2026-10-04T10:00:00.000Z',setupSnapshot:{id:'board'},generatedAt:'2026-10-04T10:00:00.000Z'} as Parameters<typeof storageService.saveSession>[1];
  await storageService.saveSession('rider1',s);expect(state.reads).toEqual(['users/rider1/sessions/s1']);expect(s.cloudRevision).toBe(2);
 });
});


describe('profile read reuse',()=>{
 beforeEach(()=>{storageService.clearMemory();state.user={uid:'rider1',email:'rider@example.com',emailVerified:true};vi.stubGlobal('navigator',{onLine:true});vi.mocked(getDocFromServer).mockReset();vi.mocked(getDocsFromServer).mockReset();});
 it('checks the root revision, reuses unchanged tools, and refetches setup locks',async()=>{
  const root={id:'rider1',cloudRevision:2,toolIds:{savedSetups:['board'],bookmarks:['b'],poolPresets:[],trickLibrary:['t'],partsInventory:['p']}};
  vi.mocked(getDocFromServer).mockResolvedValue({exists:()=>true,data:()=>root} as any);
  vi.mocked(getDocsFromServer).mockResolvedValue({docs:[{data:()=>({id:'row'})}]} as any);
  await storageService.getProfile('rider1');expect(getDocsFromServer).toHaveBeenCalledTimes(4);
  vi.mocked(getDocsFromServer).mockResolvedValue({docs:[{data:()=>({id:'board',usedAt:'now'})}]} as any);
  const next=await storageService.getProfile('rider1');expect(getDocFromServer).toHaveBeenCalledTimes(2);expect(getDocsFromServer).toHaveBeenCalledTimes(5);expect(next?.savedSetups[0].usedAt).toBe('now');
  root.cloudRevision=3;await storageService.getProfile('rider1');expect(getDocsFromServer).toHaveBeenCalledTimes(9);
 });
 it('does not query collections indexed as empty and still supports legacy profiles',async()=>{
  vi.mocked(getDocFromServer).mockResolvedValueOnce({exists:()=>true,data:()=>({id:'rider1',cloudRevision:1,toolIds:{savedSetups:[],bookmarks:[],poolPresets:[],trickLibrary:[],partsInventory:[]}})} as any);
  const empty=await storageService.getProfile('rider1');expect(empty?.savedSetups).toEqual([]);expect(getDocsFromServer).not.toHaveBeenCalled();
  storageService.clearMemory();vi.mocked(getDocFromServer).mockResolvedValueOnce({exists:()=>true,data:()=>({id:'rider1'})} as any);vi.mocked(getDocsFromServer).mockResolvedValue({docs:[]} as any);await storageService.getProfile('rider1');expect(getDocsFromServer).toHaveBeenCalledTimes(5);
 });
});
