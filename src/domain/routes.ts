export const tabPaths={home:'/',generator:'/trick-lab',history:'/dashboard',library:'/trick-library',settings:'/rider-profile'} as const;
export function navigate(path:string,replace=false){if(location.pathname+location.search===path&&!location.hash)return;history[replace?'replaceState':'pushState']({},'',path);window.dispatchEvent(new Event('app-route-change'));if(!replace)window.scrollTo({top:0,left:0,behavior:'instant'});}
export function infoPath(id:string){return id==='trick-guide'?'/trick-guides':'/'+id;}
export function readTab(){const p=location.pathname;return p.startsWith('/dashboard')?'history':Object.entries(tabPaths).find(([,path])=>path===p)?.[0] as keyof typeof tabPaths|undefined;}
export function dashboardRoute(){const v=location.pathname.split('/')[2];return v==='history'||v==='analytics'||v==='setups'?v:'overview';}
export function guideId(){return location.pathname.startsWith('/trick-guides/')?decodeURIComponent(location.pathname.split('/')[2]):null;}
