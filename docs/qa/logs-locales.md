# Logs locales

## Backend

El backend genera logs de aplicacion en:

```text
C:\HPSQ-SOFT\control-ropa\logs\backend\control-ropa.log
```

Tambien conserva historicos comprimidos en la misma carpeta. Se cortan por fecha y por bloques de 20 MB:

```text
C:\HPSQ-SOFT\control-ropa\logs\backend\control-ropa.YYYY-MM-DD.N.log.gz
```

Para arrancar el backend y guardar tambien la salida de consola:

```powershell
npm run backend:logs
```

Ese comando crea o actualiza:

```text
C:\HPSQ-SOFT\control-ropa\logs\backend\backend-console.log
```

## Frontend web

Para arrancar Expo web y guardar la salida de consola:

```powershell
npm run web
```

Ese comando crea o actualiza:

```text
C:\HPSQ-SOFT\control-ropa\logs\frontend\frontend-web.log
```

`npm run web:logs` hace lo mismo. Si necesitas arrancar Expo sin archivo de log, usa:

```powershell
npm run web:plain
```

Tambien rota por fecha y cuando llega a 20 MB:

```text
C:\HPSQ-SOFT\control-ropa\logs\frontend\frontend-web.YYYY-MM-DD.N.log
```

## Lectura rapida en PowerShell

Ver las ultimas lineas del backend:

```powershell
Get-Content C:\HPSQ-SOFT\control-ropa\logs\backend\control-ropa.log -Tail 80
```

Seguir el backend en vivo:

```powershell
Get-Content C:\HPSQ-SOFT\control-ropa\logs\backend\control-ropa.log -Wait -Tail 80
```

Seguir el frontend en vivo:

```powershell
Get-Content C:\HPSQ-SOFT\control-ropa\logs\frontend\frontend-web.log -Wait -Tail 80
```
