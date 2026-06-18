#!/usr/bin/env bash
set -u

API_BASE_URL="${API_BASE_URL:-http://localhost:8090}"

QA_A_EMAIL="${QA_A_EMAIL:-qa.a.admin@local.test}"
QA_B_EMAIL="${QA_B_EMAIL:-qa.b.admin@local.test}"
QA_PASSWORD="${QA_PASSWORD:-Qa12345!}"

QA_A_BRANCH_ID="${QA_A_BRANCH_ID:-6}"
QA_B_BRANCH_ID="${QA_B_BRANCH_ID:-7}"
DEFAULT_BRANCH_ID="${DEFAULT_BRANCH_ID:-4}"

DEFAULT_PAYMENT_ID="${DEFAULT_PAYMENT_ID:-1}"
DEFAULT_SALE_ID="${DEFAULT_SALE_ID:-1}"

QA_DUP_ITEM_CODE="${QA_DUP_ITEM_CODE:-QA-DUP-001}"
QA_DUP_ITEM_QR="${QA_DUP_ITEM_QR:-QR-QA-DUP-001}"
QA_DUP_BATCH_FOLIO="${QA_DUP_BATCH_FOLIO:-}"

QA_B_CUSTOMER_ID="${QA_B_CUSTOMER_ID:-}"
QA_B_ITEM_ID="${QA_B_ITEM_ID:-}"
QA_B_BATCH_ID="${QA_B_BATCH_ID:-}"
QA_B_PAYMENT_ID="${QA_B_PAYMENT_ID:-}"
QA_B_SALE_ID="${QA_B_SALE_ID:-}"
QA_B_RESERVATION_ID="${QA_B_RESERVATION_ID:-}"
QA_B_CUSTOMER_PACKAGE_ID="${QA_B_CUSTOMER_PACKAGE_ID:-}"
QA_B_SHIPMENT_ID="${QA_B_SHIPMENT_ID:-}"
QA_B_REFUND_ID="${QA_B_REFUND_ID:-}"

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

REPORT_DIR="${REPORT_DIR:-qa-reports}"
REPORT_TS="$(date '+%Y%m%d-%H%M%S')"
REPORT_MD="$REPORT_DIR/AUTH-F6-smoke-report-$REPORT_TS.md"
REPORT_CSV="$REPORT_DIR/AUTH-F6-smoke-report-$REPORT_TS.csv"
RUN_TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S %z')"
LAST_ENDPOINT="-"
LAST_USER="-"

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
    printf '# AUTH-F6 SaaS negative regression smoke report\n\n'
    printf '%s\n' "- Timestamp: \`$RUN_TIMESTAMP\`"
    printf '%s\n' "- API: \`$API_BASE_URL\`"
    printf '%s\n' "- QA_A: \`$QA_A_EMAIL\`, branch \`$QA_A_BRANCH_ID\`"
    printf '%s\n' "- QA_B: \`$QA_B_EMAIL\`, branch \`$QA_B_BRANCH_ID\`"
    printf '%s\n\n' "- DEFAULT branch: \`$DEFAULT_BRANCH_ID\`"
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

token_label() {
  local token="$1"
  if [ "${TOKEN_A:-}" = "$token" ]; then
    printf 'QA_A'
    return
  fi
  if [ "${TOKEN_B:-}" = "$token" ]; then
    printf 'QA_B'
    return
  fi
  if [ "${TOKEN_A_OLD:-}" = "$token" ]; then
    printf 'QA_A_REVOKED'
    return
  fi
  printf 'UNKNOWN'
}

last_endpoint() {
  if [ -f "$TMP_DIR/last_endpoint" ]; then
    cat "$TMP_DIR/last_endpoint"
  else
    printf '%s' "$LAST_ENDPOINT"
  fi
}

last_user() {
  if [ -f "$TMP_DIR/last_user" ]; then
    cat "$TMP_DIR/last_user"
  else
    printf '%s' "$LAST_USER"
  fi
}

extract_json_string() {
  sed -n "s/.*\"$2\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" "$1" | head -n 1
}

extract_json_number() {
  sed -n "s/.*\"$2\"[[:space:]]*:[[:space:]]*\([0-9][0-9]*\).*/\1/p" "$1" | head -n 1
}

extract_first_array_id() {
  sed -n 's/.*"id"[[:space:]]*:[[:space:]]*\([0-9][0-9]*\).*/\1/p' "$1" | head -n 1
}

