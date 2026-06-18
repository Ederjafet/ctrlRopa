#!/usr/bin/env bash
set -u

API_BASE_URL="${API_BASE_URL:-http://localhost:8090}"
SUPPORT_EMAIL="${SUPPORT_EMAIL:-qa.soporte@local.test}"
TENANT_ADMIN_EMAIL="${TENANT_ADMIN_EMAIL:-qa.a.admin@local.test}"
NO_ACCESS_EMAIL="${NO_ACCESS_EMAIL:-qa.sinpermisos@local.test}"
QA_PASSWORD="${QA_PASSWORD:-Qa12345!}"

REPORT_DIR="${REPORT_DIR:-qa-reports}"
REPORT_TS="$(date '+%Y%m%d-%H%M%S')"
REPORT_MD="$REPORT_DIR/AUTH-I2-view-security-audit-smoke-report-$REPORT_TS.md"
REPORT_CSV="$REPORT_DIR/AUTH-I2-view-security-audit-smoke-report-$REPORT_TS.csv"
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
    printf '# AUTH-I2 VIEW_SECURITY_AUDIT smoke report\n\n'
    printf '%s\n' "- Timestamp: \`$RUN_TIMESTAMP\`"
    printf '%s\n' "- API: \`$API_BASE_URL\`"
    printf '%s\n' "- Support user: \`$SUPPORT_EMAIL\`"
    printf '%s\n' "- Tenant admin without audit permission: \`$TENANT_ADMIN_EMAIL\`"
    printf '%s\n\n' "- NO_ACCESS: \`$NO_ACCESS_EMAIL\`"
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

extract_json_string() {
  sed -n "s/.*\"$2\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" "$1" | head -n 1
}

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  log "PASS $*"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  log "FAIL $*"
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

query_audit() {
  local query="$1"
  local output="$2"
  request_with_token "GET" "/api/security/audit-events?$query" "$SUPPORT_TOKEN" "$output"
}

assert_audit_contains() {
  local label="$1"
  local query="$2"
  local event_type="$3"
  local output="$TMP_DIR/$label.json"
  local status

  status="$(query_audit "$query" "$output")"
  if [ "$status" != "200" ]; then
    record_result "$label" "GET /api/security/audit-events?$query" "SUPPORT" "200 con $event_type" "$status" "FAIL" "El endpoint de auditoria no respondio 200"
    fail "$label audit query expected 200 got $status"
    return
  fi

  if grep -q "\"eventType\":\"$event_type\"" "$output"; then
    record_result "$label" "GET /api/security/audit-events?$query" "SUPPORT" "$event_type presente" "$status" "PASS" "Evento encontrado"
    pass "$label found $event_type"
  else
    record_result "$label" "GET /api/security/audit-events?$query" "SUPPORT" "$event_type presente" "$status" "FAIL" "Evento no encontrado"
    fail "$label missing $event_type"
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

ADMIN_LOGIN_1="$TMP_DIR/admin-login-1.json"
ADMIN_STATUS_1="$(login "$TENANT_ADMIN_EMAIL" "$ADMIN_LOGIN_1")"
expect_status "login admin tenant" "POST /api/auth/login" "$TENANT_ADMIN_EMAIL" "$ADMIN_STATUS_1" "200" "Usuario sin VIEW_SECURITY_AUDIT"
ADMIN_TOKEN_OLD="$(extract_json_string "$ADMIN_LOGIN_1" "sessionToken")"

if [ -n "${ADMIN_TOKEN_OLD:-}" ]; then
  ADMIN_AUDIT_OUTPUT="$TMP_DIR/admin-audit.json"
  ADMIN_AUDIT_STATUS="$(request_with_token "GET" "/api/security/audit-events?page=0&size=1" "$ADMIN_TOKEN_OLD" "$ADMIN_AUDIT_OUTPUT")"
  expect_status "admin tenant sin VIEW_SECURITY_AUDIT" "GET /api/security/audit-events?page=0&size=1" "TENANT_ADMIN" "$ADMIN_AUDIT_STATUS" "403" "Debe quedar bloqueado"
else
  record_result "admin tenant sin VIEW_SECURITY_AUDIT" "GET /api/security/audit-events?page=0&size=1" "TENANT_ADMIN" "403" "SKIP" "SKIP" "No hubo token admin"
  SKIP_COUNT=$((SKIP_COUNT + 1))
fi

NO_ACCESS_LOGIN="$TMP_DIR/no-access-login.json"
NO_ACCESS_STATUS="$(login "$NO_ACCESS_EMAIL" "$NO_ACCESS_LOGIN")"
expect_status "provocar LOGIN_BLOCKED_NO_ACCESS" "POST /api/auth/login" "$NO_ACCESS_EMAIL" "$NO_ACCESS_STATUS" "403" "Usuario NO_ACCESS debe ser bloqueado"

ADMIN_LOGIN_2="$TMP_DIR/admin-login-2.json"
ADMIN_STATUS_2="$(login "$TENANT_ADMIN_EMAIL" "$ADMIN_LOGIN_2")"
expect_status "login admin tenant segundo equipo" "POST /api/auth/login" "$TENANT_ADMIN_EMAIL" "$ADMIN_STATUS_2" "200" "Revoca el token anterior"

if [ -n "${ADMIN_TOKEN_OLD:-}" ]; then
  REVOKED_OUTPUT="$TMP_DIR/revoked-me.json"
  REVOKED_STATUS="$(request_with_token "GET" "/api/me" "$ADMIN_TOKEN_OLD" "$REVOKED_OUTPUT")"
  expect_status "provocar TOKEN_REVOKED" "GET /api/me" "TENANT_ADMIN_REVOKED" "$REVOKED_STATUS" "401" "Token anterior debe ser rechazado"
fi

if [ -n "${SUPPORT_TOKEN:-}" ]; then
  SUPPORT_AUDIT_OUTPUT="$TMP_DIR/support-audit.json"
  SUPPORT_AUDIT_STATUS="$(request_with_token "GET" "/api/security/audit-events?page=0&size=1" "$SUPPORT_TOKEN" "$SUPPORT_AUDIT_OUTPUT")"
  expect_status "soporte con VIEW_SECURITY_AUDIT" "GET /api/security/audit-events?page=0&size=1" "SUPPORT" "$SUPPORT_AUDIT_STATUS" "200" "Debe poder consultar auditoria"

  assert_audit_contains \
    "auditoria LOGIN_BLOCKED_NO_ACCESS" \
    "eventType=LOGIN_BLOCKED_NO_ACCESS&email=$NO_ACCESS_EMAIL&statusCode=403&page=0&size=20" \
    "LOGIN_BLOCKED_NO_ACCESS"

  assert_audit_contains \
    "auditoria TOKEN_REVOKED" \
    "eventType=TOKEN_REVOKED&statusCode=401&page=0&size=20" \
    "TOKEN_REVOKED"
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
