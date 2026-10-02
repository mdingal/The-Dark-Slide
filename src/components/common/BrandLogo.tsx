import React from 'react';

// Use the PNG alpha channel directly. No SVG color-matrix or inversion filters.
export const BrandLogo:React.FC<{className?:string;monogram?:boolean}>=({className='',monogram=false})=>{
 const url=monogram?'/dark-slide-ds-clean.png':'/dark-slide-wordmark-clean.png';
 const bounds=monogram?{w:1620,h:971,x:136,y:158,cw:1320,ch:657}:{w:1905,h:826,x:86,y:189,cw:1688,ch:459};
 const mask={maskImage:`url(${url})`,WebkitMaskImage:`url(${url})`,maskRepeat:'no-repeat',WebkitMaskRepeat:'no-repeat',maskSize:`${bounds.w/bounds.cw*100}% ${bounds.h/bounds.ch*100}%`,WebkitMaskSize:`${bounds.w/bounds.cw*100}% ${bounds.h/bounds.ch*100}%`,maskPosition:`${bounds.x/(bounds.w-bounds.cw)*100}% ${bounds.y/(bounds.h-bounds.ch)*100}%`,WebkitMaskPosition:`${bounds.x/(bounds.w-bounds.cw)*100}% ${bounds.y/(bounds.h-bounds.ch)*100}%`,aspectRatio:`${bounds.cw}/${bounds.ch}`} as React.CSSProperties;
 return <span role="img" aria-label={monogram?'Dark Slide':'Dark Slide — Fingerboard Lab'} className={`block bg-neutral-950 dark:bg-white ${className}`} style={mask}/>;
};
