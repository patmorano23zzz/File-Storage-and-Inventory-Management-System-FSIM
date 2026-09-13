-- create-admin.sql
-- Run this once in the Supabase SQL Editor to promote an existing auth user
-- to an admin profile, and assign a staff ID. This does NOT create an
-- authentication user or set their password — create the auth user first via
-- the Supabase Dashboard (Authentication → Users → New user) or via the
-- Admin API using your service_role key.
--
-- Replace the placeholders below and run the script.

-- REPLACE THESE VALUES BEFORE RUNNING.
-- The email must already exist in Authentication → Users.
-- The staff ID is what the admin will enter on the login screen.
with settings as (
  select
    'patgamer23@gmail.com'::text as target_email,
    'ADM-001'::text as staff_id,
    'School Admin'::text as full_name
),

-- Find the auth user id for the email
user_row as (
  select u.id, u.email, u.raw_user_meta_data, s.staff_id, s.full_name
  from auth.users u
  cross join settings s
  where lower(u.email) = lower(s.target_email)
  limit 1
)
-- create profile if missing
insert into public.profiles (id, staff_id, full_name, role, is_active, created_at, updated_at)
select
  user_row.id,
  user_row.staff_id,
  coalesce(user_row.raw_user_meta_data->>'full_name', user_row.full_name, user_row.email),
  'admin',
  true,
  now(), now()
from user_row
where not exists (
  select 1 from public.profiles p where p.id = user_row.id
);

-- update an existing profile to be admin and set staff_id
update public.profiles p
set
  staff_id = 'ADM-001',
  full_name = coalesce(nullif(p.full_name, ''), 'School Admin'),
  role = 'admin',
  is_active = true,
  updated_at = now()
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('patgamer23@gmail.com');

-- Show the resulting profile for verification
select p.id, p.staff_id, p.full_name, p.role, p.is_active, u.email
from public.profiles p
join auth.users u on u.id = p.id
where lower(u.email) = lower('patgamer23@gmail.com');

-- Notes:
-- 1) To set the admin user's password, create the auth user explicitly:
--    - Supabase Dashboard → Authentication → Users → New user
--      (enter email and password)
--    - Or use the Admin API with your service_role key.
-- 2) Never share your service_role key in the frontend or commit it to source control.
-- 3) After running this SQL, the admin can sign in using the app's login
--    (staff ID + password) once a staff_id has been assigned to the profile
--    and the auth user has a password.
