#!/usr/bin/env bash
set -u

API_BASE_URL="${API_BASE_URL:-http://localhost:8090}"
SUPPORT_EMAIL="${SUPPORT_EMAIL:-qa.soporte@local.test}"
TENANT_ADMIN_EMAIL="${TENANT_ADMIN_EMAIL:-qa.a.admin@local.test}"
NO_ACCESS_EMAIL="${NO_ACCESS_EMAIL:-qa.sinpermisos@local.test}"
QA_PASSWORD="${QA_PASSWORD:-Qa12345!}"

REPORT_DIR="${REPORT_DIR:-qa-reports}"
REPORT_TS="$(date '+%Y%m%d-%H%M%S')"
REPORT_MD="$REPORT_DIR/AUTH-J4-security-alerts-smoke-report-$REPORT_TS.md"
REPORT_CSV="$REPORT_DIR/AUTH-J4-security-alerts-smoke-report-$REPORT_TS.csv"
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
    printf '# AUTH-J4 security alerts smoke report\n\n'
    printf '%s\n' "- Timestamp: \`$RUN_TIMESTAMP\`"
    printf '%s\n' "- API: \`$API_BASE_URL\`"
    printf '%s\n' "- Support user: \`$SUPPORT_EMAIL\`"
    printf '%s\n' "- Tenant admin without audit permission: \`$TENANT_ADMIN_EMAIL\`"
    printf '%s\n\n' "- NO_ACCESS user: \`$NO_ACCESS_EMAIL\`"
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
    -H "Content-Type: application/json"
}

assert_json_field() {
  local label="$1"
  local endpoint="$2"
  local file="$3"
  local field="$4"

  if grep -q "\"$field\"" "$file"; then
    record_result "$label" "$endpoint" "SUPPORT" "campo $field" "FOUND" "PASS" "Campo presente"
    pass "$label found $field"
  else
    record_result "$label" "$endpoint" "SUPPORT" "campo $field" "MISSING" "FAIL" "Campo ausente"
    fail "$label missing $field"
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

NO_ACCESS_LOGIN="$TMP_DIR/no-access-login.json"
NO_ACCESS_STATUS="$(login "$NO_ACCESS_EMAIL" "$NO_ACCESS_LOGIN")"
expect_status "login bloqueado NO_ACCESS" "POST /api/auth/login" "$NO_ACCESS_EMAIL" "$NO_ACCESS_STATUS" "403" "Debe generar evento LOGIN_BLOCKED_NO_ACCESS"

ADMIN_LOGIN="$TMP_DIR/admin-login.json"
ADMIN_STATUS="$(login "$TENANT_ADMIN_EMAIL" "$ADMIN_LOGIN")"
expect_status "login admin tenant" "POST /api/auth/login" "$TENANT_ADMIN_EMAIL" "$ADMIN_STATUS" "200" "Usuario sin VIEW_SECURITY_AUDIT"
ADMIN_TOKEN="$(extract_json_string "$ADMIN_LOGIN" "sessionToken")"

if [ -n "${ADMIN_TOKEN:-}" ]; then
  for i in 1 2 3 4 5; do
    ADMIN_DENIED_OUTPUT="$TMP_DIR/admin-denied-$i.json"
    ADMIN_DENIED_STATUS="$(request_with_token "GET" "/api/security/audit-events/alerts?windowMinutes=60&threshold=5" "$ADMIN_TOKEN" "$ADMIN_DENIED_OUTPUT")"
    expect_status "admin genera permiso denegado $i" "GET /api/security/audit-events/alerts" "TENANT_ADMIN" "$ADMIN_DENIED_STATUS" "403" "Debe quedar bloqueado por falta de VIEW_SECURITY_AUDIT"
  done
else
  record_result "admin genera permiso denegado" "GET /api/security/audit-events/alerts" "TENANT_ADMIN" "403" "SKIP" "SKIP" "No hubo token admin"
  skip "admin token missing"
fi

if [ -n "${SUPPORT_TOKEN:-}" ]; then
  ALERTS_OUTPUT="$TMP_DIR/alerts.json"
  ALERTS_ENDPOINT="/api/security/audit-events/alerts?windowMinutes=60&threshold=3"
  ALERTS_STATUS="$(request_with_token "GET" "$ALERTS_ENDPOINT" "$SUPPORT_TOKEN" "$ALERTS_OUTPUT")"
  expect_status "soporte consulta alertas" "GET $ALERTS_ENDPOINT" "SUPPORT" "$ALERTS_STATUS" "200" "Debe consultar alertas"

  if [ "$ALERTS_STATUS" = "200" ]; then
    assert_json_field "alerts totalAlerts" "GET $ALERTS_ENDPOINT" "$ALERTS_OUTPUT" "totalAlerts"
    assert_json_field "alerts collection" "GET $ALERTS_ENDPOINT" "$ALERTS_OUTPUT" "alerts"
  fi
else
  record_result "soporte consulta alertas" "GET /api/security/audit-events/alerts" "SUPPORT" "200" "SKIP" "SKIP" "No hubo token soporte"
  skip "support alerts skipped"
fi

if [ -n "${ADMIN_TOKEN:-}" ]; then
  ADMIN_ALERTS_OUTPUT="$TMP_DIR/admin-alerts.json"
  ADMIN_ALERTS_STATUS="$(request_with_token "GET" "/api/security/audit-events/alerts" "$ADMIN_TOKEN" "$ADMIN_ALERTS_OUTPUT")"
  expect_status "admin tenant sin VIEW_SECURITY_AUDIT" "GET /api/security/audit-events/alerts" "TENANT_ADMIN" "$ADMIN_ALERTS_STATUS" "403" "Debe quedar bloqueado"
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
