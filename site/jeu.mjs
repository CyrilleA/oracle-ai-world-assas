import {esc,configuration,api,save,load,roomCode,validRoom} from './live-common.mjs';
const main=document.querySelector('#student'),network=document.querySelector('#network');
let base='',code=roomCode(new URLSearchParams(location.hash.slice(1)).get('r')),token='',current=null,last='',busy=false,stopped=false;
function joinForm(message=''){
 main.innerHTML=`<div class="eyebrow">À vous de jouer</div><h1>La soirée Beaujolais.</h1><p>Entrez le code affiché par votre animateur.</p>${message?`<p class="error">${esc(message)}</p>`:''}<form class="join-form"><label for="room">Code de la séance</label><br><input id="room" maxlength="8" required autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABCDEFGH"><br><button class="btn primary">Rejoindre le jeu →</button></form>`;
 main.querySelector('form').addEventListener('submit',e=>{e.preventDefault();const candidate=roomCode(main.querySelector('input').value);if(!validRoom(candidate)){joinForm('Le code doit contenir les 8 caractères affichés par votre animateur.');return;}code=candidate;location.hash='r='+code;join();});
}
async function join(){
 try{base=base||await configuration();token=load('assas-player-'+code)||'';const p=await api(base,`/api/sessions/${code}/join`,{token,body:{}});token=p.token;save('assas-player-'+code,token);stopped=false;await poll();}
 catch(e){network.textContent='Connexion à réessayer';joinForm(e.message);}
}
function render(s){
 if(s.phase==='waiting'&&s.game==='scm'){main.innerHTML='<div class="eyebrow">Découverte SCM · 6 étapes</div><h1>Mission : 80 coffrets.</h1><img class="student-art" src="coffrets.svg" width="420" height="290" alt="Préparer et livrer 80 coffrets pour la soirée Beaujolais"><p>Votre mission : préparer et livrer 80 coffrets pour la soirée Beaujolais. Choisissez comment vous organiser à chaque étape.</p><div class="status">L’animateur va ouvrir la première question. Gardez cette page ouverte.</div>';return;}
 if(s.phase==='waiting'){main.innerHTML='<div class="eyebrow">Vous êtes dans la séance</div><h1>La soirée se prépare.</h1><div class="card"><p>Votre participation est enregistrée. Le jeu commencera lorsque l’animateur ouvrira la première question.</p></div>';return;}
 if(s.phase==='results'){main.innerHTML='<div class="eyebrow">Vote terminé</div><h1>Place à la discussion.</h1><div class="card"><p>Regardez l’écran de l’animateur pour découvrir les réponses du groupe et en discuter ensemble.</p><p>La prochaine question apparaîtra ici lorsqu’elle sera ouverte.</p></div>';return;}
 if(s.phase==='finished'&&s.game==='scm'){main.innerHTML='<div class="eyebrow">Mission terminée</div><h1>80 coffrets. Toute une chaîne.</h1><div class="card"><p>Regardez l’écran de l’animateur pour découvrir le parcours complet et en discuter ensemble.</p></div>';return;}
 if(s.phase==='finished'){main.innerHTML='<div class="eyebrow">Merci pour votre participation</div><h1>Qu’avez-vous choisi de déléguer ?</h1><div class="card"><p>Le questionnaire est terminé. Poursuivons la discussion avec l’animateur. Gardez cette page ouverte pour le prochain jeu.</p></div>';return;}
 const q=s.question;
 main.innerHTML=`<div class="eyebrow">${s.game==='scm'?'Étape':'Décision'} ${s.index+1} / ${s.total||3} · ${esc(q.title)}</div><h1>À vous de décider.</h1><p class="context">${esc(q.context)}</p><p class="question">${esc(q.question)}</p><div class="votes">${q.options.map((o,i)=>`<button data-choice="${i}" aria-pressed="${s.answer===i}">${s.answer===i?'✓ ':''}${esc(o)}</button>`).join('')}</div><div id="feedback" role="status" class="status">${s.answer===null?'Choisissez une réponse.': 'Réponse enregistrée. Vous pouvez la modifier tant que le vote reste ouvert.'}</div>`;
 main.querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>vote(Number(b.dataset.choice))));
}
async function vote(choice){
 if(busy)return;busy=true;main.querySelectorAll('[data-choice]').forEach(b=>b.disabled=true);
 try{await api(base,`/api/sessions/${code}/vote`,{token,body:{index:current.index,choice,game:current.game||'beaujolais'}});current.answer=choice;last=JSON.stringify(current);render(current);}
 catch(e){const f=document.querySelector('#feedback');if(f)f.textContent='Réponse non confirmée : '+e.message;last='';}
 finally{busy=false;main.querySelectorAll('[data-choice]').forEach(b=>b.disabled=false);}
}
async function poll(){
 try{const s=await api(base,`/api/sessions/${code}/state`,{token});if(!s.joined){stopped=true;joinForm('Votre accès à cette séance a expiré. Rejoignez-la à nouveau.');return;}network.textContent='Connecté · Séance '+code;current=s;const signature=JSON.stringify(s);if(last!==signature&&!busy){last=signature;render(s);}}
 catch(e){network.textContent='Connexion interrompue · Nouvelle tentative…';if(e.status===404){stopped=true;joinForm(e.message);}}
 finally{if(!stopped)setTimeout(poll,4500+Math.random()*1000);}
}
if(validRoom(code))join();else{network.textContent='Accès au jeu';joinForm();}
