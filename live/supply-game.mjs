export const ROLES=[
 {id:'client',name:'Client',mission:'Obtenir 80 coffrets avant 19 h. Accepter ou renégocier la promesse.'},
 {id:'planning',name:'Planification',mission:'Coordonner les équipes, construire le plan et faire confirmer la promesse au client.'},
 {id:'buying',name:'Achats',mission:'Consulter les fournisseurs, négocier et accepter leurs offres.'},
 {id:'supplierA',name:'Fournisseur A',mission:'Répondre aux consultations en respectant votre prix minimum, votre stock et votre délai.'},
 {id:'supplierB',name:'Fournisseur B',mission:'Négocier une alternative en tenant compte du stock, des matières et de la fabrication.'},
 {id:'ops',name:'Opérations / livraison',mission:'Confirmer la préparation, la qualité et le transport ; alerter sur les risques.'}
];
export const EVENTS=[
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
 all:[{id:'budget',label:'Budget maximal',kind:'money',min:0,max:10000000},{id:'demand',label:'Quantité demandée par le client',min:1,max:120},{id:'deadline',label:'Heure promise au client',kind:'time',min:780,max:1320}],
 supplier:[{id:'stock',label:'Stock prêt à livrer',min:0,max:120},{id:'rawStock',label:'Matières premières disponibles',min:0,max:120},{id:'productionCapacity',label:'Capacité maximale de fabrication',min:0,max:120},{id:'productionRate',label:'Cadence de fabrication (unités / h)',min:1,max:240},{id:'productionStart',label:'Début de fabrication',kind:'time',min:0,max:1320},{id:'capacity',label:'Quantité totale maximale',min:0,max:120},{id:'transit',label:'Transport fournisseur (minutes)',min:0,max:360},{id:'earliest',label:'Première livraison possible',kind:'time',min:780,max:1320},{id:'minPrice',label:'Prix plancher par composant',kind:'money',min:0,max:10000}],
 ops:[{id:'packagingStock',label:'Stock d’emballages',min:0,max:240},{id:'capacity',label:'Capacité maximale de préparation',min:0,max:120},{id:'rate',label:'Cadence de préparation (coffrets / h)',min:1,max:240},{id:'travel',label:'Durée du transport normal (minutes)',min:0,max:360},{id:'quarantine',label:'Composants bloqués par la qualité',min:0,max:120},{id:'minPrice',label:'Prix plancher de préparation',kind:'money',min:0,max:10000}]
};
export function limitValue(g,target,field){return target==='all'?(field==='deadline'?g.promise.delivery:g[field]):g.resources[target]?.[field];}
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
 log(g,'animateur',`Limite → ${recipient} : ${label}`);
}
export const clock=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
export const money=n=>`${(n/100).toLocaleString('fr-FR',{maximumFractionDigits:2})} €`;
export function initialGame(code){return {code,game:'supply',created:Date.now(),expires:Date.now()+172800000,phase:'waiting',round:1,revision:0,players:{},messages:[],proposals:[],events:[],log:[],aiEnabled:false,aiLimit:3,aiUsed:{},aiTickets:{},drafts:{},demand:80,budget:200000,promise:{quantity:80,delivery:1140},resources:{supplierA:{capacity:60,minPrice:1000,earliest:840,stock:20,rawStock:40,productionCapacity:40,productionRate:40,productionStart:780,transit:60},supplierB:{capacity:60,minPrice:1300,earliest:900,stock:20,rawStock:40,productionCapacity:40,productionRate:20,productionStart:840,transit:60},ops:{capacity:100,minPrice:500,rate:40,travel:60,quarantine:0,packagingStock:80}},plan:null};}
export function members(g,id){return Object.values(g.players).filter(p=>p.role===id);}
export function captain(g,p){return p.role&&(g.captains?.[p.role]||members(g,p.role)[0]?.id)===p.id;}
export function log(g,who,text){g.log.push({at:Date.now(),round:g.round,who,text});g.log=g.log.slice(-250);g.revision++;}
export function accepted(g,from){return g.messages.filter(m=>m.type==='offer'&&m.status==='accepted'&&(!from||m.from===from));}
// Les séances déjà ouvertes gardent leurs règles ; les nouvelles portent le détail industriel.
export function supplierCapacity(r){return r.stock===undefined?r.capacity:Math.min(r.capacity,r.stock+Math.min(r.rawStock,r.productionCapacity));}
export function supplierDelivery(r,quantity){
 if(r.stock===undefined||quantity<=r.stock)return r.earliest;
 return Math.max(r.earliest,r.productionStart+Math.ceil((quantity-r.stock)/r.productionRate*60)+r.transit);
}
export function supplierStatus(g,id){const r=g.resources[id],booked=accepted(g,id).reduce((n,o)=>n+o.quantity,0),stockBooked=Math.min(booked,r.stock||0);
 return {capacity:supplierCapacity(r),booked,remaining:Math.max(0,supplierCapacity(r)-booked),stockRemaining:r.stock===undefined?null:Math.max(0,r.stock-stockBooked),productionBooked:r.stock===undefined?null:Math.max(0,booked-r.stock),delivery:supplierDelivery(r,booked)};
}
export function assess(g,plan=g.plan){
 const suppliers=['supplierA','supplierB'].flatMap(id=>{const offers=accepted(g,id);return offers.length?[{quantity:Math.min(supplierCapacity(g.resources[id]),offers.reduce((n,o)=>n+o.quantity,0)),delivery:Math.max(supplierDelivery(g.resources[id],Math.min(supplierCapacity(g.resources[id]),offers.reduce((n,o)=>n+o.quantity,0))),...offers.map(o=>o.delivery)),cost:offers.reduce((n,o)=>n+o.quantity*o.unitPrice,0)}]:[];});
 const supply=Math.max(0,suppliers.reduce((n,o)=>n+o.quantity,0)-g.resources.ops.quarantine);
 const operation=accepted(g,'ops').at(-1),q=plan?.quantity||0;
 const available=Math.min(supply,g.resources.ops.capacity,g.resources.ops.packagingStock??Infinity,operation?.quantity||0);
 const ready=suppliers.length?Math.max(...suppliers.map(o=>o.delivery))+Math.ceil(q/g.resources.ops.rate*60):null;
 const arrival=!plan||ready===null?null:Math.max(operation?.delivery||0,ready+Math.max(0,g.resources.ops.travel-(plan?.transport==='express'?30:0)));
 const cost=suppliers.reduce((n,o)=>n+o.cost,0)+q*(operation?.unitPrice||0)+(plan?12000+(plan.transport==='express'?16000:0):0);
 const reasons=[];if(!q)reasons.push('La planification n’a pas encore confirmé de plan.');
 if(q>available)reasons.push('Les engagements, stocks et capacités ne couvrent pas la quantité du plan.');
 if(q>(g.resources.ops.packagingStock??Infinity))reasons.push('Le stock d’emballages ne couvre pas la quantité du plan.');
 if(cost>g.budget)reasons.push('Le budget est dépassé.');
 if(arrival===null||arrival>g.promise.delivery)reasons.push('L’arrivée avant l’heure promise n’est pas assurée.');
 if(q<g.promise.quantity)reasons.push('La quantité promise au client n’est pas couverte.');
 return {quantity:q,available,arrival,cost,budget:g.budget,valid:reasons.length===0,reasons,originalDemand:g.demand,promise:g.promise,coverage:Math.min(q,available)};
}
export function teamBrief(g,role){const r=g.resources[role];if(role==='supplierA'||role==='supplierB'){
 const s=supplierStatus(g,role);
 if(r.stock===undefined)return `Capacité totale : ${r.capacity} composants. Prix minimum : ${money(r.minPrice)} par composant. Livraison au plus tôt : ${clock(r.earliest)}. Offres acceptées : ${s.booked} composants. Ces limites sont confidentielles à votre équipe.`;
 return `Stock prêt à livrer, avant réservations : ${r.stock} composants ; encore non engagé : ${s.stockRemaining}. Matières premières : ${r.rawStock}, soit au plus ${Math.min(r.rawStock,r.productionCapacity)} composants à fabriquer. Capacité de fabrication : ${r.productionCapacity} composants ; cadence : ${r.productionRate}/h à partir de ${clock(r.productionStart)}. Transport : ${r.transit} min ; première livraison possible : ${clock(r.earliest)}. Pour un volume dépassant le stock, fabrication avant transport. Engagements : ${s.booked}, dont ${s.productionBooked} à fabriquer. Quantité supplémentaire possible : ${s.remaining}. Prix minimum : ${money(r.minPrice)} par composant. Ces limites sont confidentielles à votre équipe.`;
 }
 if(role==='ops')return `Capacité : ${r.capacity} coffrets.${r.packagingStock===undefined?'':` Stock d’emballages : ${r.packagingStock} ; un emballage nécessaire par coffret.`} Cadence : ${r.rate} coffrets/heure après réception de tous les composants. Prix de préparation minimum : ${money(r.minPrice)} par coffret. Transport normal : ${r.travel} min et 120 €. Express : ${Math.max(0,r.travel-30)} min et 280 €. Composants bloqués par la qualité : ${r.quarantine}. Communiquez les impacts aux autres équipes.`;
 if(role==='buying')return 'Un composant acheté permet de préparer un coffret. Consultez les deux fournisseurs sur le prix, le stock disponible et les délais des quantités à fabriquer. Un stock déjà engagé ne peut pas être vendu une seconde fois. Vous seul acceptez leurs offres. Les achats acceptés consomment le budget même si tous les composants ne sont pas utilisés.';
 if(role==='planning')return 'Demandez aux achats leurs approvisionnements et aux opérations une offre de préparation/livraison. Acceptez l’offre Opérations, proposez une promesse au Client, puis confirmez un plan. Le site vérifie le coût et les capacités réels.';
 return `Besoin actuel : ${g.demand} coffrets. Budget total maximal : ${money(g.budget)}. Promesse actuelle : ${g.promise.quantity} coffrets avant ${clock(g.promise.delivery)}. Vous seul acceptez une nouvelle promesse proposée par la planification.`;}
