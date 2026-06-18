#!/usr/bin/env bash
set -u

API_BASE_URL="${API_BASE_URL:-http://localhost:8090}"
REPORT_DIR="${REPORT_DIR:-qa-reports}"
REPORT_TS="$(date '+%Y%m%d-%H%M%S')"
REPORT_MD="$REPORT_DIR/AUTH-Z-final-security-report-$REPORT_TS.md"
REPORT_CSV="$REPORT_DIR/AUTH-Z-final-security-report-$REPORT_TS.csv"
RUN_TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S %z')"

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
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
    printf '# AUTH-Z final security smoke report\n\n'
    printf '%s\n' "- Timestamp: \`$RUN_TIMESTAMP\`"
    printf '%s\n' "- API: \`$API_BASE_URL\`"
    printf '%s\n\n' "- Repo: \`$REPO_ROOT\`"
    printf '| Prueba | Modulo | Esperado | Recibido | Estatus | Observacion |\n'
    printf '|---|---|---|---|---|---|\n'
  } > "$REPORT_MD"

  printf 'test_name,module,expected,received,result,notes,timestamp,api_base_url\n' > "$REPORT_CSV"
}

record_result() {
  local test_name="$1"
  local module="$2"
  local expected="$3"
  local received="$4"
  local result="$5"
  local notes="$6"

  {
    csv_escape "$test_name"; printf ','
    csv_escape "$module"; printf ','
    csv_escape "$expected"; printf ','
    csv_escape "$received"; printf ','
    csv_escape "$result"; printf ','
    csv_escape "$notes"; printf ','
    csv_escape "$RUN_TIMESTAMP"; printf ','
    csv_escape "$API_BASE_URL"; printf '\n'
  } >> "$REPORT_CSV"

  printf '| %s | %s | %s | %s | %s | %s |\n' \
    "$(md_escape "$test_name")" \
    "$(md_escape "$module")" \
    "$(md_escape "$expected")" \
    "$(md_escape "$received")" \
    "$(md_escape "$result")" \
    "$(md_escape "$notes")" >> "$REPORT_MD"
}

record_skip() {
  local test_name="$1"
  local module="$2"
  local notes="$3"

  SKIP_COUNT=$((SKIP_COUNT + 1))
  record_result "$test_name" "$module" "script ejecutable" "SKIP" "SKIP" "$notes"
  log "SKIP $module - $notes"
}

run_smoke() {
  local label="$1"
  local module="$2"
  local script="$3"
  local expected="$4"
  local output="$TMP_DIR/$module.log"

  if [ ! -f "$REPO_ROOT/$script" ]; then
    record_skip "$label" "$module" "No existe $script"
    return
  fi

  log "RUN $module -> $script"
  API_BASE_URL="$API_BASE_URL" REPORT_DIR="$REPORT_DIR" "$REPO_ROOT/$script" > "$output" 2>&1
  local exit_code=$?
  local summary
  summary="$(grep -E 'Summary: PASS=[0-9]+ FAIL=[0-9]+ SKIP=[0-9]+' "$output" | tail -n 1 | sed 's/^Summary: //')"

  if [ -z "$summary" ]; then
    summary="exit=$exit_code"
  else
    summary="$summary exit=$exit_code"
  fi

  if [ "$exit_code" -eq 0 ]; then
    PASS_COUNT=$((PASS_COUNT + 1))
    record_result "$label" "$module" "$expected" "$summary" "PASS" "Smoke finalizo sin FAIL"
    log "PASS $module $summary"
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
    record_result "$label" "$module" "$expected" "$summary" "FAIL" "Revisar $output"
    log "FAIL $module $summary"
    cat "$output"
  fi
}

write_report_headers

run_smoke \
  "AUTH-F6 regresion negativa SaaS" \
  "AUTH-F6" \
  "docs/qa/10-auth-f6-saas-negative-regression-smoke.sh" \
  "QA_A/QA_B/DEFAULT aislados, token invalido 401, cross-tenant 403/404"

run_smoke \
  "AUTH-H auditoria protegida" \
  "AUTH-H" \
  "docs/qa/11-auth-h-security-audit-smoke.sh" \
  "NO_ACCESS auditado, token revocado auditado, soporte consulta auditoria"

run_smoke \
  "AUTH-I2 VIEW_SECURITY_AUDIT" \
  "AUTH-I2" \
  "docs/qa/12-auth-i2-view-security-audit-smoke.sh" \
  "qa.soporte 200, qa.a.admin 403"

run_smoke \
  "AUTH-J2 resumen de auditoria" \
  "AUTH-J2" \
  "docs/qa/13-auth-j2-security-audit-summary-smoke.sh" \
  "summary 200 para soporte, 403 para admin sin permiso"

run_smoke \
  "AUTH-J4 alertas de auditoria" \
  "AUTH-J4" \
  "docs/qa/14-auth-j4-security-alerts-smoke.sh" \
  "alerts 200 para soporte, 403 para admin sin permiso"

run_smoke \
  "AUTH-J5 export CSV de auditoria" \
  "AUTH-J5" \
  "docs/qa/15-auth-j5-security-audit-export-smoke.sh" \
  "exports 200 soporte, 403 admin, sin password/sessionToken"

{
  printf '\n## Checklist minimo cubierto\n\n'
  printf '%s\n' "- qa.sinpermisos bloqueado: AUTH-H/J4."
  printf '%s\n' "- Sesion unica invalida token anterior: AUTH-H/F6."
  printf '%s\n' "- QA_A no ve QA_B: AUTH-F6."
  printf '%s\n' "- QA_B no ve QA_A: AUTH-F6."
  printf '%s\n' "- DEFAULT no se filtra: AUTH-F6."
  printf '%s\n' "- Usuario sin permiso recibe 403: AUTH-I2/J2/J4/J5."
  printf '%s\n' "- qa.soporte consulta auditoria: AUTH-H/I2/J2/J4/J5."
  printf '%s\n' "- qa.a.admin no consulta auditoria: AUTH-I2/J2/J4/J5."
  printf '%s\n' "- Summary responde 200: AUTH-J2."
  printf '%s\n' "- Alerts responde 200: AUTH-J4."
  printf '%s\n' "- Exports responden 200 para soporte y 403 para admin: AUTH-J5."
  printf '%s\n' "- Exports sin password ni sessionToken: AUTH-J5."
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
