import assert from 'node:assert/strict';
import {createSession,validSession,passwordMatches} from '../live/auth.mjs';
const env={SESSION_KEY:'test-signing-secret-32-characters-long',ADMIN_PASSWORD:'test-only-password-not-for-deployment'};
const now=1793780000000;
assert.equal(await passwordMatches(env.ADMIN_PASSWORD,env.ADMIN_PASSWORD),true);
assert.equal(await passwordMatches('wrong',env.ADMIN_PASSWORD),false);
for(const remember of [false,true]){
 const s=await createSession(env,remember,now);
 assert.equal(await validSession(s.token,env,now),true);
 assert.equal(await validSession(s.token,env,s.expires),false);
 assert.equal(await validSession(s.token,{...env,ADMIN_PASSWORD:'a-new-password-revokes-sessions'},now),false);
 assert.equal(await validSession(s.token.slice(0,-10)+'tampered',env,now),false);
 assert.equal(s.expires-now,(remember?7*24:12)*60*60*1000);
}
assert.equal(await validSession('not-a-session',env,now),false);
console.log('Authentification : mot de passe, signature des sessions, expiration, falsification et révocation après changement du mot de passe vérifiés.');
