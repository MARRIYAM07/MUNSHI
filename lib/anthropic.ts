import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { Category,LlmClassifier } from "@/lib/categorize";
const answer=z.object({category:z.string(),certainty:z.enum(["low","med","high"])});
export const anthropicClassifier:LlmClassifier=async(input,categories:Category[])=>{
 if(!process.env.ANTHROPIC_API_KEY)return null;
 const client=new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY});
 const response=await client.messages.create({model:process.env.ANTHROPIC_MODEL??"claude-haiku-4-5-20251001",max_tokens:80,temperature:0,system:"You classify one bookkeeping transaction. Use exactly one supplied category or Uncategorized. Never provide tax advice.",messages:[{role:"user",content:`Description: ${input.description}\nAmount minor units: ${input.amountMinor} ${input.currency}\nCategories: ${categories.map(c=>c.name).join(", ")}\nReturn JSON only: {"category":"...","certainty":"low|med|high"}`} ]});
 const text=response.content.find(x=>x.type==="text");if(!text||text.type!=="text")return null;
 try{return answer.parse(JSON.parse(text.text));}catch{return null;}
};
