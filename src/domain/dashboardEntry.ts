let dashboardView:'overview'|'history'|'analytics'|'setups'='overview';
let resetLab=false;
export function requestDashboardView(view:typeof dashboardView){dashboardView=view;}
export function consumeDashboardView(){const view=dashboardView;dashboardView='overview';return view;}
export function requestLabStart(){resetLab=true;window.dispatchEvent(new Event('lab-start-entry'));}
export function consumeLabStart(){const reset=resetLab;resetLab=false;return reset;}
