# ERP LIVE - Conectividad LAN QA/dev

Fecha: 2026-05-20  
Fase: LIVE-T - hardening QA/red/movil

## Objetivo

Permitir que el frontend Expo Web y la app en dispositivos LAN consuman el backend Spring Boot de la maquina de desarrollo sin depender de `localhost`.

## Hallazgo

`constants/api.ts` resolvia web con `http://localhost:8090`. Esto funciona solo en la maquina que levanta Expo, pero desde otro equipo LAN el navegador interpreta `localhost` como el equipo cliente y falla el login/API.

En la validacion posterior se confirmo otro punto de red: el backend estaba vivo en `192.168.0.128:8090` y el login directo con credenciales QA validas respondia `200`, pero el preflight con origen LAN `http://192.168.0.128:8081` respondia `403` porque CORS solo declaraba origenes locales.

## Cambio aplicado

- `constants/api.ts` ahora usa el host con el que se abrio la app web:
  - si QA abre `http://192.168.0.128:8081`, la API se resuelve como `http://192.168.0.128:8090`.
- Para mobile nativo se mantiene host LAN configurable por `EXPO_PUBLIC_API_HOST`.
- Se conserva override con `EXPO_PUBLIC_API_BASE_URL` para QA/ambientes controlados.
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/config/CorsConfig.java` permite el origen QA LAN `http://192.168.0.128:8081` sin abrir endpoints protegidos ni cambiar autenticacion.

## Evidencia local LAN

- `http://192.168.0.128:8081`: `200`.
- `http://192.168.0.128:8090/api/health`: `200`.
- `netstat` muestra `8081` escuchando en `0.0.0.0` y conexiones `ESTABLISHED` desde `192.168.0.149`.
- `8090` escucha en `0.0.0.0`.
- `POST http://192.168.0.128:8090/api/auth/login` con `qa.admin@local.test` y password QA conocida: `200`.
- `OPTIONS /api/auth/login` con `Origin: http://192.168.0.128:8081` antes del ajuste CORS: `403`.

## Validacion QA recomendada

1. Desde equipo QA abrir `http://192.168.0.128:8081`.
2. Iniciar sesion.
3. Abrir En vivo.
4. Crear/seleccionar transmision.
5. Seleccionar cliente/prenda y registrar reserva.
6. Confirmar que las llamadas API apuntan a `192.168.0.128:8090`, no a `localhost`.

## Riesgos

- Si Expo se abre por nombre DNS, la API usara ese mismo hostname.
- Si backend corre en otro equipo, usar `EXPO_PUBLIC_API_BASE_URL`.
- Firewalls de Windows/red pueden bloquear `8090` aunque Expo `8081` responda.
- El origen LAN CORS agregado es de QA/dev. Para ambientes productivos debe reemplazarse por dominios oficiales.
- Si el login devuelve `403` despues de pasar CORS, tratarlo como credenciales invalidas, usuario bloqueado/inactivo o dataset QA, no como fallo de red.
