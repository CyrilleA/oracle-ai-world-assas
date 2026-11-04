import assert from 'node:assert/strict';
import {initialGame,act,view,assess} from '../live/supply-game.mjs';
import {startExperiment,replayWithAI,stage,taskContext,candidates,confirmAuto,report,publicExperiment,aiContext} from '../live/supply-experiment.mjs';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {fileURLToPath} from 'node:url';
const g=initialGame('EXPERIM1'),roles=['client','planning','buying','supplierA','supplierB','ops'];
for(const role of roles){g.players[role]={id:role,role};}g.phase='running';startExperiment(g);
assert.equal(stage(g),'human');act(g,g.players.planning,'request',{to:'buying',parentId:'NEED-1',quantity:80,delivery:960});
replayWithAI(g);assert.equal(g.documents.length,1);assert.equal(g.experiment.archive.documents.length,2);assert.equal(g.experiment.archive.log.length>0,true);assert.equal(g.log.length,0);assert.equal(g.experiment.reports.length,1);assert.equal(g.players.buying.role,'buying');assert.equal(stage(g),'ai');
function send(role){const p=g.players[role],c=taskContext(g,p),options=candidates(g,p,c);assert.ok(options.length,`${role}: au moins une option réalisable`);const j={id:crypto.randomUUID(),fingerprint:c.fingerprint,status:'ready',...options[0],reason:'Proposition contrôlée.'};g.experiment.jobs[role]=j;const before=g.documents.length;confirmAuto(g,p,j.id);assert.equal(g.documents.length,before+1);assert.throws(()=>confirmAuto(g,p,j.id));return g.documents.at(-1);}
function accept(role,d){act(g,g.players[role],'accept',{id:d.id});}
send('planning');send('buying');send('buying');accept('buying',send('supplierA'));accept('buying',send('supplierB'));accept('planning',send('buying'));send('planning');accept('planning',send('ops'));accept('client',send('planning'));assert.equal(assess(g).valid,true);assert.equal(assess(g).quantity,80);assert.ok(report(g).firstPromiseMs!==null);
assert.throws(()=>replayWithAI(g),'Pas de troisième passage effaçant le bilan');
const own=aiContext(g,g.players.supplierA,{s:view(g,g.players.supplierA),req:{quantity:40,delivery:960}},[]);assert.equal(own.ownConstraints.stock,g.resources.supplierA.stock);assert.ok(!JSON.stringify(own).includes('P1'));assert.equal(own.ownConstraints.normalCost,undefined);assert.equal(publicExperiment(g,g.players.buying).experiment.reports,undefined);
const stale=initialGame('STALE123');stale.players={p:{id:'p',role:'planning'}};stale.phase='running';startExperiment(stale);replayWithAI(stale);const c=taskContext(stale,stale.players.p);stale.experiment.jobs.planning={id:'draft',fingerprint:c.fingerprint,status:'ready',...candidates(stale,stale.players.p,c)[0]};stale.budget=100;assert.throws(()=>confirmAuto(stale,stale.players.p,'draft'),/situation a changé/);assert.equal(stale.documents.length,1);
// Real DO alarms with mocked provider: automatic generation, no student click and no automatic send.
const root=fileURLToPath(new URL('../',import.meta.url));let calls=0,captured,providerMode="ok";
const mf=new Miniflare(convertV4MiniflareOptions({modules:true,scriptPath:root+'.wrangler/build/worker.js',compatibilityDate:'2026-10-01',durableObjects:{ROOMS:{className:'QuizRoom',useSQLite:true},LOGIN_LIMITS:{className:'LoginLimit',useSQLite:true},SUPPLY:{className:'SupplyRoom',useSQLite:true}},bindings:{ADMIN_PASSWORD:'TEST-only-12345',SESSION_KEY:'test-signing-secret-32-characters-long',OPENAI_API_KEY:'fake-key',ALLOWED_ORIGINS:'https://cyrillea.github.io'},outboundService:async r=>{calls++;captured=JSON.parse(await r.text());if(providerMode==='credit')return Response.json({error:{code:'insufficient_quota'}},{status:429});if(providerMode==='invalid')return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({index:999,reason:'Invalide'})}]}]});return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({index:0,reason:'need'})}]}]});}}));
async function api(path,token='',body,status=200){const r=await mf.dispatchFetch('https://quiz.test'+path,{method:body?'POST':'GET',headers:{Origin:'https://cyrillea.github.io','Content-Type':'application/json',Authorization:'Bearer '+token},body:body?JSON.stringify(body):undefined});const d=await r.json();assert.equal(r.status,status,JSON.stringify(d));return d;}
try{
 const {token:admin}=await api('/api/login','',{password:'TEST-only-12345'}),{code}=await api('/api/supply-sessions',admin,{},201),path='/api/supply-sessions/'+code;
 const {token}=await api(path+'/join','',{},201);await api(path+'/role',token,{role:'planning'});await api(path+'/control',admin,{command:'start'});
 await api(path+'/assist',token,{to:'buying',text:'Préparer'},409);await api(path+'/control',admin,{command:'ai',enabled:true,limit:3},409);assert.equal(calls,0);
 await api(path+'/control',admin,{command:'ai-replay'});
 let s;for(let i=0;i<40;i++){s=await api(path+'/state',token);if(s.autoDraft?.status==='ready')break;await new Promise(r=>setTimeout(r,100));}
 assert.equal(s.autoDraft?.status,'ready');assert.match(s.autoDraft.reason,/Demander 80 unités/);assert.match(s.autoDraft.reason,/restent à confirmer/);assert.equal(calls,1);assert.equal(s.documents.length,1,'Un brouillon IA ne doit pas créer de demande');assert.equal(captured.model,'gpt-5-nano');assert.equal(captured.store,false);assert.equal(captured.text.format.strict,true);
 const context=JSON.parse(captured.input);assert.ok(!captured.input.includes(token));assert.ok(!captured.input.includes('supplierA":{'));assert.equal(context.ownConstraints,null);
 await api(path+'/state',token);assert.equal(calls,1,'Pas de nouvel appel pour le même contexte');
 await api(path+'/auto-confirm','',{id:s.autoDraft.id},401);
 s=await api(path+'/auto-confirm',token,{id:s.autoDraft.id});assert.equal(s.documents.length,2);assert.equal(s.documents.at(-1).ai,true);
 await api(path+'/auto-confirm',token,{id:'invalid'},400);
 await api(path+'/control',admin,{command:'finish'});assert.ok((await api(path+'/results',admin)).experiment.reports.length===1);
 for(const mode of ['credit','invalid']){
  providerMode=mode;
  const {code:c}=await api('/api/supply-sessions',admin,{},201),p='/api/supply-sessions/'+c,{token:t}=await api(p+'/join','',{},201);
  await api(p+'/role',t,{role:'planning'});await api(p+'/control',admin,{command:'start'});await api(p+'/control',admin,{command:'ai-replay'});
  let v;for(let i=0;i<40;i++){v=await api(p+'/state',t);if(v.autoDraft?.status==='failed')break;await new Promise(r=>setTimeout(r,100));}
  assert.equal(v.autoDraft?.status,'failed');assert.equal(v.documents.length,1);assert.equal(v.aiUsed,1);const used=calls;
  await api(p+'/state',t);await api(p+'/control',admin,{command:'pause'});await api(p+'/control',admin,{command:'resume'});
  await new Promise(r=>setTimeout(r,700));assert.equal(calls,used,'Pas de relance payante après une erreur pour un contexte inchangé');
  await api(p+'/request',t,{to:'buying',parentId:'NEED-1',quantity:80,delivery:960});
  assert.equal((await api(p+'/state',t)).documents.length,2,'Le traitement manuel reste possible après un échec IA');await api(p+'/control',admin,{command:'finish'});
 }
 console.log('Deux phases : passage humain sans IA, scénario rejoué, génération automatique dédupliquée, contexte privé, validation humaine, refus des brouillons périmés et chaîne complète à 80 coffrets vérifiés.');
}finally{await mf.dispose();}
