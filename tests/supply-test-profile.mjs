import assert from 'node:assert/strict';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const mf=new Miniflare(convertV4MiniflareOptions({modules:true,scriptPath:root+'.wrangler/build/worker.js',compatibilityDate:'2026-10-01',durableObjects:{ROOMS:{className:'QuizRoom',useSQLite:true},LOGIN_LIMITS:{className:'LoginLimit',useSQLite:true},SUPPLY:{className:'SupplyRoom',useSQLite:true}},bindings:{ADMIN_PASSWORD:'TEST-only-12345',SESSION_KEY:'test-signing-secret-32-characters-long',ALLOWED_ORIGINS:'https://cyrillea.github.io'}}));
async function api(path,token='',body,status=200){const r=await mf.dispatchFetch('https://quiz.test'+path,{method:body?'POST':'GET',headers:{Origin:'https://cyrillea.github.io','Content-Type':'application/json',Authorization:'Bearer '+token},body:body?JSON.stringify(body):undefined});const d=await r.json();assert.equal(r.status,status,`${path}: ${JSON.stringify(d)}`);return d;}
try{
 const {token:admin}=await api('/api/login','',{password:'TEST-only-12345'}),{code:realCode}=await api('/api/supply-sessions',admin,{},201),real='/api/supply-sessions/'+realCode;
 const {token:student}=await api(real+'/join','',{},201);await api(real+'/role',student,{role:'planning'});
 await api('/api/supply-sessions','',{testMode:true},401);
 const {code}=await api('/api/supply-sessions',admin,{testMode:true},201),path='/api/supply-sessions/'+code;
 const state=role=>api(path+'/test-state',admin,{role}),act=(role,action,payload,status=200)=>api(path+'/test-act',admin,{role,action,payload},status),control=body=>api(path+'/control',admin,body);
 let all=await api(path+'/results',admin);assert.equal(all.testMode,true);assert.equal(all.participants,6);assert.equal(all.roles.every(r=>r.count===1),true);assert.equal(all.testTasks.length,6);
 await api(path+'/join','',{},403);await api(path+'/state','',undefined,403);
 await api(path+'/test-state','',{role:'supplierA'},401);await api(path+'/test-act',student,{role:'supplierA',action:'quote',payload:{}},401);
 await api(real+'/test-state',admin,{role:'planning'},409);await api(path+'/test-state',admin,{role:'unknown'},400);await act('planning','control',{command:'start'},400);await act('planning','assist',{},400);
 await act('planning','request',{to:'buying',parentId:'NEED-1',quantity:80,delivery:960},409);await control({command:'start'});
 const need=(await act('planning','request',{to:'buying',parentId:'NEED-1',quantity:80,delivery:960})).documents.at(-1);
 const requests={};for(const role of ['supplierA','supplierB'])requests[role]=(await act('buying','request',{to:role,parentId:need.id,quantity:40,delivery:960})).documents.at(-1);
 assert.equal((await state('supplierA')).isCaptain,true);assert.equal((await state('supplierA')).inventory.minPrice,1000);assert.equal((await state('supplierA')).resources,undefined);
 assert.equal((await state('supplierA')).documents.some(d=>d.to==='supplierB'),false,'Le rôle sélectionné conserve sa vue d’équipe');
 for(const role of ['supplierA','supplierB']){
  const payload={requestId:requests[role].id,quantity:40,unitPrice:role==='supplierA'?1200:1400,delivery:960};
  assert.equal((await act(role,'check',payload)).ok,true);
  const offer=(await act(role,'quote',payload)).documents.at(-1);await act('buying','accept',{id:offer.id});
 }
 const internal=(await act('buying','quote',{requestId:need.id,quantity:80,unitPrice:0,delivery:960})).documents.at(-1);await act('planning','accept',{id:internal.id});
 const service=(await act('planning','request',{to:'ops',parentId:'NEED-1',quantity:80,delivery:1140})).documents.at(-1);
 const shipment=(await act('ops','quote',{requestId:service.id,quantity:80,unitPrice:600,delivery:1140,transport:'normal'})).documents.at(-1);await act('planning','accept',{id:shipment.id});
 await act('planning','plan',{quantity:80,transport:'normal'});
 const promise=(await act('planning','quote',{requestId:'NEED-1',quantity:80,unitPrice:0,delivery:1140,transport:'normal'})).documents.at(-1);await act('client','accept',{id:promise.id});
 all=await api(path+'/results',admin);assert.equal(all.assessment.valid,true);assert.equal(all.assessment.quantity,80);assert.equal(all.participants,6);assert.equal(all.financeHistory.length>1,true);assert.equal(all.testTasks.find(t=>t.role==='client').complete,true);
 const untouched=await api(real+'/results',admin);assert.equal(untouched.participants,1);assert.equal(untouched.documents.length,1);assert.equal(untouched.testMode,false,'Le jeu réel n’est jamais transformé en test');
 await control({command:'finish'});await act('buying','message',{to:'planning',type:'note',text:'Après fin'},409);assert.equal((await state('planning')).phase,'finished');
 console.log('Profil test : six capitaines simulés, sélection des rôles, chaîne complète à 80 coffrets, contrôles métier, confidentialité, accès animateur obligatoire et isolation des parties élèves vérifiés.');
}finally{await mf.dispose();}
