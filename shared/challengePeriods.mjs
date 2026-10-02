const DAY=86400000,OFFSET=8*3600000;
export function challengePeriod(kind,now=Date.now()){
 let shifted=new Date(now+OFFSET),day=Math.floor(shifted.getTime()/DAY);
 if(kind==='weekly')day-= (shifted.getUTCDay()+6)%7;
 const startsAt=new Date(day*DAY-OFFSET).toISOString(),endsAt=new Date((day+(kind==='weekly'?7:1))*DAY-OFFSET).toISOString();
 const date=new Date(day*DAY).toISOString().slice(0,10);
 return {id:kind+'-'+date,kind,startsAt,endsAt,date,index:kind==='weekly'?Math.floor(day/7):day};
}
export function challengeSchedule(catalog,days=60,now=Date.now()){
 const map=new Map();
 for(let i=0;i<days;i++)for(const kind of ['daily','weekly']){
  const p=challengePeriod(kind,now+i*DAY);if(map.has(p.id))continue;
  const pool=catalog[kind],index=((p.index%pool.length)+pool.length)%pool.length,entry=pool[index];
  const primary=kind==='daily'?entry:entry.primary;
  map.set(p.id,{id:p.id,kind,startsAt:p.startsAt,endsAt:p.endsAt,published:true,targetLandings:kind==='daily'?1:3,primary,...(entry.alternative?{alternative:entry.alternative}:{})});
 }
 return [...map.values()].sort((a,b)=>a.startsAt.localeCompare(b.startsAt)||a.kind.localeCompare(b.kind));
}
