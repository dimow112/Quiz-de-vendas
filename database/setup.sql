-- Execute no SQL Editor de um projeto Supabase. Não contém credenciais.
create table if not exists public.quiz_attempts (
  id uuid primary key,
  token_hash text not null,
  quiz_version text not null default 'v1',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  answers smallint[] not null default '{}',
  score smallint not null default 0 check (score between 0 and 80),
  check (cardinality(answers) <= 8)
);
alter table public.quiz_attempts enable row level security;
revoke all on public.quiz_attempts from public, anon, authenticated;
create index if not exists quiz_attempts_started_idx on public.quiz_attempts(started_at desc, id);

create or replace function public.quiz_start(p_id uuid, p_token_hash text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  insert into public.quiz_attempts(id,token_hash) values(p_id,p_token_hash) on conflict(id) do nothing;
  return exists(select 1 from public.quiz_attempts where id=p_id and token_hash=p_token_hash);
end; $$;

create or replace function public.quiz_answer(p_id uuid,p_token_hash text,p_index integer,p_choice integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare r public.quiz_attempts; keys integer[] := array[1,0,2,1,0,2,0,1];
begin
  if p_index not between 0 and 7 or p_choice not between 0 and 2 then return false; end if;
  select * into r from public.quiz_attempts where id=p_id and token_hash=p_token_hash for update;
  if not found then return false; end if;
  if cardinality(r.answers)>p_index then return r.answers[p_index+1]=p_choice; end if;
  if r.completed_at is not null or cardinality(r.answers)<>p_index then return false; end if;
  update public.quiz_attempts set answers=array_append(answers,p_choice::smallint),
    score=score+case when keys[p_index+1]=p_choice then 10 else 0 end where id=p_id;
  return true;
end; $$;

create or replace function public.quiz_finish(p_id uuid,p_token_hash text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update public.quiz_attempts set completed_at=coalesce(completed_at,now())
    where id=p_id and token_hash=p_token_hash and cardinality(answers)=8;
  return found;
end; $$;

create or replace function public.quiz_admin_records(p_page integer default 0)
returns jsonb language sql security definer set search_path = '' as $$
  select jsonb_build_object(
    'started',(select count(*) from public.quiz_attempts),
    'completed',(select count(*) from public.quiz_attempts where completed_at is not null),
    'records',coalesce((select jsonb_agg(to_jsonb(r)) from (
      select id,quiz_version,started_at,completed_at,score,answers from public.quiz_attempts
      order by started_at desc,id limit 25 offset (greatest(p_page,0)::bigint*25)
    ) r),'[]'::jsonb)
  );
$$;
-- Somente as funções de servidor podem acessar dados. Não crie políticas públicas.
revoke all on function public.quiz_start(uuid,text) from public,anon,authenticated;
revoke all on function public.quiz_answer(uuid,text,integer,integer) from public,anon,authenticated;
revoke all on function public.quiz_finish(uuid,text) from public,anon,authenticated;
revoke all on function public.quiz_admin_records(integer) from public,anon,authenticated;
grant execute on function public.quiz_start(uuid,text) to service_role;
grant execute on function public.quiz_answer(uuid,text,integer,integer) to service_role;
grant execute on function public.quiz_finish(uuid,text) to service_role;
grant execute on function public.quiz_admin_records(integer) to service_role;
