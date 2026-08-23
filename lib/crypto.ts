import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { z } from "zod";

const envelopeSchema=z.object({v:z.literal(1),alg:z.literal("A256GCM"),iv:z.string(),tag:z.string(),ct:z.string(),wrapIv:z.string(),wrapTag:z.string(),wrappedKey:z.string()});
type Envelope=z.infer<typeof envelopeSchema>;
const b64=(b:Buffer)=>b.toString("base64url");
const unb64=(s:string)=>Buffer.from(s,"base64url");
function masterKey(){ const raw=process.env.FIELD_ENCRYPTION_KEY; if(!raw) throw new Error("FIELD_ENCRYPTION_KEY is required"); const key=/^[a-f\d]{64}$/i.test(raw)?Buffer.from(raw,"hex"):Buffer.from(raw,"base64"); if(key.length!==32) throw new Error("FIELD_ENCRYPTION_KEY must decode to 32 bytes"); return key; }
function seal(value:Buffer,key:Buffer){const iv=randomBytes(12);const cipher=createCipheriv("aes-256-gcm",key,iv);const ct=Buffer.concat([cipher.update(value),cipher.final()]);return{iv,tag:cipher.getAuthTag(),ct};}
function open(iv:Buffer,tag:Buffer,ct:Buffer,key:Buffer){const decipher=createDecipheriv("aes-256-gcm",key,iv);decipher.setAuthTag(tag);return Buffer.concat([decipher.update(ct),decipher.final()]);}
export function encryptField(value:unknown):Buffer { const dataKey=randomBytes(32), data=seal(Buffer.from(JSON.stringify(value)),dataKey), wrapped=seal(dataKey,masterKey()); const e:Envelope={v:1,alg:"A256GCM",iv:b64(data.iv),tag:b64(data.tag),ct:b64(data.ct),wrapIv:b64(wrapped.iv),wrapTag:b64(wrapped.tag),wrappedKey:b64(wrapped.ct)}; return Buffer.from(JSON.stringify(e)); }
export function decryptField<T>(value:Uint8Array):T { const e=envelopeSchema.parse(JSON.parse(Buffer.from(value).toString("utf8"))); const key=open(unb64(e.wrapIv),unb64(e.wrapTag),unb64(e.wrappedKey),masterKey()); return JSON.parse(open(unb64(e.iv),unb64(e.tag),unb64(e.ct),key).toString("utf8")) as T; }
export function tokenHash(token:string){return createHash("sha256").update(token,"utf8").digest();}
export function newForwardingToken(){return b64(randomBytes(32));}
export function toBytea(value:Buffer){return `\\x${value.toString("hex")}`;}
export function fromBytea(value:string|Uint8Array){return typeof value==="string"&&value.startsWith("\\x")?Buffer.from(value.slice(2),"hex"):Buffer.from(value);}
