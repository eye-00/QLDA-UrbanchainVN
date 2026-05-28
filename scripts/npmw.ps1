param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$NpmArgs
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot

function Resolve-NpmCmd {
  $command = Get-Command npm.cmd -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  $fallback = Join-Path ${env:ProgramFiles} "nodejs\npm.cmd"
  if (Test-Path $fallback) {
    return $fallback
  }

  throw "Khong tim thay npm.cmd. Hay cai Node.js hoac them nodejs vao PATH."
}

$npmCmd = Resolve-NpmCmd
$env:NPM_CONFIG_UPDATE_NOTIFIER = "false"
$env:NPM_CONFIG_FUND = "false"
$env:NPM_CONFIG_AUDIT = "false"
$env:NPM_CONFIG_CACHE = Join-Path $repoRoot ".npm-cache"
$env:LOCALAPPDATA = Join-Path $repoRoot ".localappdata"
$env:APPDATA = Join-Path $repoRoot ".appdata"

foreach ($path in @($env:NPM_CONFIG_CACHE, $env:LOCALAPPDATA, $env:APPDATA)) {
  if (-not (Test-Path $path)) {
    New-Item -ItemType Directory -Path $path -Force | Out-Null
  }
}

& $npmCmd @NpmArgs
exit $LASTEXITCODE
