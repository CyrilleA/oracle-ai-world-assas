import assert from 'node:assert/strict';
import {initialGame,workflowCheck,act} from '../live/supply-game.mjs';
import {productionCalculation} from '../site/supply-production.mjs';
const g=initialGame('PRODTIME');g.phase='running';g.players={a:{id:'a',role:'supplierA'},b:{id:'b',role:'buying'}};
Object.assign(g.resources.supplierA,{capacity:120,rawStock:100,productionCapacity:100,productionStart:1200,earliest:1260});
g.documents.push({id:'r',type:'request',from:'buying',to:'supplierA',quantity:80,delivery:1320,status:'open'});
const b={requestId:'r',quantity:80,unitPrice:1400,delivery:1320};let check=workflowCheck(g,g.players.a,b);
assert.equal(check.ok,false);assert.equal(check.production.stockUsed,20);assert.equal(check.production.toManufacture,60);assert.equal(check.production.duration,90);assert.equal(check.production.from,1200);assert.equal(check.production.until,1290);assert.equal(check.production.earliestDelivery,1350);assert.equal(check.production.maxAtSelectedTime,60);assert.equal(check.earliestForFullQuantity,1350);
check=workflowCheck(g,g.players.a,{...b,delivery:1350});assert.equal(check.ok,true);assert.equal(check.production.maxAtSelectedTime,80);assert.match(productionCalculation(check.production),/22:30/);
act(g,g.players.a,'quote',{...b,delivery:1350});act(g,g.players.b,'accept',{id:g.documents.at(-1).id});assert.equal(g.documents.at(-1).quantity,80);
const existing=g.documents.at(-1);check=workflowCheck(g,g.players.a,{...b,replacesId:existing.id,delivery:1350});assert.equal(check.ok,true,'Une révision ne compte pas deux fois les réservations');assert.equal(check.production.stockUsed,20);
const constrained=initialGame('LIMITMAT');constrained.phase='running';constrained.documents.push({id:'r',type:'request',from:'buying',to:'supplierA',quantity:80,delivery:1439,status:'open'});check=workflowCheck(constrained,{id:'a',role:'supplierA'},{...b,delivery:1439});assert.equal(check.ok,false,'Du temps supplémentaire ne crée pas de matières');assert.equal(check.production.maxAtSelectedTime,60);assert.match(productionCalculation(check.production),/Il manque aussi des matières/);
console.log('Fabrication : 80 composants depuis 20 h livrables à 22 h 30, plafond à 60 pour 22 h, matières finies, révisions et explication du calcul vérifiés.');

const prior=initialGame('PRIORWIN');prior.phase='running';prior.players={a:{id:'a',role:'supplierA'},b:{id:'b',role:'buying'}};prior.documents.push({id:'r',type:'request',from:'buying',to:'supplierA',quantity:80,delivery:1320,status:'open'});act(prior,prior.players.a,'quote',{...b,quantity:40,delivery:870});const old=prior.documents.at(-1);act(prior,prior.players.b,'accept',{id:old.id});prior.productionWindows={supplierA:{start:1200}};Object.assign(prior.resources.supplierA,{capacity:120,rawStock:100,productionCapacity:100});
check=workflowCheck(prior,prior.players.a,{...b,quantity:40,delivery:1320});assert.equal(check.ok,true);assert.equal(check.production.duration,60);assert.equal(check.production.earliestDelivery,1320,'Le nouvel ordre utilise le créneau de 20 h sans refaire les anciennes pièces');check=workflowCheck(prior,prior.players.a,{...b,replacesId:old.id,delivery:1350});assert.equal(check.ok,true);assert.equal(check.production.earliestDelivery,1350);
const {workflowHealth}=await import('../live/supply-game.mjs');assert.equal(workflowHealth(prior,old).ok,true,'L’engagement déjà confirmé ne change pas de date');
const {Miniflare,convertV4MiniflareOptions}=await import('miniflare');const {fileURLToPath}=await import('node:url');const root=fileURLToPath(new URL('../',import.meta.url));
const mf=new Miniflare(convertV4MiniflareOptions({modules:true,scriptPath:root+'.wrangler/build/worker.js',compatibilityDate:'2026-10-01',durableObjects:{ROOMS:{className:'QuizRoom',useSQLite:true},LOGIN_LIMITS:{className:'LoginLimit',useSQLite:true},SUPPLY:{className:'SupplyRoom',useSQLite:true}},bindings:{ADMIN_PASSWORD:'TEST-only-12345',SESSION_KEY:'test-signing-secret-32-characters-long',ALLOWED_ORIGINS:'https://cyrillea.github.io'}}));
async function api(path,token='',body,status=200){const r=await mf.dispatchFetch('https://quiz.test'+path,{method:body?'POST':'GET',headers:{Origin:'https://cyrillea.github.io','Content-Type':'application/json',Authorization:'Bearer '+token},body:body?JSON.stringify(body):undefined});const d=await r.json();assert.equal(r.status,status,JSON.stringify(d));return d;}
try{
 const {token:admin}=await api('/api/login','',{password:'TEST-only-12345'}),{code}=await api('/api/supply-sessions',admin,{testMode:true},201),path='/api/supply-sessions/'+code;
 await api(path+'/control',admin,{command:'start'});await api(path+'/control','',{command:'production-window',role:'supplierA',start:1200,materials:100,production:100},401);
 await api(path+'/control',admin,{command:'production-window',role:'supplierA',start:1200,materials:100,production:100});
 let s=await api(path+'/test-state',admin,{role:'supplierA'});assert.equal(s.inventory.remaining,120);assert.equal(s.inventory.productionWindow.start,1200);assert.equal(s.inventory.productionStart,780,'Le créneau ne réécrit pas les anciennes fabrications');
 const request=(await api(path+'/test-act',admin,{role:'buying',action:'request',payload:{to:'supplierA',parentId:'NEED-1',quantity:80,delivery:1320}})).documents.at(-1);
 check=await api(path+'/test-act',admin,{role:'supplierA',action:'check',payload:{...b,requestId:request.id}});assert.equal(check.production.maxAtSelectedTime,60);assert.equal(check.earliestForFullQuantity,1350);
 s=await api(path+'/test-act',admin,{role:'supplierA',action:'quote',payload:{...b,requestId:request.id,delivery:1350}});assert.equal(s.documents.at(-1).delivery,1350);
 const {code:normal}=await api('/api/supply-sessions',admin,{},201);await api('/api/supply-sessions/'+normal+'/control',admin,{command:'production-window',role:'supplierA',start:1200,materials:100,production:100},409);
 await api(path+'/control',admin,{command:'production-window',role:'supplierA',start:1400,materials:100,production:100},400);
 console.log('Atelier test : ajustement atomique réservé à l’animateur, capacité effective à 120 et offre après 22 h acceptée par le serveur vérifiés.');
}finally{await mf.dispose();}
