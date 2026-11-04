import {supplierCapacity,supplierDelivery,transportOption,accepted} from './supply-game.mjs';
import {economics,supplierCost} from './supply-finance.mjs';
export function quickPlan(g){
 const begin=performance.now(),e=economics(g),q=g.demand,r=g.resources.ops,solutions=[],orders=accepted(g),op=orders.find(x=>x.from==='ops'),source=orders.find(x=>x.from==='buying');
 const committed=Object.fromEntries(['supplierA','supplierB'].map(role=>{const ds=orders.filter(x=>x.from===role);return [role,{quantity:ds.reduce((n,d)=>n+d.quantity,0),cost:ds.reduce((n,d)=>n+d.quantity*d.unitPrice,0),delivery:Math.max(0,...ds.map(d=>d.delivery))}];}));
 if(g.workflow!==2||!Number.isInteger(q)||q<1)return null;
 // This solver stays on the server. Private supplier costs are never sent to another team's model.
 for(let a=0;a<=q+r.quarantine;a++){
  const b=q+r.quarantine-a;
  if(source&&source.quantity<q)continue;
  if(a<committed.supplierA.quantity||b<committed.supplierB.quantity)continue;
  if(a>supplierCapacity(g.resources.supplierA)||b>supplierCapacity(g.resources.supplierB)||q>r.capacity||q>(r.packagingStock??Infinity))continue;
  const price=(role,n)=>{const old=committed[role],extra=n-old.quantity;return extra?Math.max(g.resources[role].minPrice,Math.ceil((supplierCost(g,role,n)/(1-e.targets[role]/100)-old.cost)/extra)):0;};
  const priceA=price('supplierA',a),priceB=price('supplierB',b),purchases=committed.supplierA.cost+(a-committed.supplierA.quantity)*priceA+committed.supplierB.cost+(b-committed.supplierB.quantity)*priceB;
  const ready=Math.max(source?.delivery||0,committed.supplierA.delivery,committed.supplierB.delivery,a?supplierDelivery(g.resources.supplierA,a):0,b?supplierDelivery(g.resources.supplierB,b):0);
  for(const mode of ['normal','express']){
   const t=transportOption(g,mode);if(q>t.capacity||op&&(op.transport!==mode||op.quantity<q))continue;
   const prepPrice=op?.unitPrice??Math.max(r.minPrice,Math.ceil((q*e.ops.preparationUnitCost+(e.targets.ops/100)*t.cost)/(1-e.targets.ops/100)/q));
   const cost=purchases+q*prepPrice+t.cost,arrival=Math.max(op?.delivery||0,ready+Math.ceil(q/r.rate*60)+t.duration);
   if(cost>g.budget||arrival>g.promise.delivery||priceA>10000||priceB>10000||prepPrice>10000)continue;
   const revenue=q*e.sellingPrice,globalMargin=revenue?(revenue-cost)/revenue*100:null,ref=(a+b)*e.referencePurchasePrice,savings=ref?(ref-purchases)/ref*100:null;
   const goals=Number(globalMargin!==null&&globalMargin>=e.targets.client)+Number(globalMargin!==null&&globalMargin>=e.targets.planning)+Number(savings!==null&&savings>=e.targets.buying);
   solutions.push({quantity:q,supplierA:{quantity:a,unitPrice:priceA},supplierB:{quantity:b,unitPrice:priceB},preparationUnitPrice:prepPrice,transport:mode,cost,arrival,globalMargin,savings,goals});
  }
 }
 solutions.sort((a,b)=>b.goals-a.goals||a.cost-b.cost||a.arrival-b.arrival);
 return {status:solutions.length?'feasible':'exception',plan:solutions[0]||null,calculationMs:Math.round((performance.now()-begin)*100)/100,alternatives:solutions.length,scope:'Plan cible calculé avec les contraintes et les engagements actuels. Les nouvelles quantités et les prix restent à faire confirmer par les équipes. Aucun engagement créé.'};
}
