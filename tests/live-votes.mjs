import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const key='test-only-secret-not-for-deployment';
const mf=new Miniflare(convertV4MiniflareOptions({modules:true,scriptPath:path.join(root,'.wrangler/build/worker.js'),compatibilityDate:'2026-10-01',
 durableObjects:{ROOMS:{className:'QuizRoom',useSQLite:true}},bindings:{ADMIN_KEY:key,ALLOWED_ORIGINS:'https://cyrillea.github.io'}}));
async function call(url,{token='',body,status=200,origin='https://cyrillea.github.io',method}={}){
 const r=await mf.dispatchFetch('https://quiz.test'+url,{method:method||(body?'POST':'GET'),headers:{Origin:origin,...(token?{Authorization:'Bearer '+token}:{}),'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 assert.equal(r.status,status,`${url} doit retourner ${status}`);return r.json();
}
try{
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
 console.log('Votes collectifs : 30 participants simultanés, comptage exact, modification sans doublon, séparation des séances, votes fermés et droits animateur vérifiés.');
}finally{await mf.dispose();}
