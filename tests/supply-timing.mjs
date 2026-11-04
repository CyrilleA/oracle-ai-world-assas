import assert from 'node:assert/strict';
import {initialGame,act,assess} from '../live/supply-game.mjs';
import {setDeadline,closeAtDeadline,nextAlarm} from '../live/supply-timing.mjs';
import {quickPlan} from '../live/supply-quick-plan.mjs';
import {startExperiment,replayWithAI,report} from '../live/supply-experiment.mjs';
import {ROLE_GUIDES,roleInstructions} from '../site/supply-instructions.mjs';
import {parisInput,parseParis,timerBanner} from '../site/supply-timing.mjs';
const g=initialGame('CLOCK123'),now=Date.now();setDeadline(g,now+10000,now);assert.equal(nextAlarm(g,{now}),now+10000);assert.equal(closeAtDeadline(g,now+9999),false);g.phase='running';startExperiment(g);assert.equal(closeAtDeadline(g,now+10000),true);assert.equal(g.phase,'finished');assert.equal(g.finishedReason,'deadline');assert.equal(g.experiment.endedAt,now+10000);assert.equal(closeAtDeadline(g,now+11000),false,'Clôture idempotente');assert.equal(nextAlarm(g,{now}),g.expires);assert.throws(()=>setDeadline(g,now-1,now));assert.throws(()=>setDeadline(g,g.expires,now));setDeadline(g,null);assert.equal(g.endsAt,null);
const replay=initialGame('REPLAY34');replay.phase='running';startExperiment(replay);setDeadline(replay,now+600000,now);replayWithAI(replay);assert.equal(replay.endsAt,now+600000,'Même fin réelle au passage humain → IA');assert.equal(nextAlarm(replay,{now}),now+100);replay.phase='paused';assert.equal(nextAlarm(replay,{now}),now+600000);assert.equal(closeAtDeadline(replay,now+600000),true,'La pause ne repousse pas la fin réelle');
assert.equal(parisInput(Date.parse('2026-11-05T08:00:00Z')),'2026-11-05T09:00');assert.equal(parseParis('2026-11-05T12:00'),Date.parse('2026-11-05T11:00:00Z'));assert.ok(Number.isNaN(parseParis('2026-03-29T02:30')),'Heure inexistante au passage heure été refusée');assert.match(timerBanner({...g,endsAt:Date.parse('2026-11-05T11:00:00Z')}),/12:00/);
assert.equal(Object.keys(ROLE_GUIDES).length,6);assert.match(roleInstructions({role:'planning',experiment:{stage:'ai'}}),/Chef d’orchestre/);assert.match(roleInstructions({role:'planning'}),/relancez/);assert.match(roleInstructions({role:'planning'}),/Les 4 étapes/);assert.match(roleInstructions({role:'buying'}),/deux fournisseurs/);
const fast=initialGame('FASTPLAN'),solution=quickPlan(fast);assert.equal(solution.status,'feasible');const p=solution.plan;assert.equal(p.quantity,80);assert.equal(p.supplierA.quantity+p.supplierB.quantity,80);assert.ok(p.cost<=fast.budget);assert.ok(p.arrival<=fast.promise.delivery);assert.ok(p.globalMargin>=30);assert.equal(p.planningMargin,(fast.budget-p.cost)/fast.budget*100,'Le plan cible utilise le budget client pour la marge Planification');assert.ok(solution.calculationMs>=0);assert.equal(fast.documents.length,1,'Aucun engagement créé par le calcul rapide');
// Exécuter réellement la solution de référence dans le moteur métier.
fast.phase='running';const roles=['planning','buying','supplierA','supplierB','ops','client'];for(const role of roles)fast.players[role]={id:role,role};
function request(role,to,q,t,parentId='NEED-1'){act(fast,fast.players[role],'request',{to,quantity:q,delivery:t,parentId});return fast.documents.at(-1);}
function offer(role,req,q,price,t,transport='normal'){act(fast,fast.players[role],'quote',{requestId:req.id,quantity:q,unitPrice:price,delivery:t,transport});return fast.documents.at(-1);}
function accept(role,d){act(fast,fast.players[role],'accept',{id:d.id});}
const need=request('planning','buying',80,960);
for(const role of ['supplierA','supplierB']){const q=p[role].quantity;if(q){const r=request('buying',role,q,960,need.id);accept('buying',offer(role,r,q,p[role].unitPrice,960));}}
accept('planning',offer('buying',need,80,0,960));const delivery=request('planning','ops',80,1140);accept('planning',offer('ops',delivery,80,p.preparationUnitPrice,1140,p.transport));act(fast,fast.players.planning,'plan',{quantity:80,transport:p.transport});accept('client',offer('planning',fast.documents[0],80,0,1140,p.transport));assert.equal(assess(fast).valid,true);assert.equal(quickPlan(fast).status,'feasible','Les engagements existants sont respectés');assert.equal(quickPlan(fast).plan.cost,assess(fast).cost);
fast.resources.ops.normalCapacity=0;fast.resources.ops.expressCapacity=0;assert.equal(quickPlan(fast).status,'exception');
console.log('Consignes des six rôles, plan rapide exécutable, horaire Paris, compte à rebours, pause et fin automatique vérifiés.');

