import {log} from './supply-game.mjs';
export function cancelPreparation(g){for(const j of Object.values(g.experiment?.jobs||{}))if(['pending','ready','stale'].includes(j.status)){j.status='cancelled';j.cancelledAt=Date.now();}}
export function closeAtDeadline(g,now=Date.now()){
 if(!g.endsAt||g.phase==='finished'||now<g.endsAt)return false;
 g.phase='finished';g.finishedReason='deadline';cancelPreparation(g);if(g.experiment)g.experiment.endedAt=g.endsAt;
 log(g,'animateur','Heure de fin atteinte · partie clôturée automatiquement');return true;
}
export function setDeadline(g,value,now=Date.now()){
 if(value===null){g.endsAt=null;return;}
 if(!Number.isInteger(value)||value<now+5000||value>=g.expires)throw Error('Choisissez une heure de fin future, avant l’expiration de la séance.');
 g.endsAt=value;
}
export function nextAlarm(g,{active=true,now=Date.now()}={}){
 const deadline=g.phase!=='finished'&&g.endsAt>now?g.endsAt:g.expires;
 return Math.min(g.expires,deadline,active&&g.phase==='running'&&g.experiment?.stage==='ai'?now+100:Infinity);
}
