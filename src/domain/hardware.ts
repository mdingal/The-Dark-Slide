import type {SetupData, PracticeSession} from './types';
export const PART_KINDS = ['deck','trucks','wheels','griptape','bushings','pivot_cups','risers'] as const;
export type PartKind = typeof PART_KINDS[number];
export interface InventoryPart {id:string; kind:PartKind; name:string; brand?:string; location?:'installed'|'reserve'; quantity?:number; specs:Record<string,string>;}
export interface OnboardingData {version:1; completedAt?:string; step:number; answers:Record<string,string|string[]>;}
export const PART_LABELS:Record<PartKind,string>={deck:'Decks',trucks:'Trucks',wheels:'Wheels',griptape:'Griptape',bushings:'Bushings',pivot_cups:'Pivot Cups',risers:'Risers'};
export const PART_FIELDS:Record<PartKind,Record<string,string[]|null>>={
 deck:{'Width (mm)':null,'Length (mm)':null,Mold:['Low','Medium','High','Flat'],Shape:['Popsicle','Boxy','Cruiser','Egg','Old school','Other'],'Number of plies':null,Material:null,Weight:['Light','Medium','Heavy'],'Graphic type':['Paper graphic','Real wear','Screen-printed','Laser-engraved','Debossed / pressed','Blank']},
 griptape:{'Thickness (mm)':null},trucks:{'Width (mm)':null,Kingpin:['Regular','Inverted']},
 wheels:{Shape:null,'Width (mm)':null,'Diameter (mm)':null,Material:['Plastic','Urethane','Resin','Other'],'Bearing type':['ABEC 3','ABEC 7','ABEC 9','Ceramic','Other']},
 bushings:{Hardness:['Soft','Medium','Hard','Other'],Shape:null},pivot_cups:{Material:null,Fit:null},risers:{'Thickness (mm)':null,Material:null}
};
export function partName(part:InventoryPart):string {
 const name=part.name.trim(),brand=(part.brand||'').trim();
 return !brand||name.toLowerCase().includes(brand.toLowerCase())?name:[brand,name].filter(Boolean).join(' ');
}
export function partLabel(part:InventoryPart):string {
 const name=partName(part),width=part.specs['Width (mm)'];
 return part.kind==='deck'&&width?`${name} - ${width}mm`:name;
}
export const uid=(prefix:string)=>`${prefix}_${crypto.randomUUID()}`;
export function setupFromParts(name:string, ids:Partial<Record<PartKind,string>>, inventory:InventoryPart[], existing?:SetupData):SetupData {
 const parts=Object.fromEntries(PART_KINDS.flatMap(kind=>{const p=inventory.find(p=>p.id===ids[kind]&&p.kind===kind);return p?[[kind,structuredClone(p)]]:[]})) as Partial<Record<PartKind,InventoryPart>>;
 const width=Number(parts.deck?.specs['Width (mm)']);
 const material=parts.wheels?.specs.Material?.toLowerCase();
 return {...existing,id:existing?.id||uid('setup'),name:name.trim(),deckWidthMm:width>0?width:0,wheelMaterial:['plastic','urethane','resin'].includes(material||'')?material as SetupData['wheelMaterial']:'unknown',deckModel:parts.deck?partName(parts.deck):'',truckModel:parts.trucks?partName(parts.trucks):'',wheelModel:parts.wheels?partName(parts.wheels):'',partIds:{...ids},partsSnapshot:parts};
}
export function setupUsed(setupId:string,sessions:PracticeSession[]):boolean{return sessions.some(s=>s.setupSnapshot.id===setupId&&!!s.sessionStartedAt);}
export const SURFACES=['Laminated wood','Non-laminated wood','Cement','Marble','Granite','Metal','Other'];
