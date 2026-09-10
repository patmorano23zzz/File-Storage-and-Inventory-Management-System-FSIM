-- Run this once in the Supabase SQL Editor for an existing auth account
-- that was created before the profiles signup trigger was installed.
-- Replace the email value with the staff account that cannot sign in.

insert into public.profiles (id, full_name, role)
select
  id,
  coalesce(raw_user_meta_data->>'full_name', email, 'School Staff'),
  'teacher'
from auth.users
where email = 'replace-with-staff-email@example.com'
on conflict (id) do nothing;

-- Verify the row was created:
select p.id, p.full_name, p.role, p.is_active
from public.profiles p
join auth.users u on u.id = p.id
where u.email = 'replace-with-staff-email@example.com';
