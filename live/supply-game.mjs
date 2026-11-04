import {financeImpact} from './supply-finance.mjs';
export const ROLES=[
 {id:'client',name:'Client',mission:'Obtenir 80 coffrets avant 19 h. Accepter ou renégocier la promesse.'},
 {id:'planning',name:'Planification',mission:'Donner le rythme : solliciter et relancer les équipes, confirmer le plan et faire accepter la promesse client.'},
 {id:'buying',name:'Achats',mission:'Consulter les fournisseurs, négocier et accepter leurs offres.'},
 {id:'supplierA',name:'Fournisseur A',mission:'Répondre aux consultations en respectant votre prix minimum, votre stock et votre délai.'},
 {id:'supplierB',name:'Fournisseur B',mission:'Négocier une alternative en tenant compte du stock, des matières et de la fabrication.'},
 {id:'ops',name:'Opérations / livraison',mission:'Confirmer la préparation, la qualité et le transport ; alerter sur les risques.'}
];
export const EVENTS=[
 {id:'vehicleCapacity',label:'Transport normal : capacité limitée à 60 coffrets',target:'ops'},
 {id:'stockA',label:'Fournisseur A : perte de 10 composants en stock',target:'supplierA'},
 {id:'productionA',label:'Fournisseur A : cadence de fabrication divisée par 2',target:'supplierA'},
 {id:'packaging',label:'Opérations : 20 emballages inutilisables',target:'ops'},
 {id:'restockPackaging',label:'Opérations : réception de 20 emballages supplémentaires',target:'ops'},
 {id:'delayA',label:'Fournisseur A : livraison retardée de 2 h',target:'supplierA'},
 {id:'shortB',label:'Fournisseur B : capacité limitée à 30 unités',target:'supplierB'},
 {id:'quality',label:'Qualité : 20 composants inutilisables',target:'ops'},
 {id:'capacity',label:'Préparation : capacité limitée à 60 coffrets',target:'ops'},
 {id:'road',label:'Transport : trajet rallongé de 90 min',target:'ops'},
 {id:'demand',label:'Client : 10 coffrets supplémentaires',target:'client'}
];
export const LIMITS={
 all:[{id:'budget',label:'Budget maximal',kind:'money',min:0,max:10000000},{id:'demand',label:'Quantité demandée par le client',min:1,max:120},{id:'deadline',label:'Heure promise au client',kind:'time',min:780,max:1439}],
 supplier:[{id:'stock',label:'Stock prêt à livrer',min:0,max:120},{id:'rawStock',label:'Matières premières disponibles',min:0,max:120},{id:'productionCapacity',label:'Capacité maximale de fabrication',min:0,max:120},{id:'productionRate',label:'Cadence de fabrication (unités / h)',min:1,max:240},{id:'productionStart',label:'Début de fabrication',kind:'time',min:0,max:1439},{id:'capacity',label:'Quantité totale maximale',min:0,max:120},{id:'transit',label:'Transport fournisseur (minutes)',min:0,max:360},{id:'earliest',label:'Première livraison possible',kind:'time',min:780,max:1439},{id:'minPrice',label:'Prix plancher par composant',kind:'money',min:0,max:10000}],
 ops:[{id:'normalCapacity',label:'Capacité de transport normal (coffrets)',min:0,max:120},{id:'expressCapacity',label:'Capacité de transport express (coffrets)',min:0,max:120},{id:'normalCost',label:'Coût du transport normal',kind:'money',min:0,max:1000000},{id:'expressCost',label:'Coût du transport express',kind:'money',min:0,max:1000000},{id:'expressTravel',label:'Durée du transport express (minutes)',min:0,max:360},{id:'packagingStock',label:'Stock d’emballages',min:0,max:240},{id:'capacity',label:'Capacité maximale de préparation',min:0,max:120},{id:'rate',label:'Cadence de préparation (coffrets / h)',min:1,max:240},{id:'travel',label:'Durée du transport normal (minutes)',min:0,max:360},{id:'quarantine',label:'Composants bloqués par la qualité',min:0,max:120},{id:'minPrice',label:'Prix plancher de préparation',kind:'money',min:0,max:10000}]
};
export function limitValue(g,target,field){if(target==='ops'&&g.workflow===2&&g.resources.ops[field]===undefined){const normal=transportOption(g,'normal'),express=transportOption(g,'express');const values={normalCapacity:normal.capacity,expressCapacity:express.capacity,normalCost:normal.cost,expressCost:express.cost,expressTravel:express.duration};if(field in values)return values[field];}return target==='all'?(field==='deadline'?g.promise.delivery:g[field]):g.resources[target]?.[field];}
export function applyLimit(g,{target,field,value,reason=''}){
 const schema=LIMITS[target==='all'?'all':['supplierA','supplierB'].includes(target)?'supplier':target==='ops'?'ops':'']?.find(x=>x.id===field);
 if(!schema||!Number.isInteger(value)||value<schema.min||value>schema.max)fail('Choisissez une limite autorisée et une valeur dans la plage indiquée.');
 const before=limitValue(g,target,field);if(before===undefined)fail('Cette limite nécessite une nouvelle séance avec les règles de stock et de fabrication.');
 const note=String(reason).trim();if(note.length>400)fail('Le motif doit tenir en 400 caractères.');
 const format=n=>schema.kind==='money'?money(n):schema.kind==='time'?clock(n):String(n);
 const label=`${schema.label} : ${format(before)} → ${format(value)}${note?' · '+note:''}`;
 if(target==='all'){if(field==='deadline')g.promise.delivery=value;else g[field]=value;}else g.resources[target][field]=value;
 const recipient=target==='all'?(field==='budget'?'all':'client'):target;
 g.events.push({id:crypto.randomUUID(),event:'limit',text:label,target:recipient,at:Date.now(),round:g.round,informational:false});
 log(g,'animateur',`Limite → ${ROLES.find(r=>r.id===recipient)?.name||'Toutes les équipes'} : ${label}`);g.log.at(-1).target=recipient;
}
export const clock=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
export const money=n=>`${(n/100).toLocaleString('fr-FR',{maximumFractionDigits:2})} €`;
export function initialGame(code,workflow=2){return {code,workflow,documents:workflow===2?[{id:"NEED-1",ref:"BES-001",type:"request",kind:"need",from:"client",to:"planning",quantity:80,delivery:1140,unitPrice:0,text:"Préparer 80 coffrets pour la soirée Beaujolais.",status:"open",at:Date.now(),round:1}]:[],game:'supply',created:Date.now(),expires:Date.now()+172800000,phase:'waiting',round:1,revision:0,players:{},messages:[],proposals:[],events:[],log:[],aiEnabled:false,aiLimit:3,aiUsed:{},aiTickets:{},drafts:{},demand:80,budget:200000,promise:{quantity:80,delivery:1140},resources:{supplierA:{capacity:60,minPrice:1000,earliest:840,stock:20,rawStock:40,productionCapacity:40,productionRate:40,productionStart:780,transit:60},supplierB:{capacity:60,minPrice:1300,earliest:900,stock:20,rawStock:40,productionCapacity:40,productionRate:20,productionStart:840,transit:60},ops:{capacity:100,minPrice:500,rate:40,travel:60,quarantine:0,packagingStock:80,...(workflow===2?{normalCapacity:100,expressCapacity:80,normalCost:12000,expressCost:28000,expressTravel:30}:{})}},plan:null};}
export function members(g,id){return Object.values(g.players).filter(p=>p.role===id);}
export function captain(g,p){return p.role&&(g.captains?.[p.role]||members(g,p.role)[0]?.id)===p.id;}
export function log(g,who,text){g.log.push({at:Date.now(),round:g.round,who,text});g.log=g.log.slice(-250);g.revision++;}
export function accepted(g,from){return (g.workflow===2?g.documents:g.messages).filter(m=>m.type==='offer'&&m.status==='accepted'&&(!from||m.from===from));}
// Les séances déjà ouvertes gardent leurs règles ; les nouvelles portent le détail industriel.
export function supplierCapacity(r){return r.stock===undefined?r.capacity:Math.min(r.capacity,r.stock+Math.min(r.rawStock,r.productionCapacity));}
export function supplierDelivery(r,quantity){
 if(r.stock===undefined||quantity<=r.stock)return r.earliest;
 return Math.max(r.earliest,r.productionStart+Math.ceil((quantity-r.stock)/r.productionRate*60)+r.transit);
}
export function supplierProduction(r,earlier,m){
 let booked=0,finish=r.productionStart;
 for(const d of [...earlier].sort((a,b)=>(a.acceptedAt||a.at||0)-(b.acceptedAt||b.at||0)||String(a.orderRef).localeCompare(String(b.orderRef)))){
  const made=Math.max(0,booked+d.quantity-r.stock)-Math.max(0,booked-r.stock),start=Math.max(finish,r.productionStart,d.productionStart??r.productionStart);
  if(made)finish=start+Math.ceil(made/r.productionRate*60);booked+=d.quantity;
 }
 const stockUsed=Math.min(m.quantity,Math.max(0,r.stock-booked)),toManufacture=m.quantity-stockUsed,from=Math.max(finish,r.productionStart,m.productionStart??r.productionStart),duration=Math.ceil(toManufacture/r.productionRate*60),until=from+duration;
 const dispatch=toManufacture?until:m.productionStart??(r.earliest-r.transit),earliestDelivery=Math.max(r.earliest,dispatch+r.transit);
 return {stockUsed,toManufacture,from,until,duration,transportMinutes:r.transit,earliestDelivery};
}
export function nextSupplierDelivery(g,role,quantity,replacesId=''){
 const earlier=accepted(g,role).filter(d=>d.id!==replacesId);
 return supplierProduction(g.resources[role],earlier,{quantity,productionStart:g.productionWindows?.[role]?.start}).earliestDelivery;
}
export function supplierStatus(g,id){const r=g.resources[id],booked=accepted(g,id).reduce((n,o)=>n+o.quantity,0),stockBooked=Math.min(booked,r.stock||0);
 return {capacity:supplierCapacity(r),booked,remaining:Math.max(0,supplierCapacity(r)-booked),stockRemaining:r.stock===undefined?null:Math.max(0,r.stock-stockBooked),productionBooked:r.stock===undefined?null:Math.max(0,booked-r.stock),delivery:supplierDelivery(r,booked)};
}
export function transportOption(g,mode='normal'){
 const r=g.resources.ops,express=mode==='express';return {mode:express?'express':'normal',capacity:express?(r.expressCapacity??(g.workflow===2?80:120)):(r.normalCapacity??(g.workflow===2?100:120)),cost:express?(r.expressCost??28000):(r.normalCost??12000),duration:express?(r.expressTravel??Math.max(0,r.travel-30)):r.travel};
}
function operationResources(g){const normal=transportOption(g,'normal'),express=transportOption(g,'express');return {...g.resources.ops,normalCapacity:normal.capacity,expressCapacity:express.capacity,normalCost:normal.cost,expressCost:express.cost,expressTravel:express.duration,booked:accepted(g,'ops').reduce((n,d)=>n+d.quantity,0),transportOptions:[normal,express]};}
export function budgetProjection(g){
 const operation=accepted(g,'ops').at(-1),quantity=g.plan?.quantity||operation?.quantity||g.demand;
 const choices=['normal','express'].map(mode=>transportOption(g,mode));
 const mode=g.plan?.transport||operation?.transport||choices.filter(x=>x.capacity>=quantity).sort((a,b)=>a.cost-b.cost)[0]?.mode||'normal',transport=transportOption(g,mode);
 const purchases=accepted(g).filter(d=>['supplierA','supplierB'].includes(d.from)).reduce((n,d)=>n+d.quantity*d.unitPrice,0),preparation=quantity*(operation?.unitPrice??g.resources.ops.minPrice),total=purchases+preparation+transport.cost;
 return {purchases,preparation,transport:transport.cost,transportMode:mode,quantity,total,remaining:g.budget-total,estimated:!g.plan};
}
export function assess(g,plan=g.plan){
 const suppliers=['supplierA','supplierB'].flatMap(id=>{const offers=accepted(g,id);return offers.length?[{quantity:Math.min(supplierCapacity(g.resources[id]),offers.reduce((n,o)=>n+o.quantity,0)),delivery:Math.max(supplierDelivery(g.resources[id],Math.min(supplierCapacity(g.resources[id]),offers.reduce((n,o)=>n+o.quantity,0))),...offers.map(o=>o.delivery)),cost:offers.reduce((n,o)=>n+o.quantity*o.unitPrice,0)}]:[];});
 const supply=Math.max(0,suppliers.reduce((n,o)=>n+o.quantity,0)-g.resources.ops.quarantine);
 const operation=accepted(g,'ops').at(-1),q=plan?.quantity||0;
 const shipping=transportOption(g,plan?.transport||operation?.transport||'normal');
 const available=Math.min(supply,g.resources.ops.capacity,g.resources.ops.packagingStock??Infinity,operation?.quantity||0,shipping.capacity);
 const ready=suppliers.length?Math.max(...suppliers.map(o=>o.delivery))+Math.ceil(q/g.resources.ops.rate*60):null;
 const arrival=!plan||ready===null?null:Math.max(operation?.delivery||0,ready+shipping.duration);
 const cost=suppliers.reduce((n,o)=>n+o.cost,0)+q*(operation?.unitPrice||0)+(plan?shipping.cost:0);
 const reasons=[];if(!q)reasons.push('La planification n’a pas encore confirmé de plan.');
 if(q>available)reasons.push('Les engagements, stocks et capacités ne couvrent pas la quantité du plan.');
 if(q>(g.resources.ops.packagingStock??Infinity))reasons.push('Le stock d’emballages ne couvre pas la quantité du plan.');
 if(q>shipping.capacity)reasons.push('La capacité du transport choisi ne couvre pas la quantité du plan.');
 if(cost>g.budget)reasons.push('Le budget est dépassé.');
 if(arrival===null||arrival>g.promise.delivery)reasons.push('L’arrivée avant l’heure promise n’est pas assurée.');
 if(q<g.promise.quantity)reasons.push('La quantité promise au client n’est pas couverte.');
 if(g.workflow===2&&q){const sourcing=accepted(g,'buying').at(-1),operation=accepted(g,'ops').at(-1);if(!sourcing||sourcing.quantity<q)reasons.push('L’engagement Achats ne couvre pas le plan.');if(sourcing&&sourcing.delivery>Math.min(operation?.delivery||1439,g.promise.delivery))reasons.push('L’engagement Achats est trop tardif.');if(sourcing&&!workflowHealth(g,sourcing).ok)reasons.push('L’engagement Achats est à risque : faites-le réviser.');if(operation&&!workflowHealth(g,operation).ok)reasons.push('L’engagement Opérations est à risque : faites-le réviser.');if(operation&&operation.transport!==plan.transport)reasons.push('Le transport diffère de l’engagement Opérations.');if([sourcing,operation].filter(Boolean).some(d=>d.dependencyIds?.some(id=>!accepted(g).some(a=>a.id===id))))reasons.push('Un engagement amont a changé : faites reconfirmer les engagements dépendants.');}
 return {quantity:q,available,arrival,cost,budget:g.budget,valid:reasons.length===0,reasons,originalDemand:g.demand,promise:g.promise,coverage:Math.min(q,available)};
}
export function teamBrief(g,role){const r=g.resources[role];if(role==='supplierA'||role==='supplierB'){
 const s=supplierStatus(g,role);
 if(r.stock===undefined)return `Capacité totale : ${r.capacity} composants. Prix minimum : ${money(r.minPrice)} par composant. Livraison au plus tôt : ${clock(r.earliest)}. Offres acceptées : ${s.booked} composants. Ces limites sont confidentielles à votre équipe.`;
 return `Stock prêt à livrer, avant réservations : ${r.stock} composants ; encore non engagé : ${s.stockRemaining}. Matières premières : ${r.rawStock}, soit au plus ${Math.min(r.rawStock,r.productionCapacity)} composants à fabriquer. Capacité de fabrication : ${r.productionCapacity} composants ; cadence : ${r.productionRate}/h à partir de ${clock(g.productionWindows?.[role]?.start??r.productionStart)}. Transport : ${r.transit} min ; première livraison possible : ${clock(r.earliest)}. Pour un volume dépassant le stock, fabrication avant transport. Engagements : ${s.booked}, dont ${s.productionBooked} à fabriquer. Quantité supplémentaire possible : ${s.remaining}. Prix minimum : ${money(r.minPrice)} par composant. Ces limites sont confidentielles à votre équipe.`;
 }
 if(role==='ops')return `Capacité : ${r.capacity} coffrets.${r.packagingStock===undefined?'':` Stock d’emballages : ${r.packagingStock} ; un emballage nécessaire par coffret.`} Cadence : ${r.rate} coffrets/heure après réception de tous les composants. Prix de préparation minimum : ${money(r.minPrice)} par coffret. Transport normal : ${transportOption(g,'normal').duration} min, ${money(transportOption(g,'normal').cost)}, au plus ${transportOption(g,'normal').capacity} coffrets. Express : ${transportOption(g,'express').duration} min, ${money(transportOption(g,'express').cost)}, au plus ${transportOption(g,'express').capacity} coffrets. Composants bloqués par la qualité : ${r.quarantine}. Communiquez les impacts aux autres équipes.`;
 if(role==='buying')return 'Un composant acheté permet de préparer un coffret. Consultez les deux fournisseurs sur le prix, le stock disponible et les délais des quantités à fabriquer. Un stock déjà engagé ne peut pas être vendu une seconde fois. Vous seul acceptez leurs offres. Les achats acceptés consomment le budget même si tous les composants ne sont pas utilisés.';
 if(role==='planning')return 'Vous donnez le rythme : lancez la demande aux Achats et relancez-les si nécessaire. Acceptez leurs approvisionnements, puis sollicitez la Livraison. Après acceptation de son offre, confirmez le plan et proposez la promesse au Client. Vérifiez qu’il l’a acceptée avant la fin réelle du jeu. Le site contrôle le coût et les capacités.';
 return `Besoin actuel : ${g.demand} coffrets. Budget total maximal : ${money(g.budget)}. Promesse actuelle : ${g.promise.quantity} coffrets avant ${clock(g.promise.delivery)}. Vous seul acceptez une nouvelle promesse proposée par la planification.`;}
