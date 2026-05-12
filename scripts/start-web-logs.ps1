$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

$logsDir = "C:\HPSQ-SOFT\control-ropa\logs\frontend"
New-Item -ItemType Directory -Force -Path $logsDir | Out-Null

$logPath = Join-Path $logsDir "frontend-web.log"
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
      $archivePath = Join-Path $logsDir "frontend-web.$datePart.$index.log"
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
Write-RotatingLog "===== Frontend web started at $startedAt ====="

npx.cmd expo start --web --port 8081 *>&1 | ForEach-Object {
  $line = $_.ToString()
  Write-Host $line
  Write-RotatingLog $line
}
