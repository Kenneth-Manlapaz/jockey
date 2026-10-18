# Host on Ubuntu with the server's MariaDB

This deploys Django and Caddy in Docker while using MariaDB installed directly on the Ubuntu host. Caddy obtains and renews HTTPS certificates for your domain. MariaDB port 3306 is not published to the internet.

## 1. Prepare Ubuntu

Use Ubuntu 22.04 or 24.04 with a public IP. Point your domain's DNS `A` record to that IP, and allow inbound TCP ports 22, 80, and 443 in your provider firewall. Install Docker Engine and the Compose plugin using Docker's [official Ubuntu instructions](https://docs.docker.com/engine/install/ubuntu/).

Check that MariaDB is running:

```bash
sudo systemctl status mariadb
sudo mariadb
```

The app container reaches the host through Docker's `host.docker.internal` gateway. On Ubuntu, MariaDB must listen on the Docker bridge gateway (commonly `172.17.0.1`) as well as its local socket. Check the bridge address with `ip -4 addr show docker0`. In a MariaDB config file under `/etc/mysql/mariadb.conf.d/`, set `bind-address` to that address (or `0.0.0.0` if the bridge address is not stable), then restart MariaDB. If using `0.0.0.0`, keep port 3306 blocked from public networks in your cloud firewall and host firewall.

## 2. Create the application database

If you already have a database dump to restore, create an empty database and import the dump instead of running the project schema files below. For a new project database, create a dedicated database and user:

```sql
CREATE DATABASE philippine_jockey CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'racing_app'@'%' IDENTIFIED BY 'replace-with-a-long-unique-password';
GRANT ALL PRIVILEGES ON philippine_jockey.* TO 'racing_app'@'%';
FLUSH PRIVILEGES;
```

The `%` host allows the app's Docker container to connect; restrict network access to port 3306 so only local/Docker traffic can reach it. Exit MariaDB, then load the provided schema and logic (only for a new, empty database):

```bash
mariadb -u racing_app -p philippine_jockey < sql/01_philippine_jockey_tables.sql
mariadb -u racing_app -p philippine_jockey < sql/02_philippine_jockey_logic.sql
```

To restore your own dump instead, for example: `mariadb -u racing_app -p philippine_jockey < backup.sql`. The dump must use this app's table schema; unrelated tables are not automatically mapped into the app.

## 3. Configure and start the app

Clone or upload the project to Ubuntu. From the project root:

```bash
cp .env.example .env
chmod 600 .env
```

Edit `.env` with production values. Use a newly generated secret (`openssl rand -hex 32`), the MariaDB username/password from above, and your real domains:

```dotenv
DJANGO_SETTINGS_MODULE=config.settings.production
DJANGO_SECRET_KEY=<long-random-secret>
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=api.example.com
DJANGO_CSRF_TRUSTED_ORIGINS=https://api.example.com,https://www.example.com
CORS_ALLOWED_ORIGINS=https://www.example.com
DJANGO_SSL_REDIRECT=True
DB_ENGINE=mysql
DB_NAME=philippine_jockey
DB_USER=racing_app
DB_PASSWORD=<same-unique-database-password>
DB_HOST=host.docker.internal
DB_PORT=3306
USE_DB_TRIGGERS=1
ENABLE_BETTING_API=False
DOMAIN=api.example.com
```

`USE_DB_TRIGGERS=1` is appropriate after importing both project SQL files. Set it to `0` if your database dump does not include the project's triggers; Django will handle bet status history itself. `DJANGO_ALLOWED_HOSTS` contains hostnames only. The trusted origins and CORS values include `https://`.

Start the app and proxy:

```bash
sudo docker compose -f docker-compose.host-db.yml up -d --build
sudo docker compose -f docker-compose.host-db.yml logs -f web caddy
```

For a new database loaded from the provided SQL, Django's `--fake-initial` recognizes the existing app tables and creates its own framework tables. For an existing app database, take a backup first and make sure it is compatible with the current migrations. Create the Django admin account:

```bash
sudo docker compose -f docker-compose.host-db.yml exec web python manage.py createsuperuser
```

Check `https://api.example.com/health/` and `https://api.example.com/admin/`.

## Updates and backups

After pulling code updates, run `sudo docker compose -f docker-compose.host-db.yml up -d --build`. Back up MariaDB regularly, for example with `mariadb-dump -u racing_app -p philippine_jockey > backup.sql`. Keep `.env` private. The existing `docker-compose.prod.yml` remains available if you prefer the database to run in a separate Docker container instead of using Ubuntu's MariaDB.
