import {esc,configuration,api,save,load,validRoom} from './live-common.mjs';
let base='',key='',code='',snapshot='',pollTimer=null,busy=false;
const $=s=>document.querySelector(s),error=s=>{$('#host-error').textContent=s;};
const params=new URLSearchParams(location.hash.slice(1));
if(validRoom(params.get('r')||''))save('assas-active-session',params.get('r'));
// L’ancienne clé n’est plus utilisée ni envoyée au serveur.
if(params.get('key'))history.replaceState(null,'',location.pathname);
try{sessionStorage.removeItem('assas-host-key');key=sessionStorage.getItem('assas-host-session')||'';}catch{}
if(!key)key=load('assas-host-session')||'';
function forgetSession(){try{sessionStorage.removeItem('assas-host-session');localStorage.removeItem('assas-host-session');}catch{}key='';}
function rememberSession(token,persistent){
 forgetSession();key=token;
 try{(persistent?localStorage:sessionStorage).setItem('assas-host-session',token);}catch{}
}
function bars(result,options){return result.received===0?'<p class="status">Aucune réponse à cette question. Aucun pourcentage à interpréter.</p>':result.counts.map((n,i)=>{const pct=Math.round(n/result.received*100);return `<div class="bar-row"><div class="bar-label"><span>${esc(options[i])}</span><strong>${n} · ${pct} %</strong></div><div class="bar" role="img" aria-label="${esc(options[i])} : ${n} réponses, ${pct} pour cent"><span style="width:${pct}%"></span></div></div>`;}).join('');}
function show(r){
 const revealed=['results','finished'].includes(r.phase),finished=r.phase==='finished',scm=r.game==='scm';
 const total=r.total||3, options=r.options;
 const url=new URL('jeu.html',location.href);url.hash='r='+r.code;
 const qr=qrcode(0,'M');qr.addData(url.href);qr.make();
 const command=r.phase==='waiting'?['open','Ouvrir la première question']:r.phase==='voting'?['reveal','Clore le vote et afficher les résultats']:r.phase==='results'?(r.index===total-1?['finish','Afficher le bilan du questionnaire']:['next','Ouvrir la question suivante']):!scm?['start-scm','Continuer : découvrir Oracle SCM avec 80 coffrets']:null;
 const story=finished?'':`<div class="host-story"><img src="${scm?'coffrets.svg':'beaujolais.svg'}" width="420" height="290" alt="${scm?'80 coffrets à concevoir, préparer et livrer pour la soirée Beaujolais':'La soirée Beaujolais : 30 participants, avec un budget de 900 euros'}"><p class="context">${esc(r.question.context)}</p></div>`;
 const stats=`<div class="stats" aria-label="Participation"><div><strong>${r.participants}</strong><small>${r.participants===1?'participant':'participants'}</small></div><div><strong>${r.received}</strong><small>${r.received===1?'réponse reçue':'réponses reçues'}</small></div><div><strong>${r.participants-r.received}</strong><small>en attente de réponse</small></div></div>`;
 const summary=finished?`<div class="finished-grid ${scm?'scm-summary':''}">${r.history.map((result,i)=>`<section class="card"><div class="eyebrow">${scm?'Étape':'Décision'} ${i+1}${result.domain?' · '+esc(result.domain):''}</div><h2 style="font-size:24px">${esc(result.title)}</h2><p class="hint">${result.received} réponses sur ${result.participants} participants</p>${bars(result,result.options||options)}${scm?`<p class="answer-key">Réponse de référence : ${esc(result.options[result.correct])}</p><p class="hint">${esc(result.product)}</p>`:''}</section>`).join('')}</div><div class="debrief"><h2>${scm?'Vous venez de parcourir une supply chain.':'Qu’est-ce qui a fait évoluer vos choix ?'}</h2><p>${scm?'Concevoir → Planifier → Acheter → Produire → Promettre → Livrer. Une modification de quantité, de composition ou de délai peut affecter toute la chaîne.':'Le budget ? Les preuves disponibles ? Le pouvoir d’engager une dépense ? La confiance dans les agents ?'}</p>${scm?'<p><a href="./#scm">Explorer les capacités Oracle SCM →</a></p>':'<details><summary>Faire le lien avec l’Agentic Enterprise</summary><p>Un objectif commun, un contexte partagé, des agents qui échangent et une autorité définie par des humains.</p><p><a href="./#enterprise">Ouvrir le cadre de confiance →</a></p></details><p class="hint">La suite : préparer et livrer 80 coffrets pour la soirée Beaujolais. Les élèves gardent cette page sur leur téléphone.</p>'}</div>`:'';
 const discovery=scm&&revealed&&!finished?`<div class="discovery"><div class="eyebrow">La fonction SCM révélée</div><h2>${esc(r.question.domain)}</h2><p><strong>${esc(r.question.product)}</strong></p><p class="answer-key">Réponse de référence : ${esc(options[r.question.correct])}</p><p>${esc(r.question.debrief)}</p><details><summary>Et l’IA dans cette étape ?</summary><p>${esc(r.question.ai)}</p><p class="hint">Illustration pédagogique ; les capacités disponibles dépendent des produits, versions et configurations.</p></details><a href="${esc(r.question.source)}" target="_blank" rel="noopener noreferrer">Découvrir ce domaine chez Oracle ↗</a></div>`:'';
 $('#dashboard').innerHTML=`<div class="host-grid"><section><div class="eyebrow">Séance ${r.code} · ${scm?'Mission : 80 coffrets · ':''}${finished?'Bilan du questionnaire':`${scm?'Étape':'Décision'} ${r.index+1} / ${total}`}</div><h1>${finished?(scm?'80 coffrets. Toute une chaîne.':'Vos choix, puis la discussion.'):esc(r.question.title)}</h1>${story}${stats}${summary}${finished?'':`<p class="question">${esc(r.question.question)}</p>${scm?`<ol class="host-options">${options.map(o=>`<li>${esc(o)}</li>`).join('')}</ol>`:''}${revealed?bars(r,options):`<div class="status">${r.phase==='waiting'?'Les élèves peuvent rejoindre la séance. Ouvrez le vote quand vous êtes prêt.':'Le vote est ouvert. La répartition reste masquée jusqu’à votre décision.'}</div>`}${discovery}${revealed?`<div class="debrief"><h2>Discutons du résultat.</h2><p>${esc(r.question.discussion)}</p>${scm?'':`<details><summary>Afficher les points de débrief</summary><p>${esc(r.question.debrief)}</p></details>`}</div>`:''}`}<div class="actions">${command?`<button class="btn primary" data-command="${command[0]}">${command[1]} →</button>`:''}</div></section><aside class="join-panel"><strong>Accès au jeu uniquement</strong>${qr.createSvgTag({cellSize:5,margin:20,scalable:true,alt:'QR code pour rejoindre la séance'})}<div class="room-code">${r.code}</div><a href="${esc(url.href)}" target="_blank" rel="noopener noreferrer">${esc(url.href)}</a><p class="hint">Aucun compte nécessaire.<br>Le même accès reste valable pour le jeu SCM.<br>Le QR code ne donne pas accès à votre console.</p></aside></div>`;
 $('#dashboard').querySelector('[data-command]')?.addEventListener('click',e=>control(e.currentTarget.dataset.command));
}
async function refresh(){if(!code||busy)return;try{const r=await api(base,`/api/sessions/${code}/results`,{token:key});const next=JSON.stringify(r);if(next!==snapshot){snapshot=next;show(r);}$('#network').textContent='Connecté · Séance '+code;error('');}catch(e){$('#network').textContent='Connexion à rétablir';error(e.message);}}
async function openConsole(){
 await api(base,'/api/admin',{token:key});
 $('#login').hidden=true;$('#host').hidden=false;$('#logout').hidden=false;
 $('#password').value='';$('#login-error').textContent='';
 code=load('assas-active-session')||'';if(!validRoom(code))code='';
 if(code)await refresh();clearInterval(pollTimer);pollTimer=setInterval(refresh,5000);
}
async function login(){
 if(busy)return;busy=true;$('#connect').disabled=true;$('#login-error').textContent='Connexion…';
 try{
  base=base||await configuration();
  const session=await api(base,'/api/login',{body:{password:$('#password').value,remember:$('#remember').checked}});
  rememberSession(session.token,$('#remember').checked);await openConsole();
 }catch(e){$('#login-error').textContent=e.message;}
 finally{busy=false;$('#connect').disabled=false;}
}
async function restoreSession(){
 try{base=await configuration();await openConsole();}
 catch(e){if(e.status===401)forgetSession();$('#login-error').textContent=e.status===401?'Votre connexion a expiré. Saisissez votre mot de passe.':e.message;$('#login').hidden=false;$('#host').hidden=true;}
}
async function control(command){if(busy)return;busy=true;$('#dashboard').querySelectorAll('button').forEach(b=>b.disabled=true);try{const r=await api(base,`/api/sessions/${code}/control`,{token:key,body:{command}});snapshot=JSON.stringify(r);show(r);error('');}catch(e){error(e.message);}finally{busy=false;$('#dashboard').querySelectorAll('button').forEach(b=>b.disabled=false);}}
$('#login form').addEventListener('submit',e=>{e.preventDefault();login();});
$('#create').addEventListener('click',async()=>{if(busy)return;busy=true;$('#create').disabled=true;try{const r=await api(base,'/api/sessions',{token:key,body:{game:$('#game-type').value}});code=r.code;snapshot='';save('assas-active-session',code);await refreshAfterCreate();}catch(e){error(e.message);}finally{busy=false;$('#create').disabled=false;}});
async function refreshAfterCreate(){const r=await api(base,`/api/sessions/${code}/results`,{token:key});snapshot=JSON.stringify(r);show(r);}
$('#projection').addEventListener('click',()=>{const active=document.body.classList.toggle('projection');$('#projection').textContent=active?'Quitter la projection':'Projection';});
$('#logout').addEventListener('click',()=>{clearInterval(pollTimer);forgetSession();$('#password').value='';$('#host').hidden=true;$('#login').hidden=false;$('#logout').hidden=true;$('#dashboard').innerHTML='';});
if(params.get('game')==='scm')$('#game-type').value='scm';
if(key)restoreSession();
