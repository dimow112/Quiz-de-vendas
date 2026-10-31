import {json, sameOrigin, body, config, upstream, rpc} from './lib/server.mjs';
const cookieName='__Secure-quiz_admin';
const cookie=(value,age)=>`${cookieName}=${value}; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=${age}`;
export default async function handler(request) {
  const path=new URL(request.url).pathname;
  const action=path.split('/').filter(Boolean).at(-1);
  if (!['login','logout','records'].includes(action)) return json(404,{error:'Não encontrado.'});
  if (action==='records' ? request.method!=='GET' : request.method!=='POST') return json(405,{error:'Método não permitido.'});
  if(request.method==='POST' && !sameOrigin(request)) return json(403,{error:'Origem não permitida.'});
  if(action==='logout') return json(200,{ok:true},{'Set-Cookie':cookie('',0)});
  try {
    const c=config();
    if(action==='login') {
      let credentials;
      try {credentials=await body(request);} catch {return json(400,{error:'Dados inválidos.'});}
      if(!credentials || typeof credentials.email!=='string'||typeof credentials.password!=='string'||credentials.email.length>254||credentials.password.length>512) return json(400,{error:'Dados inválidos.'});
      const response=await upstream(`${c.url}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:c.anon,'Content-Type':'application/json'},body:JSON.stringify({email:credentials.email,password:credentials.password})});
      if(!response.ok) return json(401,{error:'Acesso não autorizado.'});
      const session=await response.json();
      if(session.user?.id!==c.admin || !session.access_token) return json(403,{error:'Acesso não autorizado.'});
      return json(200,{ok:true},{'Set-Cookie':cookie(session.access_token,Math.min(session.expires_in||3600,3600))});
    }
    const token=request.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith(`${cookieName}=`))?.slice(cookieName.length+1);
    if(!token) return json(401,{error:'Entre novamente para acessar o painel.'});
    const userResponse=await upstream(`${c.url}/auth/v1/user`,{headers:{apikey:c.anon,Authorization:`Bearer ${token}`}});
    if(!userResponse.ok) return json(401,{error:'Sessão expirada. Entre novamente.'});
    const user=await userResponse.json();
    if(user.id!==c.admin) return json(403,{error:'Acesso não autorizado.'});
    const page=Number(new URL(request.url).searchParams.get('page')||0);
    if(!Number.isSafeInteger(page)||page<0||page>1000000) return json(400,{error:'Página inválida.'});
    return json(200,await rpc('quiz_admin_records',{p_page:page}));
  } catch {return json(503,{error:'Painel indisponível. Confira a configuração do servidor.'});}
}
