import React from 'react';
import {BookOpen,ChartNoAxesCombined,ClipboardList,Info,Layers,UserRound} from 'lucide-react';
const icons={guides:BookOpen,dashboard:ChartNoAxesCombined,setup:ClipboardList,info:Info,library:Layers,rider:UserRound};
export function DesignBadge({kind='info'}:{kind?:keyof typeof icons}){const Icon=icons[kind];return <span className="ds-heading-badge" aria-hidden="true"><Icon size={23}/></span>;}
