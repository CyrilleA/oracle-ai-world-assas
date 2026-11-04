import { DurableObject } from 'cloudflare:workers';
import { OPTIONS, QUESTIONS } from './questions.mjs';

const json = (data, status=200) => Response.json(data, { status, headers: { 'Cache-Control':'no-store' } });
const ROOM = /^[A-HJ-NP-Z2-9]{8}$/;
const TTL = 48 * 60 * 60 * 1000;
export const totals = (room, index) => {
  const counts = [0,0,0];
  for (const p of Object.values(room.players)) if (Number.isInteger(p.votes[index])) counts[p.votes[index]]++;
  const received = counts.reduce((a,b)=>a+b,0);
  return { counts, received, participants:Object.keys(room.players).length };
};
const bearer = r => r.headers.get('Authorization')?.replace(/^Bearer /,'') || '';
async function sameKey(a,b) {
  if (!a || !b) return false;
  const enc = new TextEncoder();
  const x = new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(a)));
  const y = new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(b)));
  let result=0; for(let i=0;i<x.length;i++) result |= x[i]^y[i];
  return result===0;
}

export default {
  async fetch(request, env) {
    const origin=request.headers.get('Origin');
    const allowed=(env.ALLOWED_ORIGINS||'https://cyrillea.github.io').split(',');
    const cors={ 'Access-Control-Allow-Methods':'GET,POST,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type,Authorization', 'Vary':'Origin' };
    if (origin && allowed.includes(origin)) cors['Access-Control-Allow-Origin']=origin;
    const wrap = r => { const h=new Headers(r.headers); for(const [k,v] of Object.entries(cors)) h.set(k,v); h.set('X-Content-Type-Options','nosniff');return new Response(r.body,{status:r.status,headers:h}); };
    if(origin && !allowed.includes(origin)) return wrap(json({error:'Origine non autorisée.'},403));
    if(request.method==='OPTIONS') return wrap(new Response(null,{status:204}));
    const u=new URL(request.url);
    if (u.pathname==='/api/health' && request.method==='GET') return wrap(json({ok:true}));
    if(!env.ADMIN_KEY) return wrap(json({error:'Service en cours de configuration.'},503));
    try {
      const admin=await sameKey(bearer(request),env.ADMIN_KEY);
      if(u.pathname==='/api/admin' && request.method==='GET') return wrap(admin?json({ok:true}):json({error:'Clé d’animation invalide.'},401));
      if(u.pathname==='/api/sessions' && request.method==='POST') {
        if(!admin) return wrap(json({error:'Clé d’animation invalide.'},401));
        const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        // 40 bits of random room code. Only an authenticated teacher may create a room.
        const code=Array.from(crypto.getRandomValues(new Uint8Array(8)),v=>alphabet[v%32]).join('');
        const room=env.ROOMS.get(env.ROOMS.idFromName(code));
        return wrap(await room.fetch(new Request('https://room/init',{method:'POST',body:JSON.stringify({code})})));
      }
      const match=u.pathname.match(/^\/api\/sessions\/([A-HJ-NP-Z2-9]{8})\/(state|join|vote|control|results)$/);
      if(!match || !ROOM.test(match[1])) return wrap(json({error:'Adresse de séance inconnue.'},404));
      const [,code,operation]=match;
      if(['control','results'].includes(operation) && !admin) return wrap(json({error:'Accès réservé à l’animateur.'},401));
      const safeHeaders=new Headers({'Content-Type':'application/json'});
      // Student tokens are separate from the teacher secret; the latter never enters the room state.
      if(['state','vote','join'].includes(operation)) safeHeaders.set('Authorization',request.headers.get('Authorization')||'');
      return wrap(await env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(new Request('https://room/'+operation,{
        method:request.method, headers:safeHeaders,
        body:request.method==='POST'?await request.text():undefined
      })));
    } catch { return wrap(json({error:'Le service est momentanément indisponible. Réessayez.'},500)); }
  }
};

export class QuizRoom extends DurableObject {
  constructor(ctx,env) { super(ctx,env); this.ctx=ctx; }
  async alarm() { await this.ctx.storage.deleteAll(); }
  async fetch(request) {
    const op=new URL(request.url).pathname.slice(1);
    if(!((request.method==='GET' && ['state','results'].includes(op)) || (request.method==='POST' && ['init','join','vote','control'].includes(op)))) return json({error:'Méthode non autorisée.'},405);
    let body={};
    if(request.method==='POST') {
      const raw=await request.text(); if(raw.length>2048) return json({error:'Requête trop volumineuse.'},413);
      try { body=JSON.parse(raw||'{}'); } catch { return json({error:'Requête invalide.'},400); }
    }
    return this.ctx.blockConcurrencyWhile(async()=>{
      let room=await this.ctx.storage.get('room');
      if(op==='init') {
        if(room) return json({error:'Séance existante.'},409);
        room={code:body.code,created:Date.now(),expires:Date.now()+TTL,phase:'waiting',question:0,players:{}};
        await this.ctx.storage.put('room',room);await this.ctx.storage.setAlarm(room.expires);
        return json({code:room.code,expires:room.expires},201);
      }
      if(!room || room.expires<Date.now()) return json({error:'Cette séance a expiré ou n’existe pas.'},404);
      if(op==='join') {
        if(room.phase==='finished') return json({error:'La séance est terminée.'},409);
        const token=bearer(request);
        if(token && room.players[token]) return json({token});
        if(Object.keys(room.players).length>=80) return json({error:'La séance est complète.'},409);
        const id=crypto.randomUUID();room.players[id]={votes:{}};
        await this.ctx.storage.put('room',room);return json({token:id},201);
      }
      const player=room.players[bearer(request)];
      if(op==='state') return json({code:room.code,phase:room.phase,index:room.question,joined:!!player,
        question:room.phase==='voting'?{...publicQuestion(room.question),options:OPTIONS}:null,
        answer:player?.votes[room.question]??null});
      if(op==='vote') {
        if(!player) return json({error:'Rejoignez la séance avant de voter.'},401);
        if(room.phase!=='voting' || body.index!==room.question) return json({error:'Le vote pour cette question est fermé.'},409);
        if(!Number.isInteger(body.choice)||body.choice<0||body.choice>2) return json({error:'Choix invalide.'},400);
        player.votes[room.question]=body.choice;await this.ctx.storage.put('room',room);
        return json({ok:true,choice:body.choice});
      }
      if(op==='control') {
        const command=body.command;
        if(command==='open' && ['waiting','results'].includes(room.phase)) room.phase='voting';
        else if(command==='reveal' && room.phase==='voting') room.phase='results';
        else if(command==='next' && room.phase==='results' && room.question<QUESTIONS.length-1) {room.question++;room.phase='voting';}
        else if(command==='finish' && room.phase==='results' && room.question===QUESTIONS.length-1) room.phase='finished';
        else return json({error:'Action impossible à cette étape.'},409);
        await this.ctx.storage.put('room',room);
      }
      if(op==='results'||op==='control') {
        const result=totals(room,room.question);
        return json({code:room.code,phase:room.phase,index:room.question,expires:room.expires,
          ...result,counts:['results','finished'].includes(room.phase)?result.counts:null,
          question:QUESTIONS[room.question],options:OPTIONS,
          history:room.phase==='finished'?QUESTIONS.map((q,i)=>({...totals(room,i),title:q.title})):null});
      }
      return json({error:'Action inconnue.'},404);
    });
  }
}
function publicQuestion(i) { const {title,context,question}=QUESTIONS[i];return {title,context,question}; }
