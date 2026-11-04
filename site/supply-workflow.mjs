import {roleInstructions} from './supply-instructions.mjs?v=rythme-20261104';
import {timerBanner,tickCountdown} from './supply-timing.mjs?v=rythme-20261104';
import {financePanel,financeImpactCard} from './supply-finance.mjs?v=rentabilite-20261104';
import {nextTask,proposalExplanation} from './supply-tasks.mjs?v=phases-20261104';
export {nextTask} from './supply-tasks.mjs';
import {constraintPanel,transportChoices} from './supply-constraints.mjs?v=capacites-20261104';
import {esc} from './live-common.mjs';
import {metrics,inventoryCards,euro,time,teamName} from './supply-ui.mjs';
const routes={client:['planning'],planning:['buying','ops'],buying:['supplierA','supplierB']};
const labels={open:'À traiter',partial:'Partiellement couverte',closed:'Couverte',pending:'À confirmer',accepted:'Engagement confirmé',superseded:'Remplacé par une révision',released:'Libéré',rejected:'Refusé'};
let frame='',state=null,main=null,actions=null,mode='request',requestId='',replacesId='',checked='',checking=false,checkTimer=null,checkSequence=0,lastFocusHtml='',lastConstraintSignature='',lastTransportSignature='';
const $=q=>main.querySelector(q);
const signature=b=>JSON.stringify(b);
export function workflowCard(s,d,{admin=false}={}){
 const request=d.type==='request',accepted=d.status==='accepted',active=s.phase==='running',toMe=d.to===s.role,fromMe=d.from===s.role,expired=d.status==='pending'&&d.round!==s.round;
 const title=request?(d.kind==='need'?'Besoin client':'Demande structurée'):(d.orderRef?'Engagement':'Offre');
 return `<article class="supply-message workflow-document ${d.health&&!d.health.ok?'workflow-risk':''}"><div class="supply-message-head"><strong>${esc(d.orderRef||d.ref)} · ${title}</strong><span>${expired?'Expirée':labels[d.status]||esc(d.status)}</span></div><p>${esc(teamName(s,d.from))} → ${esc(teamName(s,d.to))}</p><div class="offer-fields"><strong>${d.quantity} ${['ops','planning'].includes(d.from)||d.kind==='need'?'coffrets':'unités'}</strong><span>${request?'Souhaité avant':accepted?'Engagé à':'Proposé à'} ${time(d.delivery)}</span>${!request&&['supplierA','supplierB','ops'].includes(d.from)?`<span>${euro(d.unitPrice)} / unité</span><strong>${euro(d.quantity*d.unitPrice)}</strong>`:''}${d.from==='ops'&&!request?`<span>Transport ${d.transport==='express'?'express':'normal'}</span>`:''}</div>${d.requestRef?`<small>Répond à ${esc(d.requestRef)}</small>`:''}${d.parentRef?`<small>Issu de ${esc(d.parentRef)}</small>`:''}${d.replacesRef?`<p class="hint">Révision de ${esc(d.replacesRef)}. L’engagement actuel reste en vigueur jusqu’à acceptation.</p>`:''}${d.financeImpact?financeImpactCard(d.financeImpact):''}${d.text?`<p>${esc(d.text)}</p>`:''}${d.health&&!d.health.ok?`<div class="supply-alert"><strong>Engagement à risque · à renégocier</strong><ul>${d.health.reasons.map(r=>`<li>${esc(r)}</li>`).join('')}</ul></div>`:''}${!admin&&active?`<div class="actions">${request&&toMe&&!['closed','rejected'].includes(d.status)?`<button class="btn primary" data-wf-respond="${d.id}">Vérifier et répondre</button>${(routes[s.role]||[]).length?`<button class="btn secondary" data-wf-source="${d.id}">Consulter les équipes en amont</button>`:''}${s.isCaptain?`<button class="text-btn" data-wf-reject="${d.id}">Refuser la demande</button>`:''}`:''}${!request&&toMe&&d.status==='pending'&&!expired&&s.isCaptain?`<button class="btn primary" data-wf-accept="${d.id}">${['supplierA','supplierB'].includes(d.from)?'Commander et réserver':'Confirmer l’engagement'}</button><button class="btn secondary" data-wf-reject="${d.id}">Refuser</button>`:''}${accepted&&toMe&&s.isCaptain?`<button class="btn secondary" data-wf-renegotiate="${d.id}">Demander une révision</button>`:''}${accepted&&fromMe?`<button class="btn secondary" data-wf-revise="${d.id}">Proposer une révision</button>`:''}</div>`:''}${admin&&accepted&&d.from!=='planning'&&s.phase!=='finished'?`<button class="text-btn" data-release="${d.id}">Libérer cet engagement</button>`:''}</article>`;
}

