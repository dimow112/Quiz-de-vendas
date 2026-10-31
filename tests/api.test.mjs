import test from 'node:test';
import assert from 'node:assert/strict';
import quiz from '../netlify/functions/quiz.mjs';
import admin from '../netlify/functions/admin.mjs';
Object.assign(process.env,{SUPABASE_URL:'https://database.invalid',SUPABASE_SERVICE_ROLE_KEY:'test-service',SUPABASE_ANON_KEY:'test-anon',ADMIN_USER_ID:'admin-id'});
const nativeFetch=globalThis.fetch;
const request=(path,data,cookie)=>new Request(`https://quiz.invalid/api/${path}`,{method:data?'POST':'GET',headers:{Origin:'https://quiz.invalid','Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:data?JSON.stringify(data):undefined});
const attempt={id:'30a9c45f-c721-41bb-b631-a974b9c92c67',token:'a'.repeat(64)};
test('public API rejects foreign origin, invalid alternatives and score injection is not forwarded',async()=>{
 assert.equal((await quiz(new Request('https://quiz.invalid/api/quiz',{method:'POST',headers:{origin:'https://other.invalid'}}))).status,403);
 assert.equal((await quiz(request('quiz',{...attempt,action:'answer',index:8,choice:0}))).status,400);
 let payload;
 globalThis.fetch=async(url,options)=>{payload=JSON.parse(options.body);return Response.json(true);};
 try{
 assert.equal((await quiz(request('quiz',{...attempt,action:'answer',index:0,choice:1,score:999}))).status,200);
 assert.equal(payload.p_choice,1);assert.equal(payload.p_index,0);assert.equal(payload.score,undefined);
 assert.notEqual(payload.p_token_hash,attempt.token);assert.match(payload.p_token_hash,/^[a-f0-9]{64}$/);
 }finally{globalThis.fetch=nativeFetch;}
});
test('anonymous and non-admin users cannot read records',async()=>{
 assert.equal((await admin(request('admin/records'))).status,401);
 let calls=0;globalThis.fetch=async()=>{calls++;return Response.json({id:'other-user'});};
 try{assert.equal((await admin(request('admin/records',null,'__Secure-quiz_admin=token'))).status,403);assert.equal(calls,1);}
 finally{globalThis.fetch=nativeFetch;}
});
test('only configured admin receives a secure cookie; token never returned in JSON',async()=>{
 globalThis.fetch=async()=>Response.json({user:{id:'other-user'},access_token:'secret'});
 try{
 assert.equal((await admin(request('admin/login',{email:'admin@test.invalid',password:'test'}))).status,403);
 globalThis.fetch=async()=>Response.json({user:{id:'admin-id'},access_token:'secret',expires_in:3600});
 const response=await admin(request('admin/login',{email:'admin@test.invalid',password:'test'}));
 assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true});
 for(const flag of ['HttpOnly','Secure','SameSite=Strict','Path=/api/admin'])assert.ok(response.headers.get('set-cookie').includes(flag));
 const logout=await admin(request('admin/logout',{}));assert.match(logout.headers.get('set-cookie'),/Max-Age=0/);
 }finally{globalThis.fetch=nativeFetch;}
});
test('admin is verified before records; database failures disclose no credentials',async()=>{
 const calls=[];
 globalThis.fetch=async(url,options)=>{calls.push(url);return url.endsWith('/auth/v1/user')?Response.json({id:'admin-id'}):Response.json({started:1,completed:0,records:[]});};
 try{
 const response=await admin(request('admin/records?page=0',null,'__Secure-quiz_admin=token'));
 assert.equal(response.status,200);assert.equal(calls.length,2);assert.ok(calls[0].endsWith('/auth/v1/user'));
 globalThis.fetch=async()=>{throw new Error('test-service');};
 const failure=await quiz(request('quiz',{...attempt,action:'start'}));assert.equal(failure.status,503);assert.ok(!(await failure.text()).includes('test-service'));
 }finally{globalThis.fetch=nativeFetch;}
});