export function view(g,p,admin=false,ready=false){
 const role=p?.role||'',team=ROLES.find(r=>r.id===role);
 return {game:'supply',workflow:g.workflow||1,inputs:g.workflow===2&&role==='ops'?workflowInputs(g):null,documents:g.workflow===2?g.documents.filter(d=>admin||d.from===role||d.to===role).map(d=>({...d,requestRef:g.documents.find(x=>x.id===d.requestId)?.ref,parentRef:g.documents.find(x=>x.id===d.parentId)?.ref,replacesRef:g.documents.find(x=>x.id===d.replacesId)?.orderRef,health:d.type==='offer'&&d.status==='accepted'?workflowHealth(g,d):null,...(!admin&&role&&d.type==='offer'&&d.status==='pending'&&d.round===g.round&&(d.from===role||d.to===role)?{financeImpact:financeImpact(g,role,d)}:{})})):[],code:g.code,phase:g.phase,round:g.round,revision:g.revision,expires:g.expires,joined:!!p,playerId:p?.id,role,isCaptain:p?captain(g,p):false,team,brief:role?teamBrief(g,role):null,
 roles:ROLES.map(r=>({...r,members:members(g,r.id).map((x,i)=>({id:x.id,captain:(g.captains?.[r.id]||members(g,r.id)[0]?.id)===x.id})),count:members(g,r.id).length})),participants:Object.keys(g.players).length,
 demand:g.demand,budget:g.budget,promise:g.promise,plan:g.plan,assessment:assess(g),aiEnabled:g.aiEnabled,aiReady:ready,aiLimit:g.aiLimit,aiUsed:admin?g.aiUsed:(g.aiUsed[role]||0),
 messages:g.messages.filter(m=>admin||m.from===role||m.to===role),proposals:g.proposals.filter(m=>admin||m.from===role),events:g.events.filter(e=>admin||e.target==='all'||e.target===role),
 ...(admin?{budgetDetails:budgetProjection(g),limitSchema:LIMITS,resources:{...g.resources,ops:g.workflow===2?operationResources(g):g.resources.ops},resourceBriefs:Object.fromEntries(['supplierA','supplierB','ops'].map(id=>[id,teamBrief(g,id)])),log:g.log,aiCounts:Object.fromEntries(ROLES.map(r=>[r.id,g.log.filter(e=>e.who===r.id&&e.kind==='ai').length])),aiDrafts:Object.entries(g.drafts).map(([player,d])=>({playerId:player,role:Object.values(g.players).find(p=>p.id===player)?.role||'',text:d.text,at:d.at}))}:{}),
 spending:role==='buying'?{available:Math.max(0,budgetProjection(g).remaining),overBudget:budgetProjection(g).remaining<0}:null,
 inventory:['supplierA','supplierB'].includes(role)&&g.resources[role].stock!==undefined?{...g.resources[role],...supplierStatus(g,role),productionWindow:g.productionWindows?.[role]||null}:role==='ops'&&g.resources.ops.packagingStock!==undefined?operationResources(g):null,
 draft:p?g.drafts[p.id]||null:null};
}
function fail(message,status=400){const e=Error(message);e.status=status;throw e;}
export function messageFields(g,p,b){
 const to=String(b.to||'');if(!ROLES.some(r=>r.id===to)||to===p.role)fail('Choisissez une autre équipe destinataire.');
 const type=['request','offer','note'].includes(b.type)?b.type:'note';
 const text=String(b.text||'').trim();if(!text||text.length>1200)fail('Rédigez un message de 1 à 1 200 caractères.');
 const m={id:crypto.randomUUID(),from:p.role,to,type,text,at:Date.now(),round:g.round,status:'sent',quantity:null,unitPrice:null,delivery:null,ai:!!b.aiTicket&&g.aiTickets[b.aiTicket]?.player===p.id&&g.aiTickets[b.aiTicket]?.status==='ready'};
 if(type==='offer'){
  if(!((['supplierA','supplierB'].includes(p.role)&&to==='buying')||(p.role==='ops'&&to==='planning')||(p.role==='planning'&&to==='client')))fail('Les offres circulent des fournisseurs aux achats, des opérations à la planification, puis de la planification au client.');
  if(!Number.isInteger(b.quantity)||b.quantity<1||b.quantity>120||!Number.isInteger(b.unitPrice)||b.unitPrice<0||b.unitPrice>10000||!Number.isInteger(b.delivery)||b.delivery<780||b.delivery>1439)fail('Vérifiez la quantité, le prix unitaire et l’heure de livraison (13 h à 23 h 59).');
  Object.assign(m,{quantity:b.quantity,unitPrice:b.unitPrice,delivery:b.delivery,status:'pending'});
  validateOffer(g,m);
 }
 return m;
}
export function validateOffer(g,m){
 const r=g.resources[m.from];if(r){const booked=accepted(g,m.from).reduce((n,o)=>n+o.quantity,0);if(m.from!=='ops'){
 if(booked+m.quantity>supplierCapacity(r))fail('Le stock et la fabrication disponibles ne couvrent pas cette offre en plus des engagements acceptés.');
 const earliest=supplierDelivery(r,booked+m.quantity);
 if(m.delivery<earliest)fail(`Fabrication et transport : livraison possible à partir de ${clock(earliest)} pour ce volume engagé.`);
 }else if(m.quantity>(r.packagingStock??Infinity))fail('Le stock d’emballages ne permet pas de préparer cette quantité.');
 if(m.quantity>r.capacity||m.unitPrice<r.minPrice||m.delivery<(r.earliest||780))fail('Cette offre ne respecte pas les limites actuelles de votre équipe.');}
}
export function applyEvent(g,id,text,target){const e=EVENTS.find(x=>x.id===id);if(id!=='custom'&&!e)fail('Contrainte inconnue.');
 if(id==='stockA'){if(g.resources.supplierA.stock===undefined)fail('Cette ancienne séance ne détaille pas les stocks. Créez une nouvelle séance.');g.resources.supplierA.stock=Math.max(0,g.resources.supplierA.stock-10);}
 if(id==='productionA'){if(!g.resources.supplierA.productionRate)fail('Cette ancienne séance ne détaille pas la fabrication. Créez une nouvelle séance.');g.resources.supplierA.productionRate=Math.max(1,Math.floor(g.resources.supplierA.productionRate/2));}
 if(id==='packaging'||id==='restockPackaging'){if(g.resources.ops.packagingStock===undefined)fail('Cette ancienne séance ne détaille pas les stocks. Créez une nouvelle séance.');g.resources.ops.packagingStock=Math.max(0,g.resources.ops.packagingStock+(id==='packaging'?-20:20));}
 if(id==='delayA')g.resources.supplierA.earliest+=120;
 if(id==='shortB')g.resources.supplierB.capacity=30;
 if(id==='quality')g.resources.ops.quarantine+=20;
 if(id==='capacity')g.resources.ops.capacity=60;
 if(id==='vehicleCapacity')g.resources.ops.normalCapacity=60;
 if(id==='road'){g.resources.ops.travel+=90;if(g.resources.ops.expressTravel!==undefined)g.resources.ops.expressTravel+=90;}
 if(id==='demand')g.demand+=10;
 const t=e?.target||target||'all';if(t!=='all'&&!ROLES.some(r=>r.id===t))fail('Équipe cible inconnue.');
 const label=e?.label||String(text||'').trim();if(!label||label.length>600)fail('Décrivez la contrainte en 600 caractères maximum.');
 g.events.push({id:crypto.randomUUID(),event:id,text:label,target:t,at:Date.now(),round:g.round,informational:id==='custom'});log(g,'animateur',`Contrainte → ${t} : ${label}`);g.log.at(-1).target=t;
}
export function act(g,p,op,b){
 if(!p?.role)fail('Choisissez votre équipe avant de jouer.',403);
 if(g.phase!=='running')fail('L’animateur doit ouvrir ou reprendre le jeu.',409);
 if(g.workflow===2&&op==='proposal'&&['request','quote'].includes(b.documentAction)){
 if(g.proposals.length>=180)fail('Limite de propositions atteinte.',409);
 const payload={...b};delete payload.proposalId;
 if(b.documentAction==='quote')workflowCandidate(g,p,b);
 g.proposals.push({id:crypto.randomUUID(),from:p.role,to:b.to||g.documents.find(d=>d.id===b.requestId)?.from,author:p.id,type:'note',text:String(b.text||'Proposition structurée'),documentAction:b.documentAction,payload,at:Date.now(),round:g.round,status:'proposed'});log(g,p.role,`Proposition structurée interne de ${p.id}`);return;
 }
 if(g.workflow===2&&op==='approve'){
 if(!captain(g,p))fail('Le capitaine confirme les engagements.',403);
 const proposal=g.proposals.find(d=>d.id===b.id&&d.from===p.role&&d.status==='proposed');if(!proposal?.documentAction)fail('Proposition indisponible.',409);
 workflowAct(g,p,proposal.documentAction,proposal.payload);proposal.status='sent';return;
 }
 if(g.workflow===2&&['request','quote','check','accept','reject','renegotiate','plan'].includes(op))return workflowAct(g,p,op,b);
 if(g.workflow===2&&['message','proposal'].includes(op)&&b.type!=='note')fail('Utilisez une demande structurée ou une réponse à une demande.');
 if(op==='proposal'){if(g.proposals.length>=180)fail('Limite de propositions atteinte.',409);const m=messageFields(g,p,b);g.proposals.push({...m,author:p.id,status:'proposed'});log(g,p.role,`Proposition interne du participant ${p.id}`);return;}
 if(!captain(g,p))fail('Le capitaine confirme les messages et les engagements de l’équipe.',403);
 if(op==='message'){
  if(g.messages.length>=240)fail('La séance a atteint sa limite de messages.',409);
  const proposal=b.proposalId?g.proposals.find(x=>x.id===b.proposalId&&x.from===p.role&&x.status==='proposed'):null;
  if(b.proposalId&&!proposal)fail('Cette proposition n’est plus disponible.',409);
  const m=proposal?messageFields(g,p,proposal):messageFields(g,p,b);if(proposal){m.ai=proposal.ai;proposal.status='sent';}
  g.messages.push(m);log(g,p.role,`${m.type==='offer'?'Offre':m.type==='request'?'Demande':'Message'} → ${m.to}${m.ai?' · avec aide IA':''}`);return;
 }
 if(op==='accept'||op==='reject'){
  const m=g.messages.find(m=>m.id===b.id&&m.to===p.role&&m.status==='pending');if(!m)fail('Offre introuvable ou déjà traitée.',409);
  if(op==='accept'){
   if(m.round!==g.round)fail('Offre expirée : demandez une nouvelle offre pour ce tour.',409);
   validateOffer(g,m);
   if(m.from==='ops'&&accepted(g,'ops').length)fail('Une offre Opérations est déjà retenue. Demandez à l’animateur de la libérer pour changer de plan.',409);
   if(m.from==='planning')g.promise={quantity:m.quantity,delivery:m.delivery};
  }
  m.status=op==='accept'?'accepted':'rejected';log(g,p.role,`${op==='accept'?'Acceptation':'Refus'} de l’offre de ${m.from} : ${m.quantity} unités`);return;
 }
 if(op==='plan'){
  if(p.role!=='planning')fail('La planification confirme le plan.',403);
  if(!Number.isInteger(b.quantity)||b.quantity<1||b.quantity>120||!['normal','express'].includes(b.transport))fail('Plan invalide.');
  g.plan={quantity:b.quantity,transport:b.transport,at:Date.now(),round:g.round};log(g,p.role,`Plan confirmé : ${b.quantity} coffrets, transport ${b.transport}`);return;
 }
 fail('Action inconnue.');
}

