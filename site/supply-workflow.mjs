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
 return `<article class="supply-message workflow-document ${d.health&&!d.health.ok?'workflow-risk':''}"><div class="supply-message-head"><strong>${esc(d.orderRef||d.ref)} · ${title}</strong><span>${expired?'Expirée':labels[d.status]||esc(d.status)}</span></div><p>${esc(teamName(s,d.from))} → ${esc(teamName(s,d.to))}</p><div class="offer-fields"><strong>${d.quantity} ${['ops','planning'].includes(d.from)||d.kind==='need'?'coffrets':'unités'}</strong><span>${request?'Souhaité avant':accepted?'Engagé à':'Proposé à'} ${time(d.delivery)}</span>${!request&&['supplierA','supplierB','ops'].includes(d.from)?`<span>${euro(d.unitPrice)} / unité</span><strong>${euro(d.quantity*d.unitPrice)}</strong>`:''}${d.from==='ops'&&!request?`<span>Transport ${d.transport==='express'?'express':'normal'}</span>`:''}</div>${d.requestRef?`<small>Répond à ${esc(d.requestRef)}</small>`:''}${d.parentRef?`<small>Issu de ${esc(d.parentRef)}</small>`:''}${d.replacesRef?`<p class="hint">Révision de ${esc(d.replacesRef)}. L’engagement actuel reste en vigueur jusqu’à acceptation.</p>`:''}${d.text?`<p>${esc(d.text)}</p>`:''}${d.health&&!d.health.ok?`<div class="supply-alert"><strong>Engagement à risque · à renégocier</strong><ul>${d.health.reasons.map(r=>`<li>${esc(r)}</li>`).join('')}</ul></div>`:''}${!admin&&active?`<div class="actions">${request&&toMe&&!['closed','rejected'].includes(d.status)?`<button class="btn primary" data-wf-respond="${d.id}">Vérifier et répondre</button>${(routes[s.role]||[]).length?`<button class="btn secondary" data-wf-source="${d.id}">Consulter les équipes en amont</button>`:''}${s.isCaptain?`<button class="text-btn" data-wf-reject="${d.id}">Refuser la demande</button>`:''}`:''}${!request&&toMe&&d.status==='pending'&&!expired&&s.isCaptain?`<button class="btn primary" data-wf-accept="${d.id}">${['supplierA','supplierB'].includes(d.from)?'Commander et réserver':'Confirmer l’engagement'}</button><button class="btn secondary" data-wf-reject="${d.id}">Refuser</button>`:''}${accepted&&toMe&&s.isCaptain?`<button class="btn secondary" data-wf-renegotiate="${d.id}">Demander une révision</button>`:''}${accepted&&fromMe?`<button class="btn secondary" data-wf-revise="${d.id}">Proposer une révision</button>`:''}</div>`:''}${admin&&accepted&&d.from!=='planning'&&s.phase!=='finished'?`<button class="text-btn" data-release="${d.id}">Libérer cet engagement</button>`:''}</article>`;
}

