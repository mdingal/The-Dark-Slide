import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { beforeAll, afterAll, test, vi, expect } from 'vitest';
let env: RulesTestEnvironment;
beforeAll(async () => { env = await initializeTestEnvironment({ projectId: 'demo-dark-slide', firestore: { host: '127.0.0.1', port: 8080, rules: readFileSync(process.env.FIRESTORE_RULES_FILE || 'firestore.rules', 'utf8') } }); });
afterAll(async () => { await env?.cleanup(); });
const rider = (id: string, verified = true) => env.authenticatedContext(id, { email: `${id}@example.com`, email_verified: verified }).firestore();
test('verified owner can create profile and session', async () => {
 const db = rider('owner'); await assertSucceeds(setDoc(doc(db, 'users/owner'), { id: 'owner', email: 'owner@example.com', displayName: 'Rider', preferredTheme: 'system' }));
 await assertSucceeds(setDoc(doc(db, 'users/owner/sessions/session1'), { id: 'session1', attemptCount: 2 }));
 await assertSucceeds(getDoc(doc(db, 'users/owner/sessions/session1')));
});
test('another rider cannot read or write someone else’s records', async () => {
 const db = rider('other'); await assertFails(getDoc(doc(db, 'users/owner'))); await assertFails(getDoc(doc(db, 'users/owner/sessions/session1')));
 await assertFails(setDoc(doc(db, 'users/owner/sessions/foreign'), { id: 'foreign' }));
});
test('anonymous and unverified accounts cannot access rider records', async () => {
 await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'users/owner')));
 await assertFails(setDoc(doc(rider('unverified', false), 'users/unverified'), { id: 'unverified', email: 'unverified@example.com', displayName: 'Rider' }));
});
test('clients cannot grant roles or pricing entitlements', async () => {
 await assertFails(setDoc(doc(rider('owner'), 'users/owner'), { id: 'owner', email: 'owner@example.com', displayName: 'Rider', admin: true }));
 await assertFails(setDoc(doc(rider('owner'), 'users/owner/billing/pro'), { id: 'pro' }));
});
test('document IDs and authenticated emails must match', async () => {
 await assertFails(setDoc(doc(rider('owner'), 'users/owner'), { id: 'owner', email: 'someone@example.com', displayName: 'Rider' }));
 await assertFails(setDoc(doc(rider('owner'), 'users/owner/savedSetups/one'), { id: 'two' }));
});
test('inventory and onboarding are private cloud records', async()=>{
 const db=rider('hardware');await assertSucceeds(setDoc(doc(db,'users/hardware'),{id:'hardware',email:'hardware@example.com',displayName:'Rider',onboarding:{version:1,step:0,answers:{}}}));
 await assertSucceeds(setDoc(doc(db,'users/hardware/partsInventory/deck'),{id:'deck',kind:'deck',name:'Test deck'}));
 await assertFails(getDoc(doc(rider('other'),'users/hardware/partsInventory/deck')));
});
test('used setup configurations are immutable but can be favorited',async()=>{
 const db=rider('hardware'),ref=doc(db,'users/hardware/savedSetups/board');
 await assertSucceeds(setDoc(ref,{id:'board',name:'My board',deckWidthMm:34}));
 await assertSucceeds(setDoc(ref,{id:'board',name:'My board',deckWidthMm:34,usedAt:'2026-10-04T10:00:00.000Z'}));
 await assertSucceeds(setDoc(ref,{id:'board',name:'My board',deckWidthMm:34,usedAt:'2026-10-04T10:00:00.000Z',favorite:true}));
 await assertFails(setDoc(ref,{id:'board',name:'My board',deckWidthMm:32,usedAt:'2026-10-04T10:00:00.000Z',favorite:true}));
});
test('started sessions retain their setup and practice plan',async()=>{
 const db=rider('hardware'),ref=doc(db,'users/hardware/sessions/started');
 const s={id:'started',sessionStartedAt:'2026-10-04T10:00:00.000Z',setupSnapshot:{id:'board'},goal:{type:'landings',target:3},practiceSurface:'Marble',practiceTimer:{type:'regular'},attemptCount:0};
 await assertSucceeds(setDoc(ref,s));await assertSucceeds(setDoc(ref,{...s,attemptCount:1}));
 await assertFails(setDoc(ref,{...s,goal:{type:'landings',target:1}}));
 await assertFails(setDoc(ref,{...s,setupSnapshot:{id:'other'}}));
});

