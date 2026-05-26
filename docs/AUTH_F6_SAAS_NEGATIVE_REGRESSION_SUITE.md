# AUTH-F6 - Suite de regresion negativa SaaS

Fecha: 2026-05-26  
Rama: `feature/auth-f6-saas-negative-regression-suite`  
Estado: suite inicial reproducible

## Objetivo

Crear una suite ejecutable de regresion negativa para evitar que futuras fases vuelvan a introducir fugas cross-tenant o cross-branch en el ERP SaaS.

La suite valida que:

- QA_A no ve datos QA_B.
- QA_B no ve datos QA_A.
- QA_A/QA_B no ven DEFAULT.
- Branch ajena devuelve `403`.
- ID/codigo/QR/folio ajeno devuelve `403` o `404`.
- Token revocado devuelve `401`.
- Dato propio devuelve `200` cuando corresponde y existe permiso.

## Script ejecutable

Archivo:

- `docs/qa/10-auth-f6-saas-negative-regression-smoke.sh`

Requisitos:

- Git Bash en Windows.
- Backend levantado.
- Dataset QA Empresa A/B aplicado.
- Usuarios QA activos:
  - `qa.a.admin@local.test`
  - `qa.b.admin@local.test`

Ejecucion base:

```bash
bash docs/qa/10-auth-f6-saas-negative-regression-smoke.sh
```

Ejecucion con API remota:

```bash
API_BASE_URL=http://192.168.0.128:8090 bash docs/qa/10-auth-f6-saas-negative-regression-smoke.sh
```

Ejecucion con IDs especificos:

```bash
QA_B_CUSTOMER_ID=25 \
QA_B_ITEM_ID=30 \
QA_B_RESERVATION_ID=12 \
QA_B_CUSTOMER_PACKAGE_ID=4 \
QA_B_SHIPMENT_ID=3 \
QA_B_REFUND_ID=2 \
bash docs/qa/10-auth-f6-saas-negative-regression-smoke.sh
```

## Variables configurables

| Variable | Default | Uso |
|---|---:|---|
| `API_BASE_URL` | `http://localhost:8090` | URL del backend. |
| `QA_A_EMAIL` | `qa.a.admin@local.test` | Usuario tenant A. |
| `QA_B_EMAIL` | `qa.b.admin@local.test` | Usuario tenant B. |
| `QA_PASSWORD` | `Qa12345!` | Password QA. |
| `QA_A_BRANCH_ID` | `6` | Branch QA_A. |
| `QA_B_BRANCH_ID` | `7` | Branch QA_B. |
| `DEFAULT_BRANCH_ID` | `4` | Branch DEFAULT/QA_CTR legacy. |
| `DEFAULT_PAYMENT_ID` | `1` | Pago DEFAULT usado para prueba negativa. |
| `DEFAULT_SALE_ID` | `1` | Venta DEFAULT usada para prueba negativa. |
| `QA_DUP_ITEM_CODE` | `QA-DUP-001` | Codigo duplicado por company. |
| `QA_DUP_ITEM_QR` | `QR-QA-DUP-001` | QR duplicado por company. |
| `QA_DUP_BATCH_FOLIO` | vacio | Folio de lote para prueba opcional. |
| `QA_B_*_ID` | vacio | IDs opcionales para pruebas cruzadas por entidad. |

## Criterios del smoke

| Resultado | Significado |
|---|---|
| `PASS` | El endpoint respondio como se esperaba. |
| `FAIL` | Hubo fuga o respuesta inesperada; el script termina con `exit 1`. |
| `SKIP` | Falta un dato opcional del ambiente; no bloquea el smoke base. |

Para casos cross-tenant se acepta:

- `403`: bloqueo explicito.
- `404`: ocultamiento seguro de existencia.

No se acepta:

- `200` en dato ajeno.

## Endpoints cubiertos

