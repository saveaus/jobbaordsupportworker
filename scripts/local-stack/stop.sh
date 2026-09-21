#!/usr/bin/env bash
# Stop the local Postgres + PostgREST + auth gateway without touching .env.local.
set -euo pipefail

ROOT="${HOME}/.local/supportwork"
export PATH="${ROOT}/pgsql/bin:${ROOT}/bin:${PATH}"

stop_pidfile() {
  local file="$1"
  if [[ -f "${file}" ]]; then
    local pid
    pid="$(cat "${file}")"
    if kill -0 "${pid}" 2>/dev/null; then
      kill "${pid}" || true
      for _ in {1..20}; do
        kill -0 "${pid}" 2>/dev/null || break
        sleep 0.1
      done
      kill -9 "${pid}" 2>/dev/null || true
    fi
    rm -f "${file}"
  fi
}

stop_pidfile "${ROOT}/run/gateway.pid"
stop_pidfile "${ROOT}/run/postgrest.pid"

if [[ -d "${ROOT}/pgdata" ]] && "${ROOT}/pgsql/bin/pg_ctl" -D "${ROOT}/pgdata" status >/dev/null 2>&1; then
  "${ROOT}/pgsql/bin/pg_ctl" -D "${ROOT}/pgdata" -m fast stop >/dev/null
fi

echo "Local stack stopped."