test('every private record bucket rejects foreign reads and writes',async()=>{
 for(const bucket of ['sessions','savedSetups','bookmarks','poolPresets','trickLibrary','partsInventory']){
  await assertFails(getDoc(doc(rider('other'),`users/owner/${bucket}/private-record`)));
  await assertFails(setDoc(doc(rider('other'),`users/owner/${bucket}/foreign-record`),{id:'foreign-record'}));
 }
});

test('saved practice targets are validated and remain private to the verified owner',async()=>{
 const db=rider('target-owner'),ref=doc(db,'users/target-owner');
 const target={id:'next',createdAt:'2026-10-07T00:00:00Z',title:'Kickflip · five landings',reason:'Build on your last session.',trickResult:{mode:'single',canonicalName:'Kickflip'},goal:{type:'landings',target:5}};
 const profile={id:'target-owner',email:'target-owner@example.com',displayName:'Rider',practiceTarget:target};
 await assertSucceeds(setDoc(ref,profile));
 await assertFails(getDoc(doc(rider('other'),'users/target-owner')));
 await assertFails(setDoc(doc(rider('other'),'users/target-owner'),profile));
 await assertFails(setDoc(ref,{...profile,practiceTarget:{...target,goal:{type:'landings',target:0}}}));
 await assertFails(setDoc(ref,{...profile,practiceTarget:{...target,goal:{type:'time',target:1441}}}));
 await assertFails(setDoc(ref,{...profile,practiceTarget:{...target,goal:{type:'streak',target:2.5}}}));
 await assertFails(setDoc(ref,{...profile,practiceTarget:{...target,focusTag:'invented'}}));
 await assertFails(setDoc(ref,{...profile,practiceTarget:{...target,admin:true}}));
 await assertSucceeds(setDoc(ref,{...profile,practiceTarget:{...target,goal:{type:'time',target:10}}}));
 await assertSucceeds(setDoc(ref,{...profile,practiceTarget:null}));
});
const deckGame={gameId:'deck-test',deckId:'fundamentals',mode:'normal',order:['ollie','bs180','fs180','fakie_ollie','pop_shuv','fakie_pop_shuv','half_cab','fakie_fs180'],cardIndex:0,lettersBefore:0,gameStartedAt:'2026-10-07T01:00:00Z',endedEarly:false};
const deckSession={id:'deck-card',deckGame,sessionStartedAt:'2026-10-07T01:00:00Z',attemptCount:0,landingCount:0,goal:{type:'landings',target:1},practiceTimer:{type:'regular'}};
test('verified owners can record bounded deck attempts and end a game',async()=>{
 const ref=doc(rider('deck-owner'),'users/deck-owner/sessions/deck-card');
 await assertSucceeds(setDoc(ref,deckSession));
 await assertSucceeds(setDoc(ref,{...deckSession,attemptCount:5}));
 await assertSucceeds(setDoc(ref,{...deckSession,attemptCount:5,deckGame:{...deckGame,endedEarly:true}}));
 await assertFails(getDoc(doc(rider('other'),'users/deck-owner/sessions/deck-card')));
});
test('rejects changed deck identity, duplicate order, and attempts beyond the mode budget',async()=>{
 const db=rider('deck-check'),ref=doc(db,'users/deck-check/sessions/deck-card');
 await assertSucceeds(setDoc(ref,deckSession));
 await assertFails(setDoc(ref,{...deckSession,deckGame:{...deckGame,cardIndex:1}}));
 await assertFails(setDoc(ref,{...deckSession,attemptCount:6}));
 await assertFails(setDoc(doc(db,'users/deck-check/sessions/duplicate'),{...deckSession,id:'duplicate',deckGame:{...deckGame,order:Array(8).fill('ollie')}}));
 await assertFails(setDoc(doc(db,'users/deck-check/sessions/skate'),{...deckSession,id:'skate',attemptCount:2,deckGame:{...deckGame,mode:'skate'}}));
 await assertSucceeds(setDoc(doc(db,'users/deck-check/sessions/final'),{...deckSession,id:'final',attemptCount:2,deckGame:{...deckGame,mode:'skate',lettersBefore:4}}));
});
test('dedicated flip decks save only their exact eight-card order',async()=>{
 const db=rider('flip-decks');
 for(const [deckId,base] of [['heelflips','heelflip'],['kickflips','kickflip']]){
  const order=[base,'fakie_'+base,'nollie_'+base,'switch_'+base,'fs_'+base,'bs_'+base,'fakie_fs_'+base,'fakie_bs_'+base];
  const id=deckId;
  await assertSucceeds(setDoc(doc(db,`users/flip-decks/sessions/${id}`),{...deckSession,id,deckGame:{...deckGame,deckId,order}}));
  await assertFails(setDoc(doc(db,`users/flip-decks/sessions/${id}-bad`),{...deckSession,id:id+'-bad',deckGame:{...deckGame,deckId,order:deckGame.order}}));
 }
});

