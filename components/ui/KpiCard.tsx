import type {ReactNode} from "react";

export type KpiTone="forest"|"brass"|"red";

export type KpiCardProps={
  label:string;
  value:ReactNode;
  tone?:KpiTone;
  warning?:boolean;
  detail?:ReactNode;
};

export function KpiCard({label,value,tone="forest",warning=false,detail}:KpiCardProps){
  return <article className={`kpi-card${tone==="forest"?"":` ${tone}`}`}>
    <div className={`num${warning?" warn":""}`}>{value}</div>
    <div className="lbl">{label}</div>
    {detail}
  </article>;
}