login() {
  local email="$1"
  local output="$2"
  local status
  status="$(curl -sS -o "$output" -w "%{http_code}" \
    -X POST "$API_BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$QA_PASSWORD\"}")"

  if [ "$status" != "200" ]; then
    log "FAIL login $email expected 200 got $status"
    cat "$output"
    exit 1
  fi
}

request_status() {
  local method="$1"
  local path="$2"
  local token="$3"
  local output="$4"
  LAST_ENDPOINT="$method $path"
  LAST_USER="$(token_label "$token")"
  printf '%s' "$LAST_ENDPOINT" > "$TMP_DIR/last_endpoint"
  printf '%s' "$LAST_USER" > "$TMP_DIR/last_user"
  curl -sS -o "$output" -w "%{http_code}" \
    -X "$method" "$API_BASE_URL$path" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json"
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
  record_result "$*" "-" "-" "dato QA disponible" "SKIP" "SKIP" "Dato opcional no configurado o no disponible"
}

expect_status() {
  local label="$1"
  local status="$2"
  local expected="$3"
  if [ "$status" = "$expected" ]; then
    record_result "$label" "$(last_endpoint)" "$(last_user)" "$expected" "$status" "PASS" "Respuesta esperada"
    pass "$label -> $status"
  else
    record_result "$label" "$(last_endpoint)" "$(last_user)" "$expected" "$status" "FAIL" "Respuesta inesperada"
    fail "$label expected $expected got $status"
  fi
}

expect_cross_blocked() {
  local label="$1"
  local status="$2"
  case "$status" in
    403|404)
      record_result "$label" "$(last_endpoint)" "$(last_user)" "403 o 404" "$status" "PASS" "Dato cross-tenant bloqueado"
      pass "$label blocked -> $status"
      ;;
    200)
      record_result "$label" "$(last_endpoint)" "$(last_user)" "403 o 404" "$status" "FAIL" "Fuga: dato ajeno respondio 200"
      fail "$label leaked data -> 200"
      ;;
    *)
      record_result "$label" "$(last_endpoint)" "$(last_user)" "403 o 404" "$status" "FAIL" "Respuesta inesperada para caso cross-tenant"
      fail "$label expected 403/404 got $status"
      ;;
  esac
}

expect_not_200() {
  local label="$1"
  local status="$2"
  if [ "$status" = "200" ]; then
    record_result "$label" "$(last_endpoint)" "$(last_user)" "no 200" "$status" "FAIL" "Respuesta 200 no esperada"
    fail "$label unexpected 200"
  else
    record_result "$label" "$(last_endpoint)" "$(last_user)" "no 200" "$status" "PASS" "Respuesta no exitosa como se esperaba"
    pass "$label not 200 -> $status"
  fi
}

discover_id_from_list() {
  local path="$1"
  local token="$2"
  local file="$TMP_DIR/discover.json"
  local status
  status="$(request_status GET "$path" "$token" "$file")"
  if [ "$status" = "200" ]; then
    extract_first_array_id "$file"
  else
    printf ''
  fi
}

write_report_headers

log "AUTH-F6 SaaS negative regression smoke"
log "API_BASE_URL=$API_BASE_URL"
log "QA_A_BRANCH_ID=$QA_A_BRANCH_ID QA_B_BRANCH_ID=$QA_B_BRANCH_ID DEFAULT_BRANCH_ID=$DEFAULT_BRANCH_ID"
log "REPORT_MD=$REPORT_MD"
log "REPORT_CSV=$REPORT_CSV"

login "$QA_A_EMAIL" "$TMP_DIR/login_a_old.json"
TOKEN_A_OLD="$(extract_json_string "$TMP_DIR/login_a_old.json" sessionToken)"

login "$QA_A_EMAIL" "$TMP_DIR/login_a.json"
TOKEN_A="$(extract_json_string "$TMP_DIR/login_a.json" sessionToken)"

login "$QA_B_EMAIL" "$TMP_DIR/login_b.json"
TOKEN_B="$(extract_json_string "$TMP_DIR/login_b.json" sessionToken)"

if [ -z "$TOKEN_A" ] || [ -z "$TOKEN_B" ]; then
  log "FAIL could not extract sessionToken from login response"
  exit 1
fi

STATUS="$(request_status GET "/api/me" "$TOKEN_A_OLD" "$TMP_DIR/revoked.json")"
expect_status "revoked previous QA_A token" "$STATUS" "401"

