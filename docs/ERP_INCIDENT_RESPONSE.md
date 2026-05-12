# ERP - Incident response

Fecha: 2026-05-12

## Severidad

- SEV1: sistema no opera, dinero/seguridad/datos en riesgo.
- SEV2: flujo critico degradado con workaround.
- SEV3: modulo secundario afectado.
- SEV4: defecto menor o documental.

## Caida login

Severidad: SEV1

Acciones:

1. Validar backend y base de datos.
2. Revisar logs de `/api/auth/login`.
3. Probar usuario admin QA.
4. Verificar expiracion/bloqueo de usuarios.
5. Si inicio tras release, ejecutar rollback.

Comunicacion:

- Informar que acceso esta degradado.
- Evitar crear usuarios nuevos como workaround sin autorizacion.

## Caida backend

Severidad: SEV1

Acciones:

1. Validar proceso Java.
2. Revisar logs backend.
3. Validar `/api/health`.
4. Revisar conexion MySQL.
5. Revertir JAR si coincide con release.

## Error 500 masivo

Severidad: SEV1/SEV2

Acciones:

1. Identificar endpoint.
2. Revisar logs por stack trace.
3. Confirmar si afecta todos los usuarios o un flujo.
4. Bloquear release si esta en QA.
5. En PROD, rollback si afecta flujo critico.

## Permisos incorrectos

Severidad: SEV1 si hay acceso indebido; SEV2 si bloquea operacion.

Acciones:

1. Identificar usuario, rol y permiso.
2. Validar `/api/me/permissions`.
3. Revisar matriz de permisos.
4. Corregir rol solo con autorizacion.
5. Registrar incidente.

## Release fallido

Severidad: segun flujo afectado.

Acciones:

1. Detener despliegue.
2. Ejecutar rollback.
3. Validar smoke post-rollback.
4. Registrar causa.
5. Abrir fix en nueva rama.

## Rollback

Checklist:

- Artefacto anterior identificado.
- Backup disponible si hubo datos.
- Logs guardados.
- Smoke test post-rollback.
- Bitacora actualizada.

## Degradacion operacional

Ejemplos:

- Reportes lentos.
- Historial live pesado.
- Modales no usables en mobile.
- Logs rotando con warnings.

Acciones:

1. Confirmar impacto.
2. Definir workaround.
3. Registrar issue/fase.
4. Priorizar si afecta flujo critico.

