import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
const code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const nodes=new Map(),listeners=new Map(),storage=new Map();
class Element{
 constructor(id=''){this.id=id;this.textContent='';this.hidden=false;this.style={};this.dataset={};this.value='';this.checked=false;this.tagName='DIV';this.attrs={};this._html='';this.className='';this.offsetParent={};this.classList={add(){},remove(){},toggle(){}};}
 set innerHTML(v){this._html=v;for(const m of v.matchAll(/\bid="([^"]+)"/g)){if(!nodes.has('#'+m[1]))nodes.set('#'+m[1],new Element(m[1]));}}
 get innerHTML(){return this._html;}
 addEventListener(k,v){listeners.set(this.id+':'+k,v);}
 setAttribute(k,v){this.attrs[k]=v;}
 focus(){}
 querySelectorAll(){return [];}
}
for(const m of html.split('<script>')[0].matchAll(/\bid="([^"]+)"/g))nodes.set('#'+m[1],new Element(m[1]));
for(const s of ['[data-action="project"]','.video-player','#modal .close'])nodes.set(s,new Element());
const document={querySelector:s=>nodes.get(s)||null,querySelectorAll:()=>[],addEventListener:(k,v)=>listeners.set(k,v),activeElement:new Element(),documentElement:{requestFullscreen:async()=>{}},body:new Element(),fullscreenElement:null};
const context=vm.createContext({document,window:{scrollTo(){},addEventListener(){}},location:{hash:''},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},setInterval(){},setTimeout(){},clearTimeout(){},Intl,URL,console,Date});
vm.runInContext(code,context);
const run=s=>vm.runInContext(s,context);
const check=(s,message)=>assert.ok(run(s),message);
run("navigate('accueil');action('party-reset')");
assert.ok(nodes.get('#main').innerHTML.includes('Merci pour votre présentation.'));
assert.ok(!nodes.get('#main').innerHTML.includes('La promotion vous confie'));
assert.ok(nodes.get('#main').innerHTML.includes('href="animateur.html#game=beaujolais"'),'Bienvenue ouvre explicitement le questionnaire initial');
run("action('party-intro')");
assert.ok(nodes.get('#main').innerHTML.includes('la soirée Beaujolais'));
run("action('party-start')");
for(let step=1;step<=3;step++){
 check(`state.partyStep===${step}`,'Progression du défi Beaujolais');
 assert.ok(!nodes.get('#main').innerHTML.includes('class="party-debrief"'),'Discussion masquée avant révélation');
 run("action('party-debrief')");
 assert.ok(nodes.get('#main').innerHTML.includes(run('PARTY[state.partyStep-1].debrief')));
 run("action('party-next')");
}
assert.ok(nodes.get('#main').innerHTML.includes('Vous venez de définir une Agentic Enterprise.'));
run("action('party-prev')");
assert.ok(nodes.get('#main').innerHTML.includes('Nouveau total : 960 €'));
run("action('party-reset')");
check('state.partyStep===0&&Object.keys(state.partyVotes).length===0&&Object.keys(state.partyDebriefs).length===0','Remise à zéro du défi');
for(const route of ['accueil','frise','enterprise','ai-world','scm','deleguer','demos','atelier','parcours']){
 run(`navigate('${route}')`);
 assert.ok(nodes.get('#main').innerHTML.length>100,route+' doit contenir du contenu');
}
run("navigate('ai-world')");
for(let i=0;i<5;i++){run(`state.feature=${i};render()`);assert.ok(nodes.get('#main').innerHTML.includes(run('FEATURES[state.feature].title')));}
// Régression : les chapitres YouTube ne sont pas les repères du contenu réel.
check('FEATURE_VIDEOS[3].start===1917&&FEATURE_VIDEOS[3].end===1985','Companion : définition à 31:57');
check('FEATURE_VIDEOS[1].start===140&&FEATURE_VIDEOS[1].end===203','Applications agentiques : définition à 2:20');
check('FEATURE_VIDEOS[2].start===558&&FEATURE_VIDEOS[2].end===690','Claw : architecture et autorité à 9:18');
check('FEATURE_VIDEOS[4].start===2187&&FEATURE_VIDEOS[4].end===2347','Agentic Home : démo complète à 36:27');
for(let i=0;i<5;i++){
 run(`state.feature=${i};render();action('feature-video-load')`);
 const src=nodes.get('#feature-player').innerHTML;
 assert.ok(src.includes('start='+run('FEATURE_VIDEOS[state.feature].start')));
 const end=run('FEATURE_VIDEOS[state.feature].end');if(end)assert.ok(src.includes('end='+end));
}
run("navigate('scm')");
for(let i=0;i<6;i++){run(`state.module=${i};render()`);assert.ok(nodes.get('#main').innerHTML.includes(run('MODULES[state.module].question')));}
run("navigate('deleguer')");
assert.ok(nodes.get('#main').innerHTML.includes('Oracle Fusion Cloud SCM'));
assert.ok(!nodes.get('#main').innerHTML.includes('id="outcome-layer"'),'Le socle SCM apparaît seul au départ');
for(const domain of ['Concevoir','Planifier','Acheter','Produire','Promettre','Livrer'])assert.ok(nodes.get('#main').innerHTML.includes(domain));
run("action('outcome-toggle')");assert.ok(nodes.get('#main').innerHTML.includes('id="outcome-layer"'));
assert.ok(nodes.get('#main').innerHTML.includes('Fusion Claw'));
assert.ok(nodes.get('#main').innerHTML.includes('AI Agent Studio'));
assert.ok(nodes.get('#main').innerHTML.includes('Oracle Fusion Cloud SCM'),'Le socle reste visible sous la couche');
run("action('outcome-replay')");check('state.outcomeLayer===true','Rejouer conserve la couche');
run("action('outcome-toggle')");assert.ok(!nodes.get('#main').innerHTML.includes('id="outcome-layer"'));
run("navigate('atelier')");
assert.ok(nodes.get('#main').innerHTML.includes('Et vous, demain ?'));
assert.ok(!nodes.get('#main').innerHTML.includes('TECHINDUS'));
check('FUTURE_ROLES.length===5','Les cinq rôles cités dans le PDF');
for(let i=0;i<5;i++){run(`state.career=${i};render()`);assert.ok(nodes.get('#main').innerHTML.includes(run('FUTURE_ROLES[state.career].original')));assert.ok(nodes.get('#main').innerHTML.includes(run('FUTURE_ROLES[state.career].human')));}
assert.ok(nodes.get('#main').innerHTML.includes('p. 8–9'));
for(const a of ['help','sources','transverse','pause','fin']){run(`action('${a}')`);assert.ok(nodes.get('#modal').innerHTML.includes('modalTitle'),a+' : fenêtre nommée');run('closeModal()');}
for(let i=0;i<3;i++){run(`demoModal(${i},false)`);for(let s=0;s<3;s++){run(`state.demoStep=${s};drawDemo()`);assert.ok(nodes.get('#modal').innerHTML.includes(run('DEMOS[state.demo].explain[state.demoStep]')));}run(`demoModal(${i},true)`);assert.ok(!nodes.get('#modal').innerHTML.includes('<iframe'),'Vidéo chargée uniquement au clic');run("action('video-load')");assert.ok(nodes.get('.video-player').innerHTML.includes('youtube-nocookie.com'));run('closeModal()');}
check('Object.keys(SOURCES).length===25','25 références officielles');
run("navigate('frise');state.timelineStep=0;render()");
for(let i=0;i<7;i++){check(`state.timelineStep===${i}`,'Index du jalon');assert.ok(nodes.get('#main').innerHTML.includes(run('TIMELINE[state.timelineStep].meaning')));if(i<6)run("action('time-next')");}
assert.ok(nodes.get('#main').innerHTML.includes('Vers l’Agentic Enterprise'));
run("action('time-overview')");check('state.timelineOverview===true','Vue d’ensemble');
run("action('time-prev')");check('state.timelineStep===5','Recul dans la frise');
check('TIMELINE.every((m,i)=>i===0||m.iso>TIMELINE[i-1].iso)','Ordre chronologique des annonces');
run("navigate('enterprise')");for(let i=0;i<3;i++){run(`state.enterpriseView=${i};render()`);assert.ok(nodes.get('#main').innerHTML.includes(['Les documents fixent les engagements.','Le cadre devient exploitable par les agents.','Les agents échangent dans ce cadre.'][i]));assert.ok(nodes.get('#main').innerHTML.includes('data:image/svg+xml;base64,'),'Schéma embarqué');}
run('state.enterpriseView=2;state.enterpriseException=false;render()');
assert.ok(nodes.get('#main').innerHTML.includes('Offre à 1 650 €'));
const normalImage=run('ENTERPRISE_IMAGES.agents');
assert.ok(Buffer.from(normalImage.split(',')[1],'base64').toString().includes('1 650 €'));
run('state.enterpriseException=true;render()');
assert.ok(nodes.get('#main').innerHTML.includes(run('ENTERPRISE_IMAGES.exception')));
assert.ok(Buffer.from(run('ENTERPRISE_IMAGES.exception').split(',')[1],'base64').toString().includes('validation humaine'));
for(const a of ['enterprise-trust','enterprise-image']){run(`action('${a}')`);assert.ok(nodes.get('#modal').innerHTML.includes('modalTitle'));run('closeModal()');}
for(const a of ['opening-script','enterprise-source']){run(`action('${a}')`);assert.ok(nodes.get('#modal').innerHTML.includes('modalTitle'));run('closeModal()');}
check('Object.values(SOURCES).every(s=>new URL(s[1]).protocol==="https:")','Sources HTTPS');
assert.ok(!/__(HERO|SOURCES)__/.test(html),'Aucun emplacement incomplet');
assert.equal((html.match(/<script>/g)||[]).length,1,'Un script embarqué');
assert.ok(!/<script[^>]*src=|<link[^>]*href=/.test(html),'Aucune dépendance réseau au chargement');
check('MORNING_AGENDA[0].start===540&&MORNING_AGENDA.at(-1).end===720','De 9 h à 12 h');
check('MORNING_AGENDA.every((r,i)=>r.end>r.start&&(i===0||r.start===MORNING_AGENDA[i-1].end))','Agenda sans trous ni chevauchements');
check('MORNING_AGENDA.reduce((n,r)=>n+r.end-r.start,0)===180','180 minutes dans le véritable agenda');
check("MORNING_AGENDA.some(r=>r.route==='ai-world')&&MORNING_AGENDA.some(r=>r.route==='enterprise')",'Annonces et Agentic Enterprise présentes');
check("MORNING_AGENDA.find(r=>r.route==='demos').end-MORNING_AGENDA.find(r=>r.route==='demos').start===40",'40 minutes pour humain, IA et bilan');
check("MORNING_AGENDA.find(r=>r.route==='frise').end-MORNING_AGENDA.find(r=>r.route==='frise').start===20",'ChatGPT : 20 minutes');
check("MORNING_AGENDA.find(r=>r.route==='enterprise').end-MORNING_AGENDA.find(r=>r.route==='enterprise').start===20",'Agentic Enterprise : 20 minutes');
run("navigate('parcours')");assert.ok(nodes.get('#main').innerHTML.includes('Et vous, demain ?'));run("action('pause')");assert.ok(nodes.get('#modal').innerHTML.includes('Reprise à 11 h'));run('closeModal()');
console.log('Contrôles réussis :9 espaces,7 jalons,3 vues Agentic Enterprise illustrées,4 schémas embarqués,2 offres et escalade humaine,agrandissement des images,5 annonces,6 domaines,vue Record → Outcome illustrée,5 métiers issus du PDF,25 sources et180 minutes.');
console.log('Ces contrôles de logique et de contenu ne remplacent pas un rendu dans un navigateur.');
