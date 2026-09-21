#!/usr/bin/env bash
# Start a local Postgres + PostgREST + auth gateway so the Next.js app
# can run without Docker or a hosted Supabase project.
set -euo pipefail

ROOT="${HOME}/.local/supportwork"
APP="$(cd "$(dirname "$0")/../.." && pwd)"

if [[ -f "${APP}/.env.local" ]] && grep -qE '^NEXT_PUBLIC_SUPABASE_URL=https://.+\.supabase\.co' "${APP}/.env.local"; then
  echo "Hosted Supabase is configured in .env.local. Not starting the local stack (it would overwrite those keys)."
  exit 1
fi

PGDATA="${ROOT}/pgdata"
PGPORT=54322
POSTGREST_PORT=54323
GATEWAY_PORT=54321
JWT_SECRET="super-secret-jwt-token-with-at-least-32-characters-long"
export PATH="${ROOT}/pgsql/bin:${ROOT}/bin:${PATH}"

if [[ ! -x "${ROOT}/pgsql/bin/postgres" || ! -x "${ROOT}/bin/postgrest" ]]; then
  echo "Postgres or PostgREST is missing under ${ROOT}. Re-run the download step."
  exit 1
fi

mkdir -p "${ROOT}/run" "${ROOT}/log"

if [[ ! -f "${PGDATA}/PG_VERSION" ]]; then
  echo "Initializing Postgres cluster..."
  "${ROOT}/pgsql/bin/initdb" -D "${PGDATA}" --locale=C --encoding=UTF8 -U postgres -A trust >/dev/null
  cat >> "${PGDATA}/postgresql.conf" <<EOF
listen_addresses = '127.0.0.1'
port = ${PGPORT}
unix_socket_directories = '${ROOT}/run'
logging_collector = on
log_directory = '${ROOT}/log'
EOF
fi

if ! "${ROOT}/pgsql/bin/pg_isready" -h 127.0.0.1 -p "${PGPORT}" -U postgres >/dev/null 2>&1; then
  echo "Starting Postgres on ${PGPORT}..."
  "${ROOT}/pgsql/bin/pg_ctl" -D "${PGDATA}" -l "${ROOT}/log/postgres.log" -o "-k ${ROOT}/run" start >/dev/null
  for _ in {1..30}; do
    "${ROOT}/pgsql/bin/pg_isready" -h 127.0.0.1 -p "${PGPORT}" -U postgres >/dev/null 2>&1 && break
    sleep 0.3
  done
fi

psql() {
  "${ROOT}/pgsql/bin/psql" -h 127.0.0.1 -p "${PGPORT}" -U postgres -d postgres -v ON_ERROR_STOP=1 "$@"
}

echo "Applying bootstrap + migrations..."
psql -f "${APP}/scripts/local-stack/bootstrap.sql" >/dev/null
if [[ "$(psql -Atc "select to_regclass('public.jobs')")" == "jobs" ]]; then
  echo "Migrations already applied."
else
  for f in 0001_setup.sql 0002_tables.sql 0003_rls.sql 0004_storage.sql 0005_grants.sql; do
    psql -f "${APP}/supabase/migrations/${f}" >/dev/null
  done
  psql -f "${APP}/scripts/local-stack/grants.sql" >/dev/null
fi

"${HOME}/.local/bin/python3.12" - <<PY
from pathlib import Path
import hmac, hashlib, json, base64, time

secret = "$JWT_SECRET"

def b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()

