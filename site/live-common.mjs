export const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function configuration(){
  const r=await fetch('live-config.json',{cache:'no-store'});if(!r.ok)throw Error('Configuration du jeu indisponible.');
  const c=await r.json();if(!c.api)throw Error('Le vote collectif sera accessible lorsque l’animateur aura activé la séance.');
  const url=new URL(c.api);if(url.protocol!=='https:' && url.hostname!=='localhost' && url.hostname!=='127.0.0.1')throw Error('Adresse de service invalide.');
  return url.origin;
}
export async function api(base,path,{token='',body,signal}={}){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
  try {
    const r=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{'Authorization':'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined,signal:signal||controller.signal,cache:'no-store'});
    const data=await r.json();if(!r.ok){const e=Error(data.error||'Le service ne répond pas.');e.status=r.status;throw e;}return data;
  }catch(e){if(e.name==='AbortError')throw Error('Connexion interrompue. Vos choix déjà enregistrés sont conservés.');throw e;}finally{clearTimeout(timeout);}
}
export const save=(k,v)=>{try{localStorage.setItem(k,v);}catch{}};
export const load=k=>{try{return localStorage.getItem(k);}catch{return null;}};
export const roomCode=s=>String(s||'').trim().toUpperCase().replace(/[^A-Z2-9]/g,'');
export const validRoom=s=>/^[A-HJ-NP-Z2-9]{8}$/.test(s);
