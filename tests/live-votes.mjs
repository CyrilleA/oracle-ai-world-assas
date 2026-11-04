import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
// Mot de passe fictif de 15 caractères : régression de la limite incohérente.
const password='TEST-only-12345';
assert.equal(password.length,15);
let key='';
const mf=new Miniflare(convertV4MiniflareOptions({modules:true,scriptPath:path.join(root,'.wrangler/build/worker.js'),compatibilityDate:'2026-10-01',
 durableObjects:{ROOMS:{className:'QuizRoom',useSQLite:true},LOGIN_LIMITS:{className:'LoginLimit',useSQLite:true}},bindings:{ADMIN_PASSWORD:password,SESSION_KEY:'test-signing-secret-32-characters-long',ALLOWED_ORIGINS:'https://cyrillea.github.io'}}));
async function call(url,{token='',body,status=200,origin='https://cyrillea.github.io',method,ip='192.0.2.10'}={}){
 const r=await mf.dispatchFetch('https://quiz.test'+url,{method:method||(body?'POST':'GET'),headers:{Origin:origin,'CF-Connecting-IP':ip,...(token?{Authorization:'Bearer '+token}:{}),'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 assert.equal(r.status,status,`${url} doit retourner ${status}`);return r.json();
}
try{
 const session=await call('/api/login',{body:{password,remember:false}});key=session.token;
 assert.ok(session.expires>Date.now()+11*60*60*1000);
 const remembered=await call('/api/login',{body:{password,remember:true}});
 assert.ok(remembered.expires>Date.now()+6*24*60*60*1000);
 await call('/api/admin',{token:key.slice(0,-10)+'bad',status:401});
 await call('/api/admin',{token:password,status:401});
 await call('/api/sessions',{body:{},status:401});
 await call('/api/admin',{token:'wrong',status:401});
 await call('/api/admin',{token:key});
 const room=await call('/api/sessions',{token:key,body:{},status:201});
 const prefix='/api/sessions/'+room.code;
 await call(prefix+'/control',{body:{command:'open'},status:401});
 await call(prefix+'/results',{status:401});
 await call(prefix+'/results',{token:key,origin:'https://evil.example',status:403});
 const players=await Promise.all(Array.from({length:30},()=>call(prefix+'/join',{body:{},status:201})));
 assert.equal(new Set(players.map(p=>p.token)).size,30);
 const reused=await call(prefix+'/join',{token:players[0].token,body:{}});
 assert.equal(reused.token,players[0].token,'Un rechargement doit conserver le participant');
 const waiting=await call(prefix+'/state',{token:players[0].token});
 assert.equal(waiting.phase,'waiting');assert.equal(waiting.question,null);
 await call(prefix+'/vote',{token:players[0].token,body:{index:0,choice:0},status:409});
 await call(prefix+'/control',{token:key,body:{command:'open'}});
 const publicQuestion=await call(prefix+'/state',{token:players[0].token});
 assert.equal(publicQuestion.question.options.length,3);
 assert.equal(publicQuestion.question.debrief,undefined,'Aucun corrigé dans l’accès élève');
 await Promise.all(players.map((p,i)=>call(prefix+'/vote',{token:p.token,body:{index:0,choice:i%3}})));
 await call(prefix+'/vote',{token:players[0].token,body:{index:0,choice:1}});
 await call(prefix+'/vote',{token:players[0].token,body:{index:0,choice:3},status:400});
 const masked=await call(prefix+'/results',{token:key});
 assert.equal(masked.received,30);assert.equal(masked.participants,30);assert.equal(masked.counts,null);
 const revealed=await call(prefix+'/control',{token:key,body:{command:'reveal'}});
 assert.deepEqual(revealed.counts,[9,11,10],'Changer une réponse doit remplacer le vote précédent');
 await call(prefix+'/vote',{token:players[1].token,body:{index:0,choice:2},status:409});
 const studentResults=await call(prefix+'/state',{token:players[0].token});
 assert.equal(studentResults.counts,undefined,'Les agrégats sont réservés à l’animateur');
 await call(prefix+'/control',{token:key,body:{command:'next'}});
 await call(prefix+'/vote',{token:players[0].token,body:{index:0,choice:0},status:409});
 await call(prefix+'/vote',{token:players[0].token,body:{index:1,choice:2}});
 await call(prefix+'/control',{token:key,body:{command:'reveal'}});
 await call(prefix+'/control',{token:key,body:{command:'next'}});
 await call(prefix+'/control',{token:key,body:{command:'reveal'}});
 const done=await call(prefix+'/control',{token:key,body:{command:'finish'}});
 assert.equal(done.phase,'finished');assert.equal(done.history.length,3);
 assert.equal(done.history[2].received,0,'Une question sans vote ne doit pas inventer de réponses');
 await call(prefix+'/join',{body:{},status:409});
 // A fresh room is isolated from all the responses of the preceding session.
 const second=await call('/api/sessions',{token:key,body:{},status:201});
 const empty=await call('/api/sessions/'+second.code+'/results',{token:key});
 assert.equal(empty.received,0);assert.equal(empty.participants,0);
 for(let i=0;i<5;i++)await call('/api/login',{body:{password:'wrong'},ip:'192.0.2.99',status:401});
 await call('/api/login',{body:{password},ip:'192.0.2.99',status:429});
 await call('/api/login',{body:{password},ip:'192.0.2.100'});
 console.log('Votes collectifs : 30 participants simultanés, comptage exact, modification sans doublon, séparation des séances, votes fermés et droits animateur vérifiés.');
}finally{await mf.dispose();}