test('second-row decks accept exact catalog orders and reject wrong cards',async()=>{
 const db=rider('extra-decks');
 const decks={'shuvits': ['regular_pop_shuvit', 'fakie_pop_shuvit', 'nollie_pop_shuvit', 'switch_pop_shuvit', 'regular_frontside_pop_shuvit', 'fakie_frontside_pop_shuvit', 'nollie_frontside_pop_shuvit', 'switch_frontside_pop_shuvit'], 'spins': ['regular_frontside_180', 'regular_backside_180', 'fakie_frontside_180', 'fakie_backside_180', 'nollie_frontside_180', 'nollie_backside_180', 'switch_frontside_180', 'switch_backside_180'], 'varial-flips': ['regular_varial_kickflip', 'fakie_varial_kickflip', 'nollie_varial_kickflip', 'switch_varial_kickflip', 'regular_varial_heelflip', 'fakie_varial_heelflip', 'nollie_varial_heelflip', 'switch_varial_heelflip'], '360-flips': ['regular_tre_flip', 'fakie_tre_flip', 'nollie_tre_flip', 'switch_tre_flip', 'regular_laser_flip', 'fakie_laser_flip', 'nollie_laser_flip', 'switch_laser_flip']};
 for(const [deckId,order] of Object.entries(decks)){
  await assertSucceeds(setDoc(doc(db,`users/extra-decks/sessions/${deckId}`),{...deckSession,id:deckId,deckGame:{...deckGame,deckId,order}}));
  await assertFails(setDoc(doc(db,`users/extra-decks/sessions/${deckId}-wrong`),{...deckSession,id:deckId+'-wrong',deckGame:{...deckGame,deckId,order:deckGame.order}}));
 }
});


import {GAME_DECKS} from '../src/domain/deckGame';
test('all catalog decks allow exact orders and reject foreign or duplicate cards',async()=>{
 const db=rider('all-decks');
 for(const deck of GAME_DECKS){
  const order=deck.cards.map(c=>c.id),session={...deckSession,id:deck.id,deckGame:{...deckGame,deckId:deck.id,order}};
  await assertSucceeds(setDoc(doc(db,`users/all-decks/sessions/${deck.id}`),session));
  await assertFails(setDoc(doc(db,`users/all-decks/sessions/${deck.id}-bad`),{...session,id:deck.id+'-bad',deckGame:{...session.deckGame,order:['invented',...order.slice(1)]}}));
  await assertFails(setDoc(doc(db,`users/all-decks/sessions/${deck.id}-duplicate`),{...session,id:deck.id+'-duplicate',deckGame:{...session.deckGame,order:Array(order.length).fill(order[0])}}));
 }
});


