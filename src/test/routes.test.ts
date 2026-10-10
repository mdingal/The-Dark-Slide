import {describe,it,expect,vi,afterEach} from 'vitest';
import {readTab,guideId,dashboardRoute,navigate,infoPath} from '../domain/routes';
afterEach(()=>vi.unstubAllGlobals());
function path(pathname:string,search=''){vi.stubGlobal('location',{pathname,search,hash:''});}
describe('URL routes',()=>{
 it('maps app pages and dashboard deep links',()=>{path('/trick-lab');expect(readTab()).toBe('generator');path('/deck-games');expect(readTab()).toBe('games');path('/trick-tree','?trick=kickflip');expect(readTab()).toBe('tree');path('/dashboard/analytics');expect(readTab()).toBe('history');expect(dashboardRoute()).toBe('analytics');});
 it('reads a guide independently from pagination',()=>{path('/trick-guides/kickflip','?page=3');expect(guideId()).toBe('kickflip');expect(readTab()).toBeUndefined();expect(infoPath('trick-guide')).toBe('/trick-guides');});
 it('pushes navigation and replaces filter updates without scrolling',()=>{path('/');const pushState=vi.fn(),replaceState=vi.fn(),dispatchEvent=vi.fn(),scrollTo=vi.fn();vi.stubGlobal('history',{pushState,replaceState});vi.stubGlobal('window',{dispatchEvent,scrollTo});navigate('/faq');expect(pushState).toHaveBeenCalled();expect(dispatchEvent).toHaveBeenCalled();navigate('/trick-guides?q=flip',true);expect(replaceState).toHaveBeenCalled();expect(scrollTo).toHaveBeenCalledTimes(1);});
});
