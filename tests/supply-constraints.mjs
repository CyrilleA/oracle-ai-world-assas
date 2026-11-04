import assert from 'node:assert/strict';
import {initialGame,view,budgetProjection,workflowCheck,transportOption,applyLimit,assess} from '../live/supply-game.mjs';
import {resourceModel,constraintPanel,planningStatus,planningDiagram,transportChoices} from '../site/supply-constraints.mjs';
const game=initialGame('RESOURCE');
const supplier={id:'P1',role:'supplierA'},ops={id:'P2',role:'ops'},buyer={id:'P3',role:'buying'},planner={id:'P4',role:'planning'};
let s=view(game,supplier);let model=resourceModel(s);assert.equal(model.cells[0][1],20);assert.equal(model.cells[1][1],40);assert.equal(model.cells[3][1],60);
const order={id:'a',type:'offer',from:'supplierA',to:'buying',status:'accepted',quantity:40,unitPrice:1000,delivery:900,acceptedAt:1,orderRef:'ENG-001'};
game.documents.push(order);s=view(game,supplier);model=resourceModel(s);assert.equal(model.cells[0][1],0);assert.equal(model.cells[1][1],20);assert.equal(model.cells[3][1],20);assert.ok(constraintPanel(s,{replacesId:'a'}).includes('40 unités sont déjà réservées'));
let projection=budgetProjection(game);assert.equal(projection.purchases,40000);assert.equal(projection.preparation,40000);assert.equal(projection.transport,12000);assert.equal(projection.remaining,108000);
const bv=view(game,buyer);assert.deepEqual(bv.spending,{available:108000,overBudget:false});assert.equal(bv.budgetDetails,undefined);assert.equal(constraintPanel(bv).includes('Transport'),false);assert.equal(bv.inventory,null);
assert.equal(view(game,null,true).budgetDetails.total,92000);
let chart=planningStatus(view(game,planner));assert.equal(chart.supply,0,'Les fournisseurs ne sont pas assimilés à une confirmation reçue par la Planification');
game.documents.push({id:'b',type:'offer',from:'buying',to:'planning',status:'accepted',quantity:40,unitPrice:0,delivery:900,dependencyIds:['a']});
chart=planningStatus(view(game,planner));assert.equal(chart.supply,40);assert.equal(chart.gap,40);assert.equal(chart.atRisk,false);assert.ok(planningDiagram(view(game,planner)).includes('40 coffrets restent à couvrir'));
applyLimit(game,{target:'supplierA',field:'stock',value:0});applyLimit(game,{target:'supplierA',field:'productionRate',value:20});assert.equal(planningStatus(view(game,planner)).atRisk,true);
const r=game.resources.ops;applyLimit(game,{target:'ops',field:'normalCapacity',value:30});assert.equal(transportOption(game,'normal').capacity,30);assert.equal(transportOption(game,'express').capacity,80);
assert.ok(transportChoices(view(game,ops)).includes('Maximum 30 coffrets'));assert.equal(view(game,supplier).inventory.normalCapacity,undefined);
// Dépenser moins que le budget produit ne suffit pas : la préparation et le transport comptent aussi.
const budgetGame=initialGame('ALLCOSTS');budgetGame.documents.push({id:'rfq',type:'request',from:'buying',to:'supplierA',status:'open',quantity:60,delivery:900});
let report=workflowCheck(budgetGame,supplier,{requestId:'rfq',quantity:60,unitPrice:2500,delivery:900});assert.equal(report.ok,true,'Le fournisseur peut dépasser le budget client');assert.deepEqual(report.reasons,[]);assert.equal(report.cost,202000);
applyLimit(budgetGame,{target:'ops',field:'normalCost',value:20000});assert.equal(budgetProjection(budgetGame).remaining,140000);
// Un engagement de transport impossible est refusé et une autre option reste possible.
const g=initialGame('SHIPMENT');g.documents.push({id:'supplier',type:'offer',from:'supplierA',to:'buying',status:'accepted',quantity:60,unitPrice:1000,delivery:900},{id:'supplierB',type:'offer',from:'supplierB',to:'buying',status:'accepted',quantity:20,unitPrice:1300,delivery:900},{id:'internal',type:'offer',from:'buying',to:'planning',status:'accepted',quantity:80,unitPrice:0,delivery:900},{id:'service',type:'request',from:'planning',to:'ops',status:'open',quantity:80,delivery:1140});
applyLimit(g,{target:'ops',field:'normalCapacity',value:60});
report=workflowCheck(g,ops,{requestId:'service',quantity:80,unitPrice:500,delivery:1140,transport:'normal'});assert.equal(report.ok,false);assert.equal(report.feasibleQuantityAtRequestedTime,60);assert.ok(report.reasons.some(x=>x.includes('transport choisi')));
report=workflowCheck(g,ops,{requestId:'service',quantity:80,unitPrice:500,delivery:1140,transport:'express'});assert.equal(report.ok,true);assert.equal(report.cost,154000);
g.documents.push({id:'op',type:'offer',from:'ops',to:'planning',status:'accepted',quantity:80,unitPrice:500,delivery:1080,transport:'normal'});g.plan={quantity:80,transport:'normal'};assert.equal(assess(g).valid,false);assert.equal(assess(g).available,60);
// Anciennes séances structurées : valeurs par défaut éditables sans perdre les engagements.
const old=initialGame('OLDTRANS');for(const field of ['normalCapacity','expressCapacity','normalCost','expressCost','expressTravel'])delete old.resources.ops[field];assert.equal(view(old,null,true).resources.ops.normalCapacity,100);applyLimit(old,{target:'ops',field:'expressCapacity',value:50});assert.equal(transportOption(old,'express').capacity,50);
console.log('Contraintes visibles : stocks libres et réservés, fabrication, transport normal/express, confidentialité, diagramme demande-supply et budget incluant préparation et transport vérifiés.');
