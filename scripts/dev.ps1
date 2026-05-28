param(
  [Parameter(Position = 0)]
  [ValidateSet("check-env", "infra:up", "infra:down", "db:generate", "db:migrate", "db:seed", "dev:backend", "dev:frontend", "dev:contracts", "quickstart")]
  [string]$Task = "check-env",
  [switch]$SkipSeed
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$npmwPath = Join-Path $PSScriptRoot "npmw.ps1"

function Invoke-Npmw {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
  )

  & $npmwPath @Args
  if ($LASTEXITCODE -ne 0) {
    throw "Lenh npm that bai: $($Args -join ' ')"
  }
}

function Assert-EnvFile {
  param(
    [string]$RelativePath
  )

  $fullPath = Join-Path $repoRoot $RelativePath
  if (-not (Test-Path $fullPath)) {
    throw "Thieu file moi truong: $RelativePath"
  }
}

Push-Location $repoRoot
try {
  switch ($Task) {
    "check-env" {
      Assert-EnvFile "backend\.env"
      Assert-EnvFile "frontend\.env"
      Assert-EnvFile "contracts\.env"
      Write-Host "Env files OK:"
      Write-Host " - backend/.env"
      Write-Host " - frontend/.env"
      Write-Host " - contracts/.env"
    }
    "infra:up" { Invoke-Npmw "run" "infra:up" }
    "infra:down" { Invoke-Npmw "run" "infra:down" }
    "db:generate" { Invoke-Npmw "run" "db:generate" }
    "db:migrate" { Invoke-Npmw "run" "db:migrate" }
    "db:seed" { Invoke-Npmw "run" "db:seed" }
    "dev:backend" { Invoke-Npmw "run" "dev:backend" }
    "dev:frontend" { Invoke-Npmw "run" "dev:frontend" }
    "dev:contracts" { Invoke-Npmw "run" "dev:contracts" }
    "quickstart" {
      Assert-EnvFile "backend\.env"
      Assert-EnvFile "frontend\.env"
      Assert-EnvFile "contracts\.env"
      Invoke-Npmw "run" "infra:up"
      Invoke-Npmw "run" "db:generate"
      Invoke-Npmw "run" "db:migrate"
      if (-not $SkipSeed) {
        Invoke-Npmw "run" "db:seed"
      }
      Write-Host "Quickstart completed."
      Write-Host "Chay tiep:"
      Write-Host " - .\scripts\dev.ps1 dev:backend"
      Write-Host " - .\scripts\dev.ps1 dev:frontend"
    }
  }
} finally {
  Pop-Location
}