const {Miniflare,convertV4MiniflareOptions}=await import('miniflare');const {fileURLToPath}=await import('node:url');const root=fileURLToPath(new URL('../',import.meta.url));
const mf=new Miniflare(convertV4MiniflareOptions({modules:true,scriptPath:root+'.wrangler/build/worker.js',compatibilityDate:'2026-10-01',durableObjects:{ROOMS:{className:'QuizRoom',useSQLite:true},LOGIN_LIMITS:{className:'LoginLimit',useSQLite:true},SUPPLY:{className:'SupplyRoom',useSQLite:true}},bindings:{ADMIN_PASSWORD:'TEST-only-12345',SESSION_KEY:'test-signing-secret-32-characters-long',ALLOWED_ORIGINS:'https://cyrillea.github.io'}}));
async function api(path,token='',body,status=200){const r=await mf.dispatchFetch('https://quiz.test'+path,{method:body?'POST':'GET',headers:{Origin:'https://cyrillea.github.io','Content-Type':'application/json',Authorization:'Bearer '+token},body:body?JSON.stringify(body):undefined});const d=await r.json();assert.equal(r.status,status,JSON.stringify(d));return d;}
try{
 const {token:admin}=await api('/api/login','',{password:'TEST-only-12345'}),{code}=await api('/api/supply-sessions',admin,{},201),path='/api/supply-sessions/'+code,{token}=await api(path+'/join','',{},201);
 await api(path+'/role',token,{role:'planning'});await api(path+'/control',admin,{command:'start'});
 await api(path+'/control',token,{command:'deadline',endsAt:Date.now()+6000},401);await api(path+'/control',admin,{command:'deadline',endsAt:Date.now()-1},400);
 const endsAt=Date.now()+6000;await api(path+'/control',admin,{command:'deadline',endsAt});assert.equal((await api(path+'/state',token)).endsAt,endsAt);await api(path+'/control',admin,{command:'pause'});
 let s;for(let i=0;i<80;i++){s=await api(path+'/state',token);if(s.phase==='finished')break;await new Promise(r=>setTimeout(r,100));}
 assert.equal(s.phase,'finished');assert.equal(s.finishedReason,'deadline');await api(path+'/request',token,{to:'buying',parentId:'NEED-1',quantity:80,delivery:960},409);await api(path+'/join','',{},409);
 const all=await api(path+'/results',admin);assert.equal(all.experiment.current.endedAt,endsAt);assert.equal(all.log.filter(x=>x.text.includes('Heure de fin atteinte')).length,1);assert.equal(all.documents.length,1);
 console.log('Serveur : heure de fin réservée à l’animateur, clôture en pause, verrouillage des engagements, blocage des nouveaux joueurs et conservation du bilan vérifiés.');
}finally{await mf.dispose();}
