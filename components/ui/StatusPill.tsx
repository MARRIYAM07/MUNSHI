export type StatusValue="ok"|"review"|"learned"|"high"|"med"|"low"|"active"|"expiring"|"expired"|"healthy"|"degraded";

const labels:Record<StatusValue,string>={ok:"Filed",review:"Review",learned:"Learned",high:"High",med:"Med",low:"Low",active:"Active",expiring:"Expiring",expired:"Expired",healthy:"Healthy",degraded:"Degraded"};

export type StatusPillProps={
  value:StatusValue;
  label?:string;
};

export function StatusPill({value,label}:StatusPillProps){
  const confidence=value==="high"||value==="med"||value==="low";
  const semantic=value==="healthy"?"ok":value==="degraded"?"review":value;
  return <span className={`${confidence?"confidence-pill":"status-tag"} ${value} ${semantic}`}>{label??labels[value]}</span>;
}
