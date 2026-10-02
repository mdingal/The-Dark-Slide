import {readFile,appendFile} from 'node:fs/promises';
import {initializeApp,cert,deleteApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {challengeSchedule} from '../shared/challengePeriods.mjs';
const args=process.argv.slice(2),publish=args.includes('--publish'),dayIndex=args.indexOf('--days');
const days=dayIndex>=0?Number(args[dayIndex+1]):60;
if(!Number.isInteger(days)||days<7||days>180)throw new Error('Use --days between 7 and 180.');
if(args.some((a,i)=>a!=='--publish'&&a!=='--days'&&!(dayIndex>=0&&i===dayIndex+1)))throw new Error('Options: --days 60 --publish');
const catalog=JSON.parse(await readFile(new URL('../shared/communityChallengeCatalog.json',import.meta.url),'utf8'));
const schedule=challengeSchedule(catalog,days);
console.log(`DARK SLIDE schedule: ${days} days, ${catalog.daily.length} daily tricks, ${catalog.weekly.length} weekly challenges. Midnight Philippines; weekly Monday.`);
for(const c of schedule)console.log(`${c.id} | ${c.primary.canonicalName} | ${c.targetLandings} landing(s)${c.alternative?' | Flatground: '+c.alternative.canonicalName:''}`);
if(!publish){console.log('\nPreview only. Publish with npm run challenges:publish (or add -- --days 120).');process.exit(0);}
if(process.env.FIRESTORE_EMULATOR_HOST||process.env.FIREBASE_AUTH_EMULATOR_HOST)throw new Error('Unset emulator variables before publishing.');
const account=JSON.parse(await readFile(new URL('../.admin/service-account.json',import.meta.url),'utf8'));
if(account.project_id!=='the-dark-slide-fe8a4')throw new Error('Unexpected Firebase project.');
const app=initializeApp({credential:cert(account),projectId:account.project_id}),db=getFirestore(app);
const refs=schedule.map(c=>db.doc('communityChallenges/'+c.id)),existing=await db.getAll(...refs);
const batch=db.batch();let added=0;
for(let i=0;i<schedule.length;i++)if(!existing[i].exists){batch.create(refs[i],{...schedule[i],publishedAt:new Date().toISOString()});added++;}
if(added)await batch.commit();
console.log(`Published ${added} challenges to ${account.project_id}. Kept ${schedule.length-added} existing challenges unchanged.`);
try{await appendFile(new URL('../.admin/audit.ndjson',import.meta.url),JSON.stringify({timestamp:new Date().toISOString(),action:'publish_challenges',count:added})+'\n');}catch{console.warn('Published, but could not append the local audit record.');}
await deleteApp(app);
