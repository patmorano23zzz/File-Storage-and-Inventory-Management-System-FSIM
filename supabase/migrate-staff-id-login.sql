-- Run this ENTIRE file in the Supabase SQL Editor.
-- Do not execute only a selected portion; PostgreSQL dollar-quoted
-- functions must be submitted with their complete bodies.
-- This migration changes staff login from email to staff ID + password.

create or replace function public.submit_public_request(
  p_requester_name text,
  p_relationship text,
  p_contact text,
  p_student_lrn text,
  p_student_last_name text,
  p_document_type_id uuid,
  p_purpose text
)
returns table (reference_code text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if nullif(trim(p_requester_name), '') is null
     or nullif(trim(p_student_lrn), '') is null
     or nullif(trim(p_student_last_name), '') is null then
    raise exception 'Requester and student information are required';
  end if;

  return query
  insert into public.access_requests (
    requester_name, relationship, contact, student_lrn,
    student_last_name, document_type_id, purpose, source, requester_id
  )
  values (
    trim(p_requester_name), nullif(trim(p_relationship), ''),
    nullif(trim(p_contact), ''), trim(p_student_lrn),
    trim(p_student_last_name), p_document_type_id,
    nullif(trim(p_purpose), ''), 'web', null
  )
  returning public.access_requests.reference_code;
end;
$$;

revoke all on function public.submit_public_request(text, text, text, text, text, uuid, text) from public;
grant execute on function public.submit_public_request(text, text, text, text, text, uuid, text) to anon;

alter table public.profiles
  add column if not exists staff_id text;

create unique index if not exists profiles_staff_id_unique
  on public.profiles (upper(staff_id))
  where staff_id is not null;

-- Resolve a staff ID to the Auth email internally. Supabase Auth still
-- validates the password; the email is never shown by the frontend.
create or replace function public.get_login_email(p_staff_id text)
returns text
language sql
security definer
set search_path = public
as $$
  select u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where upper(trim(p.staff_id)) = upper(trim(p_staff_id))
    and p.is_active = true
  limit 1;
$$;

revoke all on function public.get_login_email(text) from public;
grant execute on function public.get_login_email(text) to anon, authenticated;

create or replace function public.list_admin_documents(p_search text default null)
returns table (
  id uuid, student_id uuid, type_id uuid, title text, school_year text,
  grade_level text, storage_path text, file_name text, mime_type text,
  file_size bigint, uploaded_by uuid, is_classified boolean,
  created_at timestamptz, updated_at timestamptz,
  document_type_code text, document_type_name text,
  student_last_name text, student_first_name text, student_lrn text,
  student_grade_level text, student_section text, uploader_name text
)
language plpgsql security definer set search_path = public as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'Administrator access required';
  end if;
  return query
  select d.id, d.student_id, d.type_id, d.title, d.school_year,
    d.grade_level, d.storage_path, d.file_name, d.mime_type, d.file_size,
    d.uploaded_by, d.is_classified, d.created_at, d.updated_at,
    dt.code, dt.name, s.last_name, s.first_name, s.lrn, s.grade_level,
    s.section, p.full_name
  from public.documents d
  left join public.document_types dt on dt.id = d.type_id
  left join public.students s on s.id = d.student_id
  left join public.profiles p on p.id = d.uploaded_by
  where p_search is null or d.title ilike '%' || p_search || '%'
  order by d.created_at desc;
end;
$$;

revoke all on function public.list_admin_documents(text) from public;
grant execute on function public.list_admin_documents(text) to authenticated;

create or replace function public.list_admin_audit_logs(p_limit integer default 50)
returns table (
  id uuid, actor_id uuid, action text, entity text, entity_id uuid,
  details jsonb, created_at timestamptz, actor_name text
)
language plpgsql security definer set search_path = public as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'Administrator access required';
  end if;
  return query
  select l.id, l.actor_id, l.action, l.entity, l.entity_id,
    l.details, l.created_at, p.full_name
  from public.audit_logs l
  left join public.profiles p on p.id = l.actor_id
  order by l.created_at desc
  limit greatest(1, least(coalesce(p_limit, 50), 500));
end;
$$;

revoke all on function public.list_admin_audit_logs(integer) from public;
grant execute on function public.list_admin_audit_logs(integer) to authenticated;

create or replace function public.list_teacher_accounts()
returns setof public.profiles
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'Administrator access required';
  end if;

  insert into public.profiles (id, staff_id, full_name, role)
  select
    u.id,
    nullif(upper(trim(u.raw_user_meta_data->>'staff_id')), ''),
    coalesce(nullif(trim(u.raw_user_meta_data->>'full_name'), ''), u.email, 'Teacher'),
    'teacher'
  from auth.users u
  where u.raw_user_meta_data->>'role' = 'teacher'
    and not exists (select 1 from public.profiles p where p.id = u.id)
  on conflict (id) do nothing;

  return query
  select p.*
  from public.profiles p
  where p.role = 'teacher'
  order by p.full_name;
end;
$$;

revoke all on function public.list_teacher_accounts() from public;
grant execute on function public.list_teacher_accounts() to authenticated;

-- Load or repair the current user's profile without depending on the
-- profiles table RLS policy. Missing profiles are created as teachers only.
create or replace function public.get_my_profile()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  user_email text;
  user_name text;
  user_staff_id text;
  profile_row public.profiles;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select email,
         coalesce(raw_user_meta_data->>'full_name', email),
         nullif(upper(trim(raw_user_meta_data->>'staff_id')), '')
    into user_email, user_name, user_staff_id
    from auth.users
    where id = current_user_id;

  insert into public.profiles (id, staff_id, full_name, role)
  values (current_user_id, user_staff_id, coalesce(user_name, user_email, 'School Staff'), 'teacher')
  on conflict (id) do nothing;

  select * into profile_row
  from public.profiles
  where id = current_user_id;

  return to_jsonb(profile_row);
end;
$$;

revoke all on function public.get_my_profile() from public;
grant execute on function public.get_my_profile() to authenticated;

-- Prevent RLS recursion. Policies must not query profiles directly while
-- evaluating access to profiles. This security-definer helper does that lookup
-- outside the caller's RLS policy context.
create or replace function public.current_user_is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;

revoke all on function public.current_user_is_admin() from public;
grant execute on function public.current_user_is_admin() to authenticated;

create or replace function public.log_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (actor_id, action, entity, entity_id, details)
  values (
    auth.uid(), tg_op, tg_table_name, coalesce(new.id, old.id),
    case tg_op when 'DELETE' then to_jsonb(old) else to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_audit_documents on public.documents;
create trigger trg_audit_documents
  after insert or update or delete on public.documents
  for each row execute function public.log_audit();

drop trigger if exists trg_audit_requests on public.access_requests;
create trigger trg_audit_requests
  after insert or update on public.access_requests
  for each row execute function public.log_audit();

drop policy if exists "admin reads all profiles" on public.profiles;
drop policy if exists "admin manages profiles" on public.profiles;
drop policy if exists "admin manages students" on public.students;
drop policy if exists "admin manages document_types" on public.document_types;
drop policy if exists "admin full access documents" on public.documents;
drop policy if exists "teacher reads non-classified documents" on public.documents;
drop policy if exists "admin full access requests" on public.access_requests;
drop policy if exists "admin reads audit logs" on public.audit_logs;
drop policy if exists "anon insert requests" on public.access_requests;
drop policy if exists "teacher insert own requests" on public.access_requests;
drop policy if exists "teacher reads own requests" on public.access_requests;

create policy "admin reads all profiles"
  on public.profiles for select
  using (public.current_user_is_admin());

create policy "admin manages profiles"
  on public.profiles for all
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "admin manages students"
  on public.students for all
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "admin manages document_types"
  on public.document_types for all
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "admin full access documents"
  on public.documents for all
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "teacher reads non-classified documents"
  on public.documents for select
  using (
    not is_classified
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'teacher' and is_active
    )
  );

create policy "admin full access requests"
  on public.access_requests for all
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- Public request forms use the anon role and must be able to create a
-- request without receiving access to existing requests.
create policy "anon insert requests"
  on public.access_requests for insert
  to anon
  with check (requester_id is null and source = 'web');

create policy "teacher insert own requests"
  on public.access_requests for insert
  to authenticated
  with check (requester_id = auth.uid() and source = 'teacher');

create policy "teacher reads own requests"
  on public.access_requests for select
  to authenticated
  using (requester_id = auth.uid());

grant insert on public.access_requests to anon;
grant insert, select on public.access_requests to authenticated;

create policy "admin reads audit logs"
  on public.audit_logs for select
  using (public.current_user_is_admin());

-- Add a staff ID to an existing account.
-- Replace both values before running.
update public.profiles
set staff_id = 'ADM-001'
where id = (
  select id
  from auth.users
  where email = 'replace-with-your-existing-email@example.com'
);

-- Verify existing staff IDs:
select p.staff_id, p.full_name, p.role, p.is_active, u.email
from public.profiles p
join auth.users u on u.id = p.id
order by p.role, p.full_name;
