#!/usr/bin/env bash
set -Eeuo pipefail

# ==========================================================
# Reset local de base de datos AppModa / control-ropa
# Uso:
#   ./scripts/reset-db-local.sh
#   ./scripts/reset-db-local.sh --start-backend
#
# Solo para DEV/QA local. NO usar en producción.
# ==========================================================

DB_NAME="${DB_NAME:-control_ropa}"
DB_USER="${DB_USER:-root}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
MYSQL_BIN="${MYSQL_BIN:-/c/Program Files/MySQL/MySQL Server 5.7/bin}"

START_BACKEND="false"

for arg in "$@"; do
  case "$arg" in
    --start-backend)
      START_BACKEND="true"
      ;;
    -h|--help)
      echo "Uso:"
      echo "  ./scripts/reset-db-local.sh"
      echo "  ./scripts/reset-db-local.sh --start-backend"
      echo ""
      echo "Variables opcionales:"
      echo "  DB_NAME=control_ropa"
      echo "  DB_USER=root"
      echo "  DB_HOST=localhost"
      echo "  DB_PORT=3306"
      echo "  MYSQL_BIN='/c/Program Files/MySQL/MySQL Server 5.7/bin'"
      exit 0
      ;;
    *)
      echo "[ERROR] Argumento no reconocido: $arg"
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$APP_ROOT/backups/db"

MYSQL_EXE="$MYSQL_BIN/mysql.exe"
MYSQLDUMP_EXE="$MYSQL_BIN/mysqldump.exe"

step() {
  echo ""
  echo "============================================================"
  echo "$1"
  echo "============================================================"
}

fail() {
  echo ""
  echo "[ERROR] $1"
  exit 1
}

cleanup() {
  if [[ -n "${TMP_CNF:-}" && -f "$TMP_CNF" ]]; then
    rm -f "$TMP_CNF"
  fi
}
trap cleanup EXIT

step "[1/8] Validando ubicación del proyecto"

cd "$APP_ROOT"

echo "[INFO] Proyecto: $APP_ROOT"
echo "[INFO] Base:     $DB_NAME"
echo "[INFO] Host:     $DB_HOST:$DB_PORT"
echo "[INFO] Usuario:  $DB_USER"

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[INFO] Rama Git: $(git branch --show-current)"
  echo "[INFO] Estado Git:"
  git status -sb
else
  echo "[WARN] No parece ser un repositorio Git."
fi

step "[2/8] Validando cliente MySQL"

[[ -f "$MYSQL_EXE" ]] || fail "No existe mysql.exe en: $MYSQL_EXE"
[[ -f "$MYSQLDUMP_EXE" ]] || fail "No existe mysqldump.exe en: $MYSQLDUMP_EXE"

"$MYSQL_EXE" --version
"$MYSQLDUMP_EXE" --version

step "[3/8] Confirmación de seguridad"

echo "[ADVERTENCIA] Este proceso va a BORRAR y RECREAR la base: $DB_NAME"
echo "[ADVERTENCIA] Solo debe usarse en DEV/QA local, nunca en producción."
echo ""
read -r -p "¿Confirmas resetear la base $DB_NAME? Escribe S para continuar: " CONFIRM

if [[ "$CONFIRM" != "S" && "$CONFIRM" != "s" ]]; then
  echo "[CANCELADO] No se hizo ningún cambio."
  exit 0
fi

step "[4/8] Solicitando contraseña MySQL"

read -r -s -p "Password de MySQL para $DB_USER: " DB_PASSWORD
echo ""

TMP_CNF="$(mktemp)"
chmod 600 "$TMP_CNF"

cat > "$TMP_CNF" <<CNF
[client]
user=$DB_USER
password=$DB_PASSWORD
host=$DB_HOST
port=$DB_PORT
CNF

step "[5/8] Probando conexión a MySQL"

"$MYSQL_EXE" --defaults-extra-file="$TMP_CNF" -e "SELECT VERSION() AS mysql_version;" \
  || fail "No se pudo conectar a MySQL. Revisa usuario/password/servicio MySQL."

step "[6/8] Creando backup antes del reset"

mkdir -p "$BACKUP_DIR"

BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_backup_$(date +%Y%m%d_%H%M%S).sql"

echo "[INFO] Backup destino:"
echo "$BACKUP_FILE"

"$MYSQLDUMP_EXE" --defaults-extra-file="$TMP_CNF" --databases "$DB_NAME" > "$BACKUP_FILE" \
  || fail "Falló el backup. No se borró la base."

if [[ ! -s "$BACKUP_FILE" ]]; then
  fail "El backup quedó vacío. No se borró la base."
fi

echo "[OK] Backup generado correctamente."

step "[7/8] Borrando y recreando base limpia"

if [[ ! "$DB_NAME" =~ ^[A-Za-z0-9_]+$ ]]; then
  fail "Nombre de base inválido: $DB_NAME"
fi

"$MYSQL_EXE" --defaults-extra-file="$TMP_CNF" -e "
DROP DATABASE IF EXISTS \`$DB_NAME\`;
CREATE DATABASE \`$DB_NAME\`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
" || fail "Falló el DROP/CREATE DATABASE."

echo "[OK] Base recreada: $DB_NAME"

step "[8/8] Validación final"

"$MYSQL_EXE" --defaults-extra-file="$TMP_CNF" -e "
SHOW DATABASES LIKE '$DB_NAME';
" || fail "No se pudo validar la base."

echo ""
echo "[OK] Reset terminado correctamente."
echo "[OK] Backup disponible en:"
echo "$BACKUP_FILE"

if [[ "$START_BACKEND" == "true" ]]; then
  step "Levantando backend con ./scripts/dev-backend.sh"

  if [[ ! -f "$APP_ROOT/scripts/dev-backend.sh" ]]; then
    fail "No existe $APP_ROOT/scripts/dev-backend.sh"
  fi

  cd "$APP_ROOT"
  ./scripts/dev-backend.sh
else
  echo ""
  echo "Siguiente paso sugerido:"
  echo "  ./scripts/dev-backend.sh"
  echo ""
  echo "Cuando el backend levante, Flyway debe recrear las tablas y aplicar las migraciones."
fi
