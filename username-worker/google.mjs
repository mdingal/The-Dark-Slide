const enc = new TextEncoder();
function b64url(bytes) { return btoa(String.fromCharCode(...bytes)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_'); }
export async function signedJwt(payload, account) {
 const pem = account.private_key.replace(/-----[^-]+-----/g,'').replace(/\s/g,'');
 const key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pem), c=>c.charCodeAt(0)), {name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
 const head = b64url(enc.encode(JSON.stringify({alg:'RS256',typ:'JWT'}))), body = b64url(enc.encode(JSON.stringify(payload)));
 const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,enc.encode(head+'.'+body));
 return head+'.'+body+'.'+b64url(new Uint8Array(sig));
}
let cached, pending;
export async function accessToken(account, fetcher = fetch) {
 if(cached?.email===account.client_email && cached.expires>Date.now()+60000) return cached.token;
 if(pending)return pending;
 pending=(async()=>{
  const now=Math.floor(Date.now()/1000);
  const assertion=await signedJwt({iss:account.client_email,scope:'https://www.googleapis.com/auth/datastore',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600},account);
  const response=await fetcher('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion}),signal:AbortSignal.timeout(10000)});
  const result=await response.json();if(!response.ok||!result.access_token)throw new Error('Backend credentials unavailable.');
  cached={email:account.client_email,token:result.access_token,expires:Date.now()+result.expires_in*1000};return cached.token;
 })();try{return await pending;}finally{pending=undefined;}
}
export function firestoreRest(env, account, fetcher=fetch) {
 const base=`https://firestore.googleapis.com/v1/projects/${env.PROJECT_ID}/databases/(default)/documents`;
 const name=path=>`projects/${env.PROJECT_ID}/databases/(default)/documents/${path}`;
 async function request(path,options={}) {
  const bearer=await accessToken(account,fetcher);
  const response=await fetcher(base+path,{...options,headers:{Authorization:'Bearer '+bearer,'Content-Type':'application/json'},signal:AbortSignal.timeout(10000)});
  const data=await response.json();if(response.status===404)return null;
  if(!response.ok){const e=new Error('Database request failed.');e.status=response.status;e.reason=data.error?.status;throw e;}return data;
 }
 return { name, get:path=>request('/'+path), commit:writes=>request(':commit',{method:'POST',body:JSON.stringify({writes})}) };
}
