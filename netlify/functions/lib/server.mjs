export function config() {
  const {SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, ADMIN_USER_ID} = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY || !ADMIN_USER_ID) throw new Error('configuration');
  const url = new URL(SUPABASE_URL);
  if (url.protocol !== 'https:') throw new Error('configuration');
  return {url:url.origin, service:SUPABASE_SERVICE_ROLE_KEY, anon:SUPABASE_ANON_KEY, admin:ADMIN_USER_ID};
}
export function json(status, data, extra={}) {
  return new Response(JSON.stringify(data), {status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...extra}});
}
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  return !!origin && origin === new URL(request.url).origin;
}
export async function body(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new Error('input');
  const raw = await request.text();
  if (raw.length > 4096) throw new Error('input');
  return JSON.parse(raw);
}
export async function upstream(url, options) {
  return fetch(url,{...options,signal:AbortSignal.timeout(10000)});
}
export async function rpc(name, args) {
  const c=config();
  const response=await upstream(`${c.url}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:c.service,Authorization:`Bearer ${c.service}`,'Content-Type':'application/json'},body:JSON.stringify(args)});
  if (!response.ok) throw new Error('database');
  return response.json();
}
