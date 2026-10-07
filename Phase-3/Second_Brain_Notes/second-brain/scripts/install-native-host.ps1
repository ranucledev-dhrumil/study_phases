# Second Brain - Native Messaging Host Installation Script (CHANGE 19/20)
#
# Compiles the companion binary second-brain-host.exe, installs it to %APPDATA%\SecondBrain,
# generates the host manifest JSON, and registers it with both Google Chrome and Microsoft Edge.

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$hostCrateDir = Join-Path $projectRoot "second-brain-host"
$targetExe = Join-Path $hostCrateDir "target\release\second-brain-host.exe"

$appDataDir = Join-Path $env:APPDATA "SecondBrain"
$destExe = Join-Path $appDataDir "second-brain-host.exe"
$destManifest = Join-Path $appDataDir "com.secondbrain.host.json"

$extensionId = "nlkpiaianojgfobdnafcfhcjidihoomo"

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host " Second Brain - Native Messaging Host Installer" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# 1. Compile second-brain-host.exe
Write-Host ""
Write-Host "[1/5] Compiling second-brain-host.exe (release mode)..." -ForegroundColor Yellow
Push-Location $hostCrateDir
try {
    cargo build --release
    if ($LASTEXITCODE -ne 0) {
        throw "cargo build --release failed with exit code $LASTEXITCODE"
    }
}
finally {
    Pop-Location
}

if (-not (Test-Path $targetExe)) {
    throw "Compiled binary not found at $targetExe"
}
Write-Host "      Compiled successfully." -ForegroundColor Green

# 2. Prepare %APPDATA%\SecondBrain directory
Write-Host ""
Write-Host "[2/5] Deploying binary to $appDataDir..." -ForegroundColor Yellow
if (-not (Test-Path $appDataDir)) {
    New-Item -ItemType Directory -Path $appDataDir -Force | Out-Null
}
Copy-Item -Path $targetExe -Destination $destExe -Force
Write-Host "      Copied second-brain-host.exe to $destExe" -ForegroundColor Green

# 3. Generate host manifest JSON with absolute path
Write-Host ""
Write-Host "[3/5] Writing host manifest to $destManifest..." -ForegroundColor Yellow
$manifestObj = [ordered]@{
    name = "com.secondbrain.host"
    description = "Second Brain Native Messaging Host"
    path = $destExe
    type = "stdio"
    allowed_origins = @("chrome-extension://$extensionId/")
}

$manifestJson = $manifestObj | ConvertTo-Json -Depth 4
[System.IO.File]::WriteAllText($destManifest, $manifestJson, [System.Text.Encoding]::UTF8)
Write-Host "      Manifest written successfully for extension: $extensionId" -ForegroundColor Green

# 4. Register in Windows Registry for Google Chrome
Write-Host ""
Write-Host "[4/5] Registering Native Messaging Host for Google Chrome..." -ForegroundColor Yellow
$chromeRegBase = "HKCU:\Software\Google\Chrome\NativeMessagingHosts"
$chromeRegKey = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.secondbrain.host"

if (-not (Test-Path $chromeRegBase)) {
    New-Item -Path $chromeRegBase -Force | Out-Null
}

if (-not (Test-Path $chromeRegKey)) {
    New-Item -Path $chromeRegKey -Force | Out-Null
}
Set-ItemProperty -Path $chromeRegKey -Name "(Default)" -Value $destManifest -Force
Write-Host "      Chrome registry key created: $chromeRegKey -> $destManifest" -ForegroundColor Green

# 5. Register in Windows Registry for Microsoft Edge
Write-Host ""
Write-Host "[5/5] Registering Native Messaging Host for Microsoft Edge..." -ForegroundColor Yellow
$edgeRegBase = "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts"
$edgeRegKey = "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.secondbrain.host"

if (-not (Test-Path $edgeRegBase)) {
    New-Item -Path $edgeRegBase -Force | Out-Null
}

if (-not (Test-Path $edgeRegKey)) {
    New-Item -Path $edgeRegKey -Force | Out-Null
}
Set-ItemProperty -Path $edgeRegKey -Name "(Default)" -Value $destManifest -Force
Write-Host "      Edge registry key created: $edgeRegKey -> $destManifest" -ForegroundColor Green

$extPath = Join-Path $projectRoot "second-brain-extension"
Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host " Installation Complete!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "Next steps to use Chrome / Edge capture:"
Write-Host " 1. Chrome: open chrome://extensions | Edge: open edge://extensions"
Write-Host " 2. Enable 'Developer mode' (toggle in extensions settings)"
Write-Host " 3. Click 'Load unpacked' and select: $extPath"
Write-Host " 4. Verify extension ID is: $extensionId"
Write-Host " 5. Start Second Brain desktop app: npm run tauri dev"
Write-Host " 6. Right-click any webpage or selection -> 'Save page / selection to Second Brain'"
Write-Host "=================================================" -ForegroundColor Cyan
