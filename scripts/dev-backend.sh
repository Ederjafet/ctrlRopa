#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"

cd "$PROJECT_ROOT"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "No existe .env. Copia .env.example a .env y configura CONTROL_ROPA_DB_PASSWORD."
  exit 1
fi

set -a
if ! source "$ENV_FILE"; then
  set +a
  echo "No se pudo cargar .env. Revisa que use formato KEY=VALUE y comillas para valores con espacios o &."
  exit 1
fi
set +a

if [[ -z "${CONTROL_ROPA_DB_PASSWORD:-}" ]]; then
  echo "CONTROL_ROPA_DB_PASSWORD esta vacia. Configurala en .env antes de arrancar backend DEV."
  exit 1
fi

if [[ "$CONTROL_ROPA_DB_PASSWORD" == "CAMBIA_ESTE_VALOR" || "$CONTROL_ROPA_DB_PASSWORD" == "change-me" ]]; then
  echo "CONTROL_ROPA_DB_PASSWORD sigue usando el valor de ejemplo. Configura el password local real en .env."
  exit 1
fi

cd "$PROJECT_ROOT/backend/control-ropa"
./mvnw.cmd spring-boot:run