function waitName(s,id){return id==='animateur'?'l’animateur':id==='captain'?'votre capitaine':teamName(s,id);}
function body(){const f=new FormData($('#wf-form')),hm=String(f.get('delivery')).split(':').map(Number);return {to:f.get('to'),parentId:f.get('parent'),requestId,replacesId,quantity:Number(f.get('quantity')),delivery:hm[0]*60+hm[1],unitPrice:Math.round(Number(f.get('price')||0)*100),transport:f.get('transport')||'normal',text:String(f.get('text')||'')};}
function notice(text){$('#s-error').textContent=text;$('#s-error').hidden=!text;}
function updateSubmit(){const b=body();$('#wf-submit').disabled=state.phase!=='running'||checking||(mode==='quote'&&checked!==signature(b));}
function scheduleCheck(){clearTimeout(checkTimer);checked='';checkSequence++;if(mode==='quote'){updateSubmit();$('#wf-check-result').innerHTML='<p class="hint">Vérification en cours…</p>';checkTimer=setTimeout(checkOffer,350);}}
async function checkOffer(){
 const seq=++checkSequence,b=body();if(!$('#wf-form').checkValidity()){checked='';checking=false;$('#wf-check-result').innerHTML='<p class="hint">Complétez la quantité, l’heure et le prix.</p>';updateSubmit();return false;}
 checking=true;updateSubmit();
 try{
  if(state.role==='planning'&&(!state.plan||state.plan.quantity!==b.quantity||state.plan.transport!==b.transport)){
   if(!state.isCaptain){notice('Votre capitaine prépare la promesse client.');return false;}
   if(!await actions.send('plan',{quantity:b.quantity,transport:b.transport}))return false;
  }
  if(seq!==checkSequence)return false;
  const result=await actions.check(b);if(seq!==checkSequence||$('#wf-editor').hidden)return false;
  checked=result.ok?signature(b):'';
  const full=result.earliestForFullQuantity,partial=result.feasibleQuantityAtRequestedTime;
  $('#wf-check-result').innerHTML=result.ok?`<div class="workflow-check-ok">✓ Cette proposition est réalisable.${financeImpactCard(result.financeImpact)}${b.quantity<result.requestedQuantity?`<p>Il restera ${result.requestedQuantity-b.quantity} unités à trouver.</p>`:''}${b.delivery>result.requestedDelivery?'<p>Vous proposez un délai plus tardif. L’autre équipe devra l’accepter.</p>':''}</div>`:`<div class="supply-alert"><strong>Cette proposition doit être ajustée.</strong><p>${esc(result.reasons[0]||'Les ressources disponibles ne suffisent pas.')}</p><div class="actions">${partial>0&&partial<b.quantity?`<button type="button" class="btn secondary" data-wf-option-q="${partial}" data-wf-option-time="${result.requestedDelivery}">Proposer ${partial} à ${time(result.requestedDelivery)}</button>`:''}${full!==null&&full<=1320&&full>b.delivery?`<button type="button" class="btn secondary" data-wf-option-q="${result.requestedQuantity}" data-wf-option-time="${full}">Proposer ${result.requestedQuantity} à ${time(full)}</button>`:''}</div><details><summary>Comprendre le calcul</summary><p>À ${time(result.requestedDelivery)} : jusqu’à ${partial} unités.</p><p>Pour toute la quantité : ${full===null?'pas assez de ressources actuellement.':time(full)+'.'}</p>${result.reasons.slice(1).map(r=>`<p>${esc(r)}</p>`).join('')}</details></div>`;
  main.querySelectorAll('[data-wf-option-q]').forEach(button=>button.onclick=()=>{$('#wf-form input[name=quantity]').value=button.dataset.wfOptionQ;$('#wf-form input[name=delivery]').value=time(Number(button.dataset.wfOptionTime));scheduleCheck();});return result.ok;
 }catch(e){if(seq===checkSequence){checked='';notice(e.message);}return false;}finally{if(seq===checkSequence){checking=false;updateSubmit();}}
}
function requestQuantity(doc,target){
 const need=doc?.quantity||state.demand;if(state.role!=='buying')return need;
 const ordered=state.documents.filter(d=>d.type==='offer'&&d.status==='accepted'&&['supplierA','supplierB'].includes(d.from)).reduce((n,d)=>n+d.quantity,0),left=Math.max(1,need-ordered);
 const other=state.documents.filter(d=>d.type==='request'&&d.from==='buying'&&d.to!==target&&['open','partial'].includes(d.status));
 return Math.max(1,Math.min(left,other.length?left-other.reduce((n,d)=>n+d.quantity,0):ordered?left:Math.ceil(left/2)));
}
function openForm(next,doc=null,target=null,old=null){
 clearTimeout(checkTimer);checkSequence++;checking=false;checked='';mode=next;requestId=next==='quote'?doc.id:'';replacesId=old?.id||'';
 $('#wf-form').reset();$('#wf-editor').hidden=false;$('#wf-focus').hidden=true;$('#wf-quick-constraints').hidden=true;$('#wf-check-result').innerHTML='';notice('');
 const to=next==='quote'?doc.from:target||routes[state.role]?.[0],received=doc||state.documents.find(d=>d.type==='request'&&d.to===state.role);
 $('#wf-form input[name=to]').value=to;$('#wf-form input[name=parent]').value=received?.id||'NEED-1';
 $('#wf-request-reminder').textContent=next==='quote'?`Demande reçue : ${doc.quantity} unités avant ${time(doc.delivery)}.`:'';
 $('#wf-answer-constraints').innerHTML=constraintPanel(state,{replacesId});
 $('#wf-title').textContent=next==='quote'?'Votre réponse à '+teamName(state,to):'Votre demande à '+teamName(state,to);
 let q=next==='request'?requestQuantity(received,to):old?.quantity||doc.quantity;
 if(next==='quote'&&!old&&state.inventory?.remaining!==undefined)q=Math.min(q,Math.max(1,state.inventory.remaining));
 if(next==='quote'&&state.role==='buying'){const orders=state.documents.filter(d=>d.type==='offer'&&d.status==='accepted'&&['supplierA','supplierB'].includes(d.from));q=Math.min(q,orders.reduce((n,d)=>n+d.quantity,0)||q);}
 if(next==='quote'&&state.role==='ops'&&state.inputs?.quantity>0&&!old)q=Math.min(q,state.inputs.quantity);
 $('#wf-form input[name=quantity]').value=q;
 let delivery=old?.delivery||doc?.delivery||state.promise.delivery;
 if(next==='request'&&state.role==='planning'&&to==='buying')delivery=Math.max(780,delivery-Math.ceil(q/40*60)-60);
 if(next==='quote'&&state.role==='buying')delivery=Math.max(delivery,...state.documents.filter(d=>d.type==='offer'&&d.status==='accepted'&&['supplierA','supplierB'].includes(d.from)).map(d=>d.delivery));
 $('#wf-form input[name=delivery]').value=time(delivery);$('#wf-form input[name=price]').value=old?old.unitPrice/100:state.role==='ops'?6:state.inventory?.minPrice!==undefined?(state.inventory.minPrice+200)/100:0;
 const operation=state.documents.find(d=>d.type==='offer'&&d.from==='ops'&&d.status==='accepted');const selectedTransport=old?.transport||operation?.transport||'normal';$('#wf-transport-options').innerHTML=state.role==='ops'?transportChoices(state,selectedTransport):`<input type="hidden" name="transport" value="${selectedTransport}">`;lastTransportSignature=JSON.stringify(state.inventory?.transportOptions||[]);
 $('#wf-price').hidden=next!=='quote'||!['supplierA','supplierB','ops'].includes(state.role);$('#wf-transport').hidden=next!=='quote'||state.role!=='ops';
 $('#wf-form input[name=price]').required=!$('#wf-price').hidden;
 $('#wf-submit').textContent=state.isCaptain?(next==='quote'?'Envoyer ma proposition':'Envoyer ma demande'):'Proposer à mon capitaine';
 $('#wf-editor').scrollIntoView({behavior:'smooth',block:'start'});if(next==='quote')scheduleCheck();else updateSubmit();
}
async function executeTask(task){
 notice('');if(task.kind==='request')return openForm('request',task.doc,task.target);
 if(task.kind==='respond')return openForm('quote',task.doc);
 if(task.kind==='revise'){const request=state.documents.find(d=>d.id===task.doc.requestId);return openForm('quote',request,null,task.doc);}
 if(task.kind==='accept')return actions.send('accept',{id:task.doc.id});
 if(task.kind==='renegotiate')return actions.send('renegotiate',{id:task.doc.id});
 if(task.kind==='approve')return actions.send(task.doc.documentAction?'approve':'message',task.doc.documentAction?{id:task.doc.id}:{proposalId:task.doc.id});
}
export function renderWorkflow(root,s,callbacks){main=root;state=s;actions=callbacks;
 const id=s.code+':'+s.role+':'+s.isCaptain+':'+(s.experiment?.stage||'human');
 if(frame!==id){clearTimeout(checkTimer);checkSequence++;frame=id;lastFocusHtml='';lastConstraintSignature='';lastTransportSignature='';checking=false;mode='request';requestId='';replacesId='';checked='';
 root.innerHTML=`<div class="eyebrow">${s.experiment?.stage==='ai'?'Phase 2 · Préparation IA, décision humaine':'Phase 1 · Traitement humain'}</div><h1>${esc(s.team.name)}</h1><div id="wf-timer"></div><div id="wf-role-guide">${roleInstructions(s)}</div><p class="workflow-goal">Objectif commun : ${s.demand} coffrets avant ${time(s.promise.delivery)}</p><p class="hint">${s.isCaptain?'Vous êtes capitaine : vous confirmez les décisions.':'Vous préparez des propositions pour votre capitaine.'}</p><p id="s-error" role="status" class="error" hidden></p><div id="wf-latest-event"></div><div id="wf-quick-constraints"></div><div id="wf-finance"></div><section id="wf-focus" class="card workflow-focus"></section><section id="wf-editor" class="card" hidden><h2 id="wf-title"></h2><p id="wf-request-reminder" class="hint"></p><div id="wf-answer-constraints"></div><form id="wf-form"><input type="hidden" name="to"><input type="hidden" name="parent"><div class="supply-form-grid"><label>Quantité<input type="number" name="quantity" min="1" max="120" required></label><label>Livraison à<input type="time" name="delivery" min="13:00" max="22:00" required></label><label id="wf-price">Prix par unité (€)<input type="number" name="price" min="0" max="100" step="0.01"></label></div><fieldset id="wf-transport"><legend>Choisissez le transport</legend><div id="wf-transport-options" class="transport-options"></div></fieldset><div id="wf-check-result" role="status" aria-live="polite"></div><details><summary>Ajouter un commentaire</summary><label>Commentaire facultatif<textarea name="text" maxlength="1200" rows="2"></textarea></label></details><div class="actions"><button class="btn primary" id="wf-submit">Envoyer</button><button class="btn secondary" type="button" id="wf-cancel">Retour</button></div></form></section><details class="card" id="wf-more"><summary>Mes ressources et l’historique</summary><div id="wf-resources"></div><h3>Mes engagements</h3><div id="wf-order-list"></div><h3>Les échanges en cours</h3><div id="wf-pending"></div><h3>Les demandes reçues</h3><div id="wf-request-list"></div><div id="wf-extra-actions" class="actions"></div><details><summary>Le plan du groupe</summary><div id="wf-metrics"></div></details><details><summary>Toutes les informations de l’animateur</summary><div id="wf-events"></div></details></details><details class="card" id="wf-chat"><summary>Échanger un message</summary><form id="compose"><label>À qui ?<select name="to">${s.roles.filter(r=>r.id!==s.role).map(r=>`<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select></label><label>Votre message<textarea name="text" maxlength="1200" rows="3" required></textarea></label><div class="actions"><button type="button" class="btn secondary" id="manual">Rédiger un message</button></div><p id="ai-status" class="hint"></p><label><input name="confirm" type="checkbox" required> J’ai relu ce message.</label><button class="btn primary">${s.isCaptain?'Envoyer le message':'Proposer à mon capitaine'}</button></form><div id="wf-comments"></div></details>`;
 $('#wf-cancel').onclick=()=>{clearTimeout(checkTimer);checkSequence++;checking=false;$('#wf-editor').hidden=true;$('#wf-focus').hidden=false;$('#wf-quick-constraints').hidden=false;notice('');};
 $('#wf-form').oninput=()=>scheduleCheck();
 $('#wf-form').onsubmit=async e=>{e.preventDefault();if(checking)return;const b=body();if(mode==='quote'&&checked!==signature(b)&&!await checkOffer())return;const ok=await actions.send(state.isCaptain?mode:'proposal',state.isCaptain?b:{...b,documentAction:mode});if(ok){clearTimeout(checkTimer);checkSequence++;checking=false;$('#wf-editor').hidden=true;$('#wf-focus').hidden=false;$('#wf-quick-constraints').hidden=false;checked='';}};
 $('#compose').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);if(await actions.send(state.isCaptain?'message':'proposal',{type:'note',to:f.get('to'),text:f.get('text')}))e.target.reset();};
 $('#manual').onclick=()=>{$('#compose textarea').focus();$('#ai-status').textContent='Rédigez votre message, puis relisez-le.';};
 }
 $('#wf-timer').innerHTML=timerBanner(s);tickCountdown(main);
 $('#wf-quick-constraints').innerHTML=constraintPanel(s,{compact:true});
 const financeOpen=$('#wf-finance details')?.open;$('#wf-finance').innerHTML=financePanel(s);if(financeOpen&&$('#wf-finance details'))$('#wf-finance details').open=true;
 if(!$('#wf-editor').hidden){
 $('#wf-answer-constraints').innerHTML=constraintPanel(s,{replacesId});
 const transportSignature=JSON.stringify(s.inventory?.transportOptions||[]);
 if(s.role==='ops'&&transportSignature!==lastTransportSignature){const selected=body().transport;$('#wf-transport-options').innerHTML=transportChoices(s,selected);lastTransportSignature=transportSignature;}
 }
 const constraintSignature=JSON.stringify([s.inventory,s.inputs,s.spending,s.budget,s.assessment]);
 if(lastConstraintSignature&&constraintSignature!==lastConstraintSignature&&!$('#wf-editor').hidden&&mode==='quote'&&!checking)scheduleCheck();
 lastConstraintSignature=constraintSignature;
 const task=nextTask(s);
 let focusHtml=`<div class="eyebrow">${task.kind==='wait'?(task.complete?'Votre étape est terminée':'En attente'):'À vous de jouer'}</div>${task.waitingOn?.length?`<p class="workflow-wait-owner">⏳ En attente de : <strong>${esc(task.waitingOn.map(r=>waitName(s,r)).join(' · '))}</strong></p>`:''}<h2>${esc(task.title)}</h2><p>${esc(task.text)}</p>${task.next?`<p class="workflow-then"><strong>Ensuite :</strong> ${esc(task.next)}</p>`:''}${task.waitingOn?.length?'<p class="workflow-auto-update">Cette page se met à jour automatiquement.</p>':''}${task.button?`<button class="btn primary workflow-main-action" id="wf-next">${esc(task.button)}</button>`:''}${task.otherTarget?`<button class="btn secondary" id="wf-other">Consulter ${esc(teamName(s,task.otherTarget))}</button>`:''}${task.kind==='accept'?financeImpactCard(task.doc.financeImpact):''}${task.kind==='accept'?`<button class="text-btn" id="wf-refuse">Demander une autre solution</button>`:''}`;
 const autoPhase=s.experiment?.stage==='ai',autoTask=['request','respond','revise'].includes(task.kind),draft=s.autoDraft;
 if(autoPhase&&autoTask){
  const ready=draft?.status==='ready',failed=draft?.status==='failed';
  focusHtml=`<div class="eyebrow">${ready?'Proposition IA à valider':failed?'Exception à traiter':'Préparation automatique'}</div><h2>${ready?'Votre réponse est préparée.':failed?'Une intervention est nécessaire.':'L’IA prépare votre prochaine réponse…'}</h2>${ready?`<p><strong>${draft.action==='request'?'Demande à':'Réponse à'} ${esc(teamName(s,draft.payload.to))}</strong></p><div class="offer-fields"><strong>${draft.payload.quantity} unités</strong><span>À ${time(draft.payload.delivery)}</span>${draft.payload.unitPrice?`<span>${euro(draft.payload.unitPrice)} / unité</span>`:''}${s.role==='ops'?`<span>Transport ${esc(draft.payload.transport)}</span>`:''}</div><p>${esc(proposalExplanation(draft))}</p>${financeImpactCard(draft.financeImpact)}<p class="hint">Préparée en ${((draft.readyAt-draft.startedAt)/1000).toFixed(1)} s · Option choisie par l’IA · Chiffres contrôlés par le moteur métier.</p>${draft.exception?'<div class="supply-alert">Alternative : la quantité ou le délai demandé n’est pas entièrement respecté. Vérifiez ce compromis avant de valider.</div>':''}${s.isCaptain?`<button class="btn primary" id="wf-ai-confirm">Valider et envoyer</button>`:'<p>Votre capitaine doit valider avant l’envoi.</p>'}`:failed?`<p>${esc(draft.error)}</p>`:'<p>Votre demande reçue, vos contraintes et vos capacités sont prises en compte. Aucun envoi automatique.</p><p class="workflow-auto-update">La proposition apparaîtra ici automatiquement.</p>'}<button class="btn secondary" id="wf-ai-exception">${ready?'Modifier / gérer une exception':'Traiter manuellement'}</button>`;
 }
 if(s.role==='planning'&&s.isCaptain&&s.phase==='running'&&task.kind==='wait'&&task.waitingOn?.some(id=>!['animateur','captain'].includes(id)))focusHtml+=`<button class="btn secondary" id="wf-remind">Relancer l’équipe attendue</button>`;
 if(lastFocusHtml!==focusHtml){$('#wf-focus').innerHTML=focusHtml;lastFocusHtml=focusHtml;}
 $('#wf-focus').classList.toggle('workflow-waiting',!!task.waitingOn?.length);
 if($('#wf-remind'))$('#wf-remind').onclick=()=>actions.send('message',{to:nextTask(state).waitingOn.find(id=>!['animateur','captain'].includes(id)),type:'note',text:'La Planification attend votre prochaine décision pour avancer. Vérifiez votre action principale, confirmez votre proposition ou indiquez le blocage. La promesse client doit être acceptée avant la fin du jeu.'});
 if($('#wf-next'))$('#wf-next').onclick=()=>executeTask(nextTask(state));
 if($('#wf-ai-confirm'))$('#wf-ai-confirm').onclick=()=>actions.send('auto-confirm',{id:state.autoDraft.id});
 if($('#wf-ai-exception'))$('#wf-ai-exception').onclick=async()=>{
  const d=state.autoDraft;await executeTask(nextTask(state));
  if(d?.status==='ready'&&!$('#wf-editor').hidden){const f=$('#wf-form'),b=d.payload;f.querySelector('[name=quantity]').value=b.quantity;f.querySelector('[name=delivery]').value=time(b.delivery);f.querySelector('[name=price]').value=b.unitPrice/100;const t=f.querySelector(`[name=transport][value="${b.transport}"]`);if(t?.type==='radio')t.checked=true;else if(f.querySelector('[name=transport]'))f.querySelector('[name=transport]').value=b.transport;if(mode==='quote')scheduleCheck();else updateSubmit();}
 };
 if($('#wf-other'))$('#wf-other').onclick=()=>openForm('request',task.doc,task.otherTarget);
 if($('#wf-refuse'))$('#wf-refuse').onclick=()=>actions.send('reject',{id:task.doc.id});
 const latest=s.events.at(-1);$('#wf-latest-event').innerHTML=latest?`<div class="supply-alert"><strong>Nouvelle information</strong><p>${esc(latest.text)}</p></div>`:'';
 $('#wf-resources').innerHTML=`${inventoryCards(s)}<details><summary>Les règles de mon équipe</summary><p>${esc(s.brief)}</p></details>`;
 const docs=s.documents;
 $('#wf-order-list').innerHTML=docs.filter(d=>d.type==='offer'&&['accepted','superseded','released'].includes(d.status)).map(d=>workflowCard(s,d)).join('')||'<p class="hint">Aucun engagement pour le moment.</p>';
 $('#wf-pending').innerHTML=docs.filter(d=>d.type==='offer'&&d.status==='pending'||d.type==='request'&&d.from===s.role&&!['closed','rejected'].includes(d.status)).map(d=>workflowCard(s,d)).join('')||'<p class="hint">Rien en attente.</p>';
 $('#wf-request-list').innerHTML=docs.filter(d=>d.type==='request'&&d.to===s.role).map(d=>workflowCard(s,d)).join('')||'<p class="hint">Aucune demande reçue.</p>';
 $('#wf-extra-actions').innerHTML=(routes[s.role]||[]).map(to=>`<button class="btn secondary" data-wf-extra="${to}">${s.role==='client'?'Modifier mon besoin':'Autre demande à '+esc(teamName(s,to))}</button>`).join('');
 $('#wf-metrics').innerHTML=metrics(s);$('#wf-events').innerHTML=s.events.map(e=>`<p>${esc(e.text)}</p>`).join('');
 $('#wf-comments').innerHTML=s.messages.map(m=>`<article class="supply-message"><strong>${esc(teamName(s,m.from))} → ${esc(teamName(s,m.to))}</strong><p>${esc(m.text)}</p></article>`).join('');
 main.querySelectorAll('[data-wf-extra]').forEach(b=>b.onclick=()=>openForm('request',docs.find(d=>d.type==='request'&&d.to===s.role&&!['rejected','closed'].includes(d.status)),b.dataset.wfExtra));
 main.querySelectorAll('[data-wf-respond]').forEach(b=>b.onclick=()=>openForm('quote',docs.find(d=>d.id===b.dataset.wfRespond)));
 main.querySelectorAll('[data-wf-source]').forEach(b=>b.onclick=()=>openForm('request',docs.find(d=>d.id===b.dataset.wfSource)));
 main.querySelectorAll('[data-wf-revise]').forEach(b=>b.onclick=()=>{const old=docs.find(d=>d.id===b.dataset.wfRevise);openForm('quote',docs.find(d=>d.id===old.requestId),null,old);});
 main.querySelectorAll('[data-wf-accept]').forEach(b=>b.onclick=()=>actions.send('accept',{id:b.dataset.wfAccept}));main.querySelectorAll('[data-wf-reject]').forEach(b=>b.onclick=()=>actions.send('reject',{id:b.dataset.wfReject}));main.querySelectorAll('[data-wf-renegotiate]').forEach(b=>b.onclick=()=>actions.send('renegotiate',{id:b.dataset.wfRenegotiate}));
 main.querySelectorAll('#wf-form input,#wf-form select,#wf-form textarea,#wf-form button,#compose input,#compose select,#compose textarea,#compose button').forEach(el=>el.disabled=s.phase!=='running');
 updateSubmit();
}
