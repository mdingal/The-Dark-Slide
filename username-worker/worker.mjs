import { firestoreRest } from './google.mjs';
import { usernameService } from './service.mjs';
function allowed(origin,env){return env.ALLOWED_ORIGINS.split(',').includes(origin)||/^http:\/\/(localhost|127\.0\.0\.1):\d{1,5}$/.test(origin);}
export default {async fetch(request,env){
 const origin=request.headers.get('Origin')||'',cors={'Access-Control-Allow-Origin':origin,'Vary':'Origin','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 const json=(status,data)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json'}});
 if(!allowed(origin,env))return new Response('Forbidden',{status:403});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...cors,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Max-Age':'600'}});
 if(request.method!=='POST')return json(405,{error:'Method not allowed.'});
 try{
  const ip=request.headers.get('CF-Connecting-IP')||'local';
  if(!env.IP_LIMITER||!env.USERNAME_LIMITER)throw new Error('Rate limiter missing.');
  if(!(await env.IP_LIMITER.limit({key:ip})).success)return json(429,{error:'Too many requests. Wait a minute and try again.'});
  if(!(request.headers.get('Content-Type')||'').startsWith('application/json'))return json(415,{error:'JSON required.'});
  const reader=request.body?.getReader();let size=0,text='';const decoder=new TextDecoder();
  if(reader)while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>8192){await reader.cancel();return json(413,{error:'Request too large.'});}text+=decoder.decode(value,{stream:true});}
  let body;try{body=JSON.parse(text+decoder.decode());}catch{return json(400,{error:'Invalid request.'});}
  if(!body||typeof body!=='object'||Array.isArray(body))return json(400,{error:'Invalid request.'});
  const account=JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  if(env.PROJECT_ID!=='the-dark-slide-fe8a4'||account.project_id!==env.PROJECT_ID)throw new Error('Unexpected project.');
  const db=firestoreRest(env,account);
  async function authCall(method,payload){const response=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${method}?key=${env.FIREBASE_API_KEY}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(10000)});const result=await response.json();if(!response.ok)throw Object.assign(new Error(method==='signInWithPassword'?'Username or password is incorrect.':'Sign in again to update your username.'),{status:401});return result;}
  const service=usernameService(db,{identity:async token=>{let claims;try{claims=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));}catch{throw Object.assign(new Error('Sign in again.'),{status:401});}if(claims.aud!==env.PROJECT_ID||claims.iss!=='https://securetoken.google.com/'+env.PROJECT_ID)throw Object.assign(new Error('Sign in again.'),{status:401});const result=await authCall('lookup',{idToken:token});const user=result.users?.[0];if(!user?.localId||!user.email||user.disabled)throw Object.assign(new Error('Sign in again.'),{status:401});return user;},password:(email,password)=>authCall('signInWithPassword',{email,password,returnSecureToken:true})});
  const path=new URL(request.url).pathname;
  if(path==='/login'){
   if(typeof body.username!=='string'||body.username.length>100||typeof body.password!=='string'||!body.password||body.password.length>4096)return json(401,{error:'Username or password is incorrect.'});
   if(!(await env.USERNAME_LIMITER.limit({key:body.username.trim().toLowerCase()})).success)return json(429,{error:'Too many login attempts. Wait a minute.'});
   return json(200,await service.login(body.username,body.password));
  }
  const token=request.headers.get('Authorization')?.replace(/^Bearer /,'');if(!token||token.length>8192)return json(401,{error:'Sign in first.'});
  if(path==='/me')return json(200,await service.me(token));
  if(path==='/username')return json(200,await service.claim(token,body.username));
  return json(404,{error:'Not found.'});
 }catch(e){return json(e.status&&e.status<500?e.status:503,{error:e.status&&e.status<500?e.message:'Username service unavailable. Existing accounts can still sign in with email.'});}
}};
