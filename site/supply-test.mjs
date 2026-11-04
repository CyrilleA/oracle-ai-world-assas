import {esc,configuration,api,load,validRoom} from './live-common.mjs';
import {renderWorkflow} from './supply-workflow.mjs?v=budget-planification-20261104';
import {hostSupply,bindHostSupply} from './supply-ui.mjs?v=budget-planification-20261104';
import {tickCountdown} from './supply-timing.mjs';
const $=s=>document.querySelector(s),root=$('#test-player');
let base='',key='',code=new URLSearchParams(location.hash.slice(1)).get('r')||'',role='planning',state=null,admin=null,busy=false,timer=null,lastPlayer='',lastAdmin='';
try{key=sessionStorage.getItem('assas-host-session')||'';code=code||sessionStorage.getItem('assas-private-test-room')||'';}catch{}key=key||load('assas-host-session')||'';
const path=()=>'/api/supply-sessions/'+code;
function error(message=''){$('#test-error').textContent=message;$('#test-error').hidden=!message;}
function controls(){
 $('#new-test').disabled=busy||!key;$('#test-start').hidden=admin?.phase!=='waiting';$('#test-start').disabled=busy;
 $('#test-ai').hidden=!admin||!['running','paused','finished'].includes(admin.phase)||admin.experiment?.stage==='ai';$('#test-ai').disabled=busy||!admin?.aiReady;
 const tasks=admin?.testTasks||[],actionable=tasks.filter(t=>t.kind!=='wait'),next=actionable.find(t=>t.role!==role);
 $('#test-next-role').hidden=!next;$('#test-next-role').disabled=busy;$('#test-next-role').textContent=next?'Jouer : '+admin.roles.find(r=>r.id===next.role)?.name:'Équipe suivante à jouer';$('#test-next-role').onclick=()=>choose(next.role);
 $('#test-roles').innerHTML=(admin?.roles||[]).map(r=>{const t=tasks.find(x=>x.role===r.id),job=admin?.experiment?.jobs?.[r.id],label=t?.kind==='wait'?(t.complete?'Étape terminée':'En attente'):admin?.experiment?.stage==='ai'&&job?.status==='pending'?'L’IA prépare':admin?.experiment?.stage==='ai'&&job?.status==='ready'?'À valider':'Doit agir';return `<button class="test-role ${r.id===role?'selected':''}" data-role="${r.id}" aria-pressed="${r.id===role}" ${busy?'disabled':''}><strong>${esc(r.name)}</strong><span class="${t?.kind!=='wait'?'test-actionable':''}">${esc(label)}</span><small>${esc(t?.title||'')}</small></button>`;}).join('');
 $('#test-roles').querySelectorAll('[data-role]').forEach(b=>b.onclick=()=>choose(b.dataset.role));
}
function player(){renderWorkflow(root,state,{send,productionWindow:payload=>control({command:'production-window',...payload}),check:payload=>api(base,path()+'/test-act',{token:key,body:{role,action:'check',payload}})});tickCountdown(root);}
async function refresh(force=false){if(!code||busy||!key)return;try{
 const selected=role,[nextAdmin,nextState]=await Promise.all([api(base,path()+'/results',{token:key}),api(base,path()+'/test-state',{token:key,body:{role:selected}})]);
 if(selected!==role||busy)return;
 if(!nextAdmin.testMode)throw Error('Cette séance n’est pas une partie test privée. Ouvrez un nouveau profil test.');
 admin=nextAdmin;state=nextState;controls();
 const ps=JSON.stringify(state);if(force||ps!==lastPlayer){lastPlayer=ps;player();}
 const as=JSON.stringify(admin);if(force||as!==lastAdmin&&!document.activeElement?.closest('#test-admin form')){lastAdmin=as;const open=[...$('#test-admin').querySelectorAll('details[id][open]')].map(x=>x.id);$('#test-admin').innerHTML=hostSupply(admin);for(const id of open){const d=$('#test-admin').querySelector('#'+id);if(d)d.open=true;}bindHostSupply($('#test-admin'),control,admin);}
 $('#test-network').textContent=`Test privé ${code} · ${admin.phase==='waiting'?'Prêt à démarrer':admin.phase==='running'?'En jeu':admin.phase==='paused'?'En pause':'Terminé'}`;error();
 }catch(e){error(e.message);if(e.status===401)loginRequired();}}
async function choose(next){if(busy||role===next)return;role=next;lastPlayer='';controls();await refresh(true);root.scrollIntoView({behavior:'smooth',block:'start'});}
async function send(action,payload){if(busy)return false;busy=true;controls();error();const selected=role;try{state=await api(base,path()+'/test-act',{token:key,body:{role:selected,action,payload}});lastPlayer='';busy=false;player();await refresh();return true;}catch(e){error(e.message);return false;}finally{busy=false;controls();}}
async function control(body){if(busy)return;busy=true;controls();error();try{await api(base,path()+'/control',{token:key,body});busy=false;await refresh(true);}catch(e){error(e.message);}finally{busy=false;controls();}}
async function create(){if(busy)return;busy=true;controls();error();try{const r=await api(base,'/api/supply-sessions',{token:key,body:{testMode:true}});code=r.code;try{sessionStorage.setItem('assas-private-test-room',code);}catch{}role='planning';history.replaceState(null,'',location.pathname+'#r='+code);lastPlayer='';lastAdmin='';busy=false;await refresh(true);}catch(e){error(e.message);if(e.status===401)loginRequired();}finally{busy=false;controls();}}
function loginRequired(){key='';clearInterval(timer);root.innerHTML='<section class="card"><h2>Connectez-vous avec votre accès animateur.</h2><p>Le profil test utilise votre connexion existante. Aucun autre compte ni mot de passe à créer.</p><a class="btn primary" href="animateur.html#game=supply">Ouvrir l’accès animateur</a></section>';}
$('#new-test').onclick=create;$('#test-start').onclick=()=>control({command:'start'});$('#test-ai').onclick=()=>control({command:'ai-replay'});
async function boot(){try{base=await configuration();await api(base,'/api/admin',{token:key});if(validRoom(code))await refresh(true);else await create();}catch(e){error(e.message);loginRequired();}finally{controls();clearInterval(timer);timer=setInterval(()=>refresh(),2000);}}
setInterval(()=>tickCountdown(document),1000);boot();
