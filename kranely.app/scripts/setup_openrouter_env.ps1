<#
  OpenRouter environment setup script (PowerShell).
  Usage:
    powershell -ExecutionPolicy Bypass -File scripts/setup_openrouter_env.ps1 -Key <OPENROUTER_API_KEY>
  If -Key is not provided, the script will try to read from
  %USERPROFILE%\.openrouter\OPENROUTER_API_KEY.txt and set the environment
  variable for the current user scope, so it persists across sessions.
-->
param(
  [string]$Key
)

# Directory for cached key
$cacheDir = "$env:USERPROFILE\.openrouter"
if (-not (Test-Path -Path $cacheDir)) {
  New-Item -ItemType Directory -Path $cacheDir | Out-Null
}
$cacheFile = "$cacheDir\OPENROUTER_API_KEY.txt"

# Resolve the key
if ([string]::IsNullOrWhiteSpace($Key)) {
  if (Test-Path -Path $cacheFile) {
    $Key = Get-Content -Path $cacheFile -Raw
  } else {
    Write-Error "OpenRouter API key not provided. Pass it with -Key or store it at $cacheFile."
    exit 1
  }
}

if ([string]::IsNullOrWhiteSpace($Key)) {
  Write-Error "OpenRouter API key is empty."
  exit 1
}

# Persist to user environment and cache
[Environment]::SetEnvironmentVariable("OPENROUTER_API_KEY", $Key, "User")
$env:OPENROUTER_API_KEY = $Key
Set-Content -Path $cacheFile -Value $Key

Write-Host "OPENROUTER_API_KEY set for user scope. New sessions will pick it up."
& exit 0
