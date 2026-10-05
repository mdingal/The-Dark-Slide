import {expect,it} from 'vitest';
import {riderSetupAnswers,riderObstacles} from '../domain/riderSetup';
import {SetupData} from '../domain/types';
it('derives the setup count from configurations instead of a past answer',()=>{
 const setup={id:'one'} as SetupData;
 expect(riderSetupAnswers({setupCount:'99'},[setup]).setupCount).toBe('1');
 expect(riderSetupAnswers({setupCount:'99'},[]).setupCount).toBe('0');
 expect(riderSetupAnswers({},[setup,{...setup,id:'two'}]).setupCount).toBe('2');
});
it('renames legacy Flatground answers and keeps it alongside ledges or rails',()=>{
 const original={obstacles:['Flatground only','Ledge','Flatground']};
 const normalized=riderSetupAnswers(original,[]);
 expect(normalized.obstacles).toEqual(['Flatground','Ledge']);
 expect(riderObstacles(normalized.obstacles as string[])).toEqual(['flatground','ledge']);
 expect(original.obstacles).toHaveLength(3);
});
