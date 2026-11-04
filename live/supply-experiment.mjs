import {initialGame,view,act,assess,captain} from './supply-game.mjs';
import {nextTask,proposalExplanation as safeExplanation} from '../site/supply-tasks.mjs';
export const stage=g=>g.experiment?.stage||'human';
export function startExperiment(g){
 if(g.workflow!==2)return;
 g.experiment||={stage:'human',startedAt:Date.now(),reports:[],baseline:structuredClone({resources:g.resources,demand:g.demand,budget:g.budget,promise:g.promise})};
}
export function report(g){const e=g.experiment,a=assess(g),orders=g.documents.filter(d=>d.acceptedAt),jobs=(e?.history||[]);return {stage:stage(g),startedAt:e?.startedAt||g.created,endedAt:e?.endedAt||Date.now(),elapsedMs:Math.max(0,(e?.endedAt||Date.now())-(e?.startedAt||g.created)),firstPromiseMs:orders.some(d=>d.to==='client')?Math.min(...orders.filter(d=>d.to==='client').map(d=>d.acceptedAt))-(e?.startedAt||g.created):null,assessment:a,documents:g.documents.length,accepted:orders.length,aiPrepared:jobs.filter(j=>j.readyAt).length,aiPreparationMs:jobs.filter(j=>j.readyAt).map(j=>j.readyAt-j.startedAt),responses:g.documents.filter(d=>d.type==='offer').map(d=>({role:d.from,ms:d.at-(g.documents.find(r=>r.id===d.requestId)?.at||d.at)}))};}
export function replayWithAI(g){
 if(g.workflow!==2||stage(g)!=='human'||!g.experiment)throw Error('Démarrez d’abord la phase humaine.');
 const e=g.experiment,r=report(g);e.reports.push(r);e.archive={documents:g.documents,messages:g.messages,events:g.events,log:g.log,plan:g.plan};
 const fresh=initialGame(g.code);for(const k of ['documents','messages','proposals','events','log','plan','aiUsed','aiTickets','drafts'])g[k]=fresh[k];
 Object.assign(g,structuredClone(e.baseline));g.round=1;g.phase='running';g.aiEnabled=true;g.aiLimit=6;
 g.experiment={...e,stage:'ai',startedAt:Date.now(),endedAt:null,jobs:{},history:[]};
}
export function publicExperiment(g,p,admin=false){
 const e=g.experiment;if(g.workflow!==2)return {};
 const job=e?.jobs?.[p?.role];let current=job;
 if(job&&job.fingerprint!==taskContext(g,p)?.fingerprint)current=null;
 return {experiment:{stage:stage(g),startedAt:e?.startedAt||null,reports:admin?(e?.reports||[]):undefined,current:admin&&e?report(g):undefined,jobs:admin?Object.fromEntries(Object.entries(e?.jobs||{}).map(([r,j])=>[r,{status:j.status,error:j.error,startedAt:j.startedAt,readyAt:j.readyAt}])):undefined},autoDraft:current?{id:current.id,status:current.status,error:current.error,startedAt:current.startedAt,readyAt:current.readyAt,action:current.action,payload:current.payload,reason:safeExplanation(current),exception:current.exception}:null};
}
export function taskContext(g,p){
 if(!p?.role)return null;const s=view(g,p),task=nextTask({...s,isCaptain:true});
 if(!['request','respond','revise'].includes(task.kind))return null;
 const req=task.kind==='revise'?s.documents.find(d=>d.id===task.doc.requestId):task.doc;if(!req)return null;
 // The fingerprint uses only this team's visible state; global revisions do not create paid calls.
 const fingerprint=JSON.stringify([g.round,task.kind,req.id,task.target,task.doc?.id,s.documents.map(d=>[d.id,d.status,d.quantity,d.delivery,d.unitPrice,d.health]),s.inventory,s.inputs,s.spending,g.promise,g.budget]);
 return {s,task,req,fingerprint};
}
export function candidates(g,p,context=taskContext(g,p)){
 if(!context)return [];
 const {s,task,req}=context,action=task.kind==='request'?'request':'quote',base={parentId:req.id,requestId:req.id,replacesId:task.kind==='revise'?task.doc.id:req.replacesId||'',to:task.target||req.from,unitPrice:s.inventory?.minPrice||0,transport:'normal',text:''};
 let q=req.quantity,delivery=req.delivery;
 if(action==='request'){
  if(p.role==='planning'&&task.target==='buying')delivery=Math.max(780,delivery-Math.ceil(q/40*60)-60);
  if(p.role==='buying'){const booked=s.documents.filter(d=>d.type==='offer'&&d.status==='accepted'&&['supplierA','supplierB'].includes(d.from)).reduce((n,d)=>n+d.quantity,0);const pending=s.documents.filter(d=>d.type==='request'&&d.from==='buying'&&['supplierA','supplierB'].includes(d.to)&&['open','partial'].includes(d.status));q=Math.max(1,Math.ceil((q-booked-pending.reduce((n,d)=>n+d.quantity,0))/(task.otherTarget?2:1)));}
 }
 const options=[];
 const quantities=action==='request'?[q]:[...new Set([q,Math.min(q,s.inventory?.remaining??s.inputs?.quantity??q),Math.ceil(q/2)])].filter(n=>n>0);
 for(const quantity of quantities)for(const transport of p.role==='ops'?['normal','express']:['normal']){
  const trial={...base,quantity,transport,delivery};
  if(p.role==='planning'&&action==='quote')trial.transport=s.documents.find(d=>d.from==='ops'&&d.status==='accepted')?.transport||'normal';
  for(const hour of action==='request'?[delivery]:[delivery,...Array.from({length:19},(_,i)=>780+i*30)]){
   const payload={...trial,delivery:hour};if(hour<780||hour>1320)continue;
   try{validateAction(g,p,action,payload);if(!options.some(o=>JSON.stringify(o.payload)===JSON.stringify(payload)))options.push({action,payload,estimatedCost:quantity*payload.unitPrice+(s.inventory?.transportOptions?.find(t=>t.mode===transport)?.cost||0),exception:quantity<req.quantity&&action==='quote'||hour>req.delivery});}catch{}
  }
 }
 // Prefer full quantities and on-time results; within that, earliest completion and cheaper shipping.
 return options.sort((a,b)=>Number(a.exception)-Number(b.exception)||Math.max(0,a.payload.delivery-req.delivery)-Math.max(0,b.payload.delivery-req.delivery)||b.payload.quantity-a.payload.quantity||a.estimatedCost-b.estimatedCost||a.payload.delivery-b.payload.delivery).slice(0,8);
}
export function validateAction(g,p,action,payload){const copy=structuredClone(g);if(action==='quote'&&p.role==='planning')act(copy,p,'plan',{quantity:payload.quantity,transport:payload.transport});act(copy,p,action,payload);return copy;}
export function aiContext(g,p,c,options){const {s,req}=c;return {role:s.team.name,action:options[0]?.action,destination:s.roles.find(r=>r.id===options[0]?.payload.to)?.name||req.from,brief:s.brief,request:{quantity:req.quantity,delivery:req.delivery,text:req.text},ownConstraints:s.inventory,inputs:s.inputs,availableBudget:s.spending?.available,events:s.events.map(e=>e.text),documents:s.documents.slice(-12).map(({ref,from,to,type,status,quantity,delivery,unitPrice,text})=>({ref,from,to,type,status,quantity,delivery,unitPrice,text})),options:options.map((o,index)=>({index,quantity:o.payload.quantity,delivery:o.payload.delivery,unitPrice:o.payload.unitPrice,transport:o.payload.transport,estimatedCost:o.estimatedCost,exception:o.exception}))};}
export function confirmAuto(g,p,id){
 if(stage(g)!=='ai'||!captain(g,p))throw Error('Le capitaine valide la proposition en phase IA.');
 const j=g.experiment.jobs[p.role],c=taskContext(g,p);if(!j||j.id!==id||j.status!=='ready'||j.fingerprint!==c?.fingerprint)throw Error('La situation a changé. Attendez la nouvelle proposition.');
 validateAction(g,p,j.action,j.payload);
 if(j.action==='quote'&&p.role==='planning')act(g,p,'plan',{quantity:j.payload.quantity,transport:j.payload.transport});
 act(g,p,j.action,{...j.payload,text:safeExplanation(j)});g.documents.at(-1).ai=true;j.status='sent';j.sentAt=Date.now();
}
