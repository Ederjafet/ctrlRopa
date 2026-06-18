#!/usr/bin/env bash
set -u

API_BASE_URL="${API_BASE_URL:-http://localhost:8090}"
SUPPORT_EMAIL="${SUPPORT_EMAIL:-qa.soporte@local.test}"
TENANT_ADMIN_EMAIL="${TENANT_ADMIN_EMAIL:-qa.a.admin@local.test}"
QA_PASSWORD="${QA_PASSWORD:-Qa12345!}"

REPORT_DIR="${REPORT_DIR:-qa-reports}"
REPORT_TS="$(date '+%Y%m%d-%H%M%S')"
REPORT_MD="$REPORT_DIR/AUTH-J5-security-audit-export-smoke-report-$REPORT_TS.md"
REPORT_CSV="$REPORT_DIR/AUTH-J5-security-audit-export-smoke-report-$REPORT_TS.csv"
RUN_TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S %z')"

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

mkdir -p "$REPORT_DIR"

log() {
  printf '%s\n' "$*"
}

csv_escape() {
  local value="${1//\"/\"\"}"
  printf '"%s"' "$value"
}

md_escape() {
  local value="$1"
  value="${value//|/\\|}"
  printf '%s' "$value"
}

write_report_headers() {
  {
    printf '# AUTH-J5 security audit export smoke report\n\n'
    printf '%s\n' "- Timestamp: \`$RUN_TIMESTAMP\`"
    printf '%s\n' "- API: \`$API_BASE_URL\`"
    printf '%s\n' "- Support user: \`$SUPPORT_EMAIL\`"
    printf '%s\n\n' "- Tenant admin without audit permission: \`$TENANT_ADMIN_EMAIL\`"
    printf '| Test | Endpoint | Usuario/token | Esperado | Recibido | Resultado | Observacion |\n'
    printf '|---|---|---|---|---:|---|---|\n'
  } > "$REPORT_MD"

  printf 'test_name,endpoint,user_token,expected,received_status,result,notes,timestamp,api_base_url\n' > "$REPORT_CSV"
}

record_result() {
  local test_name="$1"
  local endpoint="$2"
  local user_token="$3"
  local expected="$4"
  local received_status="$5"
  local result="$6"
  local notes="$7"

  {
    csv_escape "$test_name"; printf ','
    csv_escape "$endpoint"; printf ','
    csv_escape "$user_token"; printf ','
    csv_escape "$expected"; printf ','
    csv_escape "$received_status"; printf ','
    csv_escape "$result"; printf ','
    csv_escape "$notes"; printf ','
    csv_escape "$RUN_TIMESTAMP"; printf ','
    csv_escape "$API_BASE_URL"; printf '\n'
  } >> "$REPORT_CSV"

  printf '| %s | `%s` | `%s` | %s | %s | %s | %s |\n' \
    "$(md_escape "$test_name")" \
    "$(md_escape "$endpoint")" \
    "$(md_escape "$user_token")" \
    "$(md_escape "$expected")" \
    "$(md_escape "$received_status")" \
    "$(md_escape "$result")" \
    "$(md_escape "$notes")" >> "$REPORT_MD"
}

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  log "PASS $*"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  log "FAIL $*"
}

skip() {
  SKIP_COUNT=$((SKIP_COUNT + 1))
  log "SKIP $*"
}

expect_status() {
  local label="$1"
  local endpoint="$2"
  local user_token="$3"
  local status="$4"
  local expected="$5"
  local notes="$6"

  if [ "$status" = "$expected" ]; then
    record_result "$label" "$endpoint" "$user_token" "$expected" "$status" "PASS" "$notes"
    pass "$label -> $status"
  else
    record_result "$label" "$endpoint" "$user_token" "$expected" "$status" "FAIL" "$notes"
    fail "$label expected $expected got $status"
  fi
}

extract_json_string() {
  sed -n "s/.*\"$2\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" "$1" | head -n 1
}

login() {
  local email="$1"
  local output="$2"
  curl -sS -o "$output" -w "%{http_code}" \
    -X POST "$API_BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$QA_PASSWORD\"}"
}

request_with_token() {
  local method="$1"
  local path="$2"
  local token="$3"
  local output="$4"
  curl -sS -o "$output" -w "%{http_code}" \
    -X "$method" "$API_BASE_URL$path" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: text/csv"
}

assert_contains() {
  local label="$1"
  local endpoint="$2"
  local file="$3"
  local expected="$4"

  if grep -q "$expected" "$file"; then
    record_result "$label" "$endpoint" "SUPPORT" "contiene $expected" "FOUND" "PASS" "Contenido esperado"
    pass "$label contains $expected"
  else
    record_result "$label" "$endpoint" "SUPPORT" "contiene $expected" "MISSING" "FAIL" "Contenido ausente"
    fail "$label missing $expected"
  fi
}

assert_not_contains() {
  local label="$1"
  local endpoint="$2"
  local file="$3"
  local forbidden="$4"

  if grep -qi "$forbidden" "$file"; then
    record_result "$label" "$endpoint" "SUPPORT" "no contiene $forbidden" "FOUND" "FAIL" "Contenido sensible detectado"
    fail "$label found forbidden $forbidden"
  else
    record_result "$label" "$endpoint" "SUPPORT" "no contiene $forbidden" "NOT_FOUND" "PASS" "Contenido sensible ausente"
    pass "$label no $forbidden"
  fi
}

write_report_headers

