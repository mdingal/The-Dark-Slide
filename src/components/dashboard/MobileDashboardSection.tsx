import React,{useState,useId} from 'react';
export function MobileDashboardSection({title,children}:{title:string;children:React.ReactNode}){
 const [open,setOpen]=useState(false),id=useId();
 return <div className="mobile-dashboard-section"><button type="button" className="w-full flex justify-between items-center gap-3 p-4 text-left font-semibold cursor-pointer" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}>{title}<span aria-hidden="true">{open?'−':'+'}</span></button><div id={id} className={`${open?'block':'hidden'}`}>{children}</div></div>;
}
