# Chewy's Spotify Shortcut System Guide

This is all for 2 shortcuts mind you; adding and deleting songs to and from a playlist.


This guide provides a detailed explanation of how the three main components — the **Server**, the **Auth Token Manager**, and the **Shortcut Script** — work together. It also includes installation steps, dependencies, usage instructions, and how to run the system.
This shit took me like 10 full hours of fucking with to make this bullshit work. Updates for UI shit will come probably, lazy atm.

---

## Overview

The system is designed to integrate **Spotify API** with custom keyboard shortcuts in **Spicetify**. The setup includes:

1. **Server (`spotifyserver.mjs`)**: Acts as the backend, handling token exchange and refreshing.
2. **Auth Token Manager (`sendAuthCode.mjs`)**: Exchanges authorization codes for access and refresh tokens.
3. **Shortcut Script (`KeyboardShortcut.js`)**: Provides custom keyboard shortcuts to manipulate Spotify playlists.

These components work together to automate playlist management using Spicetify.

---

## Installation & Setup

### 1. Prerequisites

Ensure you have the following installed:
- **Node.js** (version 16+)
- **Curl** (for testing API endpoints)
- **Spicetify** (customizes the Spotify client)

Install required Node.js dependencies:
```bash
npm install express body-parser node-fetch
```

---

### 2. Files and Their Roles

- **`spotifyserver.mjs`**: This file runs a local Node.js server to handle authentication and token management.
- **`sendAuthCode.mjs`**: Exchanges an authorization code for an access token.
- **`KeyboardShortcut.js`**: Implements shortcuts for Spotify playlist actions.

---

## Detailed Explanation of Each File

### 1. **Server (`spotifyserver.mjs`)**

#### **Purpose**
The server is the backbone of the system. It:
- Authenticates users with Spotify.
- Exchanges authorization codes for tokens.
- Refreshes expired tokens.
- Provides an endpoint to retrieve the current access token.

#### **How It Works**
1. **Authorization Start**: The server serves an HTML link to authenticate with Spotify:
   ```
   GET /
   ```
   Redirects users to Spotify's authorization page.

2. **Callback**: Spotify redirects back with an authorization code:
   ```
   GET /callback
   ```
   The server exchanges this code for an access and refresh token.

3. **Access Token Retrieval**: The shortcut script retrieves the access token from:
   ```
   GET /token
   ```

4. **Token Refresh**: Tokens are refreshed via:
   ```
   POST /refresh
   ```

#### **How to Run**
1. Start the server:
   ```bash
   node spotifyserver.mjs
   ```
2. Visit `http://localhost:3000` to start the OAuth flow.

---

### 2. **Auth Token Manager (`sendAuthCode.mjs`)**

#### **Purpose**
This script helps exchange an authorization code for tokens manually. It's used for testing and one-time setups.

#### **How It Works**
1. Sends a POST request to the server's `/auth` endpoint with the authorization code.
2. Receives and logs the access and refresh tokens.

#### **How to Use**
1. Replace `your_auth_code_here` with the actual authorization code obtained during the OAuth flow.
2. Run the script:
   ```bash
   node sendAuthCode.mjs
   ```
3. The tokens are printed in the terminal. Save them for use.

---

### 3. **Shortcut Script (`KeyboardShortcut.js`)**

#### **Purpose**
This script integrates with **Spicetify** to enable custom keyboard shortcuts for Spotify actions:
- Add the currently playing track to a specific playlist (`MAIN`).
- Remove the currently playing track from its current playlist.

#### **How It Works**
1. Fetches the access token from the local server.
2. Uses Spotify's API to locate playlists and manipulate tracks.
3. Hooks custom shortcuts using Spicetify's **Mousetrap**.

#### **Keyboard Shortcuts**
- **Ctrl+1**: Add the currently playing track to the `MAIN` playlist.
- **Ctrl+`**: Remove the currently playing track from the current playlist.

#### **How to Use**
1. Copy the script into your Spicetify extensions directory.
2. Enable it using:
   ```bash
   spicetify apply
   ```
3. Use the shortcuts in the Spotify client.

---

## Running the Entire System

### Step-by-Step Workflow

1. **Start the Server**:
   ```bash
   node spotifyserver.mjs
   ```
2. **Authorize Spotify**:
   - Visit `http://localhost:3000` in your browser.
   - Log in to Spotify and grant permissions.
3. **Get Tokens**:
   - Ensure `accessToken` and `refreshToken` are logged in the terminal.
   - Test them with:
     ```bash
     curl -X GET http://localhost:3000/token
     ```
4. **Run the Shortcut Script**:
   - Copy `KeyboardShortcut.js` to Spicetify's extensions folder.
   - Enable and apply:
     ```bash
     spicetify apply
     ```
5. **Test Keyboard Shortcuts**:
   - Play a track in Spotify.
   - Press `Ctrl+1` to add to the `MAIN` playlist.
   - Press `Ctrl+` to remove it from the current playlist.

---

## Common Issues and Fixes

1. **CORS Policy Error**:
   - Ensure the `spotifyserver.mjs` includes:
     ```javascript
     import cors from "cors";
     app.use(cors());
     ```

2. **Token Expiry**:
   - Run a simple script to refresh the token every hour:
     ```bash
     while true; do
       curl -X POST http://localhost:3000/refresh
       sleep 3600
     done
     ```

3. **401 Unauthorized**:
   - Confirm that the correct access token is used.
   - Refresh the token if expired.

---

## Dependencies

- **Node.js** (16+)
- **Express**: HTTP server.
- **Body-Parser**: Parses JSON payloads.
- **Node-Fetch**: Makes HTTP requests.
- **Spicetify**: Spotify customization tool.

Install dependencies with:
```bash
npm install express body-parser node-fetch
```

---

## Summary

The system seamlessly connects Spotify API, Spicetify, and custom scripts. By integrating these components:
- Automate playlist management with keyboard shortcuts.
- Refresh tokens dynamically for uninterrupted API access.
- Customize the Spotify client for a more personalized experience. 

**Happy Spicetifying!** 🎶





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