SUPPORT_LOGIN="$TMP_DIR/support-login.json"
SUPPORT_STATUS="$(login "$SUPPORT_EMAIL" "$SUPPORT_LOGIN")"
expect_status "login soporte auditoria" "POST /api/auth/login" "$SUPPORT_EMAIL" "$SUPPORT_STATUS" "200" "Usuario con VIEW_SECURITY_AUDIT"
SUPPORT_TOKEN="$(extract_json_string "$SUPPORT_LOGIN" "sessionToken")"

if [ -z "${SUPPORT_TOKEN:-}" ]; then
  record_result "extraer token soporte" "POST /api/auth/login" "$SUPPORT_EMAIL" "sessionToken" "EMPTY" "FAIL" "No se pudo extraer token"
  fail "support token missing"
else
  record_result "extraer token soporte" "POST /api/auth/login" "$SUPPORT_EMAIL" "sessionToken" "OK" "PASS" "Token extraido"
  pass "support token extracted"
fi

if [ -n "${SUPPORT_TOKEN:-}" ]; then
  EVENTS_CSV="$TMP_DIR/events.csv"
  EVENTS_STATUS="$(request_with_token "GET" "/api/security/audit-events/export.csv" "$SUPPORT_TOKEN" "$EVENTS_CSV")"
  expect_status "soporte exporta eventos CSV" "GET /api/security/audit-events/export.csv" "SUPPORT" "$EVENTS_STATUS" "200" "Debe descargar eventos"

  if [ "$EVENTS_STATUS" = "200" ]; then
    assert_contains "eventos CSV encabezado" "GET /api/security/audit-events/export.csv" "$EVENTS_CSV" "event_type"
    assert_not_contains "eventos CSV sin sessionToken" "GET /api/security/audit-events/export.csv" "$EVENTS_CSV" "sessionToken"
    assert_not_contains "eventos CSV sin password" "GET /api/security/audit-events/export.csv" "$EVENTS_CSV" "password"
  fi

  ALERTS_CSV="$TMP_DIR/alerts.csv"
  ALERTS_STATUS="$(request_with_token "GET" "/api/security/audit-events/alerts/export.csv?windowMinutes=60&threshold=1" "$SUPPORT_TOKEN" "$ALERTS_CSV")"
  expect_status "soporte exporta alertas CSV" "GET /api/security/audit-events/alerts/export.csv" "SUPPORT" "$ALERTS_STATUS" "200" "Debe descargar alertas"

  if [ "$ALERTS_STATUS" = "200" ]; then
    assert_contains "alertas CSV encabezado" "GET /api/security/audit-events/alerts/export.csv" "$ALERTS_CSV" "alert_type"
    assert_not_contains "alertas CSV sin sessionToken" "GET /api/security/audit-events/alerts/export.csv" "$ALERTS_CSV" "sessionToken"
    assert_not_contains "alertas CSV sin password" "GET /api/security/audit-events/alerts/export.csv" "$ALERTS_CSV" "password"
  fi
else
  record_result "exports soporte" "GET /api/security/audit-events/export.csv" "SUPPORT" "200" "SKIP" "SKIP" "No hubo token soporte"
  skip "support exports skipped"
fi

ADMIN_LOGIN="$TMP_DIR/admin-login.json"
ADMIN_STATUS="$(login "$TENANT_ADMIN_EMAIL" "$ADMIN_LOGIN")"
expect_status "login admin tenant" "POST /api/auth/login" "$TENANT_ADMIN_EMAIL" "$ADMIN_STATUS" "200" "Usuario sin VIEW_SECURITY_AUDIT"
ADMIN_TOKEN="$(extract_json_string "$ADMIN_LOGIN" "sessionToken")"

if [ -n "${ADMIN_TOKEN:-}" ]; then
  ADMIN_EVENTS="$TMP_DIR/admin-events.csv"
  ADMIN_EVENTS_STATUS="$(request_with_token "GET" "/api/security/audit-events/export.csv" "$ADMIN_TOKEN" "$ADMIN_EVENTS")"
  expect_status "admin sin permiso export eventos" "GET /api/security/audit-events/export.csv" "TENANT_ADMIN" "$ADMIN_EVENTS_STATUS" "403" "Debe quedar bloqueado"

  ADMIN_ALERTS="$TMP_DIR/admin-alerts.csv"
  ADMIN_ALERTS_STATUS="$(request_with_token "GET" "/api/security/audit-events/alerts/export.csv" "$ADMIN_TOKEN" "$ADMIN_ALERTS")"
  expect_status "admin sin permiso export alertas" "GET /api/security/audit-events/alerts/export.csv" "TENANT_ADMIN" "$ADMIN_ALERTS_STATUS" "403" "Debe quedar bloqueado"
else
  record_result "admin sin permiso exports" "GET /api/security/audit-events/export.csv" "TENANT_ADMIN" "403" "SKIP" "SKIP" "No hubo token admin"
  skip "admin token missing"
fi

{
  printf '\n## Summary\n\n'
  printf '%s\n' "- PASS: \`$PASS_COUNT\`"
  printf '%s\n' "- FAIL: \`$FAIL_COUNT\`"
  printf '%s\n' "- SKIP: \`$SKIP_COUNT\`"
} >> "$REPORT_MD"

log "Summary: PASS=$PASS_COUNT FAIL=$FAIL_COUNT SKIP=$SKIP_COUNT"
log "Markdown report: $REPORT_MD"
log "CSV report: $REPORT_CSV"

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi

exit 0
