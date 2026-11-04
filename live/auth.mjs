const encoder=new TextEncoder();
const encode=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
function decode(text){const b=atob(text.replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(b,c=>c.charCodeAt(0));}
async function signingKey(env){return crypto.subtle.importKey('raw',encoder.encode(env.SESSION_KEY+'\0'+env.ADMIN_PASSWORD),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
export async function passwordMatches(given,expected){
 if(typeof given!=='string'||!expected)return false;
 const a=new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(given)));
 const b=new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(expected)));
 let different=0;for(let i=0;i<a.length;i++)different|=a[i]^b[i];return different===0;
}
export async function createSession(env,remember,now=Date.now()){
 const expires=now+(remember?7*24:12)*60*60*1000;
 const payload=encode(encoder.encode(JSON.stringify({v:1,scope:'animateur',iat:now,exp:expires,id:crypto.randomUUID()})));
 const signature=await crypto.subtle.sign('HMAC',await signingKey(env),encoder.encode(payload));
 return {token:payload+'.'+encode(signature),expires};
}
export async function validSession(token,env,now=Date.now()){
 if(!token||token.length>1024||!env.SESSION_KEY||!env.ADMIN_PASSWORD)return false;
 try{
  const parts=token.split('.');if(parts.length!==2)return false;
  if(!await crypto.subtle.verify('HMAC',await signingKey(env),decode(parts[1]),encoder.encode(parts[0])))return false;
  const p=JSON.parse(new TextDecoder().decode(decode(parts[0])));
  return p.v===1&&p.scope==='animateur'&&Number.isFinite(p.exp)&&Number.isFinite(p.iat)&&p.iat<=now&&p.exp>now&&p.exp-p.iat<=7*24*60*60*1000;
 }catch{return false;}
}
export async function addressKey(request,env){
 const address=request.headers.get('CF-Connecting-IP')||'unknown';
 return encode(await crypto.subtle.digest('SHA-256',encoder.encode(env.SESSION_KEY+'\0'+address)));
}
