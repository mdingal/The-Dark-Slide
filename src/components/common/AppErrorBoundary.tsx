import React from 'react';
export class AppErrorBoundary extends React.Component<{children:React.ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<section role="alert" className="p-6 rounded-xl border border-neutral-700 space-y-3"><h1 className="text-xl font-semibold">This page could not load</h1><p className="text-sm">Your saved cloud records are preserved. If a save was still in progress, check your history after reloading.</p><button type="button" className="rounded-lg bg-[#D4A72C] text-black p-3 cursor-pointer" onClick={()=>window.location.reload()}>Reload app</button><a href="https://www.instagram.com/ktnk.fb/" target="_blank" rel="noopener noreferrer" className="ml-3 underline">Report a problem</a></section>:this.props.children;}
}
