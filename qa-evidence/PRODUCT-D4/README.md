# PRODUCT-D4 - Evidencia manual QA visual

Esta carpeta concentra evidencia real de la corrida manual QA visual por roles.

## Estructura sugerida

- `admin/`
- `vendedor/`
- `supervisor/`
- `sin-permisos/`

Dentro de cada usuario se separa por dispositivo y tema:

- `desktop-light/`
- `desktop-dark/`
- `mobile-light/`
- `mobile-dark/`

Si se ejecuta tablet, usar la carpeta mas cercana o crear `tablet-light/` y `tablet-dark/`.

## Convencion de nombres

Usar el ID del caso del CSV y una descripcion corta:

```text
D4-001-home-admin-desktop-light-retailPremium.png
D4-005-live-reservada-admin-desktop-light-retailPremium.png
D4-023-live-sin-permisos-mobile-dark-retailPremium.png
```

## Evidencia minima

Cada caso marcado como `PASS`, `FAIL` o `BLOQUEADO` debe tener:

- captura o enlace en la columna `Evidencia`;
- resultado real escrito en la columna `Resultado real`;
- fecha de ejecucion;
- notas si hay desviacion, limitacion o dato especial.

No marcar `PASS` sin evidencia real.

## Severidad

- `S1`: bloqueo critico, permiso roto, fuga de acceso, login/logout roto, operacion LIVE insegura.
- `S2`: problema importante de flujo, pantalla principal inutilizable, contraste severo, responsive roto en ruta critica.
- `S3`: defecto visual o de usabilidad medio, workaround disponible.
- `S4`: detalle menor, texto, espaciado o pulido.
- `NA`: no aplica o caso no ejecutable por condicion documentada.

## Estados validos

- `PASS`
- `FAIL`
- `BLOQUEADO`
- `NO_APLICA`
- `PENDIENTE_MANUAL`

Si no hay evidencia real, mantener `PENDIENTE_MANUAL`.
