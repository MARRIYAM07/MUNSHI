"use client";

import {useId} from "react";

export type ToggleSwitchProps={
  checked:boolean;
  onCheckedChange:(checked:boolean)=>void;
  label:string;
  id?:string;
  name?:string;
  disabled?:boolean;
};

export function ToggleSwitch({checked,onCheckedChange,label,id,name,disabled=false}:ToggleSwitchProps){
  const generatedId=useId();
  const inputId=id??generatedId;
  return <label className="switch" htmlFor={inputId} title={label}>
    <input id={inputId} name={name} type="checkbox" checked={checked} disabled={disabled} onChange={event=>onCheckedChange(event.currentTarget.checked)} aria-label={label}/>
    <span className="slider" aria-hidden="true"/>
  </label>;
}
