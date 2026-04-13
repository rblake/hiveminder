#!/bin/bash
set -euo pipefail


HIVE_DIR="/opt/hiveminder"
CONFIG="$HIVE_DIR/etc/config.yml"

echo "==> Hiveminder Docker entrypoint"
echo "    Perl: $(perl -v | head -2 | tail -1)"
echo "    DB host: ${HM_DB_HOST:-db}:${HM_DB_PORT:-5432}"

# ------------------------------------------------------------------
# 1. Substitute environment variables into config.yml
# ------------------------------------------------------------------
echo "==> Writing config from environment..."
sed -i \
    -e "s|__HM_BASE_URL__|${HM_BASE_URL:-http://localhost:8888}|g" \
    -e "s|__HM_DB_HOST__|${HM_DB_HOST:-db}|g" \
    -e "s|__HM_DB_PORT__|${HM_DB_PORT:-5432}|g" \
    -e "s|__HM_DB_NAME__|${HM_DB_NAME:-hiveminder}|g" \
    -e "s|__HM_DB_USER__|${HM_DB_USER:-hiveminder}|g" \
    -e "s|__HM_DB_PASS__|${HM_DB_PASS:-hiveminder}|g" \
    -e "s|__HM_ADMIN_EMAIL__|${HM_ADMIN_EMAIL:-admin@localhost}|g" \
    -e "s|__HM_ADMIN_PASS__|${HM_ADMIN_PASS:-hiveminder}|g" \
    "$CONFIG"

# ------------------------------------------------------------------
# 2. Wait for Postgres to be ready
# ------------------------------------------------------------------
echo "==> Waiting for PostgreSQL at ${HM_DB_HOST:-db}:${HM_DB_PORT:-5432}..."
until nc -z "${HM_DB_HOST:-db}" "${HM_DB_PORT:-5432}"; do
    echo "   ... not yet, sleeping 2s"
    sleep 2
done
echo "   PostgreSQL is up."

# Additional wait to let pg finish init
sleep 2

# ------------------------------------------------------------------
# 3. Initialize schema if this is a fresh database
# ------------------------------------------------------------------
DB_EXISTS=$(PGPASSWORD="${HM_DB_PASS:-hiveminder}" psql \
    -h "${HM_DB_HOST:-db}" \
    -U "${HM_DB_USER:-hiveminder}" \
    -d "${HM_DB_NAME:-hiveminder}" \
    -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" \
    2>/dev/null || echo "0")

if [ "$DB_EXISTS" = "0" ] || [ -z "$DB_EXISTS" ]; then
    echo "==> Fresh database detected — running schema setup..."
    cd "$HIVE_DIR"
    ./bin/jifty schema --setup 2>&1 | tee /opt/hiveminder/log/schema-setup.log
    echo "==> Schema setup complete."

    # Create admin user
    echo "==> Creating admin account (${HM_ADMIN_EMAIL:-admin@localhost})..."
    perl -e "
use lib '$HIVE_DIR/lib';
use Jifty;
Jifty->new(no_handle => 0);
require BTDT::CurrentUser;
require BTDT::Model::User;
my \$superuser = BTDT::CurrentUser->superuser;
my \$u = BTDT::Model::User->new(current_user => \$superuser);
\$u->create(
    email           => '${HM_ADMIN_EMAIL:-admin@localhost}',
    password        => '${HM_ADMIN_PASS:-hiveminder}',
    name            => 'Local Admin',
    email_confirmed => 1,
    pro_account     => 1,
    access_level    => 'administrator',
);
if (\$u->id) {
    print 'Admin user created: id=' . \$u->id . \"\n\";
} else {
    print 'Admin user creation failed\n';
}
" 2>&1 | tee -a /opt/hiveminder/log/schema-setup.log \
    || echo "WARN: Admin user creation failed — you may need to register manually via the web UI."
else
    echo "==> Existing database found (${DB_EXISTS} tables) — skipping schema setup."
fi

# ------------------------------------------------------------------
# 3b. Ensure all existing users have pro_account = true (local mode)
# ------------------------------------------------------------------
if [ "${HM_LOCAL_MODE:-0}" = "1" ]; then
    echo "==> HM_LOCAL_MODE: setting pro_account=true for all users..."
    PGPASSWORD="${HM_DB_PASS:-hiveminder}" psql \
        -h "${HM_DB_HOST:-db}" \
        -U "${HM_DB_USER:-hiveminder}" \
        -d "${HM_DB_NAME:-hiveminder}" \
        -c "UPDATE users SET pro_account = true WHERE pro_account = false OR pro_account IS NULL;" \
        2>&1 || echo "WARN: Could not update pro_account — table may not exist yet."
fi

# ------------------------------------------------------------------
# 4. Start Jifty web server
# ------------------------------------------------------------------
echo ""
echo "======================================================"
echo "  Hiveminder is starting at ${HM_BASE_URL:-http://localhost:8888}"
echo "  Admin login: ${HM_ADMIN_EMAIL:-admin@localhost}"
echo "======================================================"
echo ""

cd "$HIVE_DIR"
exec ./bin/jifty server --port 8888 --host 0.0.0.0 2>&1
