// Development diagnostics only: no rider data, no storage, and no cloud requests.
const reads=new Map<string,{requests:number;documents:number}>();
let startedAt=new Date().toISOString();
export function trackFirebaseRead(category:string,documents:number){
 if(!import.meta.env.DEV)return;
 const row=reads.get(category)||{requests:0,documents:0};row.requests++;row.documents+=documents;reads.set(category,row);
}
function snapshot(){return {startedAt,categories:Object.fromEntries([...reads].map(([key,value])=>[key,{...value}])),estimatedDocumentReads:[...reads].filter(([key])=>!key.startsWith('Aggregation')).reduce((sum,[,row])=>sum+row.documents,0)};}
declare global {interface Window {darkSlideReadUsage:()=>ReturnType<typeof snapshot>;darkSlideResetReadUsage:()=>void;}}
if(import.meta.env.DEV&&typeof window!=='undefined'){
 window.darkSlideReadUsage=()=>{const result=snapshot();console.table(result.categories);console.info('Estimated direct document reads:',result.estimatedDocumentReads,'since',result.startedAt);return result;};
 window.darkSlideResetReadUsage=()=>{reads.clear();startedAt=new Date().toISOString();};
}
