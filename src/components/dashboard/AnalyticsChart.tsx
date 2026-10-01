import React from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { chartData, ChartDefinition, AnalyticsData } from '../../domain/dashboardAnalytics';
import { PracticeSession } from '../../domain/types';
import { useTheme } from '../../context/ThemeProvider';
import { ChevronDown, ChevronUp, Expand, Pin, X } from 'lucide-react';
const COLORS=['#D4A72C','#60a5fa','#a78bfa','#f472b6','#2dd4bf'];

export const AnalyticsPlot:React.FC<{definition:ChartDefinition;data:AnalyticsData;large?:boolean}>=({definition:d,data,large})=>{
  const { resolvedTheme }=useTheme();
  const dark=resolvedTheme==='dark';
  if(!data.rows.length)return <div className="min-h-40 flex items-center justify-center p-6 text-sm text-neutral-600 dark:text-neutral-300 text-center">{data.empty}</div>;
  if(d.kind==='table') return <div className="overflow-auto max-h-96"><table className="w-full text-left text-xs"><thead><tr>{Object.keys(data.rows[0]).filter(k=>k!=='value').map(k=><th className="p-2 border-b border-neutral-300 dark:border-neutral-700" key={k}>{k==='name'?'Trick':k}</th>)}</tr></thead><tbody>{data.rows.map((r,i)=><tr key={i}>{Object.entries(r).filter(([k])=>k!=='value').map(([k,v])=><td className="p-2 border-b border-neutral-200 dark:border-neutral-800 break-words" key={k}>{v}</td>)}</tr>)}</tbody></table></div>;
  if(d.kind==='calendar')return <div className="space-y-3"><div className="grid grid-cols-7 gap-1.5">{data.rows.map(r=><div key={r.name} tabIndex={0} aria-label={`${r.name}: ${r.value} active minutes, ${r.Attempts} attempts`} title={`${r.name}: ${r.value} active minutes · ${r.Attempts} attempts`} className="aspect-square max-h-10 rounded-sm border border-neutral-300 dark:border-neutral-700 focus-visible:outline-2 focus-visible:outline-[#D4A72C]" style={{backgroundColor:r.value?`rgba(212,167,44,${Math.min(.95,.25+r.value/40)})`:dark?'#171717':'#e2d7c6'}} />)}</div><div className="flex justify-between text-xs text-neutral-600 dark:text-neutral-300"><span>{data.rows[0].name}</span><span>Darker: less · Mustard: more</span><span>{data.rows.at(-1)?.name}</span></div><p className="text-xs text-neutral-600 dark:text-neutral-400">Read left to right, oldest to newest. Hover or focus a day for details.</p></div>;
  const tooltip=<Tooltip contentStyle={{backgroundColor:dark?'#171717':'#faf6ed',borderColor:dark?'#525252':'#bcb09b',borderRadius:8,color:dark?'#eee':'#222'}} itemStyle={{color:dark?'#eee':'#222'}} />;
  const series=d.series||['value'];
  return <div style={{height:large?420:260}} className="min-w-0 w-full"><ResponsiveContainer width="100%" height="100%">
    {d.kind==='donut'?<PieChart>{tooltip}<Pie data={data.rows} dataKey="value" nameKey="name" innerRadius="48%" outerRadius="75%">{data.rows.map((r,i)=><Cell key={r.name} fill={COLORS[i%COLORS.length]} />)}</Pie><Legend /></PieChart>:
      d.kind==='line'?<LineChart data={data.rows} margin={{top:12,right:16,left:0,bottom:16}}><CartesianGrid stroke={dark?'#333':'#d7ccbb'} strokeDasharray="3 3" /><XAxis dataKey="name" tickFormatter={(value:string)=>value.length>18?value.slice(0,17)+'…':value} tick={{fontSize:10,fill:dark?'#ccc':'#555'}} minTickGap={24} /><YAxis domain={d.unit==='%'?[0,100]:d.id==='difficulty'?[1,5]:[0,'auto']} tick={{fontSize:11,fill:dark?'#ccc':'#555'}} unit={d.unit==='%'?'%':undefined} />{tooltip}{d.series&&<Legend />}{series.map((s,i)=><Line key={s} name={s==='value'?d.title:s} dataKey={s} type="linear" stroke={COLORS[i%COLORS.length]} strokeWidth={2} dot={{r:3}} isAnimationActive={false} />)}</LineChart>:
      <BarChart data={data.rows} margin={{top:12,right:16,left:0,bottom:40}}><CartesianGrid stroke={dark?'#333':'#d7ccbb'} strokeDasharray="3 3" /><XAxis dataKey="name" tickFormatter={(value:string)=>value.length>18?value.slice(0,17)+'…':value} tick={{fontSize:10,fill:dark?'#ccc':'#555'}} interval={0} angle={-20} textAnchor="end" height={65} /><YAxis domain={d.unit==='%'?[0,100]:[0,'auto']} tick={{fontSize:11,fill:dark?'#ccc':'#555'}} />{tooltip}{d.series&&<Legend />}{series.map((s,i)=><Bar key={s} name={s==='value'?`${d.title}${d.unit?' ('+d.unit+')':''}`:s} dataKey={s} fill={COLORS[i%COLORS.length]} radius={[3,3,0,0]} isAnimationActive={false} />)}</BarChart>}
  </ResponsiveContainer></div>;
};
export const AnalyticsChart:React.FC<{definition:ChartDefinition;sessions:PracticeSession[];pinned:boolean;collapsed:boolean;onPin:()=>void;onCollapse:()=>void;onExpand:()=>void}>=({definition,sessions,pinned,collapsed,onPin,onCollapse,onExpand})=>{
  const data=React.useMemo(()=>chartData(definition.id,sessions),[definition.id,sessions]);
  return <article className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 min-w-0 space-y-4">
    <div className="flex items-start justify-between gap-3"><h3 className="text-base font-semibold">{definition.title}</h3><div className="flex gap-1 shrink-0">
      <button type="button" onClick={onPin} aria-pressed={pinned} aria-label={`${pinned?'Unpin':'Pin'} ${definition.title}`} title={pinned?'Unpin from Overview':'Pin to Overview (maximum 4)'} className={`p-1.5 rounded-md ${pinned?'text-[#8A6500] dark:text-[#D4A72C]':'text-neutral-600 dark:text-neutral-400'}`}><Pin className="w-4 h-4" /></button>
      <button type="button" onClick={onExpand} aria-label={`Expand ${definition.title}`} title="Expand chart" className="p-1.5 text-neutral-600 dark:text-neutral-300"><Expand className="w-4 h-4" /></button>
      <button type="button" onClick={onCollapse} aria-expanded={!collapsed} aria-label={`${collapsed?'Show':'Collapse'} ${definition.title}`} className="p-1.5 text-neutral-600 dark:text-neutral-300">{collapsed?<ChevronDown className="w-4 h-4" />:<ChevronUp className="w-4 h-4" />}</button>
    </div></div>
    {!collapsed&&<><p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{definition.description}</p><AnalyticsPlot definition={definition} data={data} /><p className="text-[11px] text-neutral-600 dark:text-neutral-400">{data.note}</p></>}
  </article>;
};
export const ExpandedAnalytics:React.FC<{definition:ChartDefinition;sessions:PracticeSession[];onClose:()=>void;filterControls:React.ReactNode}>=({definition,sessions,onClose,filterControls})=>{
  const container=React.useRef<HTMLDivElement>(null),close=React.useRef<HTMLButtonElement>(null);
  React.useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';close.current?.focus();
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();if(e.key==='Tab'){
      const items=Array.from(container.current?.querySelectorAll<HTMLElement>('button,a[href],select,input,[tabindex="0"]')||[]).filter(el=>!el.hasAttribute('disabled'));
      const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
    }};document.addEventListener('keydown',key);return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',key);previous?.focus();};
  },[]);
  const data=React.useMemo(()=>chartData(definition.id,sessions),[definition.id,sessions]);
  return <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto p-4 sm:p-8" onClick={e=>{if(e.target===e.currentTarget)onClose();}}><div ref={container} role="dialog" aria-modal="true" aria-labelledby="expanded-chart-title" className="max-w-6xl mx-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-8 space-y-5">
    <div className="flex justify-between items-start gap-4"><h2 id="expanded-chart-title" className="text-xl font-semibold">{definition.title}</h2><button ref={close} type="button" onClick={onClose} aria-label="Close expanded chart" className="p-2"><X className="w-5 h-5" /></button></div>
    {filterControls}<p className="text-sm text-neutral-700 dark:text-neutral-300">{definition.description}</p><AnalyticsPlot definition={definition} data={data} large /><p className="text-xs text-neutral-600 dark:text-neutral-300">{data.note}</p>
    {data.rows.length>0&&definition.kind!=='table'&&<details className="space-y-3"><summary className="text-sm font-semibold cursor-pointer">View chart data and sample counts</summary><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr>{Object.keys(data.rows[0]).map(k=><th key={k} className="p-2 border-b border-neutral-300 dark:border-neutral-700">{k==='name'?'Group / Date':k==='value'?`Value ${definition.unit||''}`:k}</th>)}</tr></thead><tbody>{data.rows.map((r,i)=><tr key={i}>{Object.entries(r).map(([k,v])=><td key={k} className="p-2 border-b border-neutral-200 dark:border-neutral-800">{v}</td>)}</tr>)}</tbody></table></div></details>}
  </div></div>;
};