test('wildcard mode bounds extra landings, attempts, and immutable joker assignments',async()=>{
 const db=rider('wild-owner');
 const wildcards=[{cardIndex:0,type:'triple'},{cardIndex:1,type:'one_attempt'},{cardIndex:2,type:'sudden_death'}];
 const triple={...deckSession,id:'triple',goal:{type:'landings',target:3},deckGame:{...deckGame,mode:'wildcard',wildcards}};
 const ref=doc(db,'users/wild-owner/sessions/triple');
 await assertSucceeds(setDoc(ref,triple));
 await assertSucceeds(setDoc(ref,{...triple,attemptCount:5,landingCount:3}));
 await assertFails(setDoc(ref,{...triple,attemptCount:6,landingCount:3}));
 await assertFails(setDoc(ref,{...triple,goal:{type:'landings',target:1}}));
 await assertFails(setDoc(ref,{...triple,deckGame:{...triple.deckGame,wildcards:[{cardIndex:0,type:'double'},...wildcards.slice(1)]}}));
 const one={...deckSession,id:'one',deckGame:{...triple.deckGame,cardIndex:1}};
 await assertSucceeds(setDoc(doc(db,'users/wild-owner/sessions/one'),{...one,attemptCount:1,landingCount:1}));
 await assertFails(setDoc(doc(db,'users/wild-owner/sessions/one-bad'),{...one,id:'one-bad',attemptCount:2}));
 for(const [id,w] of [['missing',wildcards.slice(1)],['duplicate',[wildcards[0],wildcards[0],wildcards[2]]],['unknown',[{cardIndex:0,type:'invented'},...wildcards.slice(1)]]]){
  await assertFails(setDoc(doc(db,`users/wild-owner/sessions/${id}`),{...triple,id,deckGame:{...triple.deckGame,wildcards:w}}));
 }
});

import {newDeckCard,recordDeckAttempt} from '../src/domain/deckGame';
test('actual wildcard session payloads save after misses and landings',async()=>{
 const db=rider('wild-real'),d=GAME_DECKS.find(d=>d.id==='basic-flips')!;
 const g={...deckGame,mode:'wildcard' as const,deckId:d.id,order:d.cards.map(c=>c.id),wildcards:[{cardIndex:1,type:'triple' as const},{cardIndex:2,type:'one_attempt' as const},{cardIndex:3,type:'opposite_stance' as const}]};
 const clean=(x:unknown)=>JSON.parse(JSON.stringify(x));
 let session=newDeckCard(g,{id:'board',name:'Daily 34',deckWidthMm:34,wheelMaterial:'urethane'},'Non-laminated wood',1000);
 const ref=doc(db,`users/wild-real/sessions/${session.id}`);
 await assertSucceeds(setDoc(ref,clean(session)));
 session=recordDeckAttempt(session,false,2000);await assertSucceeds(setDoc(ref,clean({...session,cloudRevision:2})));
 session=recordDeckAttempt(session,true,3000);await assertSucceeds(setDoc(ref,clean({...session,cloudRevision:3})));
});


import {WILDCARD_TYPES,cardTarget} from '../src/domain/deckGame';
import {pauseTimer,startTimer} from '../src/domain/timer';
test('all seven jokers accept realistic attempts, pause, resume, and completion payloads',async()=>{
 const db=rider('wild-all'),clean=(x:unknown)=>JSON.parse(JSON.stringify(x));
 for(const deckId of ['basic-flips','big-flips','switch-mix'])for(const type of WILDCARD_TYPES){
  const d=GAME_DECKS.find(d=>d.id===deckId)!;
  const g={...deckGame,mode:'wildcard' as const,deckId,order:d.cards.map(c=>c.id),wildcards:[{cardIndex:0,type},{cardIndex:3,type:'triple' as const},{cardIndex:7,type:'opposite_stance' as const}]};
  let session=newDeckCard(g,{id:'board',name:'Daily 34',deckWidthMm:34,wheelMaterial:'urethane'},'Non-laminated wood',1000);
  const ref=doc(db,`users/wild-all/sessions/${session.id}`);await assertSucceeds(setDoc(ref,clean(session)));
  session={...session,timerState:pauseTimer(session.timerState,1100)};await assertSucceeds(setDoc(ref,clean(session)));
  session={...session,timerState:startTimer(session.timerState,1200)};await assertSucceeds(setDoc(ref,clean(session)));
  const target=cardTarget(session.deckGame!);
  for(let i=0;i<target;i++){session=recordDeckAttempt(session,true,2000+i*1000);await assertSucceeds(setDoc(ref,clean({...session,cloudRevision:i+2})));}
 }
});

test('sudden death rejects a second attempt on the server',async()=>{
 const db=rider('sudden-owner');
 const wildcards=[{cardIndex:0,type:'sudden_death'},{cardIndex:3,type:'triple'},{cardIndex:7,type:'opposite_stance'}];
 const s={...deckSession,id:'sudden',deckGame:{...deckGame,mode:'wildcard',wildcards}};
 const ref=doc(db,'users/sudden-owner/sessions/sudden');
 await assertSucceeds(setDoc(ref,s));
 await assertSucceeds(setDoc(ref,{...s,attemptCount:1,landingCount:0}));
 await assertFails(setDoc(ref,{...s,attemptCount:2,landingCount:0}));
 await assertFails(setDoc(ref,{...s,attemptCount:2,landingCount:1}));
});

