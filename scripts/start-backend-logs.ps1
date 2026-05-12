$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$defaultBackendRoot = Join-Path $repoRoot "backend\control-ropa"
$qaBackendRoot = "C:\proyectos_2026_spring\control-ropa"
$backendRoot = if ($env:CONTROL_ROPA_BACKEND_ROOT) {
  $env:CONTROL_ROPA_BACKEND_ROOT
} elseif ($repoRoot.Path -like "C:\proyectos_2026_mobile\*" -and (Test-Path $qaBackendRoot)) {
  $qaBackendRoot
} else {
  $defaultBackendRoot
}

Set-Location $backendRoot

$env:DEBUG = "false"
$env:LOGGING_LEVEL_ROOT = "INFO"
$env:LOGGING_LEVEL_ORG_SPRINGFRAMEWORK = "INFO"
$env:LOGGING_LEVEL_ORG_HIBERNATE = "INFO"
$env:LOGGING_LEVEL_COM_HPSQSOFT_CTRLROPA = "INFO"

$logsDir = "C:\HPSQ-SOFT\control-ropa\logs\backend"
New-Item -ItemType Directory -Force -Path $logsDir | Out-Null

$logPath = Join-Path $logsDir "backend-console.log"
$maxBytes = 20MB

function Rotate-LogIfNeeded {
  param([string] $Path)

  $today = Get-Date -Format "yyyy-MM-dd"
  $shouldRotate = $false

  if (Test-Path $Path) {
    $file = Get-Item $Path
    if ($file.Length -ge $maxBytes -or $file.LastWriteTime.ToString("yyyy-MM-dd") -ne $today) {
      $shouldRotate = $true
      $datePart = $file.LastWriteTime.ToString("yyyy-MM-dd")
    }
  }

  if ($shouldRotate) {
    $index = 0
    do {
      $index++
      $archivePath = Join-Path $logsDir "backend-console.$datePart.$index.log"
    } while (Test-Path $archivePath)

    Move-Item -LiteralPath $Path -Destination $archivePath -Force
  }
}

function Write-RotatingLog {
  param([string] $Message)

  Rotate-LogIfNeeded -Path $logPath
  Add-Content -Path $logPath -Value $Message
}

$startedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-RotatingLog ""
Write-RotatingLog "===== Backend started at $startedAt ====="

.\mvnw.cmd spring-boot:run *>&1 | ForEach-Object {
  $line = $_.ToString()
  Write-Host $line
  Write-RotatingLog $line
}
