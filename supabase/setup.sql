-- ============================================================
-- e-Records: School File Storage & Inventory System
-- setup.sql — run this once in your Supabase SQL Editor
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Helpers ──────────────────────────────────────────────────
create or replace function generate_reference_code()
returns text language sql as $$
  select upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 10));
$$;

-- ── Tables ───────────────────────────────────────────────────

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  staff_id    text unique,
  full_name   text not null,
  role        text not null check (role in ('admin', 'teacher')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Safe to run against an existing project.
alter table profiles add column if not exists staff_id text;
create unique index if not exists profiles_staff_id_unique
  on profiles (upper(staff_id))
  where staff_id is not null;

create table students (
  id            uuid primary key default gen_random_uuid(),
  lrn           text unique not null,
  last_name     text not null,
  first_name    text not null,
  middle_name   text,
  birth_date    date,
  sex           text check (sex in ('M', 'F')),
  grade_level   text not null,
  section       text,
  guardian_name text,
  status        text not null default 'enrolled' check (status in ('enrolled', 'transferred', 'graduated', 'dropped')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table document_types (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  name        text not null,
  description text
);

create table documents (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(id) on delete cascade,
  type_id       uuid not null references document_types(id),
  title         text not null,
  school_year   text,
  grade_level   text,
  storage_path  text not null,
  file_name     text not null,
  mime_type     text,
  file_size     bigint,
  uploaded_by   uuid references profiles(id),
  is_classified boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table access_requests (
  id                uuid primary key default gen_random_uuid(),
  reference_code    text unique not null default generate_reference_code(),
  requester_id      uuid references profiles(id),          -- null = public/web
  requester_name    text not null,
  relationship      text,
  contact           text,
  student_id        uuid references students(id),
  student_lrn       text,                                  -- captured at submit time
  student_last_name text,                                  -- captured at submit time
  document_type_id  uuid references document_types(id),
  purpose           text,
  status            text not null default 'pending'
                      check (status in ('pending','approved','denied','released','cancelled')),
  source            text not null default 'web' check (source in ('web','teacher')),
  decided_by        uuid references profiles(id),
  decided_at        timestamptz,
  release_note      text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references profiles(id),
  action      text not null,
  entity      text not null,
  entity_id   uuid,
  details     jsonb,
  created_at  timestamptz not null default now()
);

-- ── Indexes ──────────────────────────────────────────────────
create index on students (lrn);
create index on students (last_name);
create index on documents (student_id);
create index on access_requests (reference_code);
create index on access_requests (status);
create index on audit_logs (actor_id);
create index on audit_logs (created_at desc);

-- ── Updated_at trigger ───────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_profiles_updated_at   before update on profiles        for each row execute function set_updated_at();
create trigger trg_students_updated_at   before update on students         for each row execute function set_updated_at();
create trigger trg_documents_updated_at  before update on documents        for each row execute function set_updated_at();
create trigger trg_requests_updated_at   before update on access_requests  for each row execute function set_updated_at();

-- ── Auto-create profile on signup ────────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, staff_id, full_name, role)
  values (
    new.id,
    nullif(upper(trim(new.raw_user_meta_data->>'staff_id')), ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'teacher')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Staff ID login bridge ──────────────────────────────────
-- Supabase Auth still validates the password. This function only resolves
-- an active staff ID to the Auth email needed by signInWithPassword.
create or replace function get_login_email(p_staff_id text)
returns text
language sql
security definer
set search_path = public
as $$
  select u.email
  from profiles p
  join auth.users u on u.id = p.id
  where upper(trim(p.staff_id)) = upper(trim(p_staff_id))
    and p.is_active = true
  limit 1;
$$;

revoke all on function get_login_email(text) from public;
grant execute on function get_login_email(text) to anon, authenticated;

-- ── Repair profile for accounts created before the signup trigger ──
-- This is safe to call from the login screen: it can only create a profile
-- for the currently authenticated user and never grants admin access.
create or replace function ensure_my_profile()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text;
  current_name text;
  profile_row profiles;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select email, coalesce(raw_user_meta_data->>'full_name', email)
    into current_email, current_name
    from auth.users
    where id = current_user_id;

  insert into profiles (id, full_name, role)
  values (current_user_id, coalesce(current_name, current_email, 'School Staff'), 'teacher')
  on conflict (id) do nothing;

  select *
    into profile_row
    from profiles
    where id = current_user_id;

  return to_jsonb(profile_row);
end;
$$;

revoke all on function ensure_my_profile() from public;
grant execute on function ensure_my_profile() to authenticated;

-- ── Load profile without depending on profile RLS ────────────
create or replace function get_my_profile()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  profile_row profiles;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into profiles (id, staff_id, full_name, role)
  select
    id,
    nullif(upper(trim(raw_user_meta_data->>'staff_id')), ''),
    coalesce(raw_user_meta_data->>'full_name', email, 'School Staff'),
    'teacher'
  from auth.users
  where id = current_user_id
  on conflict (id) do nothing;

  select * into profile_row from profiles where id = current_user_id;
  return to_jsonb(profile_row);
end;
$$;

revoke all on function get_my_profile() from public;
grant execute on function get_my_profile() to authenticated;

-- ── RLS role helper ─────────────────────────────────────────
create or replace function current_user_is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;

revoke all on function current_user_is_admin() from public;
grant execute on function current_user_is_admin() to authenticated;

-- Return teacher accounts and repair profiles for Auth users created with
-- teacher metadata. This keeps the registrar list complete even when an
-- Auth account predates its profile row.
create or replace function list_teacher_accounts()
returns setof profiles
language plpgsql
security definer
set search_path = public
as $$
begin
  if not current_user_is_admin() then
    raise exception 'Administrator access required';
  end if;

  insert into profiles (id, staff_id, full_name, role)
  select
    u.id,
    nullif(upper(trim(u.raw_user_meta_data->>'staff_id')), ''),
    coalesce(nullif(trim(u.raw_user_meta_data->>'full_name'), ''), u.email, 'Teacher'),
    'teacher'
  from auth.users u
  where u.raw_user_meta_data->>'role' = 'teacher'
    and not exists (select 1 from profiles p where p.id = u.id)
  on conflict (id) do nothing;

  return query
  select p.*
  from profiles p
  where p.role = 'teacher'
  order by p.full_name;
end;
$$;

revoke all on function list_teacher_accounts() from public;
grant execute on function list_teacher_accounts() to authenticated;

-- ── Audit log trigger (documents + requests) ─────────────────
create or replace function log_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_logs (actor_id, action, entity, entity_id, details)
  values (
    auth.uid(),
    tg_op,
    tg_table_name,
    coalesce(new.id, old.id),
    case tg_op
      when 'DELETE' then to_jsonb(old)
      else to_jsonb(new)
    end
  );
  return coalesce(new, old);
end;
$$;

create or replace function list_admin_documents(p_search text default null)
returns table (
  id uuid, student_id uuid, type_id uuid, title text, school_year text,
  grade_level text, storage_path text, file_name text, mime_type text,
  file_size bigint, uploaded_by uuid, is_classified boolean,
  created_at timestamptz, updated_at timestamptz,
  document_type_code text, document_type_name text,
  student_last_name text, student_first_name text, student_lrn text,
  student_grade_level text, student_section text, uploader_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not current_user_is_admin() then
    raise exception 'Administrator access required';
  end if;

  return query
  select d.id, d.student_id, d.type_id, d.title, d.school_year,
    d.grade_level, d.storage_path, d.file_name, d.mime_type, d.file_size,
    d.uploaded_by, d.is_classified, d.created_at, d.updated_at,
    dt.code, dt.name, s.last_name, s.first_name, s.lrn, s.grade_level,
    s.section, p.full_name
  from documents d
  left join document_types dt on dt.id = d.type_id
  left join students s on s.id = d.student_id
  left join profiles p on p.id = d.uploaded_by
  where p_search is null or d.title ilike '%' || p_search || '%'
  order by d.created_at desc;
end;
$$;

revoke all on function list_admin_documents(text) from public;
grant execute on function list_admin_documents(text) to authenticated;

create or replace function list_admin_audit_logs(p_limit integer default 50)
returns table (
  id uuid, actor_id uuid, action text, entity text, entity_id uuid,
  details jsonb, created_at timestamptz, actor_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not current_user_is_admin() then
    raise exception 'Administrator access required';
  end if;

  return query
  select l.id, l.actor_id, l.action, l.entity, l.entity_id,
    l.details, l.created_at, p.full_name
  from audit_logs l
  left join profiles p on p.id = l.actor_id
  order by l.created_at desc
  limit greatest(1, least(coalesce(p_limit, 50), 500));
end;
$$;

revoke all on function list_admin_audit_logs(integer) from public;
grant execute on function list_admin_audit_logs(integer) to authenticated;

create trigger trg_audit_documents
  after insert or update or delete on documents
  for each row execute function log_audit();

create trigger trg_audit_requests
  after insert or update on access_requests
  for each row execute function log_audit();

-- ── Public RPC: track request by reference code + last name ──
create or replace function track_request(p_code text, p_last_name text)
returns table (
  reference_code    text,
  status            text,
  document_type     text,
  requester_name    text,
  created_at        timestamptz,
  decided_at        timestamptz,
  release_note      text
)
language plpgsql security definer as $$
begin
  return query
  select
    ar.reference_code,
    ar.status,
    dt.name as document_type,
    ar.requester_name,
    ar.created_at,
    ar.decided_at,
    ar.release_note
  from access_requests ar
  left join document_types dt on dt.id = ar.document_type_id
  where ar.reference_code = upper(trim(p_code))
    and lower(ar.student_last_name) = lower(trim(p_last_name));
end;
$$;

-- Public request submission runs through a narrowly scoped RPC so anonymous
-- users never receive direct insert access to the requests table.
create or replace function submit_public_request(
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
  insert into access_requests (
    requester_name, relationship, contact, student_lrn,
    student_last_name, document_type_id, purpose, source, requester_id
  )
  values (
    trim(p_requester_name), nullif(trim(p_relationship), ''),
    nullif(trim(p_contact), ''), trim(p_student_lrn),
    trim(p_student_last_name), p_document_type_id,
    nullif(trim(p_purpose), ''), 'web', null
  )
  returning access_requests.reference_code;
end;
$$;

revoke all on function submit_public_request(text, text, text, text, text, uuid, text) from public;
grant execute on function submit_public_request(text, text, text, text, text, uuid, text) to anon;

-- ── RLS ──────────────────────────────────────────────────────
alter table profiles        enable row level security;
alter table students        enable row level security;
alter table document_types  enable row level security;
alter table documents       enable row level security;
alter table access_requests enable row level security;
alter table audit_logs      enable row level security;

-- profiles
create policy "users read own profile"
  on profiles for select using (auth.uid() = id);
create policy "admin reads all profiles"
  on profiles for select using (
    current_user_is_admin()
  );
create policy "admin manages profiles"
  on profiles for all using (
    current_user_is_admin()
  ) with check (current_user_is_admin());

-- students
create policy "authenticated reads students"
  on students for select using (auth.role() = 'authenticated');
create policy "admin manages students"
  on students for all using (
    current_user_is_admin()
  ) with check (current_user_is_admin());

-- document_types
create policy "anyone reads document_types"
  on document_types for select using (true);
create policy "admin manages document_types"
  on document_types for all using (
    current_user_is_admin()
  ) with check (current_user_is_admin());

-- documents
create policy "admin full access documents"
  on documents for all using (
    current_user_is_admin()
  ) with check (current_user_is_admin());
create policy "teacher reads non-classified documents"
  on documents for select using (
    not is_classified
    and exists (select 1 from profiles where id = auth.uid() and role = 'teacher' and is_active)
  );

-- access_requests
create policy "anon insert requests"
  on access_requests for insert
  to anon
  with check (requester_id is null and source = 'web');
create policy "teacher insert own requests"
  on access_requests for insert
  to authenticated
  with check (requester_id = auth.uid() and source = 'teacher');
create policy "teacher reads own requests"
  on access_requests for select
  to authenticated
  using (requester_id = auth.uid());
create policy "admin full access requests"
  on access_requests for all using (
    current_user_is_admin()
  ) with check (current_user_is_admin());

-- audit_logs
create policy "admin reads audit logs"
  on audit_logs for select using (
    current_user_is_admin()
  );
grant insert on access_requests to anon;
grant insert, select on access_requests to authenticated;

-- ── Storage bucket ───────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('student-files', 'student-files', false)
on conflict (id) do nothing;

create policy "admin upload student files"
  on storage.objects for insert with check (
    bucket_id = 'student-files'
    and current_user_is_admin()
  );
create policy "admin read student files"
  on storage.objects for select using (
    bucket_id = 'student-files'
    and current_user_is_admin()
  );
create policy "admin delete student files"
  on storage.objects for delete using (
    bucket_id = 'student-files'
    and current_user_is_admin()
  );
create policy "teacher read non-classified files"
  on storage.objects for select using (
    bucket_id = 'student-files'
    and exists (select 1 from profiles where id = auth.uid() and role = 'teacher' and is_active)
    and exists (
      select 1 from documents
      where storage_path = name and not is_classified
    )
  );

-- ── Seed: document types ──────────────────────────────────────
insert into document_types (code, name, description) values
  ('SF10',   'School Form 10 (Form 137)',       'Permanent Record / Learner''s Cumulative Booster'),
  ('SF9',    'School Form 9 (Form 138)',         'Report Card'),
  ('COE',    'Certificate of Enrollment',        'Proof of current enrollment'),
  ('COG',    'Certificate of Graduation',        'Proof of graduation'),
  ('PSA_BC', 'PSA Birth Certificate',            'Philippine Statistics Authority birth certificate'),
  ('GM',     'General Average / Moving Up Cert','End-of-year general average certification'),
  ('GOOD',   'Certificate of Good Moral',        'Character reference from school'),
  ('CARD',   'Learner''s ID',                    'School-issued identification card'),
  ('MED',    'Medical / Health Records',         'Health and immunization records'),
  ('OTHER',  'Other Document',                   'Miscellaneous school document')
on conflict (code) do nothing;
