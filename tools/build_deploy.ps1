# Build a production-ready deploy folder for zipping and uploading to a server.
# Usage: powershell -ExecutionPolicy Bypass -File tools/build_deploy.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$deploy = Join-Path $root 'deploy'
$backendSrc = Join-Path $root 'backend'
$backendDst = Join-Path $deploy 'backend'
$publicApp = Join-Path $backendSrc 'public\app'

$frontendFiles = @(
    'index.html', 'app.js', 'api.js', 'assessments.js', 'understand.js', 'games.js', 'fx.js',
    'styles.css', 'animations.css', 'game-enhance.css', 'book-reader.js', 'representations.js',
    'limits.js', 'pdf-media.js', 'scenes.js', 'Logo-Lorebound.png'
)

Write-Host 'Syncing frontend into backend/public/app...'
foreach ($file in $frontendFiles) {
    $src = Join-Path $root $file
    if (Test-Path $src) {
        Copy-Item -Force $src (Join-Path $publicApp $file)
    }
}

if (Test-Path $deploy) {
    Get-ChildItem $deploy -Exclude 'README.md' | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Force -Path $backendDst | Out-Null

Write-Host 'Copying backend (excluding vendor, .env, caches)...'
$robocopyArgs = @(
    $backendSrc, $backendDst,
    '/E',
    '/XD', 'vendor', 'node_modules', '.git', '.idea', '.vscode', '.cursor',
    'storage\logs', 'storage\framework\views', 'storage\framework\cache\data',
    'storage\framework\sessions', 'storage\framework\testing',
    '/XF', '.env', '.env.backup', '.env.production', 'database.sqlite', 'database.sqlite-journal',
    'laravel.log', 'packages.php', 'services.php',
    '/NFL', '/NDL', '/NJH', '/NJS', '/nc', '/ns', '/np'
)
& robocopy @robocopyArgs | Out-Null
# robocopy exit codes 0-7 are success
if ($LASTEXITCODE -gt 7) { throw "robocopy failed with exit code $LASTEXITCODE" }

Copy-Item -Force (Join-Path $root 'composer.phar') (Join-Path $deploy 'composer.phar')

$envDeploy = Join-Path $backendSrc '.env.deploy'
if (Test-Path $envDeploy) {
    Copy-Item -Force $envDeploy (Join-Path $backendDst '.env')
    Write-Host 'Copied production .env.deploy to deploy/backend/.env'
}

Write-Host ''
Write-Host 'Deploy bundle ready at:' $deploy
Write-Host 'Zip this folder and upload to your server.'
