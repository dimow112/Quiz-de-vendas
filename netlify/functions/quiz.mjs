import {createHash} from 'node:crypto';
import {json, sameOrigin, body, rpc} from './lib/server.mjs';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export default async function handler(request) {
  if (request.method!=='POST') return json(405,{error:'Método não permitido.'},{Allow:'POST'});
  if (!sameOrigin(request)) return json(403,{error:'Origem não permitida.'});
  let input;
  try {input=await body(request);} catch {return json(400,{error:'Dados inválidos.'});}
  if (!input || typeof input !== 'object' || Array.isArray(input)) return json(400,{error:'Dados inválidos.'});
  const {action,id,token,index,choice}=input;
  if (!uuid.test(id||'') || !/^[a-f0-9]{64}$/.test(token||'') || !['start','answer','finish'].includes(action)) return json(400,{error:'Dados inválidos.'});
  if (action==='answer' && (!Number.isInteger(index)||index<0||index>7||!Number.isInteger(choice)||choice<0||choice>2)) return json(400,{error:'Resposta inválida.'});
  const args={p_id:id,p_token_hash:createHash('sha256').update(token).digest('hex')};
  if(action==='answer') Object.assign(args,{p_index:index,p_choice:choice});
  try {
    const result=await rpc(`quiz_${action}`,args);
    return result ? json(200,{saved:true}) : json(409,{error:'Participação inválida ou fora de ordem.'});
  } catch {return json(503,{error:'Registro temporariamente indisponível.'});}
}
