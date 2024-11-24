$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

#region Variables
$repoUrl = "https://github.com/ChewOnThis/cablespicetifycli/archive/refs/heads/main.zip"
$installationFolder = "$env:LOCALAPPDATA\cablespicetifycli" # Main installation folder
$spicetifyBinaryPath = "$installationFolder\cablespicetifycli-main\spicetify.exe"
$serverScriptPath = "$installationFolder\cablespicetifycli-main\spotifyServer.mjs"
$nodePath = "C:\Program Files\nodejs\node.exe"
$extensionsPath = "$installationFolder\cablespicetifycli-main\Extensions"
$customAppsPath = "$installationFolder\cablespicetifycli-main\CustomApps"
$spotifyPath = "$env:APPDATA\Spotify"
#endregion Variables

#region Functions
function Restart-Spotify {
    Write-Host "Restarting Spotify if necessary..."
    $spotifyProcesses = Get-Process -Name Spotify -ErrorAction SilentlyContinue
    if ($spotifyProcesses) {
        Stop-Process -Name Spotify -Force
    }
    Start-Process -FilePath "$spotifyPath\Spotify.exe"
}

function Install-NodeJS {
    if (-not (Test-Path -Path $nodePath)) {
        Write-Host "Node.js not found. Please install Node.js from https://nodejs.org/ and add it to your PATH."
        exit 1
    } else {
        Write-Host "Node.js is already installed."
    }
}

function Download-Repo {
    Write-Host "Downloading cablespicetifycli repository..."
    $zipPath = "$installationFolder\cablespicetifycli.zip"
    Invoke-WebRequest -Uri $repoUrl -OutFile $zipPath
    Expand-Archive -Path $zipPath -DestinationPath $installationFolder -Force
    Remove-Item -Path $zipPath
    Write-Host "Repository downloaded and extracted."
}

function Install-Spicetify {
    Write-Host "Installing Spicetify binary..."
    if (Test-Path -Path $spicetifyBinaryPath) {
        Copy-Item -Path $spicetifyBinaryPath -Destination "$installationFolder\spicetify.exe" -Force
        Write-Host "Spicetify installed successfully." -ForegroundColor Green
    } else {
        Write-Host "Spicetify binary not found in the downloaded repository." -ForegroundColor Red
        exit 1
    }
}

function Copy-ExtensionsAndApps {
    Write-Host "Copying Extensions and Custom Apps..."
    if (Test-Path -Path $extensionsPath) {
        Copy-Item -Path "$extensionsPath\*" -Destination "$installationFolder\Extensions" -Recurse -Force
    }
    if (Test-Path -Path $customAppsPath) {
        Copy-Item -Path "$customAppsPath\*" -Destination "$installationFolder\CustomApps" -Recurse -Force
    }
    Write-Host "Extensions and Custom Apps copied successfully." -ForegroundColor Green
}

function Start-NodeServer {
    Write-Host "Starting Spotify server..."
    if ((Test-Path -Path $nodePath) -and (Test-Path -Path $serverScriptPath)) {
        try {
            Start-Process -FilePath $nodePath -ArgumentList $serverScriptPath -NoNewWindow
            Start-Sleep -Seconds 5 # Give server time to initialize
            Write-Host "Spotify server started on http://localhost:3000." -ForegroundColor Green
        } catch {
            Write-Host "Failed to start Node server: $_" -ForegroundColor Red
            exit 1
        }
    } else {
        if (-not (Test-Path -Path $nodePath)) {
            Write-Host "Node.js executable not found. Please ensure Node.js is installed." -ForegroundColor Red
        }
        if (-not (Test-Path -Path $serverScriptPath)) {
            Write-Host "Spotify server script not found. Please ensure the script exists." -ForegroundColor Red
        }
        exit 1
    }
}

function Install-SpicetifyMarketplace {
    Write-Host "Installing Spicetify Marketplace..."
    iwr -useb https://raw.githubusercontent.com/spicetify/marketplace/main/resources/install.ps1 | iex
}
#endregion Functions

#region Main
Write-Host "Starting installation of cablespicetifycli and dependencies..."

# Create installation directory
if (-not (Test-Path -Path $installationFolder)) {
    New-Item -ItemType Directory -Force -Path $installationFolder | Out-Null
}

# Install Node.js if not installed
Install-NodeJS

# Download and extract cablespicetifycli repository
Download-Repo

# Install Spicetify binary
Install-Spicetify

# Copy Extensions and Custom Apps
Copy-ExtensionsAndApps

# Start Spotify server
Start-NodeServer

# Restart Spotify
Restart-Spotify

# Prompt for Spicetify Marketplace installation
$choices = [System.Management.Automation.Host.ChoiceDescription[]] @(
    (New-Object System.Management.Automation.Host.ChoiceDescription "&Yes", "Install Spicetify Marketplace."),
    (New-Object System.Management.Automation.Host.ChoiceDescription "&No", "Skip installation.")
)
$choice = $Host.UI.PromptForChoice('', "Install Spicetify Marketplace?", $choices, 0)
if ($choice -eq 0) {
    Install-SpicetifyMarketplace
}

Write-Host "Installation completed! Visit http://localhost:3000 to configure." -ForegroundColor Green
#endregion Main
