import {esc} from './live-common.mjs';
import {euro,time} from './supply-ui.mjs';
const supplier=id=>['supplierA','supplierB'].includes(id);
export function resourceModel(s){
 const r=s.inventory,orders=(s.documents||[]).filter(d=>d.type==='offer'&&d.status==='accepted');
 if(supplier(s.role)&&r?.stock!==undefined){
  const productionFree=Math.max(0,Math.min(r.rawStock,r.productionCapacity)-r.productionBooked);
  return {cells:[['Stock libre',r.stockRemaining,'composants'],['Fabrication libre',productionFree,'composants'],['Cadence',r.productionRate,'par heure'],['Maximum supplémentaire',r.remaining,'composants']],quick:[0,1,3],compactNote:`${r.booked} déjà engagés · Cadence : ${r.productionRate} / h`,note:`${r.booked} déjà engagés · Prix minimum : ${euro(r.minPrice)} / composant`,detail:`Fabrication à partir de ${time(r.productionStart)} · Transport : ${r.transit} min · Stock livrable dès ${time(r.earliest)} · Matières libres : ${Math.max(0,r.rawStock-r.productionBooked)}`};
 }
 if(s.role==='ops'&&r){
  return {cells:[['Composants confirmés',s.inputs?.quantity||0,'unités'],['Préparation maximale',r.capacity,'coffrets'],['Emballages',r.packagingStock,'disponibles'],['Cadence',r.rate,'coffrets / heure']],quickCells:[['Préparation max.',r.capacity,'coffrets'],['Transport normal',r.transportOptions?.find(x=>x.mode==='normal')?.capacity??'—','coffrets max.'],['Transport express',r.transportOptions?.find(x=>x.mode==='express')?.capacity??'—','coffrets max.']],note:`${r.booked||0} coffrets déjà engagés · Préparation : au moins ${euro(r.minPrice)} / coffret`,detail:r.quarantine?`${r.quarantine} composants bloqués par la qualité.`:'Un emballage est nécessaire par coffret.'};
 }
 if(s.role==='buying'){
  const wanted=(s.documents||[]).filter(d=>d.type==='request'&&d.to==='buying'&&d.status!=='rejected').at(-1)?.quantity||s.demand,ordered=orders.filter(d=>supplier(d.from)).reduce((n,d)=>n+d.quantity,0);
  return {cells:[['Besoin',wanted,'composants'],['Commandés',ordered,'composants'],['À trouver',Math.max(0,wanted-ordered),'composants'],['Budget disponible',euro(s.spending?.available??s.budget),'pour vos achats']],quick:[1,2,3],note:s.spending?.overBudget?'Le budget global est dépassé : une nouvelle solution est nécessaire.':'Le budget disponible est actualisé avec les engagements du jeu.'};
 }
 return {cells:[['Budget maximal',euro(s.budget),'pour la mission']],quick:[0],note:''};
}
export function constraintPanel(s,{compact=false,replacesId=''}={}){
 if(s.role==='planning')return planningDiagram(s,{compact});
 const m=resourceModel(s),cells=compact?(m.quickCells||m.quick.map(i=>m.cells[i])):m.cells;
 const old=(s.documents||[]).find(d=>d.id===replacesId&&d.status==='accepted');
 return `<section class="workflow-constraints ${compact?'constraints-compact':''}" aria-label="Vos ressources et contraintes"><div class="eyebrow">${s.role==='buying'?'Vos repères':'Vos moyens disponibles'}</div><div class="constraint-grid">${cells.map(([label,value,unit])=>`<div><span>${esc(label)}</span><strong>${esc(value??'—')}</strong><small>${esc(unit||'')}</small></div>`).join('')}</div>${compact&&m.compactNote?`<p class="constraint-note">${esc(m.compactNote)}</p>`:''}${!compact&&m.note?`<p class="constraint-note">${esc(m.note)}</p>`:''}${!compact&&old?`<p class="constraint-revision">Révision : ${old.quantity} unités sont déjà réservées pour cet engagement. La vérification en tient compte.</p>`:''}${!compact&&m.detail?`<details><summary>Détail des capacités</summary><p>${esc(m.detail)}</p></details>`:''}</section>`;
}
export function planningStatus(s){
 const active=(s.documents||[]).filter(d=>d.type==='offer'&&d.status==='accepted'),sourcing=active.find(d=>d.from==='buying'),operation=active.find(d=>d.from==='ops'),promise=active.find(d=>d.from==='planning'&&d.to==='client');
 const demand=s.demand,supply=sourcing?.quantity||0;
 return {demand,supply,gap:Math.max(0,demand-supply),atRisk:!!sourcing?.health&&!sourcing.health.ok,delivery:operation?.quantity||0,deliveryAtRisk:!!operation?.health&&!operation.health.ok,promise:promise?.quantity||0};
}
export function planningDiagram(s){
 const p=planningStatus(s),pct=p.demand?Math.min(100,p.supply/p.demand*100):0;
 return `<section class="workflow-constraints planning-progress" aria-label="Demande et approvisionnements"><div class="eyebrow">Demande / approvisionnements</div><div class="planning-bar-row"><span>Demande client</span><strong>${p.demand} coffrets</strong><div class="planning-bar"><i style="width:100%"></i></div></div><div class="planning-bar-row ${p.atRisk?'planning-risk':''}"><span>Approvisionnements confirmés</span><strong>${p.supply} coffrets${p.atRisk?' · à revoir':''}</strong><div class="planning-bar" role="progressbar" aria-label="Quantité confirmée" aria-valuemin="0" aria-valuemax="${p.demand}" aria-valuenow="${Math.min(p.demand,p.supply)}"><i style="width:${pct}%"></i></div></div><p class="constraint-note">${p.gap?`${p.gap} coffrets restent à couvrir.`:p.atRisk?'La quantité est annoncée, mais les engagements doivent être revalidés.':'La quantité demandée est couverte par les engagements Achats.'}</p><div class="planning-follow-up"><span>Préparation / livraison : <strong>${p.delivery?`${p.delivery}${p.deliveryAtRisk?' · à revoir':' confirmés'}`:'en attente'}</strong></span><span>Promesse acceptée par le Client : <strong>${p.promise||'en attente'}</strong></span></div></section>`;
}
export function transportChoices(s,selected='normal'){
 const options=s.inventory?.transportOptions||[];return options.map(o=>`<label class="transport-choice"><input type="radio" name="transport" value="${o.mode}" ${selected===o.mode?'checked':''}><span><strong>${o.mode==='express'?'Express':'Normal'}</strong><small>Maximum ${o.capacity} coffrets</small><small>${o.duration} min · ${euro(o.cost)}</small></span></label>`).join('');
}
