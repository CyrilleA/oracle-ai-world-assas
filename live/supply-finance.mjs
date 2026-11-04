import {accepted,budgetProjection,transportOption,workflowHealth} from './supply-game.mjs';
export const FINANCE_ROLES=['client','planning','buying','supplierA','supplierB','ops'];
export const DEFAULT_ECONOMICS={sellingPrice:3500,referencePurchasePrice:1600,targets:{client:25,planning:30,buying:15,supplierA:20,supplierB:20,ops:15},supplierA:{stockUnitCost:800,productionUnitCost:900},supplierB:{stockUnitCost:1000,productionUnitCost:1100},ops:{preparationUnitCost:400}};
export function economics(g){const x=g.economics||{};return {...DEFAULT_ECONOMICS,...x,targets:{...DEFAULT_ECONOMICS.targets,...x.targets},supplierA:{...DEFAULT_ECONOMICS.supplierA,...x.supplierA},supplierB:{...DEFAULT_ECONOMICS.supplierB,...x.supplierB},ops:{...DEFAULT_ECONOMICS.ops,...x.ops}};}
const sum=(a,f)=>a.reduce((n,x)=>n+f(x),0);
function metric(revenue,cost,quantity,target){const profit=revenue-cost,rate=revenue>0?profit/revenue*100:null;return {revenue,cost,profit,rate,quantity,target,attained:quantity>0&&rate!==null&&rate+1e-8>=target};}
export function supplierCost(g,role,quantity){const e=economics(g)[role],stock=Math.min(quantity,g.resources[role].stock??quantity);return stock*e.stockUnitCost+Math.max(0,quantity-stock)*e.productionUnitCost;}
function coreFinance(g,role){
 if(g.workflow!==2||!FINANCE_ROLES.includes(role))return null;
 const e=economics(g),target=e.targets[role],orders=accepted(g),suppliers=orders.filter(d=>['supplierA','supplierB'].includes(d.from));
 let committed,forecast,ownCosts,formula,label='Marge',atRisk=false;
 if(['supplierA','supplierB'].includes(role)){
  const own=orders.filter(d=>d.from===role),q=sum(own,d=>d.quantity),revenue=sum(own,d=>d.quantity*d.unitPrice);
  committed=metric(revenue,supplierCost(g,role,q),q,target);forecast={...committed};ownCosts={...e[role]};formula='(Ventes − coût du stock et de la fabrication) ÷ ventes';
  atRisk=own.some(d=>!workflowHealth(g,d).ok);
 }else if(role==='ops'){
  const own=orders.filter(d=>d.from==='ops'),q=sum(own,d=>d.quantity),shipping=sum(own,d=>transportOption(g,d.transport).cost),revenue=sum(own,d=>d.quantity*d.unitPrice)+shipping;
  committed=metric(revenue,q*e.ops.preparationUnitCost+shipping,q,target);forecast={...committed};ownCosts={...e.ops};formula='(Préparation facturée + transport refacturé − coûts de préparation et de transport) ÷ recettes';atRisk=own.some(d=>!workflowHealth(g,d).ok);
 }else if(role==='buying'){
  const q=sum(suppliers,d=>d.quantity),cost=sum(suppliers,d=>d.quantity*d.unitPrice);
  committed=metric(q*e.referencePurchasePrice,cost,q,target);forecast={...committed};ownCosts={referenceUnitPrice:e.referencePurchasePrice};label='Économies d’achat';formula='(Coût de référence des quantités commandées − achats engagés) ÷ coût de référence. Ce gain est une économie, pas un bénéfice commercial.';atRisk=suppliers.some(d=>!workflowHealth(g,d).ok);
 }else{
  const operation=orders.find(d=>d.from==='ops'),promise=orders.find(d=>d.from==='planning'&&d.to==='client'),q=promise?.quantity||0;
  const purchases=sum(suppliers,d=>d.quantity*d.unitPrice),service=operation?operation.quantity*operation.unitPrice+transportOption(g,operation.transport).cost:0;
  committed=metric(q*e.sellingPrice,purchases+service,q,target);
  const projection=budgetProjection(g),forecastQ=g.plan?.quantity||operation?.quantity||g.demand,ordered=sum(suppliers,d=>d.quantity),missing=Math.max(0,forecastQ-ordered),forecastCost=projection.total+missing*e.referencePurchasePrice;
  forecast=metric(forecastQ*e.sellingPrice,forecastCost,forecastQ,target);forecast.estimatedPurchases=missing>0;
  ownCosts={sellingPrice:e.sellingPrice,referencePurchasePrice:e.referencePurchasePrice};label='Marge de la soirée';formula='(Recettes simulées des coffrets confirmés au Client − achats, préparation et transport engagés) ÷ recettes. Client et Planification suivent le même résultat global : ne pas additionner leurs marges.';atRisk=orders.some(d=>d.from!=='client'&&!workflowHealth(g,d).ok);
 }
 const goalReached=committed.attained&&!atRisk&&(!['client','planning'].includes(role)||committed.quantity>=g.demand);
 return {role,label,target,committed,forecast,ownCosts,formula,atRisk,goalReached,provisional:true};
}
export function finance(g,role){
 const f=coreFinance(g,role);if(!f)return null;
 const offer=(g.documents||[]).filter(d=>d.type==='offer'&&d.status==='pending'&&d.round===g.round&&(d.from===role||role==='buying'&&d.to===role)).at(-1);
 if(offer){f.forecast=financeImpact(g,role,offer);f.forecast.offerRef=offer.ref;}
 return f;
}
export function financeImpact(g,role,document){
 if(g.workflow!==2||document.type!=='offer')return null;
 const copy=structuredClone(g),d={...document,status:'accepted',acceptedAt:Date.now()};
 copy.documents=copy.documents.filter(x=>x.id!==d.id).map(x=>x.id===d.replacesId?{...x,status:'superseded'}:x);copy.documents.push(d);
 const f=coreFinance(copy,role);return f?{label:f.label,target:f.target,...f.committed,atRisk:f.atRisk}:null;
}
export function financePreview(g,p,b){const request=g.documents.find(d=>d.id===b.requestId);return request?financeImpact(g,p.role,{...b,id:'FINANCE-PREVIEW',type:'offer',from:p.role,to:request.from,replacesId:b.replacesId||request.replacesId||null,unitPrice:['planning','buying'].includes(p.role)?0:b.unitPrice}):null;}
export function recordFinance(g,label){
 if(g.workflow!==2)return;
 g.financeHistory||=[];g.financeHistory.push({at:Date.now(),round:g.round,stage:g.experiment?.stage||'human',label:String(label).slice(0,180),teams:Object.fromEntries(FINANCE_ROLES.map(role=>{const f=finance(g,role);return [role,{target:f.target,profit:f.committed.profit,rate:f.committed.rate,forecastProfit:f.forecast.profit,forecastRate:f.forecast.rate,quantity:f.committed.quantity,atRisk:f.atRisk,goalReached:f.goalReached}];}))});g.financeHistory=g.financeHistory.slice(-160);
}
export function financeView(g,p,admin=false){
 if(g.workflow!==2)return {};
 if(admin)return {teamFinances:Object.fromEntries(FINANCE_ROLES.map(role=>[role,finance(g,role)])),economics:economics(g),financeHistory:g.financeHistory||[]};
 if(!p?.role)return {};
 return {finance:finance(g,p.role),financeHistory:(g.financeHistory||[]).slice(-8).map(x=>({at:x.at,round:x.round,stage:x.stage,...x.teams[p.role]}))};
}
export function changeEconomics(g,b){
 const e=structuredClone(economics(g)),role=b.role,target=b.target;
 if(!FINANCE_ROLES.includes(role)||!Number.isFinite(target)||target<0||target>80||Math.abs(Math.round(target*10)-target*10)>1e-6)throw Error('Objectif : de 0 à 80 %, avec une décimale maximum.');
 e.targets[role]=target;
 const fields=['supplierA','supplierB'].includes(role)?['stockUnitCost','productionUnitCost']:role==='ops'?['preparationUnitCost']:role==='buying'?['referencePurchasePrice']:['sellingPrice'];
 for(const field of fields){const value=b[field];if(!Number.isInteger(value)||value<0||value>10000)throw Error('Les valeurs unitaires doivent être comprises entre 0 et 100 €.');if(['stockUnitCost','productionUnitCost','preparationUnitCost'].includes(field))e[role][field]=value;else e[field]=value;}
 g.economics=e;
}
