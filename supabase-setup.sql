-- IA Lab. Run in the Supabase SQL Editor as the project administrator.
-- Rerunnable; never drops existing user content.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check(char_length(display_name) between 2 and 50),
 created_at timestamptz not null default now()
);
create table if not exists public.ai_conversations (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now()
);
create table if not exists public.ai_messages (
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
 role text not null check(role in ('user','assistant')),
 content text not null check(char_length(content) between 1 and 5000),
 created_at timestamptz not null default now()
);
create index if not exists ai_conversations_user_idx on public.ai_conversations(user_id,created_at);
create index if not exists ai_messages_conversation_idx on public.ai_messages(conversation_id,created_at);
create table if not exists private.demo_access (
 user_id uuid primary key references auth.users(id) on delete cascade,
 expires_at timestamptz not null
);
create table if not exists private.request_events (
 scope text not null,
 kind text not null check(kind in ('login','chat')),
 created_at timestamptz not null default now()
);
create index if not exists request_events_scope_idx on private.request_events(kind,scope,created_at);
alter table public.profiles enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table private.demo_access enable row level security;
alter table private.request_events enable row level security;
revoke all on public.profiles,public.ai_conversations,public.ai_messages from anon,authenticated;
grant select,update on public.profiles to authenticated;
grant select,delete on public.ai_conversations to authenticated;
grant select on public.ai_messages to authenticated;
drop policy if exists profiles_read_own on public.profiles;
create policy profiles_read_own on public.profiles for select to authenticated using(id=(select auth.uid()));
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
drop policy if exists conversations_read_own on public.ai_conversations;
create policy conversations_read_own on public.ai_conversations for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists conversations_delete_own on public.ai_conversations;
create policy conversations_delete_own on public.ai_conversations for delete to authenticated using(user_id=(select auth.uid()));
drop policy if exists messages_read_own on public.ai_messages;
create policy messages_read_own on public.ai_messages for select to authenticated using(exists(select 1 from public.ai_conversations c where c.id=conversation_id and c.user_id=(select auth.uid())));
-- Only the Edge Function's service role grants classroom access.
create or replace function public.register_demo_user(p_user_id uuid,p_name text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if char_length(trim(p_name)) not between 2 and 50 then raise exception 'invalid name';end if;
 insert into public.profiles(id,display_name) values(p_user_id,trim(p_name)) on conflict(id) do update set display_name=excluded.display_name;
 insert into private.demo_access(user_id,expires_at) values(p_user_id,now()+interval '12 hours') on conflict(user_id) do update set expires_at=excluded.expires_at;
end;$$;
revoke all on function public.register_demo_user(uuid,text) from public,anon,authenticated;
grant execute on function public.register_demo_user(uuid,text) to service_role;
-- Durable and atomic limits across Edge Function instances.
create or replace function public.consume_demo_login(p_scope text)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(73600401);
 delete from private.request_events where created_at<now()-interval '1 day';
 if (select count(*) from private.request_events where kind='login' and scope=p_scope and created_at>now()-interval '10 minutes')>=10
 or (select count(*) from private.request_events where kind='login' and created_at>now()-interval '1 hour')>=200 then return false;end if;
 insert into private.request_events(scope,kind) values(p_scope,'login');return true;
end;$$;
revoke all on function public.consume_demo_login(text) from public,anon,authenticated;
grant execute on function public.consume_demo_login(text) to service_role;
create or replace function public.consume_ai_quota()
returns boolean language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();
begin
 if uid is null or not exists(select 1 from private.demo_access where user_id=uid and expires_at>now()) then return false;end if;
 perform pg_advisory_xact_lock(73600402);
 delete from private.request_events where created_at<now()-interval '1 day';
 if (select count(*) from private.request_events where kind='chat' and scope=uid::text and created_at>now()-interval '1 minute')>=10
 or (select count(*) from private.request_events where kind='chat' and scope=uid::text and created_at>now()-interval '1 day')>=100
 or (select count(*) from private.request_events where kind='chat' and created_at>now()-interval '1 hour')>=1000 then return false;end if;
 insert into private.request_events(scope,kind) values(uid::text,'chat');return true;
end;$$;
revoke all on function public.consume_ai_quota() from public,anon;
grant execute on function public.consume_ai_quota() to authenticated;
-- One RPC saves both messages atomically and checks conversation ownership.
create or replace function public.save_chat_turn(p_conversation_id uuid,p_prompt text,p_reply text)
returns uuid language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();cid uuid:=p_conversation_id;
begin
 if uid is null or not exists(select 1 from private.demo_access where user_id=uid and expires_at>now()) then raise exception 'access denied';end if;
 if char_length(p_prompt) not between 1 and 1500 or char_length(p_reply) not between 1 and 5000 then raise exception 'invalid message';end if;
 if cid is null then
  if (select count(*) from public.ai_conversations where user_id=uid)>=100 then raise exception 'conversation limit';end if;
  insert into public.ai_conversations(user_id) values(uid) returning id into cid;
 elsif not exists(select 1 from public.ai_conversations where id=cid and user_id=uid) then raise exception 'conversation denied';end if;
 insert into public.ai_messages(conversation_id,role,content,created_at) values(cid,'user',p_prompt,clock_timestamp()),(cid,'assistant',p_reply,clock_timestamp()+interval '1 microsecond');
 return cid;
end;$$;
revoke all on function public.save_chat_turn(uuid,text,text) from public,anon;
grant execute on function public.save_chat_turn(uuid,text,text) to authenticated;
commit;
