$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

$expoRuntimeHome = Join-Path $env:TEMP "control-ropa-expo-home"
New-Item -ItemType Directory -Force -Path $expoRuntimeHome | Out-Null
$env:HOME = $expoRuntimeHome
$env:USERPROFILE = $expoRuntimeHome

$logsDir = "C:\HPSQ-SOFT\control-ropa\logs\frontend"
$logPath = Join-Path $logsDir "frontend-web.log"
$maxBytes = 20MB
$script:logAvailable = $true

try {
  New-Item -ItemType Directory -Force -Path $logsDir | Out-Null
} catch {
  $script:logAvailable = $false
  Write-Warning "No se pudo preparar la carpeta de logs frontend: $($_.Exception.Message)"
}

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
      $archivePath = Join-Path $logsDir "frontend-web.$datePart.$index.log"
    } while (Test-Path $archivePath)

    Move-Item -LiteralPath $Path -Destination $archivePath -Force
  }
}

function Write-RotatingLog {
  param([string] $Message)

  if (-not $script:logAvailable) {
    return
  }

  try {
    Rotate-LogIfNeeded -Path $logPath
    Add-Content -Path $logPath -Value $Message -Encoding UTF8
  } catch {
    $script:logAvailable = $false
    Write-Warning "No se pudo escribir el log frontend en $logPath. El servidor continuara en consola. Detalle: $($_.Exception.Message)"
  }
}

$startedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-RotatingLog ""
Write-RotatingLog "===== Frontend web started at $startedAt ====="

npx.cmd expo start --web --port 8081 *>&1 | ForEach-Object {
  $line = $_.ToString()
  Write-Host $line
  Write-RotatingLog $line
}
