export type Category={id:string;name:string};
export type CacheRule={id:string;merchantPattern:string;categoryId:string};
export type KeywordRule={keyword:string;categoryId:string};
export type StagedInput={id:string;description:string;amountMinor:number;currency:string};
export type Classification={categoryId:string|null;categoryName:string;confidence:"high"|"med"|"low";status:"ok"|"review";source:"merchant"|"keyword"|"llm"|"none";cacheRuleId?:string};
export type LlmClassifier=(input:StagedInput,categories:Category[])=>Promise<{category:string;certainty:"low"|"med"|"high"}|null>;

export function normalizeMerchant(s:string){return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g," ").trim();}
function trigrams(s:string){const x=`  ${s} `;return new Set(Array.from({length:Math.max(0,x.length-2)},(_,i)=>x.slice(i,i+3)));}
export function similarity(a:string,b:string){const aa=trigrams(normalizeMerchant(a)),bb=trigrams(normalizeMerchant(b));if(!aa.size&&!bb.size)return 1;let overlap=0;aa.forEach(x=>{if(bb.has(x))overlap++;});return 2*overlap/(aa.size+bb.size);}

export async function categorize(input:StagedInput,categories:Category[],cache:CacheRule[],keywords:KeywordRule[],llm:LlmClassifier):Promise<Classification>{
 const normalized=normalizeMerchant(input.description);
 const hit=cache.map(rule=>({rule,score:normalized===normalizeMerchant(rule.merchantPattern)?1:similarity(normalized,rule.merchantPattern)})).filter(x=>x.score>=0.70).sort((a,b)=>b.score-a.score)[0];
 if(hit){const cat=categories.find(c=>c.id===hit.rule.categoryId);if(cat)return{categoryId:cat.id,categoryName:cat.name,confidence:"high",status:"ok",source:"merchant",cacheRuleId:hit.rule.id};}
 const keyword=keywords.find(rule=>normalized.includes(normalizeMerchant(rule.keyword)));
 if(keyword){const cat=categories.find(c=>c.id===keyword.categoryId);if(cat)return{categoryId:cat.id,categoryName:cat.name,confidence:"high",status:"ok",source:"keyword"};}
 const result=await llm(input,categories);
 if(result){const cat=categories.find(c=>c.name.toLowerCase()===result.category.toLowerCase());if(cat)return{categoryId:cat.id,categoryName:cat.name,confidence:result.certainty==="high"?"med":result.certainty,status:result.certainty==="low"?"review":"ok",source:"llm"};}
 return{categoryId:null,categoryName:"Uncategorized",confidence:"low",status:"review",source:"none"};
}

export type CacheWriter={upsert:(value:{businessId:string;merchantPattern:string;categoryId:string})=>Promise<void>};
export async function learnCorrection(writer:CacheWriter,businessId:string,description:string,categoryId:string){await writer.upsert({businessId,merchantPattern:normalizeMerchant(description),categoryId});return{categoryId,confidence:"learned" as const,status:"ok" as const};}
