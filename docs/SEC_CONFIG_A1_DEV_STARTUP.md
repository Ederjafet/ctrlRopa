# SEC-CONFIG-A1 - Script local seguro de arranque DEV

## Problema

Despues de SEC-CONFIG-A, el backend ya no versiona el password de base de datos. Si `CONTROL_ROPA_DB_PASSWORD` no esta cargada, Spring Boot intenta conectar sin password y puede fallar con:

```text
Access denied for user 'root'@'localhost' (using password: NO)
```

Ese comportamiento es correcto desde seguridad: el secreto debe vivir fuera del repositorio.

## Como configurar DEV

Desde la raiz del proyecto:

```bash
cp .env.example .env
```

Luego editar `.env` y reemplazar:

```text
CONTROL_ROPA_DB_PASSWORD=CAMBIA_ESTE_VALOR
```

por el password local real. No compartir ese archivo y no subirlo al repositorio.

## Arranque con Git Bash

Desde la raiz del proyecto:

```bash
./scripts/dev-backend.sh
```

El script:

- valida que exista `.env`;
- carga variables con `set -a` y `source .env`;
- valida que `CONTROL_ROPA_DB_PASSWORD` no este vacia ni sea el placeholder;
- entra a `backend/control-ropa`;
- ejecuta `./mvnw.cmd spring-boot:run`;
- no imprime el password en consola.

## Arranque con Windows CMD

Desde la raiz del proyecto:

```cmd
scripts\dev-backend.cmd
```

El script:

- valida que exista `.env`;
- carga variables simples `KEY=VALUE`;
- valida `CONTROL_ROPA_DB_PASSWORD`;
- entra a `backend\control-ropa`;
- ejecuta `mvnw.cmd spring-boot:run`;
- no imprime el password en consola.

## Alternativa manual en CMD

Si se prefiere no usar `.env` en CMD:

```cmd
set CONTROL_ROPA_DB_PASSWORD=TU_PASSWORD_LOCAL
cd backend\control-ropa
mvnw.cmd spring-boot:run
```

No pegar el valor real en documentacion, tickets ni capturas.

## Validar que la variable existe

Git Bash:

```bash
echo $CONTROL_ROPA_DB_PASSWORD
```

Windows CMD:

```cmd
echo %CONTROL_ROPA_DB_PASSWORD%
```

Usar esto solo en ambiente local controlado. No compartir capturas si aparece el password.

## Que NO hacer

- No subir `.env`.
- No poner password real en `application.properties`.
- No pegar secretos reales en documentacion.
- No compartir capturas con passwords.
- No usar variables `EXPO_PUBLIC_*` para secretos.

## Troubleshooting

| Error | Causa probable | Accion |
| --- | --- | --- |
| `Access denied ... using password: NO` | `CONTROL_ROPA_DB_PASSWORD` no esta cargada. | Revisar `.env` o variable de entorno. |
| `Access denied ... using password: YES` | Password cargado pero incorrecto. | Corregir el valor local en `.env`. |
| `Unknown database` | La base no existe o la URL apunta a otra DB. | Crear DB o ajustar `CONTROL_ROPA_DB_URL`. |
| `Communications link failure` | MySQL no esta levantado, host/puerto incorrecto o firewall. | Levantar MySQL y revisar URL/puerto. |
| El script indica placeholder | `.env` sigue usando `CAMBIA_ESTE_VALOR`. | Reemplazar por el valor local real. |

## Estado

DONE_TECH para SEC-CONFIG-A1.

Estado QA: PENDING_QA hasta validar arranque local con `.env` real no versionado.
