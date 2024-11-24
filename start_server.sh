#!/bin/bash

# Define the working directory for easier handling
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Install necessary Node.js packages if not already installed
if [ ! -d "$DIR/node_modules" ]; then
  echo "Installing dependencies..."
  npm install express fs path cors net node-fetch --prefix "$DIR"
fi

# Start the server in the background
node "$DIR/spotifyServer.mjs" &
SERVER_PID=$!

# Exchange authorization code if tokens are not present
if [ ! -f "$DIR/tokens.json" ]; then
  echo "No tokens found, please run authorization script to set up tokens."
  node "$DIR/sendAuthCode.mjs"
fi

# Start the refresh token script in the background
"$DIR/refresh_token.sh" &

# Keep server running
wait $SERVER_PID