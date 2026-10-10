const IDS=['fundamentals','basic-flips','heelflips','kickflips','shuvits','spins','varial-flips','360-flips','hard-inward','big-flips','big-spins','double-impossible','regular-mix','fakie-mix','nollie-mix','switch-mix','better-late-than-sorry','see-you-later-alligator'];
const COLORS=['#d4a72c','#97bdb5','#c9a685','#a8aec9','#8ab6a0','#c4b37c','#b29abd','#97bbcd','#c79a95','#c4af87','#96b5bb','#b4b594','#b7c8aa','#b5a5bf','#bda887','#8daac3','#d4ac6b','#9fc4ae'];
export function deckBackDesign(id='fundamentals'){
 const found=IDS.indexOf(id),index=found<0?0:found;
 return {index,color:COLORS[index],pattern:index%6,variation:Math.floor(index/6),code:String(index+1).padStart(2,'0')};
}
