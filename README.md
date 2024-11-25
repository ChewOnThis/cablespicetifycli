# CablespicetifyCLI Installation and Usage Guide

Welcome to **CablespicetifyCLI**! This tool allows you to customize your Spotify experience using Spicetify, along with a set of custom extensions and applications that enhance the functionality of your Spotify desktop client.

## Features
- **Spotify Customizations**: Modify the look and feel of Spotify with themes, extensions, and custom applications.
- **Node.js Server Integration**: Manage Spotify token authorization and custom actions using a local server.
- **Easy Keyboard Shortcuts**: Control and interact with Spotify effortlessly.
- **Spicetify Marketplace**: Access themes, extensions, and more from Spicetify's Marketplace.

## Installation Instructions

### Requirements
- **Node.js**: Please make sure you have Node.js installed on your system. If not, download it from [Node.js official website](https://nodejs.org/).
- **Spotify Desktop Client**: CablespicetifyCLI works with the Spotify desktop application, so make sure it is installed.
- **Spicetify**: Install Spicetify by running the following command in **PowerShell**:
  ```powershell
  iwr -useb https://raw.githubusercontent.com/spicetify/marketplace/main/resources/install.ps1 | iex
  ```

### One-Line Installation Command
To install CablespicetifyCLI, run the following command in **PowerShell** (make sure **PowerShell is not run as Administrator**):

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; iwr -useb https://raw.githubusercontent.com/ChewOnThis/cablespicetifycli/main/installcablespicetifycli.ps1 | iex
```

This command will:
1. **Download and execute** the installation script.
2. **Install Spicetify** and set up extensions and custom applications.
3. **Start the local Node.js server** to manage additional Spotify features.
4. **Restart Spotify** to apply all modifications.

### What the Installation Does
- Downloads the **CablespicetifyCLI** repository from GitHub.
- Extracts the contents into your local user directory (`C:\Users\<Your Username>\AppData\Local\cablespicetifycli`).
- Installs Spicetify and copies custom extensions and applications.
- Starts a local server at `http://localhost:3000` for managing advanced Spotify interactions.

### Getting Your Spotify Developer Details
To use CablespicetifyCLI, you need to set up a Spotify Developer application to obtain your **Client ID** and **Client Secret**. Follow these steps:
1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Log in with your Spotify account.
3. Click **Create an App**.
4. Fill in the details for your app (e.g., name, description) and click **Create**.
5. Once the app is created, you will see the **Client ID** and **Client Secret**. Note these down as they will be needed during the installation.

### Post-Installation
After installation, Spotify will restart, and all customizations will be applied. You will also be prompted to install **Spicetify Marketplace**, which gives you access to themes, extensions, and other community-created customizations.

## Usage

### Restart Spotify
- Whenever changes are applied using Spicetify, Spotify must be restarted. This is automatically handled during installation.

### Start the Local Server
- If the local server is not running, you can manually start it by navigating to the installation directory and running the command:

  ```powershell
  node spotifyServer.mjs
  ```
  - Make sure Node.js is in your system's PATH.

### Spicetify Commands
- To manage customizations, use Spicetify commands in your terminal:
  ```
  spicetify backup apply
  spicetify update
  ```
  These commands allow you to backup your Spotify client, apply new themes, or update configurations.

### Custom Keyboard Shortcuts
- **CablespicetifyCLI** comes with several custom keyboard shortcuts for Spotify. These shortcuts make it easy to interact with Spotify features (e.g., adding/removing tracks from playlists).

## Uninstallation
To remove all customizations and uninstall CablespicetifyCLI:
1. **Restore Spotify** to its default settings using Spicetify:
   ```
   spicetify restore
   ```
2. Delete the **CablespicetifyCLI** installation folder located at:
   ```
   C:\Users\<Your Username>\AppData\Local\cablespicetifycli
   ```

## Troubleshooting

### Common Issues
- **Node.js Not Found**: Make sure Node.js is installed and added to your system's PATH.
- **Access Token Issues**: If the Spotify server (`http://localhost:3000`) isn’t functioning correctly, check the terminal output for any authorization errors.

### Logs and Support
- Logs are available in the PowerShell window during the installation and while running the local server. Use these logs for debugging issues.
- For further support, open an issue in the [GitHub repository](https://github.com/ChewOnThis/cablespicetifycli).

## License
**CablespicetifyCLI** is open source and available under the [MIT License](https://github.com/ChewOnThis/cablespicetifycli/blob/main/LICENSE).

## Contributions
Contributions are welcome! Feel free to open pull requests or submit issues to improve the tool.

### Stay Connected
- [GitHub Repository](https://github.com/ChewOnThis/cablespicetifycli)
- Stay tuned for updates and new features!





<h3 align="center"><a href="https://spicetify.app/"><img src="https://i.imgur.com/iwcLITQ.png" width="600px"></a></h3>
<p align="center">
  <a href="https://goreportcard.com/report/github.com/spicetify/cli"><img src="https://goreportcard.com/badge/github.com/spicetify/cli"></a>
  <a href="https://github.com/spicetify/cli/releases/latest"><img src="https://img.shields.io/github/release/spicetify/cli/all.svg?colorB=97CA00&label=version"></a>
  <a href="https://github.com/spicetify/cli/releases"><img src="https://img.shields.io/github/downloads/spicetify/cli/total.svg?colorB=97CA00"></a>
  <a href="https://discord.gg/VnevqPp2Rr"><img src="https://img.shields.io/discord/842219447716151306?label=chat&logo=discord&logoColor=discord"></a>
  <a href="https://www.reddit.com/r/spicetify"><img src="https://img.shields.io/reddit/subreddit-subscribers/spicetify?logo=reddit"></a>
</p>

---

Command-line tool to customize the official Spotify client.
Supports Windows, MacOS and Linux.

<img src=".github/assets/logo.png" alt="img" align="right" width="560px" height="400px">

### Features

- Change colors whole UI
- Inject CSS for advanced customization
- Inject Extensions (Javascript script) to extend functionalities, manipulate UI and control player.
- Inject Custom apps
- Remove bloated components to improve performance

### Links

- [Installation](https://spicetify.app/docs/getting-started)
- [Basic Usage](https://spicetify.app/docs/getting-started#basic-usage)
- [FAQ](https://spicetify.app/docs/faq)