test('an old unfinished sudden-death card can be closed without adding attempts',async()=>{
 const wildcards=[{cardIndex:0,type:'sudden_death'},{cardIndex:3,type:'triple'},{cardIndex:7,type:'opposite_stance'}];
 const s={...deckSession,id:'legacy',attemptCount:2,cloudRevision:3,deckGame:{...deckGame,mode:'wildcard',wildcards}};
 await env.withSecurityRulesDisabled(async context=>{await setDoc(doc(context.firestore(),'users/legacy-wild/sessions/legacy'),s);});
 const ref=doc(rider('legacy-wild'),'users/legacy-wild/sessions/legacy');
 await assertSucceeds(setDoc(ref,{...s,status:'failed',sessionEndedAt:'2026-10-08T15:00:00Z',cloudRevision:4}));
 await assertFails(setDoc(ref,{...s,attemptCount:3}));
 await assertFails(setDoc(ref,{...s,landingCount:1}));
});

test('private session summaries are restricted to verified owners',async()=>{
 const owner=rider('summary-owner'),ref=doc(owner,'users/summary-owner/sessionIndex/a');
 await assertSucceeds(setDoc(ref,{version:1,split:false,rows:{session:'{}'}}));
 await assertSucceeds(getDoc(ref));
 await assertFails(getDoc(doc(rider('summary-other'),'users/summary-owner/sessionIndex/a')));
 await assertFails(setDoc(doc(rider('summary-unverified',false),'users/summary-unverified/sessionIndex/a'),{version:1,split:false,rows:{}}));
 await assertFails(setDoc(doc(owner,'users/summary-owner/sessionIndex/not-a-hash'),{version:1,split:false,rows:{}}));
 await assertSucceeds(setDoc(doc(owner,'users/summary-owner/sessionIndexMeta/state'),{version:1,complete:true}));
 await assertFails(getDoc(doc(rider('summary-other'),'users/summary-owner/sessionIndexMeta/state')));
});

const summaryCloud=vi.hoisted(()=>({db:null as any}));
vi.mock('../src/services/firebase',()=>({auth:{currentUser:{uid:'summary-integration',email:'summary-integration@example.com',emailVerified:true}},get db(){return summaryCloud.db;}}));
import {storageService as indexedStorage} from '../src/services/firebaseStorageService';
test('real Firestore transactions keep the history index consistent through migration, updates, and deletion',async()=>{
 summaryCloud.db=rider('summary-integration');vi.stubGlobal('navigator',{onLine:true});indexedStorage.clearMemory();
 const setup={id:'board',name:'Daily',deckWidthMm:34,wheelMaterial:'urethane' as const};
 const records=Array.from({length:26},(_,i)=>recordDeckAttempt(newDeckCard({...deckGame,mode:'normal' as const,gameId:'integration-'+i},setup,'Marble',1000+i*1000),true,1500+i*1000));
 await env.withSecurityRulesDisabled(async context=>{
  await setDoc(doc(context.firestore(),'users/summary-integration/savedSetups/board'),setup);
  for(const s of records)await setDoc(doc(context.firestore(),'users/summary-integration/sessions/'+s.id),JSON.parse(JSON.stringify(s)));
 });
 expect(await indexedStorage.getSessions('summary-integration',false)).toHaveLength(26);
 indexedStorage.clearMemory();const rows=await indexedStorage.getSessions('summary-integration',false);
 expect(rows.filter(s=>s.summaryOnly)).toHaveLength(26);
 const full=await indexedStorage.getSession('summary-integration',records[0].id);expect(full!.history).toHaveLength(1);
 await indexedStorage.saveSession('summary-integration',{...full!,notes:'Indexed update'});
 await indexedStorage.deleteSession('summary-integration',records[1].id);
 indexedStorage.clearMemory();const after=await indexedStorage.getSessions('summary-integration',false);
 expect(after).toHaveLength(25);expect(after.find(s=>s.id===records[0].id)?.notes).toBe('Indexed update');expect(after.some(s=>s.id===records[1].id)).toBe(false);
 expect((await indexedStorage.getAllSessions('summary-integration')).every(s=>s.history.length===1)).toBe(true);
 const fresh=newDeckCard({...deckGame,mode:'normal' as const,gameId:'fresh-start'},setup,'Marble',50000);
 await indexedStorage.saveSession('summary-integration',fresh);
 await indexedStorage.saveSession('summary-integration',{...fresh,attemptCount:1});
 expect((await getDoc(doc(summaryCloud.db,'users/summary-integration/savedSetups/board'))).data()?.usedAt).toBe(fresh.sessionStartedAt);
});

