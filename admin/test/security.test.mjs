import { test, before, after } from 'node:test';
import { request } from 'node:http';
import assert from 'node:assert/strict';
import { scryptSync } from 'node:crypto';
import { createAdminServer } from '../app.mjs';
import { firebaseService } from '../firebase-service.mjs';
const code = 'my-test-secret-12345', salt = 'test-salt';
const config = { projectId: 'test-only', salt, secretHash: scryptSync(code, salt, 64).toString('hex') };
const events = [], audits = [];
const server = createAdminServer({ config, port: 3002, publicDir: new URL('../public/', import.meta.url), audit: async event => audits.push(event), service: {
 list: async () => ({ users: [], nextPage: null }), update: async (...args) => { events.push(['update',...args]); return {}; }, remove: async (...args) => { events.push(['remove',...args]); return {}; }, cleanup: async (...args) => { events.push(['cleanup',...args]); return {}; }
} });
let cookie, csrf;
before(async () => { await new Promise(resolve => server.listen(3002, '127.0.0.1', resolve)); });
after(async () => { await new Promise(resolve => server.close(resolve)); });
async function call(path, method = 'GET', data, headers = {}) { return fetch('http://127.0.0.1:3002' + path, { method, headers: { Origin: 'http://127.0.0.1:3002', 'Content-Type':'application/json', ...(cookie ? { Cookie:cookie } : {}), ...(csrf ? {'X-Admin-CSRF':csrf} : {}), ...headers }, body:data === undefined ? undefined : JSON.stringify(data) }); }
test('API rejects access before unlock',async()=>assert.equal((await call('/api/users')).status,401));
test('cross-origin unlock is blocked',async()=>assert.equal((await call('/api/unlock','POST',{code},{Origin:'https://evil.example'})).status,403));
test('DNS rebinding Host is blocked',async()=>{const status=await new Promise((resolve,reject)=>{const req=request({hostname:'127.0.0.1',port:3002,path:'/api/users',headers:{Host:'evil.example:3002'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);req.end();});assert.equal(status,403);});
test('incorrect secret fails without exposing config',async()=>{const r=await call('/api/unlock','POST',{code:'wrong-secret-1234567'});assert.equal(r.status,401);assert.equal((await call('/.admin/config.json')).status,404);});
test('unlock sets HttpOnly strict cookie and permits reads',async()=>{const r=await call('/api/unlock','POST',{code});assert.equal(r.status,200);const header=r.headers.get('set-cookie');assert.match(header,/HttpOnly/);assert.match(header,/SameSite=Strict/);cookie=header.split(';')[0];csrf=(await r.json()).csrf;assert.equal((await call('/api/users')).status,200);});
test('mutation requires CSRF and origin',async()=>{assert.equal((await call('/api/users/testuid','DELETE',{confirmUid:'testuid',deleteData:true},{'X-Admin-CSRF':''})).status,403);assert.equal((await call('/api/users/testuid','DELETE',{confirmUid:'testuid',deleteData:true},{Origin:''})).status,403);assert.equal(events.length,0);});
test('cannot modify unsupported privileged fields',async()=>{const r=await call('/api/users/testuid','PATCH',{displayName:'Rider',email:'rider@example.com',disabled:false,emailVerified:false,admin:true});assert.equal(r.status,400);assert.equal(events.length,0);});
test('confirmed UID required before deletion',async()=>{assert.equal((await call('/api/users/testuid','DELETE',{confirmUid:'wrong',deleteData:true})).status,400);assert.equal(events.length,0);});
test('update and deletion dispatch validated actions and audit',async()=>{assert.equal((await call('/api/users/testuid','PATCH',{displayName:'Rider',email:'rider@example.com',disabled:false,emailVerified:false})).status,200);assert.equal((await call('/api/users/testuid','DELETE',{confirmUid:'testuid',deleteData:true})).status,200);assert.deepEqual(events.map(x=>x[0]),['update','remove']);assert.deepEqual(audits.map(x=>x.action),['update','delete-account-and-data']);});
test('logout revokes server session',async()=>{assert.equal((await call('/api/logout','POST',{})).status,200);assert.equal((await call('/api/users')).status,401);});
test('five failed unlock attempts trigger throttling',async()=>{for(let i=0;i<5;i++)assert.equal((await call('/api/unlock','POST',{code:'bad-code-123456789'})).status,401);assert.equal((await call('/api/unlock','POST',{code})).status,429);});
test('email change resets verification and updates cloud revision',async()=>{
 let written, changes, revoked=false;
 const doc={get:async()=>({exists:true,data:()=>({displayName:'Old',cloudRevision:7})})};
 const db={collection:()=>({doc:()=>doc}),runTransaction:async fn=>fn({get:doc.get,update:(_,value)=>written=value})};
 const auth={getUser:async()=>({uid:'rider',email:'old@example.com',metadata:{},disabled:false,emailVerified:true}),updateUser:async(_,value)=>changes=value,revokeRefreshTokens:async()=>revoked=true};
 await firebaseService(auth,db).update('rider',{displayName:'New',email:'new@example.com',disabled:false,emailVerified:true});
 assert.equal(changes.emailVerified,false);assert.equal(revoked,true);assert.equal(written.cloudRevision,8);assert.equal(written.displayName,'New');
});
test('retained-data cleanup refuses existing accounts',async()=>{let deleted=false;const service=firebaseService({getUser:async()=>({uid:'rider'})},{collection:()=>({doc:()=>({})}),recursiveDelete:async()=>deleted=true});await assert.rejects(service.cleanup('rider'),/Account still exists/);assert.equal(deleted,false);});
test('partial deletion is reported rather than claimed successful',async()=>{let authDeleted=false;const service=firebaseService({deleteUser:async()=>authDeleted=true},{collection:()=>({doc:()=>({})}),recursiveDelete:async()=>{throw new Error('offline');}});await assert.rejects(service.remove('rider',true),e=>e.partial===true);assert.equal(authDeleted,true);});
function memoryDb(initial={}) {
 const rows=new Map(Object.entries(initial));const ref=path=>({path,get:async()=>snap(path)});const snap=path=>({exists:rows.has(path),data:()=>rows.get(path),ref:ref(path)});
 return {rows,collection:key=>({doc:id=>ref(key+'/'+id)}),runTransaction:async fn=>fn({get:async doc=>snap(doc.path),create:(doc,data)=>{assert.equal(rows.has(doc.path),false);rows.set(doc.path,data);},set:(doc,data)=>rows.set(doc.path,data),update:(doc,data)=>rows.set(doc.path,{...rows.get(doc.path),...data}),delete:doc=>rows.delete(doc.path)}),recursiveDelete:async doc=>rows.delete(doc.path)};
}
test('admin username rename reserves new alias and releases old alias',async()=>{
 const db=memoryDb({'usernameOwners/rider':{username:'old_name',email:'old@example.com'},'usernames/old_name':{uid:'rider'},'users/rider':{displayName:'Old',cloudRevision:2}});
 const auth={getUser:async()=>({uid:'rider',email:'old@example.com',metadata:{}}),updateUser:async()=>{},revokeRefreshTokens:async()=>{}};
 const row=await firebaseService(auth,db).update('rider',{username:'new_name',displayName:'New',email:'new@example.com',disabled:false,emailVerified:true});
 assert.equal(row.username,'new_name');assert.equal(db.rows.has('usernames/old_name'),false);assert.equal(db.rows.get('usernames/new_name').uid,'rider');assert.equal(db.rows.get('usernameOwners/rider').email,'new@example.com');assert.equal(db.rows.get('users/rider').cloudRevision,3);
});
test('duplicate admin username fails before authentication changes',async()=>{
 const db=memoryDb({'usernames/taken_name':{uid:'someone_else'}});let changed=false;
 await assert.rejects(firebaseService({getUser:async()=>({email:'old@example.com'}),updateUser:async()=>changed=true},db).update('rider',{username:'taken_name',displayName:'Rider',email:'rider@example.com',disabled:false,emailVerified:false}),e=>e.status===409);assert.equal(changed,false);
});
test('deleting an account releases username even when practice data is retained',async()=>{
 const db=memoryDb({'usernameOwners/rider':{username:'rider_name',email:'rider@example.com'},'usernames/rider_name':{uid:'rider'},'users/rider':{displayName:'Rider'}});let deleted=false;
 await firebaseService({deleteUser:async()=>deleted=true},db).remove('rider',false);assert.equal(deleted,true);assert.equal(db.rows.has('usernameOwners/rider'),false);assert.equal(db.rows.has('usernames/rider_name'),false);assert.equal(db.rows.has('users/rider'),true);
});
