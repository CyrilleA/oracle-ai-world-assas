import {initialGame,workflowHealth,workflowCheck,view} from '../live/supply-game.mjs';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const mf=new Miniflare(convertV4MiniflareOptions({modules:true,scriptPath:root+'.wrangler/build/worker.js',compatibilityDate:'2026-10-01',durableObjects:{ROOMS:{className:'QuizRoom',useSQLite:true},LOGIN_LIMITS:{className:'LoginLimit',useSQLite:true},SUPPLY:{className:'SupplyRoom',useSQLite:true}},bindings:{ADMIN_PASSWORD:'TEST-only-12345',SESSION_KEY:'test-signing-secret-32-characters-long',ALLOWED_ORIGINS:'https://cyrillea.github.io'}}));
async function api(path,token='',body,status=200){const r=await mf.dispatchFetch('https://quiz.test'+path,{method:body?'POST':'GET',headers:{Origin:'https://cyrillea.github.io','Content-Type':'application/json',Authorization:'Bearer '+token},body:body?JSON.stringify(body):undefined});const data=await r.json();assert.equal(r.status,status,`${path}: ${JSON.stringify(data)}`);return data;}
try{
 const scheduling=initialGame('SCHEDULE');scheduling.documents.push({id:'one',from:'supplierA',to:'buying',type:'offer',status:'accepted',quantity:20,unitPrice:1000,delivery:840,acceptedAt:1,orderRef:'ENG-001'},{id:'two',from:'supplierA',to:'buying',type:'offer',status:'accepted',quantity:40,unitPrice:1000,delivery:900,acceptedAt:1,orderRef:'ENG-002'});
 assert.equal(workflowHealth(scheduling,scheduling.documents.at(-1)).ok,true);
 scheduling.resources.supplierA.productionRate=20;
 assert.equal(workflowHealth(scheduling,scheduling.documents[1]).ok,true,'Le stock réservé en premier reste réalisable');
 assert.equal(workflowHealth(scheduling,scheduling.documents[2]).ok,false,'La seconde réservation utilise bien la fabrication, même à horodatage identique');
 const partial=initialGame('PARTIAL1');partial.documents.push({id:'source',from:'supplierA',to:'buying',type:'offer',status:'accepted',quantity:60,unitPrice:1000,delivery:900,acceptedAt:1,orderRef:'ENG-001'},{id:'internal',from:'buying',to:'planning',type:'offer',status:'accepted',quantity:60,unitPrice:0,delivery:900,acceptedAt:2,orderRef:'ENG-002',dependencyIds:['source']},{id:'service',from:'planning',to:'ops',type:'request',status:'open',quantity:80,delivery:1140});
 assert.deepEqual(view(partial,{id:'P1',role:'ops'}).inputs,{ready:true,quantity:60});
 assert.equal(workflowCheck(partial,{id:'P1',role:'ops'},{requestId:'service',quantity:60,unitPrice:500,delivery:1140}).ok,true,'Une réponse partielle reste possible après confirmation partielle');
 assert.equal(view(partial,{id:'P2',role:'supplierB'}).inputs,null,'La disponibilité de préparation n’est partagée qu’avec les Opérations');
 const {token:admin}=await api('/api/login','',{password:'TEST-only-12345'});
 const {code}=await api('/api/supply-sessions',admin,{},201),path='/api/supply-sessions/'+code;
 const control=b=>api(path+'/control',admin,b),all=()=>api(path+'/results',admin),state=t=>api(path+'/state',t);
 const roles=['client','planning','buying','supplierA','supplierB','ops'],teams={},peers={};
 const players=await Promise.all(Array.from({length:30},()=>api(path+'/join','',{},201)));
 for(let i=0;i<roles.length;i++){teams[roles[i]]=players[i*5].token;peers[roles[i]]=players[i*5+1].token;for(let n=0;n<5;n++)await api(path+'/role',players[i*5+n].token,{role:roles[i]});}
 const act=(role,op,b,status=200)=>api(path+'/'+op,teams[role],b,status);
 const request=async(role,to,quantity,delivery,parentId='NEED-1')=>{const r=await act(role,'request',{to,quantity,delivery,parentId});return r.documents.at(-1);};
 const quote=async(role,req,quantity,unitPrice,delivery,extra={})=>{const r=await act(role,'quote',{requestId:req.id,quantity,unitPrice,delivery,...extra});return r.documents.at(-1);};
 const accept=(role,d,status=200)=>act(role,'accept',{id:d.id},status);
 assert.equal((await all()).workflow,2);assert.equal((await state(teams.buying)).documents.length,0);
 await act('buying','request',{to:'supplierA',quantity:40,delivery:900},409); // Jeu non ouvert.
 await control({command:'start'});
 await act('client','request',{to:'supplierA',quantity:40,delivery:900},400);
 await act('supplierA','quote',{requestId:'NEED-1',quantity:40,unitPrice:1000,delivery:900},400);
 const sourcing=await request('planning','buying',80,900);
 const service=await request('planning','ops',80,1140);
 await act('ops','quote',{requestId:service.id,quantity:80,unitPrice:500,delivery:1080},409);
 await act('planning','plan',{quantity:80,transport:'normal'},409);
 const reqA=await request('buying','supplierA',60,840,sourcing.id),reqB=await request('buying','supplierB',20,900,sourcing.id);
 const check=await act('supplierA','check',{requestId:reqA.id,quantity:60,unitPrice:1000,delivery:840});
 assert.equal(check.ok,false);assert.equal(check.feasibleQuantityAtRequestedTime,20);assert.equal(check.earliestForFullQuantity,900);
 await act('supplierA','quote',{requestId:reqA.id,quantity:60,unitPrice:1000,delivery:840},409);
 // Une proposition interne n'engage rien et est revérifiée par le capitaine.
 const proposal=await api(path+'/proposal',peers.supplierA,{documentAction:'quote',requestId:reqA.id,quantity:60,unitPrice:1000,delivery:900,text:'Notre proposition'});
 assert.equal((await all()).documents.filter(d=>d.type==='offer').length,0);
 await api(path+'/approve',peers.supplierA,{id:proposal.proposals.at(-1).id},403);
 const aResponse=await act('supplierA','approve',{id:proposal.proposals.at(-1).id}),offerA=aResponse.documents.at(-1);
 assert.equal((await state(teams.supplierA)).inventory.stockRemaining,20,'Une offre en attente ne réserve pas le stock');
 await control({command:'limit',target:'supplierA',field:'capacity',value:20});await accept('buying',offerA,409);
 await control({command:'limit',target:'supplierA',field:'capacity',value:60});await accept('buying',offerA);await accept('buying',offerA,409);
 assert.equal((await state(teams.supplierA)).inventory.remaining,0);
 const offerB=await quote('supplierB',reqB,20,1300,900);await accept('buying',offerB);
 assert.equal((await state(teams.supplierA)).documents.some(d=>d.from==='supplierB'),false);
 assert.equal((await state(teams.ops)).inputs.ready,false,'Les Opérations attendent la confirmation interne, même si les fournisseurs ont répondu');
 await act('ops','quote',{requestId:service.id,quantity:80,unitPrice:500,delivery:1080},409);
 const buying=await quote('buying',sourcing,80,0,900);await accept('planning',buying);assert.equal((await state(teams.ops)).inputs.ready,true);assert.equal((await state(teams.ops)).inputs.quantity,80);
 await act('ops','quote',{requestId:service.id,quantity:80,unitPrice:500,delivery:1020},409);
 const operation=await quote('ops',service,80,500,1080,{transport:'normal'});await accept('planning',operation);
 await act('planning','plan',{quantity:80,transport:'express'},409);
 await act('planning','plan',{quantity:80,transport:'normal'});
 const rootNeed=(await state(teams.planning)).documents.find(d=>d.id==='NEED-1');
 const promise=await quote('planning',rootNeed,80,0,1140);await accept('client',promise);
 let host=await all();assert.equal(host.assessment.valid,true);assert.equal(host.assessment.cost,138000);assert.equal(host.assessment.arrival,1080);
 assert.equal(host.documents.filter(d=>d.status==='accepted').length,5);
 await control({command:'limit',target:'supplierA',field:'productionRate',value:20});
 host=await all();assert.equal(host.documents.find(d=>d.id===offerA.id).status,'accepted');assert.equal(host.documents.find(d=>d.id===offerA.id).health.ok,false);assert.equal(host.assessment.valid,false);
 // Une révision n'efface pas la commande initiale avant la nouvelle acceptation.
 const revisedA=await quote('supplierA',reqA,60,1000,960,{replacesId:offerA.id});
 assert.equal((await all()).documents.find(d=>d.id===offerA.id).status,'accepted');
 await accept('buying',revisedA);host=await all();assert.equal(host.documents.find(d=>d.id===offerA.id).status,'superseded');assert.equal(host.documents.find(d=>d.id===buying.id).health.ok,false);
 const revisedBuying=await quote('buying',sourcing,80,0,960,{replacesId:buying.id});await accept('planning',revisedBuying);
 const revisedOps=await quote('ops',service,80,500,1140,{transport:'normal',replacesId:operation.id});await accept('planning',revisedOps);
 await act('planning','plan',{quantity:80,transport:'normal'});
 const revisedPromise=await quote('planning',rootNeed,80,0,1140,{replacesId:promise.id});await accept('client',revisedPromise);
 host=await all();assert.equal(host.assessment.valid,true);assert.equal(host.assessment.arrival,1140);assert.equal(host.assessment.cost,138000,'Une révision ne double pas les coûts');
 // Demander une nouvelle révision conserve toutes les commandes.
 await act('buying','renegotiate',{id:revisedA.id});assert.equal((await all()).documents.find(d=>d.id===revisedA.id).status,'accepted');
 await control({command:'pause'});await act('buying','request',{to:'supplierA',quantity:1,delivery:1200,parentId:sourcing.id},409);await control({command:'resume'});
 await act('buying','message',{to:'supplierA',type:'offer',quantity:1,unitPrice:1000,delivery:1200,text:'Contourner le circuit'},400);
 await control({command:'finish'});await act('buying','accept',{id:revisedA.id},409);
 // Deux acceptations concurrentes ne peuvent pas réserver les mêmes ressources.
 const fresh=await api('/api/supply-sessions',admin,{},201),p2='/api/supply-sessions/'+fresh.code;
 const join=async role=>{const p=await api(p2+'/join','',{},201);await api(p2+'/role',p.token,{role});return p.token;};
 const buyer=await join('buying'),supplier=await join('supplierA');await api(p2+'/control',admin,{command:'start'});
 const rfq=await api(p2+'/request',buyer,{to:'supplierA',parentId:'NEED-1',quantity:80,delivery:900});
 const offers=[];for(let n=0;n<2;n++){const r=await api(p2+'/quote',supplier,{requestId:rfq.documents.at(-1).id,quantity:40,unitPrice:1000,delivery:900});offers.push(r.documents.at(-1));}
 const race=await Promise.all(offers.map(d=>mf.dispatchFetch('https://quiz.test'+p2+'/accept',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+buyer},body:JSON.stringify({id:d.id})})));
 assert.deepEqual(race.map(r=>r.status).sort(),[200,409]);
 const inventory=await api(p2+'/state',supplier);assert.equal(inventory.inventory.booked,40);assert.equal(inventory.inventory.remaining,20);
 await api(p2+'/control',admin,{command:'limit',target:'supplierA',field:'stock',value:12});await api(p2+'/control',admin,{command:'limit',target:'supplierA',field:'productionRate',value:20});
 const extra=await api(p2+'/request',buyer,{to:'supplierA',parentId:'NEED-1',quantity:40,delivery:900});
 // Disponibilité calculée en tenant compte de la commande existante, jamais 32 unités revendues.
 const preview=await api(p2+'/check',supplier,{requestId:extra.documents.at(-1).id,quantity:40,unitPrice:1000,delivery:900});assert.equal(preview.ok,false);assert.equal(preview.feasibleQuantityAtRequestedTime,0);
 console.log('Parcours structuré : 30 participants, liens demande-devis-engagement, contrôle des quantités et délais, revalidation atomique, propositions internes, approvisionnements, préparation, promesse client, alertes, révisions sans double réservation ni double coût, confidentialité et concurrence vérifiés.');
}finally{await mf.dispose();}
