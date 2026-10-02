import { normalizeUsername } from '../shared/username.mjs';
export function firebaseService(auth, db) {
 const ref=uid=>db.collection('users').doc(uid),ownerRef=uid=>db.collection('usernameOwners').doc(uid),indexRef=name=>db.collection('usernames').doc(name);
 async function row(user){const [profile,owner]=await Promise.all([ref(user.uid).get(),ownerRef(user.uid).get()]);return {uid:user.uid,email:user.email||'',username:owner.data()?.username||null,displayName:profile.data()?.displayName||user.displayName||'',authDisplayName:user.displayName||'',disabled:user.disabled,emailVerified:user.emailVerified,createdAt:user.metadata.creationTime,lastSignIn:user.metadata.lastSignInTime||null,hasProfile:profile.exists};}
 async function release(uid){await db.runTransaction(async tx=>{const doc=ownerRef(uid),owner=await tx.get(doc),username=owner.data()?.username;const index=username?await tx.get(indexRef(username)):null;if(index?.data()?.uid===uid)tx.delete(index.ref);if(owner.exists)tx.delete(doc);});}
 return {
  async list(pageToken,search){
   if(search){let user;try{let index;try{index=await indexRef(normalizeUsername(search)).get();}catch{}user=index?.data()?.uid?await auth.getUser(index.data().uid):search.includes('@')?await auth.getUserByEmail(search):await auth.getUser(search);}catch(e){if(e.code==='auth/user-not-found')return {users:[],nextPage:null};throw e;}return {users:[await row(user)],nextPage:null};}
   const page=await auth.listUsers(25,pageToken||undefined);return {users:await Promise.all(page.users.map(row)),nextPage:page.pageToken||null};
  },
  async update(uid,update){
   const {username,...authUpdate}=update;const previous=await auth.getUser(uid),emailChanged=previous.email!==update.email;
   if(username){const taken=await indexRef(username).get();if(taken.exists&&taken.data().uid!==uid)throw Object.assign(new Error('This username is already taken.'),{status:409});}
   const changes={...authUpdate,emailVerified:emailChanged?false:update.emailVerified};await auth.updateUser(uid,changes);
   if(update.disabled||emailChanged)await auth.revokeRefreshTokens(uid);
   try{await db.runTransaction(async tx=>{
    const profileDoc=ref(uid),ownerDoc=ownerRef(uid);const [profile,owner]=await Promise.all([tx.get(profileDoc),tx.get(ownerDoc)]);
    const oldName=owner.data()?.username,newName=username||oldName;
    const target=newName?await tx.get(indexRef(newName)):null;const oldIndex=oldName&&oldName!==newName?await tx.get(indexRef(oldName)):null;
    if(target?.exists&&target.data().uid!==uid)throw new Error('Username was claimed elsewhere.');
    if(newName){if(!target?.exists)tx.create(indexRef(newName),{uid});tx.set(ownerDoc,{username:newName,email:changes.email});}
    if(oldIndex?.data()?.uid===uid)tx.delete(oldIndex.ref);
    if(profile.exists)tx.update(profileDoc,{displayName:changes.displayName,email:changes.email,cloudRevision:(profile.data().cloudRevision||0)+1});
   });}catch{const error=new Error('Authentication was updated, but username/profile synchronization failed. Reload and save again, using an available username.');error.partial=true;throw error;}
   return row(await auth.getUser(uid));
  },
  async remove(uid,deleteData){await auth.deleteUser(uid);try{await release(uid);if(deleteData)await db.recursiveDelete(ref(uid));}catch{const error=new Error('Account deleted, but some username bindings or data remain. Use Cleanup retained data for this UID.');error.partial=true;throw error;}return {deleted:true,dataDeleted:deleteData};},
  async cleanup(uid){try{await auth.getUser(uid);throw new Error('Account still exists. Use Delete account instead.');}catch(e){if(e.code!=='auth/user-not-found')throw e;}await release(uid);await db.recursiveDelete(ref(uid));return {dataDeleted:true};}
 };
}
