-- ============================================================
-- teacher-assignments.sql — run once in Supabase SQL Editor
-- Lets admins assign teachers to grade levels & sections so
-- teachers only see the students/files they handle.
-- ============================================================

-- ── Table ────────────────────────────────────────────────────
create table if not exists teacher_assignments (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references profiles(id) on delete cascade,
  grade_level text not null,
  section     text,
  created_at  timestamptz not null default now()
);

-- A teacher can only be assigned once per grade + section pair.
create unique index if not exists teacher_assignments_unique
  on teacher_assignments (teacher_id, grade_level, coalesce(section, ''));

alter table teacher_assignments enable row level security;

create policy "admin manages teacher assignments"
  on teacher_assignments for all using (
    current_user_is_admin()
  ) with check (current_user_is_admin());

create policy "teacher reads own assignments"
  on teacher_assignments for select
  to authenticated
  using (teacher_id = auth.uid());

grant select, insert, delete on teacher_assignments to authenticated;

-- ── Helper: does the current teacher handle a given student? ─
create or replace function public.teacher_handles_student(p_student_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from students s
    join teacher_assignments ta on ta.teacher_id = auth.uid()
    where s.id = p_student_id
      and s.grade_level = ta.grade_level
      and coalesce(s.section, '') = coalesce(ta.section, '')
  );
$$;

-- ── Replace the old "teachers see everything" policies ───────
drop policy if exists "authenticated reads students" on students;
drop policy if exists "teacher reads non-classified documents" on documents;
drop policy if exists "teacher read non-classified files" on storage.objects;

-- Teachers only see students in their assigned grade/section;
-- admins still see everything.
create policy "admin reads students"
  on students for select using (current_user_is_admin());

create policy "teacher reads assigned students"
  on students for select
  to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'teacher' and is_active
    )
    and public.teacher_handles_student(id)
  );

-- Documents: teacher must be assigned to the document's student
create policy "teacher reads assigned non-classified documents"
  on documents for select
  to authenticated
  using (
    not is_classified
    and exists (
      select 1 from profiles
      where id = auth.uid() and role = 'teacher' and is_active
    )
    and public.teacher_handles_student(student_id)
  );

-- Storage: same rule for the actual files in the bucket
create policy "teacher read assigned student files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'student-files'
    and exists (
      select 1 from profiles
      where id = auth.uid() and role = 'teacher' and is_active
    )
    and exists (
      select 1 from documents d
      where d.storage_path = name
        and not d.is_classified
        and public.teacher_handles_student(d.student_id)
    )
  );

-- ── Verify ───────────────────────────────────────────────────
select p.full_name, ta.grade_level, ta.section
from teacher_assignments ta
join profiles p on p.id = ta.teacher_id
order by p.full_name, ta.grade_level, ta.section;
