$ErrorActionPreference = 'Stop'
$mobile = Split-Path -Path $PSScriptRoot -Parent
$server = Join-Path (Split-Path -Path $mobile -Parent) 'Server'
$logs = Join-Path $mobile '.local'
New-Item -ItemType Directory -Path $logs -Force | Out-Null

function Test-Ready([string]$url, [string]$expected) {
  try {
    $response = Invoke-WebRequest -Uri $url -TimeoutSec 2 -UseBasicParsing
    $content = if ($response.Content -is [byte[]]) {
      [Text.Encoding]::UTF8.GetString($response.Content)
    } else {
      [string]$response.Content
    }
    return $response.StatusCode -eq 200 -and $content.Contains($expected)
  } catch {
    return $false
  }
}

function Ensure-Service([string]$name, [string]$url, [string]$expected, [string]$directory, [string[]]$arguments) {
  if (Test-Ready $url $expected) {
    Write-Host "$name is already running."
    return
  }
  $npm = (Get-Command npm.cmd -ErrorAction Stop).Source
  Start-Process -FilePath $npm -ArgumentList $arguments -WorkingDirectory $directory -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $logs "$name.stdout.log") `
    -RedirectStandardError (Join-Path $logs "$name.stderr.log") | Out-Null
  for ($attempt = 0; $attempt -lt 60; $attempt++) {
    if (Test-Ready $url $expected) {
      Write-Host "$name is ready."
      return
    }
    Start-Sleep -Milliseconds 500
  }
  throw "$name did not start. Check the logs in $logs."
}

$devices = & adb devices
if ($LASTEXITCODE -ne 0 -or -not ($devices -match '\sdevice$')) {
  throw 'Connect an Android phone with USB debugging enabled, then run this script again.'
}

Ensure-Service 'server' 'http://127.0.0.1:4000/api/health' '"ok":true' $server @('run', 'start')
Ensure-Service 'metro' 'http://127.0.0.1:8081/status' 'packager-status:running' $mobile @('start', '--', '--port', '8081')

& adb reverse tcp:4000 tcp:4000
if ($LASTEXITCODE -ne 0) { throw 'Could not forward API port 4000.' }
& adb reverse tcp:8081 tcp:8081
if ($LASTEXITCODE -ne 0) { throw 'Could not forward Metro port 8081.' }

Push-Location (Join-Path $mobile 'android')
try {
  & .\gradlew.bat installDebug
  if ($LASTEXITCODE -ne 0) { throw 'Android debug installation failed.' }
} finally {
  Pop-Location
}

& adb shell am start -n 'com.mataka.royaclub/.MainActivity'
if ($LASTEXITCODE -ne 0) { throw 'Could not launch the new Android app.' }
Write-Host 'Royal Club is ready for local USB testing.'