def jwt(payload: dict) -> str:
    header = b64url(json.dumps({"alg":"HS256","typ":"JWT"}, separators=(",", ":")).encode())
    body = b64url(json.dumps(payload, separators=(",", ":")).encode())
    sig = hmac.new(secret.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest()
    return f"{header}.{body}.{b64url(sig)}"

now = int(time.time())
anon = jwt({"iss":"supabase","role":"anon","iat":now,"exp":now + 60*60*24*365*10})
service = jwt({"iss":"supabase","role":"service_role","iat":now,"exp":now + 60*60*24*365*10})
Path("${ROOT}/anon.jwt").write_text(anon)
Path("${ROOT}/service.jwt").write_text(service)
print("anon_len", len(anon), "service_len", len(service))
PY

ANON="$(cat "${ROOT}/anon.jwt")"
SERVICE="$(cat "${ROOT}/service.jwt")"

cat > "${ROOT}/postgrest.conf" <<EOF
db-uri = "postgres://authenticator@127.0.0.1:${PGPORT}/postgres"
db-anon-role = "anon"
db-schemas = "public"
db-extra-search-path = "public, auth"
jwt-secret = "${JWT_SECRET}"
server-host = "127.0.0.1"
server-port = ${POSTGREST_PORT}
EOF

if [[ -f "${ROOT}/run/postgrest.pid" ]] && kill -0 "$(cat "${ROOT}/run/postgrest.pid")" 2>/dev/null; then
  kill "$(cat "${ROOT}/run/postgrest.pid")" || true
  sleep 0.4
fi
echo "Starting PostgREST on ${POSTGREST_PORT}..."
nohup "${ROOT}/bin/postgrest" "${ROOT}/postgrest.conf" >"${ROOT}/log/postgrest.log" 2>&1 &
echo $! > "${ROOT}/run/postgrest.pid"

if [[ -f "${ROOT}/run/gateway.pid" ]] && kill -0 "$(cat "${ROOT}/run/gateway.pid")" 2>/dev/null; then
  kill "$(cat "${ROOT}/run/gateway.pid")" || true
  sleep 0.2
fi
echo "Starting API gateway on ${GATEWAY_PORT}..."
nohup env \
  JWT_SECRET="${JWT_SECRET}" \
  PSQL_BIN="${ROOT}/pgsql/bin/psql" \
  PGHOST=127.0.0.1 \
  PGPORT="${PGPORT}" \
  PGUSER=postgres \
  PGDATABASE=postgres \
  POSTGREST_URL="http://127.0.0.1:${POSTGREST_PORT}" \
  GATEWAY_PORT="${GATEWAY_PORT}" \
  MAILBOX_PATH="${ROOT}/mailbox.json" \
  NEXT_PUBLIC_SITE_URL="http://localhost:3000" \
  /usr/local/bin/node "${APP}/scripts/local-stack/gateway.mjs" \
  >"${ROOT}/log/gateway.log" 2>&1 &
echo $! > "${ROOT}/run/gateway.pid"

"${HOME}/.local/bin/python3.12" - <<PY
from pathlib import Path
anon = Path("${ROOT}/anon.jwt").read_text().strip()
service = Path("${ROOT}/service.jwt").read_text().strip()
env_path = Path("${APP}/.env.local")
vals = {}
if env_path.exists():
    for line in env_path.read_text().splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, _, v = line.partition("=")
            vals[k.strip()] = v
vals.update({
    "NEXT_PUBLIC_SITE_URL": "http://localhost:3000",
    "NEXT_PUBLIC_SUPABASE_URL": "http://127.0.0.1:${GATEWAY_PORT}",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": anon,
    "SUPABASE_SERVICE_ROLE_KEY": service,
    "SUPABASE_DB_URL": "postgres://postgres@127.0.0.1:${PGPORT}/postgres",
})
order = [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_DB_URL",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PRICE_MONTHLY",
    "STRIPE_PRICE_ANNUAL",
    "STRIPE_TAX_RATE_GST",
    "RESEND_API_KEY",
    "EMAIL_FROM_TRANSACTIONAL",
    "EMAIL_FROM_ALERTS",
    "CRON_SECRET",
    "CONTACT_EMAIL",
]
lines = [f"{k}={vals[k]}" for k in order if vals.get(k)]
env_path.write_text("\\n".join(lines) + "\\n")
print("env updated:", [l.split("=")[0] for l in lines])
PY

echo "Waiting for gateway..."
for _ in {1..40}; do
  if curl -sf "http://127.0.0.1:${GATEWAY_PORT}/auth/v1/health" >/dev/null; then
    echo "Local stack is up at http://127.0.0.1:${GATEWAY_PORT}"
    exit 0
  fi
  sleep 0.25
done
echo "Gateway failed to start. Logs:"
tail -n 50 "${ROOT}/log/gateway.log" "${ROOT}/log/postgrest.log" || true
exit 1
