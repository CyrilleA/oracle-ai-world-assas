export function hostEntry(params,load){
 const game=['beaujolais','scm','supply'].includes(params.get('game'))?params.get('game'):null;
 const previousKind=load('assas-active-kind')||'quiz',kind=game?(game==='supply'?'supply':'quiz'):previousKind;
 const code=params.get('r')||(game?load('assas-active-session-'+game)||(kind===previousKind?load('assas-active-session'):''):load('assas-active-session'))||'';
 return {game,kind,code};
}
