import { readFile, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const rl=createInterface({input:process.stdin,output:process.stdout});
try{
 let content;
 try{content=await readFile(new URL('../.admin/service-account.json',import.meta.url),'utf8');}
 catch{const path=(await rl.question('Full path to your Firebase service-account JSON (do not paste its contents): ')).trim().replace(/^"|"$/g,'');content=await readFile(path,'utf8');}
 const account=JSON.parse(content);if(account.project_id!=='the-dark-slide-fe8a4'||!account.private_key)throw new Error('Wrong Firebase service-account file.');
 console.log('Uploading Firebase credentials to a Cloudflare Worker secret. The key contents will not be printed.');
 const result=spawnSync(process.execPath,[fileURLToPath(new URL('./node_modules/wrangler/bin/wrangler.js',import.meta.url)),'secret','put','FIREBASE_SERVICE_ACCOUNT'],{cwd:fileURLToPath(new URL('./',import.meta.url)),input:JSON.stringify(account)+'\n',stdio:['pipe','inherit','inherit']});
 if(result.status!==0)throw new Error('Secret upload failed. Run username:login and username:deploy, then retry.');
 const raw=(await rl.question('Paste your deployed Worker HTTPS URL (https://dark-slide-usernames.YOUR-SUBDOMAIN.workers.dev): ')).trim();const url=new URL(raw);
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||!['','/'].includes(url.pathname))throw new Error('Use the Worker base HTTPS URL, without a path.');
 const env=new URL('../.env.local',import.meta.url);let previous='';try{previous=await readFile(env,'utf8');}catch{}
 const lines=previous.split(/\r?\n/).filter(line=>!/^\s*VITE_USERNAME_WORKER_URL\s*=/.test(line));
 await writeFile(env,lines.join('\n').trimEnd()+'\nVITE_USERNAME_WORKER_URL='+url.origin+'\n');
 console.log('Username service configured. Restart npm run dev. Rebuild before deploying Firebase Hosting.');
}catch(e){console.error(e.message);process.exitCode=1;}finally{rl.close();}
