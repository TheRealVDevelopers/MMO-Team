# PowerShell script to run both applications simultaneously

Write-Host "🚀 Starting Make My Office Applications..." -ForegroundColor Green
Write-Host ""

# Define paths
$internalAppPath = $PSScriptRoot
$clientAppPath = Join-Path $PSScriptRoot "office-dream-builder"

# Check if office-dream-builder exists
if (-not (Test-Path $clientAppPath)) {
    Write-Host "❌ Office Dream Builder not found at: $clientAppPath" -ForegroundColor Red
    Write-Host "Please ensure the repository is cloned." -ForegroundColor Yellow
    exit 1
}

Write-Host "📍 Internal App Path: $internalAppPath" -ForegroundColor Cyan
Write-Host "📍 Client App Path: $clientAppPath" -ForegroundColor Cyan
Write-Host ""

# Function to check if npm is installed
function Test-NpmInstalled {
    try {
        $null = npm --version
        return $true
    } catch {
        return $false
    }
}

if (-not (Test-NpmInstalled)) {
    Write-Host "❌ npm is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ npm found" -ForegroundColor Green
Write-Host ""

# Install dependencies if needed
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow

# Check Internal App
if (-not (Test-Path (Join-Path $internalAppPath "node_modules"))) {
    Write-Host "Installing dependencies for MMO-Team (Internal)..." -ForegroundColor Yellow
    Set-Location $internalAppPath
    npm install
}

# Check Client App
if (-not (Test-Path (Join-Path $clientAppPath "node_modules"))) {
    Write-Host "Installing dependencies for Office Dream Builder (Client)..." -ForegroundColor Yellow
    Set-Location $clientAppPath
    npm install
}

Write-Host ""
Write-Host "✅ Dependencies ready" -ForegroundColor Green
Write-Host ""

# Start both applications
Write-Host "🎯 Starting both applications..." -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "📱 MMO-Team (Internal Management)" -ForegroundColor Cyan
Write-Host "   Running on: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Office Dream Builder (Client-Facing)" -ForegroundColor Cyan
Write-Host "   Running on: http://localhost:5174" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Press Ctrl+C to stop both applications" -ForegroundColor Yellow
Write-Host ""

# Start Internal App in background
$internalJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    npm run dev
} -ArgumentList $internalAppPath

# Start Client App in background
$clientJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    npm run dev
} -ArgumentList $clientAppPath

# Wait a bit for servers to start
Start-Sleep -Seconds 3

Write-Host "✅ Both applications are starting..." -ForegroundColor Green
Write-Host ""

# Monitor jobs
try {
    while ($true) {
        # Check if both jobs are still running
        if ($internalJob.State -ne "Running" -and $clientJob.State -ne "Running") {
            Write-Host "⚠️ Both applications have stopped" -ForegroundColor Yellow
            break
        }
        
        # Display output from internal app
        $internalOutput = Receive-Job -Job $internalJob 2>&1
        if ($internalOutput) {
            Write-Host "[Internal] $internalOutput" -ForegroundColor Cyan
        }
        
        # Display output from client app
        $clientOutput = Receive-Job -Job $clientJob 2>&1
        if ($clientOutput) {
            Write-Host "[Client] $clientOutput" -ForegroundColor Green
        }
        
        Start-Sleep -Milliseconds 500
    }
} finally {
    # Cleanup
    Write-Host ""
    Write-Host "🛑 Stopping applications..." -ForegroundColor Yellow
    
    Stop-Job -Job $internalJob -ErrorAction SilentlyContinue
    Stop-Job -Job $clientJob -ErrorAction SilentlyContinue
    
    Remove-Job -Job $internalJob -Force -ErrorAction SilentlyContinue
    Remove-Job -Job $clientJob -Force -ErrorAction SilentlyContinue
    
    Write-Host "✅ Applications stopped" -ForegroundColor Green
}
