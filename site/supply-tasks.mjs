const time=n=>`${String(Math.floor(n/60)).padStart(2,"0")}:${String(n%60).padStart(2,"0")}`;
const euro=n=>(n/100).toLocaleString("fr-FR",{style:"currency",currency:"EUR"});
const teamName=(s,id)=>s.roles.find(r=>r.id===id)?.name||id;
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
