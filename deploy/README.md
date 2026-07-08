# Lorebound Server Deploy Bundle

This folder is a **production-ready copy** of Lorebound for uploading to your server. Zip the entire `deploy` folder (or its contents) and extract on the host.

## Requirements

- PHP 8.3+
- Composer (or use the bundled `composer.phar`)
- MySQL 8+ (recommended) or SQLite for small demos
- Web server (Apache/Nginx) with document root pointing to `backend/public`

## Folder layout

```
deploy/
├── README.md           (this file)
├── composer.phar       (optional local Composer binary)
└── backend/            (Laravel app — run composer install on server)
    ├── app/
    ├── public/         ← web root (serves /app/ frontend + API)
    │   └── app/        ← Lorebound frontend (compiler + games)
    ├── database/
    ├── routes/
    └── ...
```

## Setup on server

### 1. Upload and extract

Upload your zip, then:

```bash
cd /path/to/deploy/backend
cp .env.example .env
```

Edit `.env`:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lorebound
DB_USERNAME=your_user
DB_PASSWORD=your_password

GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_VERIFY_SSL=true
```

Set `GROQ_VERIFY_SSL=false` only if your host has missing CA certificates (common on some Windows dev boxes).

### 2. Install dependencies

```bash
cd /path/to/deploy/backend
php ../composer.phar install --no-dev --optimize-autoloader
# or: composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --seed --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 3. Permissions (Linux)

```bash
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### 4. Web server

Point the **document root** to `backend/public`.

| URL | Description |
|-----|-------------|
| `/app/` | Main frontend |
| `/admin` | Admin panel |
| `/api/v1/health` | API health check |

**Admin login (seeded):** `admin@lorebound.test` / `password` — change immediately in production.

### 5. Rebuild this bundle locally

From the project root:

```powershell
powershell -ExecutionPolicy Bypass -File tools/build_deploy.ps1
```

Then zip the `deploy` folder.

## Notes

- `vendor/` is **not** included — run `composer install` on the server.
- `.env` is **not** included — create it from `.env.example`.
- The four built-in curriculum games are seeded via `php artisan migrate --seed`.
