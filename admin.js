'use strict';
const el=id=>document.getElementById(id);
let page=0;
const date=value=>value?new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'medium',timeZone:'America/Sao_Paulo'}).format(new Date(value)):'Não finalizou';
async function api(action, data) {
 const response=await fetch(`/api/admin/${action}${action==='records'?`?page=${page}`:''}`,{method:data?'POST':'GET',credentials:'same-origin',headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(15000)});
 const result=await response.json();
 if(!response.ok){const error=new Error(result.error||'Não foi possível acessar o painel.');error.status=response.status;throw error;}
 return result;
}
function showLogin(){el('dashboard').classList.add('hidden');el('login-panel').classList.remove('hidden');el('records').replaceChildren();}
function text(tag,value){const node=document.createElement(tag);node.textContent=value;return node;}
async function load(){
 el('message').textContent='Carregando…';
 try {
  const data=await api('records');
  el('started').textContent=data.started;el('completed').textContent=data.completed;
  el('records').replaceChildren();
  for(const record of data.records){
   const card=document.createElement('details');card.className='attempt';
   card.append(text('summary',`${record.score}/80 pontos · ${record.completed_at?'Finalizada':'Em andamento'} · ${date(record.started_at)}`));
   card.append(text('small',`Participação anônima: ${record.id} · Versão: ${record.quiz_version}`));
   card.append(text('p',`Início: ${date(record.started_at)} · Fim: ${date(record.completed_at)}`));
   const list=document.createElement('ol');
   questions.forEach((question,i)=>{
    const choice=record.answers[i];
    const answer=choice===undefined?'Não respondida':`alternativa ${'ABC'[choice]} · ${question.options[choice]} · ${choice===question.correct?'Correta (+10 pontos)':'Incorreta'} · correta: ${'ABC'[question.correct]}`;
    list.append(text('li',`${question.question} Resposta: ${answer}`));
   });
   card.append(list);el('records').append(card);
  }
  if(!data.records.length)el('records').append(text('p','Nenhuma participação nesta página.'));
  el('previous').disabled=page===0;el('next-page').disabled=(page+1)*25>=Number(data.started);
  el('page-number').textContent=`Página ${page+1}`;
  el('login-panel').classList.add('hidden');el('dashboard').classList.remove('hidden');el('message').textContent='Dados atualizados.';
 }catch(error){showLogin();el('message').textContent=error.message;}
}
el('login-form').addEventListener('submit',async event=>{
 event.preventDefault();el('login-button').disabled=true;el('message').textContent='Verificando acesso…';
 try{await api('login',{email:el('email').value,password:el('password').value});el('password').value='';page=0;await load();}
 catch(error){el('message').textContent=error.message;el('password').value='';}
 finally{el('login-button').disabled=false;}
});
el('logout').onclick=async()=>{try{await api('logout',{});showLogin();el('message').textContent='Você saiu do painel.';}catch{el('message').textContent='Não foi possível sair. Tente novamente.';}};
el('refresh').onclick=load;
el('previous').onclick=()=>{if(page>0){page--;void load();}};
el('next-page').onclick=()=>{page++;void load();};
void load();
