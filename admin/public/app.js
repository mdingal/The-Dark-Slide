const $ = id => document.getElementById(id);
let csrf = '', users = [], nextPage = null, selected = null, cleanup = false;
function message(text, error = false) { $('message').textContent = text; $('message').classList.toggle('error', error); }
function locked() { csrf = ''; $('panel').hidden = true; $('unlock').hidden = false; $('lock').hidden = true; for (const d of document.querySelectorAll('dialog[open]')) d.close(); $('users').replaceChildren(); users = []; }
function unlocked(data) { csrf = data.csrf; $('project').textContent = data.projectId; $('panel').hidden = false; $('unlock').hidden = true; $('lock').hidden = false; $('code').value = ''; }
async function api(path, method = 'GET', data) {
 const response = await fetch(path, { method, headers: { 'Content-Type': 'application/json', 'X-Admin-CSRF': csrf }, body: data === undefined ? undefined : JSON.stringify(data) });
 const result = await response.json(); if (!response.ok) { if (response.status === 401 && path !== '/api/unlock') locked(); throw new Error(result.error || 'Request failed.'); } return result;
}
function date(value) { return value ? new Date(value).toLocaleString() : 'Never'; }
function render() {
 $('users').replaceChildren();
 for (const user of users) {
  const row = document.createElement('tr'), identity = document.createElement('td'), name = document.createElement('strong'); name.textContent = user.displayName || 'Unnamed rider'; identity.append(name);
  for (const value of [user.username ? '@'+user.username : 'No username yet', user.email || 'No email', user.uid, user.hasProfile ? '' : 'No rider profile']) if (value) { const el = document.createElement('small'); el.textContent = value; identity.append(el); }
  const status = document.createElement('td'); status.textContent = user.disabled ? 'Disabled' : 'Active'; const verification = document.createElement('small'); verification.textContent = user.emailVerified ? 'Verified email' : 'Unverified email'; status.append(verification);
  const time = document.createElement('td'); time.textContent = date(user.lastSignIn); const created = document.createElement('small'); created.textContent = 'Created: ' + date(user.createdAt); time.append(created);
  const actions = document.createElement('td'), wrap = document.createElement('div'); wrap.className = 'actions';
  for (const [label, action] of [['Edit', () => edit(user)], ['Delete', () => deletion(user.uid, user.email)]]) { const b = document.createElement('button'); b.textContent = label; b.onclick = action; if (label === 'Delete') b.className = 'danger'; wrap.append(b); }
  actions.append(wrap);row.append(identity,status,time,actions);$('users').append(row);
 }
 $('count').textContent = users.length ? `${users.length} accounts on this page` : 'No accounts found'; $('next').disabled = !nextPage;
}
async function load(page) { message('Loading accounts…'); try { const params = new URLSearchParams(); const search = $('search').value.trim(); if (search) params.set('search', search); else if (page) params.set('page', page); const data = await api('/api/users?' + params); users = data.users; nextPage = data.nextPage; render(); message(''); } catch (e) { message(e.message, true); } }
function edit(user) { selected = user; $('edit-uid').textContent = user.uid; $('edit-name').value = user.displayName; $('edit-email').value = user.email; $('edit-username').value = user.username || ''; $('edit-disabled').checked = user.disabled; $('edit-verified').checked = user.emailVerified; $('edit-error').textContent = ''; $('edit-dialog').showModal(); }
function deletion(uid, email = '', isCleanup = false) { selected = { uid }; cleanup = isCleanup; $('delete-title').textContent = cleanup ? 'Delete retained practice data' : 'Delete account'; $('delete-description').textContent = cleanup ? 'This permanently removes all remaining rider data for this deleted account.' : `Permanently remove ${email || 'this account'} from Firebase Authentication. This cannot be undone.`; $('delete-uid').textContent = uid; $('data-choice').hidden = cleanup; $('delete-data').checked = false; $('confirm-uid').value = ''; $('delete-error').textContent = ''; $('delete-dialog').showModal(); }
async function submit(form, action, errorId) { const buttons = [...form.querySelectorAll('button')]; buttons.forEach(b => b.disabled = true); try { await action(); } catch (e) { if (errorId) $(errorId).textContent = e.message; message(e.message,true); } finally { buttons.forEach(b => b.disabled = false); } }
$('unlock-form').onsubmit = e => { e.preventDefault(); submit(e.target, async () => { const data = await api('/api/unlock','POST',{code:$('code').value}); unlocked(data); await load(); }); };
$('lock').onclick = async () => { try { await api('/api/logout','POST',{}); locked(); message('Panel locked.'); } catch (e) { message(e.message,true); } };
$('search-form').onsubmit = e => { e.preventDefault(); load(); };
$('refresh').onclick = () => { $('search').value = ''; load(); }; $('next').onclick = () => load(nextPage);
$('edit-form').onsubmit = e => { e.preventDefault(); submit(e.target, async () => { await api('/api/users/' + selected.uid,'PATCH',{username:$('edit-username').value,displayName:$('edit-name').value,email:$('edit-email').value,disabled:$('edit-disabled').checked,emailVerified:$('edit-verified').checked}); $('edit-dialog').close(); await load(); message('Account updated.'); },'edit-error'); };
$('delete-form').onsubmit = e => { e.preventDefault(); submit(e.target, async () => { await api('/api/users/' + selected.uid + (cleanup ? '/cleanup' : ''),cleanup ? 'POST' : 'DELETE',{confirmUid:$('confirm-uid').value,deleteData:$('delete-data').checked}); $('delete-dialog').close(); await load(); message(cleanup ? 'Retained data deleted.' : 'Account deleted.'); },'delete-error'); };
$('cleanup-form').onsubmit = e => { e.preventDefault(); deletion($('cleanup-uid').value.trim(),'',true); };
for (const button of document.querySelectorAll('[data-close]')) button.onclick = () => $(button.dataset.close).close();
try { const session = await api('/api/session'); unlocked(session); await load(); } catch { locked(); message('Enter your local admin secret to continue.'); }
