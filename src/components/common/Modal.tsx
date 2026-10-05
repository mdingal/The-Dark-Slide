import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const modalStack: HTMLDivElement[] = [];
let savedBodyOverflow='';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, wide=false }) => {
  const titleId=useId();
  const dialogRef=useRef<HTMLDivElement>(null),closeRef=useRef(onClose);closeRef.current=onClose;
  useEffect(()=>{
    if(!isOpen)return;
    const previous=document.activeElement as HTMLElement|null,dialog=dialogRef.current;
    if(!dialog)return;
    if(!modalStack.length){savedBodyOverflow=document.body.style.overflow;document.body.style.overflow='hidden';}
    modalStack.push(dialog);
    const focusable=()=>Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex="0"]')||[]);
    focusable()[0]?.focus();
    const key=(e:KeyboardEvent)=>{
      if(modalStack[modalStack.length-1]!==dialog)return;
      if(e.key==='Escape'){e.preventDefault();closeRef.current();return;}
      if(e.key!=='Tab')return;const items=focusable(),first=items[0],last=items[items.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
    };
    window.addEventListener('keydown',key);
    return()=>{window.removeEventListener('keydown',key);const index=modalStack.indexOf(dialog);if(index>=0)modalStack.splice(index,1);if(!modalStack.length)document.body.style.overflow=savedBodyOverflow;if(previous?.isConnected)previous.focus({preventScroll:true});};
  },[isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div className={`relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl ${wide ? 'max-w-6xl' : 'max-w-2xl'} w-full max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden shadow-xl text-neutral-900 dark:text-neutral-100`}>
        <div className="flex shrink-0 items-center justify-between gap-4 p-4 sm:px-6 border-b border-neutral-200 dark:border-neutral-800">
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="shrink-0 cursor-pointer p-1 rounded-md text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
};