STATUS="$(request_status GET "/api/customers/branch/$QA_A_BRANCH_ID" "$TOKEN_A" "$TMP_DIR/a_customers.json")"
expect_status "QA_A own customers branch" "$STATUS" "200"

STATUS="$(request_status GET "/api/customers/branch/$QA_B_BRANCH_ID" "$TOKEN_A" "$TMP_DIR/a_customers_b_branch.json")"
expect_cross_blocked "QA_A customers QA_B branch" "$STATUS"

STATUS="$(request_status GET "/api/customers/branch/$DEFAULT_BRANCH_ID" "$TOKEN_A" "$TMP_DIR/a_customers_default_branch.json")"
expect_cross_blocked "QA_A customers DEFAULT branch" "$STATUS"

STATUS="$(request_status GET "/api/customers/branch/$QA_B_BRANCH_ID" "$TOKEN_B" "$TMP_DIR/b_customers.json")"
expect_status "QA_B own customers branch" "$STATUS" "200"

if [ -z "$QA_B_CUSTOMER_ID" ]; then
  QA_B_CUSTOMER_ID="$(extract_first_array_id "$TMP_DIR/b_customers.json")"
fi
if [ -n "$QA_B_CUSTOMER_ID" ]; then
  STATUS="$(request_status GET "/api/customers/$QA_B_CUSTOMER_ID" "$TOKEN_A" "$TMP_DIR/a_customer_b_id.json")"
  expect_cross_blocked "QA_A customer QA_B id $QA_B_CUSTOMER_ID" "$STATUS"

  STATUS="$(request_status GET "/api/customer-addresses/customer/$QA_B_CUSTOMER_ID" "$TOKEN_A" "$TMP_DIR/a_addresses_b_customer.json")"
  expect_cross_blocked "QA_A addresses QA_B customer $QA_B_CUSTOMER_ID" "$STATUS"

  STATUS="$(request_status GET "/api/balance/$QA_B_CUSTOMER_ID" "$TOKEN_A" "$TMP_DIR/a_balance_b_customer.json")"
  expect_cross_blocked "QA_A balance QA_B customer $QA_B_CUSTOMER_ID" "$STATUS"
else
  skip "QA_B customer id unavailable; customer id/address/balance checks skipped"
fi

STATUS="$(request_status GET "/api/items/branch/$QA_A_BRANCH_ID" "$TOKEN_A" "$TMP_DIR/a_items.json")"
expect_status "QA_A own items branch" "$STATUS" "200"

STATUS="$(request_status GET "/api/items/branch/$QA_B_BRANCH_ID" "$TOKEN_A" "$TMP_DIR/a_items_b_branch.json")"
expect_cross_blocked "QA_A items QA_B branch" "$STATUS"

STATUS="$(request_status GET "/api/items/lookup/code/$QA_DUP_ITEM_CODE" "$TOKEN_A" "$TMP_DIR/a_item_code.json")"
expect_status "QA_A item lookup duplicated code scoped to own tenant" "$STATUS" "200"

STATUS="$(request_status GET "/api/items/lookup/qr/$QA_DUP_ITEM_QR" "$TOKEN_A" "$TMP_DIR/a_item_qr.json")"
expect_status "QA_A item lookup duplicated QR scoped to own tenant" "$STATUS" "200"

if [ -z "$QA_B_ITEM_ID" ]; then
  STATUS="$(request_status GET "/api/items/branch/$QA_B_BRANCH_ID" "$TOKEN_B" "$TMP_DIR/b_items.json")"
  if [ "$STATUS" = "200" ]; then
    QA_B_ITEM_ID="$(extract_first_array_id "$TMP_DIR/b_items.json")"
  fi
fi
if [ -n "$QA_B_ITEM_ID" ]; then
  STATUS="$(request_status GET "/api/items/$QA_B_ITEM_ID" "$TOKEN_A" "$TMP_DIR/a_item_b_id.json")"
  expect_cross_blocked "QA_A item QA_B id $QA_B_ITEM_ID" "$STATUS"
else
  skip "QA_B item id unavailable; item by id check skipped"
fi

STATUS="$(request_status GET "/api/batches/branch/$QA_A_BRANCH_ID" "$TOKEN_A" "$TMP_DIR/a_batches.json")"
expect_status "QA_A own batches branch" "$STATUS" "200"

STATUS="$(request_status GET "/api/batches/branch/$QA_B_BRANCH_ID" "$TOKEN_A" "$TMP_DIR/a_batches_b_branch.json")"
expect_cross_blocked "QA_A batches QA_B branch" "$STATUS"