export function view(g,p,admin=false,ready=false){
 const role=p?.role||'',team=ROLES.find(r=>r.id===role);
 return {game:'supply',code:g.code,phase:g.phase,round:g.round,revision:g.revision,expires:g.expires,joined:!!p,playerId:p?.id,role,isCaptain:p?captain(g,p):false,team,brief:role?teamBrief(g,role):null,
 roles:ROLES.map(r=>({...r,members:members(g,r.id).map((x,i)=>({id:x.id,captain:(g.captains?.[r.id]||members(g,r.id)[0]?.id)===x.id})),count:members(g,r.id).length})),participants:Object.keys(g.players).length,
 demand:g.demand,budget:g.budget,promise:g.promise,plan:g.plan,assessment:assess(g),aiEnabled:g.aiEnabled,aiReady:ready,aiLimit:g.aiLimit,aiUsed:admin?g.aiUsed:(g.aiUsed[role]||0),
 messages:g.messages.filter(m=>admin||m.from===role||m.to===role),proposals:g.proposals.filter(m=>admin||m.from===role),events:g.events.filter(e=>admin||e.target==='all'||e.target===role),
 ...(admin?{limitSchema:LIMITS,resources:g.resources,resourceBriefs:Object.fromEntries(['supplierA','supplierB','ops'].map(id=>[id,teamBrief(g,id)])),log:g.log,aiCounts:Object.fromEntries(ROLES.map(r=>[r.id,g.log.filter(e=>e.who===r.id&&e.kind==='ai').length])),aiDrafts:Object.entries(g.drafts).map(([player,d])=>({playerId:player,role:Object.values(g.players).find(p=>p.id===player)?.role||'',text:d.text,at:d.at}))}:{}),
 inventory:['supplierA','supplierB'].includes(role)&&g.resources[role].stock!==undefined?{...g.resources[role],...supplierStatus(g,role)}:role==='ops'&&g.resources.ops.packagingStock!==undefined?{packagingStock:g.resources.ops.packagingStock}:null,
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
  if(!Number.isInteger(b.quantity)||b.quantity<1||b.quantity>120||!Number.isInteger(b.unitPrice)||b.unitPrice<0||b.unitPrice>10000||!Number.isInteger(b.delivery)||b.delivery<780||b.delivery>1320)fail('Vérifiez la quantité, le prix unitaire et l’heure de livraison (13 h à 22 h).');
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
 if(id==='road')g.resources.ops.travel+=90;
 if(id==='demand')g.demand+=10;
 const t=e?.target||target||'all';if(t!=='all'&&!ROLES.some(r=>r.id===t))fail('Équipe cible inconnue.');
 const label=e?.label||String(text||'').trim();if(!label||label.length>600)fail('Décrivez la contrainte en 600 caractères maximum.');
 g.events.push({id:crypto.randomUUID(),event:id,text:label,target:t,at:Date.now(),round:g.round,informational:id==='custom'});log(g,'animateur',`Contrainte → ${t} : ${label}`);
}
export function act(g,p,op,b){
 if(!p?.role)fail('Choisissez votre équipe avant de jouer.',403);
 if(g.phase!=='running')fail('L’animateur doit ouvrir ou reprendre le jeu.',409);
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
