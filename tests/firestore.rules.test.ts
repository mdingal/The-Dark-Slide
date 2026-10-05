import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { beforeAll, afterAll, test } from 'vitest';
let env: RulesTestEnvironment;
beforeAll(async () => { env = await initializeTestEnvironment({ projectId: 'demo-dark-slide', firestore: { host: '127.0.0.1', port: 8080, rules: readFileSync('firestore.rules', 'utf8') } }); });
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