test('late decks enforce card and joker bounds for eight-card orders',async()=>{
 const db=rider('late-decks');
 for(const deck of GAME_DECKS.filter(d=>d.id==='better-late-than-sorry'||d.id==='see-you-later-alligator')){
  const order=deck.cards.map(c=>c.id),last=order.length-1;
  for(const mode of ['normal','skate','wildcard']){
   const game={...deckGame,deckId:deck.id,order,cardIndex:last,mode,...(mode==='wildcard'?{wildcards:[{cardIndex:0,type:'double'},{cardIndex:1,type:'triple'},{cardIndex:last,type:'one_attempt'}]}:{})};
   const session={...deckSession,id:deck.id+'-'+mode,deckGame:game};
   await assertSucceeds(setDoc(doc(db,`users/late-decks/sessions/${session.id}`),session));
   await assertFails(setDoc(doc(db,`users/late-decks/sessions/${session.id}-bad-index`),{...session,id:session.id+'-bad-index',deckGame:{...game,cardIndex:order.length}}));
   await assertFails(setDoc(doc(db,`users/late-decks/sessions/${session.id}-short`),{...session,id:session.id+'-short',deckGame:{...game,cardIndex:0,order:order.slice(1)}}));
   if(mode==='wildcard')await assertFails(setDoc(doc(db,`users/late-decks/sessions/${session.id}-bad-joker`),{...session,id:session.id+'-bad-joker',deckGame:{...game,wildcards:[{cardIndex:0,type:'double'},{cardIndex:1,type:'triple'},{cardIndex:order.length,type:'one_attempt'}]}}));
  }
 }
});

test('previous six-card late decks remain writable without allowing mixed orders',async()=>{
 const db=rider('legacy-late');
 const order=['late_kickflip_back_finger','late_kickflip_front_finger','late_heelflip','late_shove_it','late_frontside_shove_it','late_double_kickflip'];
 const session={...deckSession,id:'legacy-late',deckGame:{...deckGame,deckId:'better-late-than-sorry',order}};
 await assertSucceeds(setDoc(doc(db,'users/legacy-late/sessions/legacy-late'),session));
 await assertFails(setDoc(doc(db,'users/legacy-late/sessions/mixed'),{...session,id:'mixed',deckGame:{...session.deckGame,order:['late_kickflip',...order.slice(1)]}}));
});

test('previous five and nine-card orders remain valid after eight-card revision',async()=>{
 const db=rider('previous-late-counts');
 const orders={
  'better-late-than-sorry':['late_kickflip','late_heelflip','late_shove_it','late_frontside_shove_it','late_double_kickflip'],
  'see-you-later-alligator':['pop_shove_it_late_kickflip','pop_shove_it_late_heelflip','kickflip_late_shove_it','heelflip_late_shove_it','shove_it_360_late_kickflip','tre_flip_late_kickflip','hardflip_late_flip','inward_heelflip_late_flip','kickflip_late_impossible']
 };
 for(const [deckId,order] of Object.entries(orders))await assertSucceeds(setDoc(doc(db,`users/previous-late-counts/sessions/${deckId}`),{...deckSession,id:deckId,deckGame:{...deckGame,deckId,order,cardIndex:order.length-1}}));
});

test('previous eight-card Alligator order remains allowed after the hardflip swap',async()=>{
 const db=rider('previous-alligator');
 const order=['pop_shove_it_late_kickflip','pop_shove_it_late_heelflip','kickflip_late_shove_it','heelflip_late_shove_it','shove_it_360_late_kickflip','tre_flip_late_kickflip','hardflip_late_flip','inward_heelflip_late_flip'];
 const session={...deckSession,id:'old-eight',deckGame:{...deckGame,deckId:'see-you-later-alligator',order}};
 await assertSucceeds(setDoc(doc(db,'users/previous-alligator/sessions/old-eight'),session));
});