// Parcours structuré : une demande n'engage rien ; seule l'acceptation réserve.
const REQUEST_ROUTES={client:['planning'],planning:['buying','ops'],buying:['supplierA','supplierB']};
const supplierRole=r=>['supplierA','supplierB'].includes(r);
function workflowDoc(g,b){return g.documents.find(d=>d.id===b.id);}
function workflowSources(g){
 const rows=['supplierA','supplierB'].map(id=>{const orders=accepted(g,id);return {quantity:Math.min(supplierCapacity(g.resources[id]),orders.reduce((n,d)=>n+d.quantity,0)),delivery:orders.length?Math.max(supplierDelivery(g.resources[id],orders.reduce((n,d)=>n+d.quantity,0)),...orders.map(d=>d.delivery)):0,cost:orders.reduce((n,d)=>n+d.quantity*d.unitPrice,0)};});
 return {quantity:Math.max(0,rows.reduce((n,r)=>n+r.quantity,0)-g.resources.ops.quarantine),delivery:Math.max(...rows.map(r=>r.delivery)),cost:rows.reduce((n,r)=>n+r.cost,0)};
}
function workflowInputs(g){const sourcing=accepted(g,'buying').at(-1),source=workflowSources(g),quantity=Math.min(sourcing?.quantity||0,source.quantity),confirmed=!!sourcing&&workflowHealth(g,sourcing).ok,ready=confirmed&&quantity>0;return {ready,quantity:confirmed?quantity:0,waitingOn:ready?[]:!sourcing&&g.documents.some(d=>d.type==='offer'&&d.from==='buying'&&d.to==='planning'&&d.status==='pending'&&d.round===g.round)?['planning']:['buying']};}
function workflowBase(g,m){return m.replacesId?{...g,documents:g.documents.filter(d=>d.id!==m.replacesId)}:g;}
function workflowDependencies(g,role){return accepted(g).filter(d=>role==='buying'?supplierRole(d.from):role==='ops'?supplierRole(d.from)||d.from==='buying':role==='planning'?['buying','ops'].includes(d.from):false).map(d=>d.id);}
function workflowOfferReport(original,m,existing=false){
 const g=workflowBase(original,m),errors=[],warnings=[],q=m.quantity,r=g.resources[m.from];let available=0,earliest=null,cost=null;
 if(supplierRole(m.from)){
  const earlier=accepted(g,m.from).filter(d=>d.id!==m.id&&(!existing||((d.acceptedAt||d.at)<(m.acceptedAt||m.at)||((d.acceptedAt||d.at)===(m.acceptedAt||m.at)&&String(d.orderRef)<String(m.orderRef)))));
  const booked=earlier.reduce((n,d)=>n+d.quantity,0);available=Math.max(0,supplierCapacity(r)-booked);earliest=q<=available?supplierProduction(r,earlier,m).earliestDelivery:null;
  if(q>available)errors.push('Le stock libre, les matières et la capacité de fabrication ne couvrent pas cette quantité.');
  if(earliest!==null&&m.delivery<earliest)errors.push('La fabrication et le transport ne permettent pas cette heure de livraison.');
  if(!existing&&m.unitPrice<r.minPrice)errors.push('Le prix proposé est inférieur au prix plancher de votre équipe.');
  cost=budgetProjection(g).total+(existing?0:q*m.unitPrice);
 }else if(m.from==='buying'){
  const source=workflowSources(g);available=source.quantity;earliest=available>=q?source.delivery:null;cost=budgetProjection(g).total;
  if(q>available)errors.push('Les commandes fournisseurs confirmées ne couvrent pas la quantité annoncée.');
  if(earliest!==null&&m.delivery<earliest)errors.push('Les fournisseurs confirmés ne livrent pas assez tôt.');
 }else if(m.from==='ops'){
  const source=workflowSources(g),sourcing=accepted(g,'buying').at(-1),shipping=transportOption(g,m.transport);available=Math.min(source.quantity,sourcing?.quantity||0,r.capacity,r.packagingStock??Infinity,shipping.capacity);
  if(q>shipping.capacity)errors.push('La capacité du transport choisi ne permet pas cette quantité.');
  if(!sourcing||!workflowHealth(g,sourcing).ok)errors.push('Attendez la confirmation des approvisionnements par les Achats et la Planification.');
  cost=source.cost+q*m.unitPrice+shipping.cost;
  earliest=q<=available?source.delivery+Math.ceil(q/r.rate*60)+shipping.duration:null;
  if(q>available)errors.push('Les commandes fournisseurs, les emballages et la capacité de préparation ne couvrent pas cette quantité.');
  if(earliest!==null&&m.delivery<earliest)errors.push('La réception des composants, la préparation et le transport ne permettent pas cette heure.');
  if(!existing&&m.unitPrice<r.minPrice)errors.push('Le prix de préparation est inférieur au prix plancher de votre équipe.');
 }else if(m.from==='planning'){
  const sourcing=accepted(g,'buying').at(-1),operation=accepted(g,'ops').at(-1);available=Math.min(sourcing?.quantity||0,operation?.quantity||0);
  if(!g.plan||g.plan.quantity!==q)errors.push('Confirmez d’abord un plan de cette quantité, appuyé sur les engagements Achats et Opérations.');
  if(g.plan){const a=assess({...g,promise:{quantity:q,delivery:m.delivery}});earliest=a.arrival;cost=a.cost;errors.push(...a.reasons);}
 }
 if(cost!==null&&cost>g.budget)errors.push('Le budget maximal serait dépassé.');
 if(existing&&m.dependencyIds?.some(id=>!accepted(g).some(d=>d.id===id)))errors.push('Un engagement amont a été remplacé ou libéré : une reconfirmation est nécessaire.');
 const request=g.documents.find(d=>d.id===m.requestId);if(request&&m.delivery>request.delivery)warnings.push('L’heure proposée dépasse l’heure demandée : le destinataire devra accepter cette alternative.');
 if(request&&q>request.quantity)warnings.push('Volume supérieur à la demande : le destinataire doit accepter explicitement cette quantité.');
 if(request&&q<request.quantity)warnings.push('Réponse partielle : le reste du besoin devra être couvert par une autre offre.');
 return {ok:errors.length===0,reasons:[...new Set(errors)],warnings,available,earliest,cost};
}
export function workflowHealth(g,m){const r=workflowOfferReport(g,m,true);return {ok:r.ok,reasons:r.reasons};}
function workflowCandidate(g,p,b){
 const request=g.documents.find(d=>d.id===b.requestId&&d.type==='request'&&d.to===p.role);
 if(!request)fail('Sélectionnez une demande reçue par votre équipe.');
 const editId=String(b.editId||''),edited=editId?g.documents.find(d=>d.id===editId&&d.type==='offer'&&d.status==='pending'&&d.round===g.round&&d.from===p.role&&d.to===request.from&&d.requestId===request.id):null;
 if(editId&&!edited)fail('Cette offre a déjà été traitée ou ne vous appartient pas. Rechargez les échanges.',409);
 const replacesId=String(b.replacesId||edited?.replacesId||request.replacesId||'');
 if(edited&&replacesId!==String(edited.replacesId||''))fail('La modification doit conserver l’engagement à réviser.',409);
 if(replacesId){const old=g.documents.find(d=>d.id===replacesId&&d.type==='offer'&&d.status==='accepted'&&d.from===p.role&&d.to===request.from);if(!old)fail('L’engagement à réviser n’est plus actif.');}
 if(!replacesId&&['rejected','closed'].includes(request.status))fail('Cette demande est clôturée ou refusée.');
 const quantity=Number(b.quantity),delivery=Number(b.delivery),unitPrice=['buying','planning'].includes(p.role)?0:Number(b.unitPrice);
 if(!Number.isInteger(quantity)||quantity<1||quantity>(supplierRole(p.role)||p.role==='buying'?120:request.quantity)||!Number.isInteger(unitPrice)||unitPrice<0||unitPrice>10000||!Number.isInteger(delivery)||delivery<780||delivery>1439)fail('Vérifiez la quantité autorisée (1 à 120 pour les Fournisseurs et les Achats), le prix et l’heure (13 h à 23 h 59).');
 const transport=b.transport==='express'?'express':'normal';
 return {type:'offer',from:p.role,to:request.from,requestId:request.id,...(edited?{editedOfferId:edited.id}:{}),replacesId:replacesId||null,quantity,unitPrice,delivery,transport,...(supplierRole(p.role)&&g.productionWindows?.[p.role]?{productionStart:g.productionWindows[p.role].start}:{}),text:String(b.text||'').trim().slice(0,1200)};
}
export function workflowCheck(g,p,b){
 if(g.workflow!==2)fail('Créez une nouvelle séance pour utiliser le parcours structuré.');
 const m=workflowCandidate(g,p,b),base=workflowBase(g,m),report=workflowOfferReport(g,m),request=g.documents.find(d=>d.id===m.requestId);
 let feasibleQuantity=0;for(let quantity=1;quantity<=request.quantity;quantity++){if(workflowOfferReport(g,{...m,quantity,delivery:request.delivery}).ok)feasibleQuantity=quantity;}
 let fullEarliest=null;if(supplierRole(p.role)){const booked=accepted(base,p.role).reduce((n,d)=>n+d.quantity,0),r=base.resources[p.role];if(booked+request.quantity<=supplierCapacity(r))fullEarliest=workflowOfferReport(g,{...m,quantity:request.quantity}).earliest;}
 else {const full=workflowOfferReport(g,{...m,quantity:request.quantity});if(full.available>=request.quantity)fullEarliest=full.earliest;}
 let production=null;
 if(supplierRole(p.role)){
  const r=base.resources[p.role],earlier=accepted(base,p.role),booked=earlier.reduce((n,d)=>n+d.quantity,0),prior=Math.max(0,booked-r.stock);
  const schedule=supplierProduction(r,earlier,m);let maxAtSelectedTime=0;
  for(let quantity=1;quantity<=Math.max(0,supplierCapacity(r)-booked);quantity++)if(supplierProduction(r,earlier,{...m,quantity}).earliestDelivery<=m.delivery)maxAtSelectedTime=quantity;
  production={...schedule,maxAtSelectedTime,selectedDelivery:m.delivery,materialsRemaining:Math.max(0,r.rawStock-prior),productionRemaining:Math.max(0,r.productionCapacity-prior)};
 }
 return {...report,production,requestedQuantity:request.quantity,requestedDelivery:request.delivery,feasibleQuantityAtRequestedTime:feasibleQuantity,earliestForFullQuantity:fullEarliest};
}
function appendWorkflow(g,d){d.id=crypto.randomUUID();d.ref=(d.type==='request'?'DEM':'DEV')+'-'+String(g.documents.length+1).padStart(3,'0');d.at=Date.now();d.round=g.round;g.documents.push(d);return d;}
function workflowRequest(g,p,b){
 if(!(REQUEST_ROUTES[p.role]||[]).includes(b.to))fail('Cette demande doit suivre le circuit Client → Planification → Achats → Fournisseurs, ou Planification → Opérations.');
 const quantity=Number(b.quantity),delivery=Number(b.delivery);if(!Number.isInteger(quantity)||quantity<1||quantity>120||!Number.isInteger(delivery)||delivery<780||delivery>1439)fail('Indiquez une quantité de 1 à 120 et une heure entre 13 h et 23 h 59.');
 const parent=g.documents.find(d=>d.id===b.parentId&&d.type==='request'&&(d.to===p.role||d.id==='NEED-1'));
 if(p.role!=='client'&&!parent)fail('Reliez cette demande au besoin client ou à une demande reçue.');
 const d=appendWorkflow(g,{type:'request',kind:p.role==='client'?'need':b.to==='ops'?'service':'sourcing',from:p.role,to:b.to,parentId:parent?.id||null,quantity,delivery,unitPrice:0,text:String(b.text||'').trim().slice(0,1200),status:'open',replacesId:b.replacesId||null});
 if(p.role==='client'){g.demand=quantity;}
 log(g,p.role,`${d.ref} · Demande de ${quantity} unités avant ${clock(delivery)} → ${ROLES.find(r=>r.id===b.to)?.name}`);return d;
}
export function workflowAct(g,p,op,b){
 if(!captain(g,p))fail('Le capitaine confirme les demandes et les engagements de l’équipe.',403);
 if(['request','quote','renegotiate'].includes(op)&&g.documents.length>=240)fail('Limite de documents atteinte.',409);
 if(op==='request'){if(b.replacesId)fail('Utilisez l’action Renégocier sur l’engagement concerné.');workflowRequest(g,p,b);return;}
 if(op==='quote'){
  const m=workflowCandidate(g,p,b),report=workflowOfferReport(g,m);if(!report.ok)fail(report.reasons.join(' '),409);
  if(!m.replacesId){const covered=accepted(g).filter(d=>d.requestId===m.requestId).reduce((n,d)=>n+d.quantity,0);if(covered>=g.documents.find(d=>d.id===m.requestId).quantity||(!(supplierRole(p.role)||p.role==='buying')&&covered+m.quantity>g.documents.find(d=>d.id===m.requestId).quantity))fail('Les réponses déjà commandées couvrent cette demande.',409);}
  if(m.editedOfferId)g.documents.find(d=>d.id===m.editedOfferId).status='superseded';
  m.status='pending';m.dependencyIds=workflowDependencies(workflowBase(g,m),p.role);appendWorkflow(g,m);log(g,p.role,`${m.ref} · Proposition de ${m.quantity} unités à ${clock(m.delivery)}${m.replacesId?' · révision d’un engagement':''}`);return;
 }
 const m=workflowDoc(g,b);
 if(op==='renegotiate'){
  if(!m||m.type!=='offer'||m.status!=='accepted'||m.to!==p.role)fail('Choisissez un engagement accepté par votre équipe.');
  const parent=g.documents.find(d=>d.id===m.requestId);
  workflowRequest(g,p,{to:m.from,quantity:b.quantity??m.quantity,delivery:b.delivery??m.delivery,parentId:parent?.parentId||'NEED-1',replacesId:m.id,text:b.text||'Merci de proposer une révision de cet engagement.'});return;
 }
 if(op==='reject'){
  if(!m||m.to!==p.role||!['pending','open'].includes(m.status))fail('Document déjà traité ou inaccessible.',409);
  m.status='rejected';log(g,p.role,`${m.ref} · ${m.type==='offer'?'Offre':'Demande'} refusée`);return;
 }
 if(op==='accept'){
  if(!m||m.type!=='offer'||m.to!==p.role||m.status!=='pending')fail('Offre déjà traitée ou inaccessible.',409);
  if(m.round!==g.round)fail('Offre expirée : demandez une nouvelle proposition pour ce tour.',409);
  const originalRequest=g.documents.find(d=>d.id===m.requestId);
  if(!originalRequest||originalRequest.status==='rejected')fail('La demande a été refusée.',409);
  if(m.replacesId&&!g.documents.some(d=>d.id===m.replacesId&&d.status==='accepted'))fail('L’engagement remplacé n’est plus actif.',409);
  const base=workflowBase(g,m),report=workflowOfferReport(g,m);if(!report.ok)fail('Engagement impossible : '+report.reasons.join(' '),409);
  const covered=accepted(base).filter(d=>d.requestId===m.requestId).reduce((n,d)=>n+d.quantity,0);if(covered>=originalRequest.quantity||(!(supplierRole(m.from)||m.from==='buying')&&covered+m.quantity>originalRequest.quantity))fail('La demande est déjà couverte par un autre engagement.',409);
  if(['buying','ops','planning'].includes(m.from)&&accepted(base,m.from).length)fail('Un engagement est déjà actif pour cette équipe. Utilisez une révision pour le remplacer.',409);
  if(m.replacesId){g.documents.find(d=>d.id===m.replacesId).status='superseded';}
  m.status='accepted';m.acceptedAt=Date.now();m.orderRef='ENG-'+String(g.documents.filter(d=>d.acceptedAt).length).padStart(3,'0');m.dependencyIds=workflowDependencies(g,m.from);
  originalRequest.status=covered+m.quantity>=originalRequest.quantity?'closed':'partial';
  if(m.from==='planning')g.promise={quantity:m.quantity,delivery:m.delivery};
  log(g,p.role,`${m.orderRef} · ${m.ref} accepté : ${m.quantity} unités à ${clock(m.delivery)} · ressources réservées`);return;
 }
 if(op==='plan'){
  if(p.role!=='planning')fail('La planification confirme le plan.',403);
  if(!Number.isInteger(b.quantity)||b.quantity<1||b.quantity>120||!['normal','express'].includes(b.transport))fail('Plan invalide.');
  const sourcing=accepted(g,'buying').at(-1),operation=accepted(g,'ops').at(-1);
  if(!sourcing||!operation)fail('Faites confirmer les engagements Achats et Opérations avant le plan.',409);
  if(operation.transport!==b.transport)fail('Le transport doit correspondre à l’engagement Opérations. Demandez une révision.',409);
  const candidate={quantity:b.quantity,transport:b.transport},result=assess({...g,promise:{quantity:b.quantity,delivery:1439}},candidate);
  if(!result.valid)fail('Plan impossible : '+result.reasons.join(' '),409);
  g.plan={...candidate,at:Date.now(),round:g.round};log(g,p.role,`Plan confirmé : ${b.quantity} coffrets, transport ${b.transport}`);return;
 }
 fail('Action inconnue.');
}
