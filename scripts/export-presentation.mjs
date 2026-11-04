// Evaluate the self-contained portal with the same minimal DOM as its smoke check.
import fs from 'node:fs';
import vm from 'node:vm';
const test=fs.readFileSync(new URL('../tests/portal-smoke.mjs',import.meta.url),'utf8');
const harness=test.slice(test.indexOf('const html='),test.indexOf('run("navigate(\'accueil\')'));
const scope=vm.createContext({fs,vm,URL,console,Buffer,importMetaUrl:import.meta.url});
vm.runInContext(harness.replaceAll('import.meta.url','importMetaUrl'),scope);
const run=s=>vm.runInContext(`run(${JSON.stringify(s)})`,scope);
const cards=[];
function add(section,expression){cards.push({section,html:run(expression)});}
add('Bienvenue',"home()");
for(let i=0;i<4;i++)add('D’où vient la supply chain ?',`state.supplyHistoryStep=${i};supplyHistory()`);
for(const [section,key,fn] of [['De ChatGPT à aujourd’hui','timelineAI','timeline'],['Agentic Enterprise','enterprise','enterprise'],['Oracle : infrastructure et data centers','infra','oracleInfrastructure'],['Les métiers Oracle SCM','modules','scm'],['Oracle AI World','features','aiWorld'],['System of Record → System of Outcome','record','delegate'],['Jeu Supply Chain','game','demos'],['Et vous, demain ?','careers','futureCareers']]){
 const deck=run(`LESSON_DECKS[${JSON.stringify(key)}]`);
 for(let i=0;i<deck.total;i++)add(section,`state[${JSON.stringify(deck.field)}]=${key==='record'?Boolean(i):i};state.scmView=1;state.supplyHistoryDone=true;${fn}()`);
}
cards.push({section:'La matinée',html:'<article><h2>Le programme de 9 h à 12 h</h2>'+run('MORNING_AGENDA').map(r=>'<p>'+String(Math.floor(r.start/60)).padStart(2,'0')+':'+String(r.start%60).padStart(2,'0')+' - '+String(Math.floor(r.end/60)).padStart(2,'0')+':'+String(r.end%60).padStart(2,'0')+' · '+Object.entries(r).filter(([k])=>!['start','end','route'].includes(k)).map(([,v])=>v).join(' · ')+'</p>').join('')+'</article>'});
fs.writeFileSync(new URL('../tmp/pdfs/cards.json',import.meta.url),JSON.stringify(cards));
console.log(`${cards.length} cartes exportées.`);
