"use client";

import {useEffect,useId,type MouseEvent,type ReactNode} from "react";

export type ModalProps={
  open:boolean;
  title:string;
  onClose:()=>void;
  children:ReactNode;
  footer?:ReactNode;
  closeLabel?:string;
};

export function Modal({open,title,onClose,children,footer,closeLabel="Close dialog"}:ModalProps){
  const titleId=useId();

  useEffect(()=>{
    if(!open)return;
    const closeOnEscape=(event:KeyboardEvent)=>{if(event.key==="Escape")onClose();};
    window.addEventListener("keydown",closeOnEscape);
    return()=>window.removeEventListener("keydown",closeOnEscape);
  },[onClose,open]);

  const closeOnBackdrop=(event:MouseEvent<HTMLDivElement>)=>{
    if(event.target===event.currentTarget)onClose();
  };

  return <div className={`modal-backdrop${open?" show":""}`} onMouseDown={closeOnBackdrop} aria-hidden={!open}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="modal-head">
        <h3 id={titleId}>{title}</h3>
        <button className="modal-close" type="button" onClick={onClose} aria-label={closeLabel}>✕</button>
      </div>
      <div className="modal-body">{children}</div>
      {footer?<div className="modal-footer">{footer}</div>:null}
    </section>
  </div>;
}
