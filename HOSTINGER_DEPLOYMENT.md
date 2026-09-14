# Hostinger or InfinityFree deployment (PHP/MySQL MVP)

The frontend is a Vite SPA, but data, authentication, and files are now
served by the same-origin PHP API and Hostinger MySQL database.

The same build can also be deployed to InfinityFree free hosting because it
only needs Apache, PHP, MySQL, PHP sessions, and file uploads. Build the
frontend locally; Node.js is not required on the hosting account.

## InfinityFree free-hosting setup

1. Create an InfinityFree account and an `ixdb_...` MySQL database.
2. Open phpMyAdmin from the InfinityFree control panel and import
   [`schema.sql`](./schema.sql).
3. Copy `api/config.php` to `api/config.local.php` and use the exact MySQL
   host, database name, username, and password shown in the control panel.
   Do not assume the database host is `localhost`.
4. Run `npm ci` and `npm run build` locally.
5. Upload the contents of `dist/` into the account's `htdocs/` directory.
6. Upload `api/` and `storage/` into `htdocs/`. Keep `storage/.htaccess` in
   place so uploaded files cannot be opened directly.
7. If the account allows files outside `htdocs/`, move `storage/` there and
   update `STORAGE_ROOT` in `api/config.local.php` to its absolute path.
8. Open the site using the InfinityFree HTTPS URL and test `/login`,
   `/track-request`, uploads, and downloads.

InfinityFree may show a browser security or verification page on some
requests. That is a hosting-level restriction and cannot be fixed by the
React application.

## Free shared-hosting setup

1. Create a Hostinger MySQL database and import [`schema.sql`](./schema.sql).
2. Copy `api/config.php` to `api/config.local.php` and set the database
   host/name/user/password. Keep `config.local.php` out of Git.
3. Put `storage/` outside `public_html` when the plan permits it. If it must
   be inside the web root, keep the included `.htaccess`; downloads still pass
   through `api/index.php` and role checks.
4. Upload the contents of `dist/` to `public_html/`, then upload `api/`,
   `schema.sql` (optional, preferably remove after import), and `storage/`.
5. Ensure PHP 8.1+, PDO MySQL, sessions, and HTTPS are enabled.

Create the first admin manually with a PHP password hash (for example
`password_hash()`), never store a plaintext password in this repository.

## Build

```text
npm ci
npm run build
```

The API defaults to `/api/index.php`; set `VITE_API_URL` only when the API is
deployed at another same-origin path. `public/.htaccess` keeps client-side
routes working.

## Free shared-hosting limitations

Hostinger and InfinityFree may limit upload size, execution time, concurrent
sessions, database resources, outbound requests, and cron jobs. The API
currently rejects files larger than 10 MB, but the hosting server may impose a
lower PHP limit. Use modest file sizes and test `upload_max_filesize` and
`post_max_size` on the selected account.

Free hosting is suitable for development, demonstrations, and light testing,
but should not be treated as the only backup for confidential student records.
Take independent database and file backups. This MVP uses PHP sessions and
polling rather than realtime events. Premium hosting can move storage outside
the web root, add object storage, queues, virus scanning, and stronger
audit/retention controls without changing the frontend contract.

Never commit `config.local.php`, passwords, or private files.
