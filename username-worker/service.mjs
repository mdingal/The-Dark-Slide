import { normalizeUsername } from '../shared/username.mjs';
const str=(doc,key)=>doc?.fields?.[key]?.stringValue;
const pre=doc=>doc?{updateTime:doc.updateTime}:{exists:false};
const fields=values=>Object.fromEntries(Object.entries(values).map(([k,v])=>[k,{stringValue:v}]));
export function usernameService(db, firebase) {
 return {
  async me(token){const user=await firebase.identity(token);const owner=await db.get('usernameOwners/'+user.localId);return {username:str(owner,'username')||null};},
  async claim(token,value){
   let username;try{username=normalizeUsername(value);}catch(e){e.status=400;throw e;}
   const user=await firebase.identity(token),uid=user.localId;
   const [owner,index]=await Promise.all([db.get('usernameOwners/'+uid),db.get('usernames/'+username)]);
   if(index&&str(index,'uid')!==uid)throw Object.assign(new Error('This username is already taken.'),{status:409});
   const previous=str(owner,'username');const oldIndex=previous&&previous!==username?await db.get('usernames/'+previous):null;
   const writes=[{update:{name:db.name('usernameOwners/'+uid),fields:fields({username,email:user.email})},currentDocument:pre(owner)}];
   if(!index)writes.push({update:{name:db.name('usernames/'+username),fields:fields({uid})},currentDocument:{exists:false}});
   if(oldIndex&&str(oldIndex,'uid')===uid)writes.push({delete:db.name('usernames/'+previous),currentDocument:pre(oldIndex)});
   try{await db.commit(writes);}catch(e){if([409,412].includes(e.status)||['ALREADY_EXISTS','FAILED_PRECONDITION','ABORTED'].includes(e.reason))throw Object.assign(new Error('Username changed or was claimed elsewhere. Reload and try again.'),{status:409});throw e;}
   return {username};
  },
  async login(value,password){
   let username;try{username=normalizeUsername(value);}catch{throw Object.assign(new Error('Username or password is incorrect.'),{status:401});}
   const index=await db.get('usernames/'+username),uid=str(index,'uid');
   const owner=uid?await db.get('usernameOwners/'+uid):null,email=str(owner,'email');
   if(!uid||!email||str(owner,'username')!==username)throw Object.assign(new Error('Username or password is incorrect.'),{status:401});
   const authenticated=await firebase.password(email,password);
   if(authenticated.localId!==uid)throw Object.assign(new Error('Username or password is incorrect.'),{status:401});
   // Return the email only after the password was verified for this exact UID.
   // The browser then uses the normal Firebase SDK to establish its own session.
   return {email};
  }
 };
}
