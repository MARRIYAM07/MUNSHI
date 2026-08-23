"use client";

import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from "react";

export type ToastOptions={duration?:number};
export type ShowToast=(message:string,options?:ToastOptions)=>void;

const ToastContext=createContext<ShowToast|null>(null);

export type ToastProps={message:string;visible:boolean};

export function Toast({message,visible}:ToastProps){
  return <div className={`toast${visible?" show":""}`} role="status" aria-live="polite" aria-atomic="true">{message}</div>;
}

export type ToastProviderProps={children:ReactNode;defaultDuration?:number};

export function ToastProvider({children,defaultDuration=2600}:ToastProviderProps){
  const[message,setMessage]=useState("");
  const[visible,setVisible]=useState(false);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);

  const showToast=useCallback<ShowToast>((nextMessage,options)=>{
    if(timer.current)clearTimeout(timer.current);
    setMessage(nextMessage);
    setVisible(true);
    timer.current=setTimeout(()=>setVisible(false),options?.duration??defaultDuration);
  },[defaultDuration]);

  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);

  return <ToastContext.Provider value={showToast}>
    {children}
    <Toast message={message} visible={visible}/>
  </ToastContext.Provider>;
}

export function useToast():ShowToast{
  const showToast=useContext(ToastContext);
  if(!showToast)throw new Error("useToast must be used inside ToastProvider");
  return showToast;
}
