import type { Provider } from "@/lib/connections";
export type ParsedSms={provider:Provider;amountMinor:number;currency:string;direction:"credit"|"debit";counterparty:string;description:string};
type Pattern={regex:RegExp;amount:number;direction?:"credit"|"debit";directionGroup?:number;counterparty?:number};
export const SMS_PATTERNS:Record<"jazzcash"|"easypaisa"|"bank_sms",Pattern[]>={
 jazzcash:[{regex:/(?:Rs\.?|PKR)\s*([\d,]+(?:\.\d{1,2})?).*?(?:received\s+from|from)\s+([^,.]+)/i,amount:1,direction:"credit",counterparty:2},{regex:/(?:sent|paid).*?(?:Rs\.?|PKR)\s*([\d,]+(?:\.\d{1,2})?).*?(?:to|at)\s+([^,.]+)/i,amount:1,direction:"debit",counterparty:2}],
 easypaisa:[{regex:/(?:received).*?(?:Rs\.?|PKR)\s*([\d,]+(?:\.\d{1,2})?).*?from\s+([^,.]+)/i,amount:1,direction:"credit",counterparty:2},{regex:/(?:Rs\.?|PKR)\s*([\d,]+(?:\.\d{1,2})?).*?(?:paid|sent).*?(?:to)\s+([^,.]+)/i,amount:1,direction:"debit",counterparty:2}],
 bank_sms:[{regex:/(?:PKR|Rs\.?)\s*([\d,]+(?:\.\d{1,2})?).*?(credited|debited).*?(?:at|to|from)?\s*([^,.]*)/i,amount:1,directionGroup:2,counterparty:3}]
};
export function detectSmsProvider(from:string,body:string):"jazzcash"|"easypaisa"|"bank_sms" {const s=`${from} ${body}`.toLowerCase();return s.includes("jazzcash")||s.includes("mobilink")?"jazzcash":s.includes("easypaisa")||s.includes("telenor")?"easypaisa":"bank_sms";}
export function parseSms(from:string,body:string):ParsedSms|null {const provider=detectSmsProvider(from,body);for(const p of SMS_PATTERNS[provider]){const m=p.regex.exec(body);if(!m)continue;const amount=Math.round(Number(m[p.amount].replace(/,/g,""))*100);if(!Number.isSafeInteger(amount))continue;const direction=p.direction??(m[p.directionGroup!].toLowerCase().startsWith("credit")?"credit":"debit");const counterparty=(p.counterparty?m[p.counterparty]:"").trim()||"Unknown";return{provider,amountMinor:amount,currency:"PKR",direction,counterparty,description:`${provider} — ${counterparty}`};}return null;}
