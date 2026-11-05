import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context=vm.createContext({DurableObject:class{},Response,URL,Date,TextEncoder});
const strip=s=>s.replace(/^import .*$/gm,'').replace(/^export \{.*\};$/gm,'').replaceAll('export const ','const ').replaceAll('export class ','class ').replaceAll('export async function ','async function ');
const worker=vm.runInContext(strip(fs.readFileSync(new URL('../live/worker.mjs',import.meta.url),'utf8')).replace('export default','const worker =')+';worker',context);
for(const path of ['/','/api/login','/api/health']){
 const response=await worker.fetch(new Request('https://example.com'+path),{SERVICE_ARCHIVED:'true'});
 assert.equal(response.status,503);
}
const SupplyRoom=vm.runInContext(strip(fs.readFileSync(new URL('../live/supply-room.mjs',import.meta.url),'utf8'))+';SupplyRoom',vm.createContext({DurableObject:class{},Response,Date}));
for(const expired of [false,true]){
 const game={expires:Date.now()+(expired?-10000:100000),phase:'running',workflow:2};let scheduled=null,deleted=false;
 const ctx={storage:{get:async()=>game,setAlarm:async t=>{scheduled=t;},deleteAll:async()=>{deleted=true;}},blockConcurrencyWhile:async f=>f()};
 await new SupplyRoom(ctx,{SERVICE_ARCHIVED:'true'}).alarm();
 assert.equal(deleted,expired);assert.equal(scheduled,expired?null:game.expires);
}
console.log('Archivage : routes bloquées, aucune préparation IA et expiration des séances conservée.');