// Une action principale à la fois, calculée à partir des documents visibles de l'équipe.
function chooseTask(s){
 const docs=s.documents||[],live=d=>d.type==='offer'&&d.status==='accepted',incoming=docs.filter(d=>d.type==='request'&&d.to===s.role&&!['closed','rejected'].includes(d.status));
 if(s.phase!=='running')return {kind:'wait',title:s.phase==='waiting'?'Votre équipe est prête.':s.phase==='paused'?'Le jeu est en pause.':'La partie est terminée.',text:s.phase==='waiting'?'L’animateur va démarrer. Vous pouvez déjà découvrir vos ressources.':s.phase==='paused'?'Attendez le signal de l’animateur.':'Regardez le bilan avec l’animateur.'};
 const proposal=s.proposals?.find(p=>p.status==='proposed');
 if(proposal&&s.isCaptain)return {kind:'approve',doc:proposal,title:'Votre équipe a préparé une proposition.',text:`${proposal.documentAction?proposal.payload.quantity+' unités à '+time(proposal.payload.delivery):proposal.text}`,button:'Confirmer la proposition'};
 if(proposal&&!s.isCaptain)return {kind:'wait',title:'Votre proposition attend votre capitaine.',text:'Il doit la confirmer avant son envoi à l’autre équipe.'};
 const offer=docs.find(d=>d.type==='offer'&&d.to===s.role&&d.status==='pending'&&d.round===s.round);
 if(offer)return s.isCaptain?{kind:'accept',doc:offer,title:`${teamName(s,offer.from)} vous propose une solution.`,text:`${offer.quantity} unités à ${time(offer.delivery)}${['supplierA','supplierB','ops'].includes(offer.from)?' · '+euro(offer.quantity*offer.unitPrice):''}`,button:['supplierA','supplierB'].includes(offer.from)?'Commander':'Accepter cette proposition'}:{kind:'wait',title:'Une proposition est arrivée.',text:'Votre capitaine doit la valider. Discutez du choix avec votre équipe.'};
 const receivedRisk=docs.find(d=>live(d)&&d.to===s.role&&d.health&&!d.health.ok);
 if(receivedRisk&&s.isCaptain){
  if(docs.some(d=>d.type==='request'&&d.replacesId===receivedRisk.id&&d.status==='open'))return {kind:'wait',title:teamName(s,receivedRisk.from)+' revoit sa solution.',text:'Sa nouvelle proposition apparaîtra ici. L’engagement actuel reste enregistré.'};
  return {kind:'renegotiate',doc:receivedRisk,title:'Une solution ne tient plus.',text:`${teamName(s,receivedRisk.from)} doit revoir son engagement.`,button:'Demander une nouvelle proposition'};
 }
 if(s.role==='ops'&&s.inputs?.ready===false&&(incoming.length||docs.some(d=>live(d)&&d.from==='ops')))return {kind:'wait',title:'Les composants doivent être confirmés.',text:'Les Achats et la Planification doivent d’abord confirmer les approvisionnements.'};
 const risk=docs.find(d=>live(d)&&d.from===s.role&&d.health&&!d.health.ok);
 if(risk&&docs.some(d=>d.type==='offer'&&d.from===s.role&&d.status==='pending'&&d.round===s.round&&d.replacesId===risk.id))return {kind:'wait',title:'Votre nouvelle proposition attend une décision.',text:'L’autre équipe doit l’accepter avant de remplacer l’engagement actuel.'};
 if(risk)return {kind:'revise',doc:risk,title:'Votre engagement doit être revu.',text:`${risk.quantity} unités à ${time(risk.delivery)} : les conditions ont changé.`,button:'Proposer une autre solution'};
 const unanswered=incoming.find(r=>!docs.some(d=>d.type==='offer'&&d.requestId===r.id&&d.from===s.role&&d.status==='pending'&&d.round===s.round));
 if(s.role==='ops'&&unanswered&&s.inputs?.ready===false)return {kind:'wait',title:'Les composants ne sont pas encore confirmés.',text:'Les Achats et la Planification doivent d’abord confirmer les approvisionnements.'};
 if(['supplierA','supplierB','ops'].includes(s.role))return unanswered?{kind:'respond',doc:unanswered,title:`${teamName(s,unanswered.from)} attend votre réponse.`,text:`${unanswered.quantity} unités avant ${time(unanswered.delivery)}.`,button:'Préparer ma réponse'}:{kind:'wait',title:'Vous êtes à jour.',text:'Votre prochaine demande ou la réponse à votre offre apparaîtra ici.'};
 if(s.role==='buying'){
  const need=incoming[0],orders=docs.filter(d=>live(d)&&['supplierA','supplierB'].includes(d.from)),covered=orders.reduce((n,d)=>n+d.quantity,0);
  if(!need)return docs.some(d=>live(d)&&d.from==='buying')?{kind:'wait',title:'Les achats sont confirmés.',text:'La Planification organise la suite. Vous serez avertis si une décision est nécessaire.'}:{kind:'wait',title:'Attendez le besoin de la Planification.',text:'Vous pourrez ensuite demander un prix aux fournisseurs.'};
  if(covered>=need.quantity&&unanswered)return {kind:'respond',doc:unanswered,title:'Les composants sont commandés.',text:`Vous pouvez annoncer ${need.quantity} composants à la Planification.`,button:'Confirmer aux autres équipes'};
  const targets=['supplierA','supplierB'].filter(to=>!docs.some(d=>d.type==='request'&&d.from==='buying'&&d.to===to&&!['closed','rejected'].includes(d.status))&&!orders.some(d=>d.from===to));
  if(covered<need.quantity&&targets.length)return {kind:'request',doc:need,target:targets[0],title:'Demandez un prix aux fournisseurs.',text:`Besoin : ${need.quantity} composants. Déjà commandés : ${covered}.`,button:'Consulter '+teamName(s,targets[0]),otherTarget:targets[1]};
  return {kind:'wait',title:'Les fournisseurs préparent leur réponse.',text:'Leurs offres apparaîtront ici. Vous pourrez choisir de commander.'};
 }
 if(s.role==='planning'){
  const need=incoming.find(d=>d.from==='client')||incoming[0];if(!need)return {kind:'wait',title:'Le client a accepté votre promesse.',text:'Restez attentifs : l’animateur peut encore ajouter un imprévu.'};
  const sourcing=docs.find(d=>live(d)&&d.from==='buying'),operation=docs.find(d=>live(d)&&d.from==='ops');
  if(!sourcing){const sent=docs.some(d=>d.type==='request'&&d.from==='planning'&&d.to==='buying'&&!['rejected'].includes(d.status));return sent?{kind:'wait',title:'Les Achats recherchent les composants.',text:'Vous recevrez leur proposition ici, puis vous organiserez la livraison.'}:{kind:'request',doc:need,target:'buying',title:'Commencez par les composants.',text:`Le client souhaite ${need.quantity} coffrets avant ${time(need.delivery)}.`,button:'Demander les composants aux Achats'};}
  if(!operation){const sent=docs.some(d=>d.type==='request'&&d.from==='planning'&&d.to==='ops'&&d.status!=='rejected');return sent?{kind:'wait',title:'L’équipe Livraison prépare sa réponse.',text:'Vous recevrez sa proposition ici.'}:{kind:'request',doc:need,target:'ops',title:'Les composants sont prévus.',text:'Il reste à organiser la préparation et la livraison des coffrets.',button:'Organiser la livraison'};}
  if(unanswered)return s.isCaptain?{kind:'respond',doc:unanswered,title:'Vous pouvez répondre au client.',text:`Les Achats et la Livraison ont confirmé leurs solutions.`,button:'Préparer la promesse au client'}:{kind:'wait',title:'La promesse client est prête à préparer.',text:'Votre capitaine peut maintenant la proposer au client.'};
  return {kind:'wait',title:'Le client examine votre proposition.',text:'Sa décision apparaîtra ici.'};
 }
 if(s.role==='client'&&docs.some(d=>live(d)&&d.to==='client'))return {kind:'wait',title:'Votre promesse est confirmée.',text:'La quantité et le délai acceptés sont enregistrés. Vous serez avertis si la situation change.'};
 return {kind:'wait',title:offer?'Votre capitaine doit choisir cette proposition.':'Votre demande est en cours.',text:offer?'Discutez du choix avec votre équipe.':'La Planification organise les composants et la livraison. Sa proposition apparaîtra ici.'};
}
function waiting(on,title,text,next){return {kind:'wait',waitingOn:on,title,text,next};}
export function nextTask(s){
 const task=chooseTask(s);if(task.kind!=='wait')return task;
 if(s.phase==='finished')return {...task,waitingOn:[],complete:true};
 if(s.phase!=='running')return {...task,waitingOn:['animateur'],next:'L’action suivante apparaîtra dès que l’animateur ouvrira le jeu.'};
 const docs=s.documents||[],live=d=>d.type==='offer'&&d.status==='accepted';
 if(!s.isCaptain&&s.proposals?.some(p=>p.status==='proposed'))return waiting(['captain'],'Votre proposition attend votre capitaine.','Il doit la confirmer avant son envoi à l’autre équipe.','La décision de votre capitaine apparaîtra ici.');
 const received=docs.find(d=>d.type==='offer'&&d.to===s.role&&d.status==='pending'&&d.round===s.round);
 if(received&&!s.isCaptain)return waiting(['captain'],'Votre capitaine doit choisir.',`Une proposition de ${teamName(s,received.from)} a été reçue.`, 'Après sa décision, votre équipe passera à l’étape suivante.');
 const revision=docs.find(d=>d.type==='request'&&d.from===s.role&&d.replacesId&&d.status==='open');
 if(revision)return waiting([revision.to],teamName(s,revision.to)+' prépare une nouvelle solution.',`Vous avez demandé une révision pour ${revision.quantity} unités à ${time(revision.delivery)}.`, 'Vous pourrez accepter ou refuser sa nouvelle proposition.');
 const pending=docs.filter(d=>d.type==='offer'&&d.from===s.role&&d.status==='pending'&&d.round===s.round);
 if(pending.length){const on=[...new Set(pending.map(d=>d.to))];return waiting(on,'Votre proposition a été envoyée.',`${pending[0].quantity} unités à ${time(pending[0].delivery)} : ${on.length===1?'l’équipe':'les équipes'} ${on.map(r=>teamName(s,r)).join(' et ')} ${on.length===1?'doit':'doivent'} maintenant décider.`, pending[0].replacesId?'Après acceptation, cette offre remplacera votre engagement actuel.':s.role==='planning'?'Après acceptation, la promesse au Client sera confirmée.':s.role==='ops'?'La Planification pourra ensuite préparer la promesse au Client.':s.role==='buying'?'La Planification pourra ensuite organiser la livraison.':'Après acceptation, les quantités seront réservées pour les Achats.');}
 if(['supplierA','supplierB'].includes(s.role)){
  if(docs.some(d=>live(d)&&d.from===s.role))return {...task,title:'Votre engagement est confirmé.',text:'Les Achats ont accepté votre proposition. Les autres équipes organisent la suite.',waitingOn:[],complete:true};
  return waiting(['buying'],'Les Achats doivent vous consulter.','Aucune demande de prix à traiter pour le moment.','Vous pourrez indiquer la quantité, le prix et le délai que vous pouvez tenir.');
 }
 if(s.role==='ops'){
  if(s.inputs?.ready===false&&(docs.some(d=>d.type==='request'&&d.to==='ops'&&!['closed','rejected'].includes(d.status))||docs.some(d=>live(d)&&d.from==='ops')))return waiting(s.inputs.waitingOn?.length?s.inputs.waitingOn:['buying'],'Les composants doivent être confirmés.',s.inputs.waitingOn?.includes('planning')?'Les Achats ont proposé une solution. La Planification doit maintenant la valider.':'Votre demande est reçue, mais les Achats doivent encore confirmer les approvisionnements.','Vous pourrez proposer la préparation et la livraison des coffrets.');
  if(docs.some(d=>live(d)&&d.from==='ops'))return {...task,title:'Votre livraison est confirmée.',text:'La Planification s’appuie sur votre engagement pour répondre au Client.',waitingOn:[],complete:true};
  return waiting(['planning'],'La Planification doit vous solliciter.','Vous n’avez pas encore reçu de demande de préparation et de livraison.','Vous pourrez vérifier vos capacités et proposer votre solution.');
 }
 if(s.role==='buying'){
  const need=docs.find(d=>d.type==='request'&&d.to==='buying'&&!['closed','rejected'].includes(d.status));
  if(!need){if(docs.some(d=>live(d)&&d.from==='buying'))return {...task,waitingOn:[],complete:true};return waiting(['planning'],'La Planification doit préciser son besoin.','Aucune demande de composants à traiter pour le moment.','Vous pourrez consulter les fournisseurs.');}
  const open=docs.filter(d=>d.type==='request'&&d.from==='buying'&&['supplierA','supplierB'].includes(d.to)&&['open','partial'].includes(d.status));
  const on=[...new Set(open.map(d=>d.to))];return waiting(on.length?on:['supplierA','supplierB'],'Les fournisseurs préparent leurs offres.', 'Vous recevrez les quantités, prix et délais qu’ils peuvent proposer.','Vous pourrez choisir les offres et confirmer les commandes.');
 }
 if(s.role==='planning'){
  const need=docs.some(d=>d.type==='request'&&d.to==='planning'&&!['closed','rejected'].includes(d.status));
  if(!need)return {...task,waitingOn:[],complete:true};
  if(!docs.some(d=>live(d)&&d.from==='buying'))return waiting(['buying'],'Les Achats recherchent les composants.','Votre demande a été envoyée aux Achats. Ils consultent les fournisseurs et confirment les commandes.','Vous pourrez accepter leur solution, puis organiser la livraison.');
  if(!docs.some(d=>live(d)&&d.from==='ops'))return waiting(['ops'],'L’équipe Livraison prépare sa solution.','Votre demande de préparation et de livraison lui a été transmise.','Vous pourrez accepter sa solution, puis proposer une promesse au Client.');
  return {...task,waitingOn:['captain'],next:'Votre capitaine pourra préparer la promesse au Client.'};
 }
 if(s.role==='client'&&docs.some(d=>live(d)&&d.to==='client'))return {...task,waitingOn:[],complete:true};
 return waiting(['planning'],'La Planification organise votre demande.','Elle attend les engagements des Achats et de la Livraison avant de vous répondre.','Vous pourrez accepter sa promesse ou demander une autre solution.');
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
  $('#wf-check-result').innerHTML=result.ok?`<div class="workflow-check-ok">✓ Cette proposition est réalisable.${b.quantity<result.requestedQuantity?`<p>Il restera ${result.requestedQuantity-b.quantity} unités à trouver.</p>`:''}${b.delivery>result.requestedDelivery?'<p>Vous proposez un délai plus tardif. L’autre équipe devra l’accepter.</p>':''}</div>`:`<div class="supply-alert"><strong>Cette proposition doit être ajustée.</strong><p>${esc(result.reasons[0]||'Les ressources disponibles ne suffisent pas.')}</p><div class="actions">${partial>0&&partial<b.quantity?`<button type="button" class="btn secondary" data-wf-option-q="${partial}" data-wf-option-time="${result.requestedDelivery}">Proposer ${partial} à ${time(result.requestedDelivery)}</button>`:''}${full!==null&&full<=1320&&full>b.delivery?`<button type="button" class="btn secondary" data-wf-option-q="${result.requestedQuantity}" data-wf-option-time="${full}">Proposer ${result.requestedQuantity} à ${time(full)}</button>`:''}</div><details><summary>Comprendre le calcul</summary><p>À ${time(result.requestedDelivery)} : jusqu’à ${partial} unités.</p><p>Pour toute la quantité : ${full===null?'pas assez de ressources actuellement.':time(full)+'.'}</p>${result.reasons.slice(1).map(r=>`<p>${esc(r)}</p>`).join('')}</details></div>`;
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
 const id=s.code+':'+s.role+':'+s.isCaptain;
 if(frame!==id){clearTimeout(checkTimer);checkSequence++;frame=id;lastFocusHtml='';lastConstraintSignature='';lastTransportSignature='';checking=false;mode='request';requestId='';replacesId='';checked='';
 root.innerHTML=`<div class="eyebrow">Mon équipe</div><h1>${esc(s.team.name)}</h1><p class="workflow-goal">Objectif commun : ${s.demand} coffrets avant ${time(s.promise.delivery)}</p><p class="hint">${s.isCaptain?'Vous êtes capitaine : vous confirmez les décisions.':'Vous préparez des propositions pour votre capitaine.'}</p><p id="s-error" role="status" class="error" hidden></p><div id="wf-latest-event"></div><div id="wf-quick-constraints"></div><section id="wf-focus" class="card workflow-focus"></section><section id="wf-editor" class="card" hidden><h2 id="wf-title"></h2><p id="wf-request-reminder" class="hint"></p><div id="wf-answer-constraints"></div><form id="wf-form"><input type="hidden" name="to"><input type="hidden" name="parent"><div class="supply-form-grid"><label>Quantité<input type="number" name="quantity" min="1" max="120" required></label><label>Livraison à<input type="time" name="delivery" min="13:00" max="22:00" required></label><label id="wf-price">Prix par unité (€)<input type="number" name="price" min="0" max="100" step="0.01"></label></div><fieldset id="wf-transport"><legend>Choisissez le transport</legend><div id="wf-transport-options" class="transport-options"></div></fieldset><div id="wf-check-result" role="status" aria-live="polite"></div><details><summary>Ajouter un commentaire</summary><label>Commentaire facultatif<textarea name="text" maxlength="1200" rows="2"></textarea></label></details><div class="actions"><button class="btn primary" id="wf-submit">Envoyer</button><button class="btn secondary" type="button" id="wf-cancel">Retour</button></div></form></section><details class="card" id="wf-more"><summary>Mes ressources et l’historique</summary><div id="wf-resources"></div><h3>Mes engagements</h3><div id="wf-order-list"></div><h3>Les échanges en cours</h3><div id="wf-pending"></div><h3>Les demandes reçues</h3><div id="wf-request-list"></div><div id="wf-extra-actions" class="actions"></div><details><summary>Le plan du groupe</summary><div id="wf-metrics"></div></details><details><summary>Toutes les informations de l’animateur</summary><div id="wf-events"></div></details></details><details class="card" id="wf-chat"><summary>Échanger un message · avec ou sans IA</summary><form id="compose"><label>À qui ?<select name="to">${s.roles.filter(r=>r.id!==s.role).map(r=>`<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select></label><label>Message ou consigne pour l’IA<textarea name="text" maxlength="1200" rows="3" required></textarea></label><div class="actions"><button type="button" class="btn secondary" id="manual">Rédiger sans IA</button><button type="button" class="btn secondary" id="assist">Préparer avec IA</button></div><p id="ai-status" class="hint"></p><p class="hint">L’IA prépare un texte à relire. Votre demande et le contexte de votre équipe sont transmis à OpenAI uniquement sur ce bouton.</p><label><input name="confirm" type="checkbox" required> J’ai relu ce message.</label><button class="btn primary">${s.isCaptain?'Envoyer le message':'Proposer à mon capitaine'}</button></form><div id="wf-comments"></div></details>`;
 $('#wf-cancel').onclick=()=>{clearTimeout(checkTimer);checkSequence++;checking=false;$('#wf-editor').hidden=true;$('#wf-focus').hidden=false;$('#wf-quick-constraints').hidden=false;notice('');};
 $('#wf-form').oninput=()=>scheduleCheck();
 $('#wf-form').onsubmit=async e=>{e.preventDefault();if(checking)return;const b=body();if(mode==='quote'&&checked!==signature(b)&&!await checkOffer())return;const ok=await actions.send(state.isCaptain?mode:'proposal',state.isCaptain?b:{...b,documentAction:mode});if(ok){clearTimeout(checkTimer);checkSequence++;checking=false;$('#wf-editor').hidden=true;$('#wf-focus').hidden=false;$('#wf-quick-constraints').hidden=false;checked='';}};
 $('#compose').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);if(await actions.send(state.isCaptain?'message':'proposal',{type:'note',to:f.get('to'),text:f.get('text')}))e.target.reset();};
 $('#assist').onclick=actions.assist;$('#manual').onclick=()=>{$('#compose textarea').focus();$('#ai-status').textContent='Rédigez votre message, puis relisez-le.';};
 }
 $('#wf-quick-constraints').innerHTML=constraintPanel(s,{compact:true});
 if(!$('#wf-editor').hidden){
 $('#wf-answer-constraints').innerHTML=constraintPanel(s,{replacesId});
 const transportSignature=JSON.stringify(s.inventory?.transportOptions||[]);
 if(s.role==='ops'&&transportSignature!==lastTransportSignature){const selected=body().transport;$('#wf-transport-options').innerHTML=transportChoices(s,selected);lastTransportSignature=transportSignature;}
 }
 const constraintSignature=JSON.stringify([s.inventory,s.inputs,s.spending,s.budget,s.assessment]);
 if(lastConstraintSignature&&constraintSignature!==lastConstraintSignature&&!$('#wf-editor').hidden&&mode==='quote'&&!checking)scheduleCheck();
 lastConstraintSignature=constraintSignature;
 const task=nextTask(s);
 const focusHtml=`<div class="eyebrow">${task.kind==='wait'?(task.complete?'Votre étape est terminée':'En attente'):'À vous de jouer'}</div>${task.waitingOn?.length?`<p class="workflow-wait-owner">⏳ En attente de : <strong>${esc(task.waitingOn.map(r=>waitName(s,r)).join(' · '))}</strong></p>`:''}<h2>${esc(task.title)}</h2><p>${esc(task.text)}</p>${task.next?`<p class="workflow-then"><strong>Ensuite :</strong> ${esc(task.next)}</p>`:''}${task.waitingOn?.length?'<p class="workflow-auto-update">Cette page se met à jour automatiquement.</p>':''}${task.button?`<button class="btn primary workflow-main-action" id="wf-next">${esc(task.button)}</button>`:''}${task.otherTarget?`<button class="btn secondary" id="wf-other">Consulter ${esc(teamName(s,task.otherTarget))}</button>`:''}${task.kind==='accept'?`<button class="text-btn" id="wf-refuse">Demander une autre solution</button>`:''}`;
 if(lastFocusHtml!==focusHtml){$('#wf-focus').innerHTML=focusHtml;lastFocusHtml=focusHtml;}
 $('#wf-focus').classList.toggle('workflow-waiting',!!task.waitingOn?.length);
 $('#wf-next')?.addEventListener('click',()=>executeTask(nextTask(state)));
 $('#wf-other')?.addEventListener('click',()=>openForm('request',task.doc,task.otherTarget));
 $('#wf-refuse')?.addEventListener('click',()=>actions.send('reject',{id:task.doc.id}));
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
 $('#assist').disabled=!s.aiEnabled||!s.aiReady||s.aiUsed>=s.aiLimit||s.phase!=='running';updateSubmit();
}
