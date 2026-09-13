-- Run this ENTIRE file in Supabase SQL Editor.
-- Do not run only a selected portion of the script.

create or replace function public.current_user_is_admin()
returns boolean
language sql
security definer
set search_path = public
as $admin$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$admin$;

revoke all on function public.current_user_is_admin() from public;
grant execute on function public.current_user_is_admin() to authenticated;

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
language plpgsql
security definer
set search_path = public
as $documents$
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
$documents$;

revoke all on function public.list_admin_documents(text) from public;
grant execute on function public.list_admin_documents(text) to authenticated;

create or replace function public.list_admin_audit_logs(p_limit integer default 50)
returns table (
  id uuid, actor_id uuid, action text, entity text, entity_id uuid,
  details jsonb, created_at timestamptz, actor_name text
)
language plpgsql
security definer
set search_path = public
as $logs$
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
$logs$;

revoke all on function public.list_admin_audit_logs(integer) from public;
grant execute on function public.list_admin_audit_logs(integer) to authenticated;

create or replace function public.log_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $audit$
begin
  insert into public.audit_logs (actor_id, action, entity, entity_id, details)
  values (
    auth.uid(), tg_op, tg_table_name, coalesce(new.id, old.id),
    case tg_op when 'DELETE' then to_jsonb(old) else to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$audit$;

drop trigger if exists trg_audit_documents on public.documents;
create trigger trg_audit_documents
  after insert or update or delete on public.documents
  for each row execute function public.log_audit();

drop trigger if exists trg_audit_requests on public.access_requests;
create trigger trg_audit_requests
  after insert or update on public.access_requests
  for each row execute function public.log_audit();

drop policy if exists "admin full access documents" on public.documents;
create policy "admin full access documents"
  on public.documents for all
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists "admin reads audit logs" on public.audit_logs;
create policy "admin reads audit logs"
  on public.audit_logs for select
  using (public.current_user_is_admin());