| Modulo | Endpoint | Caso |
|---|---|---|
| Auth | `POST /api/auth/login` | Login QA_A/QA_B. |
| Auth | `GET /api/me` | Token QA_A anterior debe devolver `401` tras segundo login. |
| Clientes | `GET /api/customers/branch/{branchId}` | Propio `200`, branch ajena `403/404`. |
| Clientes | `GET /api/customers/{id}` | Customer QA_B con token QA_A `403/404`. |
| Items | `GET /api/items/branch/{branchId}` | Propio `200`, branch ajena `403/404`. |
| Items | `GET /api/items/lookup/code/{code}` | Codigo duplicado se resuelve al tenant propio. |
| Items | `GET /api/items/lookup/qr/{qrCode}` | QR duplicado se resuelve al tenant propio. |
| Batches | `GET /api/batches/branch/{branchId}` | Propio `200`, branch ajena `403/404`. |
| Batches | `GET /api/batches/folio/{folio}` | Opcional por folio configurado. |
| Pagos | `GET /api/payments/{id}` | Pago DEFAULT con token QA_A `403/404`. |
| Ventas | `GET /api/sales/{id}` | Venta DEFAULT con token QA_A `403/404`. |
| Reportes | `GET /api/reports/daily-store` | Branch QA_B con token QA_A `403/404`. |
| Reservaciones | `GET /api/reservations/branch/{branchId}` | Propio `200`, branch ajena `403/404`. |
| Direcciones | `GET /api/customer-addresses/customer/{customerId}` | Customer QA_B con token QA_A `403/404`. |
| Saldos | `GET /api/balance/{customerId}` | Customer QA_B con token QA_A `403/404`. |
| Paquetes | `GET /api/customer-packages/{id}` | Opcional si existe paquete QA_B. |
| Envios | `GET /api/shipments/{id}` | Opcional si existe envio QA_B. |
| Refunds | `GET /api/refunds/{id}` | Opcional si existe refund QA_B. |

## Pendientes por datos reales

Algunos modulos dependen de que el ambiente QA tenga datos secundarios creados en QA_B:

- Reservacion especifica.
- Paquete de cliente.
- Envio.
- Refund.
- Folio de lote duplicado o cross-check controlado.

Si no existen, el script imprime `SKIP`. Para convertirlos en obligatorios, ejecutar el smoke pasando las variables `QA_B_*_ID`.

## Resultado runtime AUTH-F6 inicial

Ambiente:

- API: `http://localhost:8090`.
- QA_A: `qa.a.admin@local.test`, branch `6`.
- QA_B: `qa.b.admin@local.test`, branch `7`.
- DEFAULT branch: `4`.

Ejecucion:

```powershell
& 'C:\Program Files\Git\bin\bash.exe' docs/qa/10-auth-f6-saas-negative-regression-smoke.sh
```

Resultado:

- `PASS=20`.
- `FAIL=0`.
- `SKIP=5`.

Casos PASS relevantes:

- Token QA_A anterior revocado devolvio `401`.
- QA_A branch propia customers/items/batches/reservations devolvio `200`.
- QA_A contra branch QA_B/DEFAULT devolvio `403`.
- QA_A contra customer QA_B id `25` devolvio `404`.
- QA_A contra item QA_B id `29` devolvio `404`.
- QA_A contra payment DEFAULT id `1` devolvio `403`.
- QA_A contra sale DEFAULT id `1` devolvio `403`.
- QA_A contra `daily-store` branch QA_B devolvio `403`.

Casos SKIP por falta de variable/dato especifico:

- `QA_DUP_BATCH_FOLIO`.
- `QA_B_RESERVATION_ID`.
- `QA_B_CUSTOMER_PACKAGE_ID`.
- `QA_B_SHIPMENT_ID`.
- `QA_B_REFUND_ID`.

## Pruebas backend

AUTH-F6 conserva las pruebas negativas agregadas en AUTH-F3/F4/F5 y agrega cobertura central con `TenantAccessGuardTests`.

La suite backend esperada:

```powershell
cd backend/control-ropa
.\mvnw.cmd test
```

## Decisiones

- AUTH-F6 no agrega permisos nuevos.
- AUTH-F6 no crea migraciones.
- AUTH-F6 no cambia calculos financieros.
- Si un smoke devuelve `200` para dato ajeno, debe corregirse backend antes de mergear.