if [ -n "$QA_DUP_BATCH_FOLIO" ]; then
  STATUS="$(request_status GET "/api/batches/folio/$QA_DUP_BATCH_FOLIO" "$TOKEN_A" "$TMP_DIR/a_batch_folio.json")"
  expect_not_200 "QA_A batch folio configured as cross-check $QA_DUP_BATCH_FOLIO" "$STATUS"
else
  skip "QA_DUP_BATCH_FOLIO not set; batch folio cross-check skipped"
fi

STATUS="$(request_status GET "/api/payments/$DEFAULT_PAYMENT_ID" "$TOKEN_A" "$TMP_DIR/a_payment_default.json")"
expect_cross_blocked "QA_A payment DEFAULT id $DEFAULT_PAYMENT_ID" "$STATUS"

STATUS="$(request_status GET "/api/sales/$DEFAULT_SALE_ID" "$TOKEN_A" "$TMP_DIR/a_sale_default.json")"
expect_cross_blocked "QA_A sale DEFAULT id $DEFAULT_SALE_ID" "$STATUS"

STATUS="$(request_status GET "/api/reports/daily-store?branchId=$QA_B_BRANCH_ID&date=2026-05-25" "$TOKEN_A" "$TMP_DIR/a_report_b_branch.json")"
expect_cross_blocked "QA_A daily-store report QA_B branch" "$STATUS"

STATUS="$(request_status GET "/api/reservations/branch/$QA_A_BRANCH_ID" "$TOKEN_A" "$TMP_DIR/a_reservations.json")"
expect_status "QA_A own reservations branch" "$STATUS" "200"

STATUS="$(request_status GET "/api/reservations/branch/$QA_B_BRANCH_ID" "$TOKEN_A" "$TMP_DIR/a_reservations_b_branch.json")"
expect_cross_blocked "QA_A reservations QA_B branch" "$STATUS"

if [ -n "$QA_B_RESERVATION_ID" ]; then
  STATUS="$(request_status GET "/api/reservations/$QA_B_RESERVATION_ID" "$TOKEN_A" "$TMP_DIR/a_reservation_b_id.json")"
  expect_cross_blocked "QA_A reservation QA_B id $QA_B_RESERVATION_ID" "$STATUS"
else
  skip "QA_B_RESERVATION_ID not set; reservation id cross-check skipped"
fi

if [ -n "$QA_B_CUSTOMER_PACKAGE_ID" ]; then
  STATUS="$(request_status GET "/api/customer-packages/$QA_B_CUSTOMER_PACKAGE_ID" "$TOKEN_A" "$TMP_DIR/a_package_b_id.json")"
  expect_cross_blocked "QA_A package QA_B id $QA_B_CUSTOMER_PACKAGE_ID" "$STATUS"
else
  skip "QA_B_CUSTOMER_PACKAGE_ID not set; package id cross-check skipped"
fi

if [ -n "$QA_B_SHIPMENT_ID" ]; then
  STATUS="$(request_status GET "/api/shipments/$QA_B_SHIPMENT_ID" "$TOKEN_A" "$TMP_DIR/a_shipment_b_id.json")"
  expect_cross_blocked "QA_A shipment QA_B id $QA_B_SHIPMENT_ID" "$STATUS"
else
  skip "QA_B_SHIPMENT_ID not set; shipment id cross-check skipped"
fi

if [ -n "$QA_B_REFUND_ID" ]; then
  STATUS="$(request_status GET "/api/refunds/$QA_B_REFUND_ID" "$TOKEN_A" "$TMP_DIR/a_refund_b_id.json")"
  expect_cross_blocked "QA_A refund QA_B id $QA_B_REFUND_ID" "$STATUS"
else
  skip "QA_B_REFUND_ID not set; refund id cross-check skipped"
fi

log "Summary: PASS=$PASS_COUNT FAIL=$FAIL_COUNT SKIP=$SKIP_COUNT"

{
  printf '\n## Resumen\n\n'
  printf '%s\n' "- PASS: \`$PASS_COUNT\`"
  printf '%s\n' "- FAIL: \`$FAIL_COUNT\`"
  printf '%s\n' "- SKIP: \`$SKIP_COUNT\`"
} >> "$REPORT_MD"

log "Report markdown: $REPORT_MD"
log "Report csv: $REPORT_CSV"

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi

exit 0
