import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import net from "net";
import fetch from "node-fetch";
const tokensFilePath = path.resolve("tokens.json");


const app = express();
const PORT = 3000;

// Use CORS with proper configuration
app.use(cors({
  origin: "*", // This allows requests from any domain. For production, specify only trusted domains.
  methods: ["GET", "POST"], // Specify allowed methods
  allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
}));

// Other middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Your routes (e.g., /token, /auth, etc.)
app.get("/token", async (req, res) => {
  console.log("Received request for /token");
  loadTokens(); // Reload tokens from file to ensure latest state

  if (!tokens.accessToken) {
    console.warn("Access token not found, attempting refresh...");
    await refreshAccessToken();
  }

  if (tokens.accessToken) {
    console.log("Access token found, returning token", tokens.accessToken);
    return res.status(200).json({ accessToken: tokens.accessToken });
  } else {
    console.warn("Access token still not found after attempting refresh");
    return res.status(404).json({ error: "Access token not found." });
  }
});

app.listen(PORT, () => {
  console.log(`Spotify server started on http://localhost:${PORT}`);
});


// Pre-load tokens from file if available
let tokens = {};
function loadTokens() {
  if (fs.existsSync(tokensFilePath)) {
    try {
      tokens = JSON.parse(fs.readFileSync(tokensFilePath, 'utf8'));
      console.log("Tokens loaded from file", tokens);
    } catch (err) {
      console.error("Error reading tokens file during startup", err);
    }
  } else {
    console.warn("Tokens file not found, starting with empty tokens");
  }
}

loadTokens();

// Middleware to parse JSON body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allow CORS from Spotify's client
app.use(
  cors({
    origin: "*", // Allow all origins to access the server for better compatibility across environments
    methods: ["GET", "POST"], // Specify allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
  })
);

// Automatically get access token using client credentials if auth code is not available
async function getClientCredentialsToken() {
  try {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: tokens.clientId,
      client_secret: tokens.clientSecret,
    });

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error("Failed to get client credentials token.");
    }

    const data = await response.json();
    tokens.accessToken = data.access_token;

    // Save tokens to file
    fs.writeFileSync(tokensFilePath, JSON.stringify(tokens, null, 2));
    console.log("Client credentials token saved successfully", tokens);
  } catch (err) {
    console.error("Error getting client credentials token", err);
  }
}

// Redirect user to Spotify authorization page
app.get("/authorize", (req, res) => {
  const scopes = "playlist-read-private playlist-modify-public";
  const authorizeUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${tokens.clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent("http://localhost:3000/callback")}`;
  res.redirect(authorizeUrl);
});

// Handle Spotify redirect with authorization code
app.get("/callback", async (req, res) => {
  const authCode = req.query.code;
  if (!authCode) {
    return res.status(400).send("Authorization code is required.");
  }

  tokens.authCode = authCode;

  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: authCode,
      redirect_uri: "http://localhost:3000/callback",
      client_id: tokens.clientId,
      client_secret: tokens.clientSecret,
    });

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error("Failed to exchange authorization code for tokens.");
    }

    const data = await response.json();
    tokens.accessToken = data.access_token;
    tokens.refreshToken = data.refresh_token;

    // Save tokens to file
    fs.writeFileSync(tokensFilePath, JSON.stringify(tokens, null, 2));
    console.log("Tokens saved successfully", tokens);
    res.status(200).send("Tokens generated and saved successfully. You can now close this window.");
  } catch (err) {
    console.error("Error saving tokens file", err);
    res.status(500).send("Error saving tokens file.");
  }
});

// Root endpoint for server status and token input form
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Spotify Token Setup</title>
      </head>
      <body>
        <h1>Enter Spotify Tokens</h1>
        <form action="/save-tokens" method="post">
          <label for="clientId">Client ID:</label><br>
          <input type="text" id="clientId" name="clientId" value="${tokens.clientId || ""}"><br>
          <label for="clientSecret">Client Secret:</label><br>
          <input type="text" id="clientSecret" name="clientSecret" value="${tokens.clientSecret || ""}"><br>
          <label for="authCode">Authorization Code:</label><br>
          <input type="text" id="authCode" name="authCode" value="${tokens.authCode || ""}"><br>
          <input type="submit" value="Save and Authorize">
        </form>
        <p>Or <a href="/authorize">Click here to authorize with Spotify</a></p>
      </body>
    </html>
  `);
});

// Endpoint to save client ID, secret, and optionally auth code, then get client credentials token or redirect to authorize
app.post("/save-tokens", async (req, res) => {
  console.log("Received request to save tokens");
  const { clientId, clientSecret, authCode } = req.body;
  if (!clientId || !clientSecret) {
    console.error("Missing required fields to save tokens");
    return res.status(400).send("Missing required fields");
  }

  tokens.clientId = clientId;
  tokens.clientSecret = clientSecret;
  if (authCode) {
    tokens.authCode = authCode;
  }

  // Save tokens to file
  fs.writeFileSync(tokensFilePath, JSON.stringify(tokens, null, 2));
  console.log("Client ID, Secret, and Auth Code saved successfully", tokens);

  // Try to get client credentials token automatically or redirect to authorize
  if (authCode) {
    await getClientCredentialsToken();
    res.redirect("/callback?code=" + authCode);
  } else {
    res.redirect("/authorize");
  }
});

// Endpoint to fetch tokens
app.get("/token", (req, res) => {
  console.log("Received request for /token");
  loadTokens(); // Reload tokens from file to ensure latest state
  if (tokens.accessToken) {
    console.log("Access token found, returning token", tokens.accessToken);
    return res.status(200).json({ accessToken: tokens.accessToken });
  } else {
    console.warn("Access token not found in tokens");
    return res.status(404).json({ error: "Access token not found." });
  }
});

// Endpoint to refresh the access token
app.post("/refresh", async (req, res) => {
  console.log("Access token not found, attempting refresh...");
  if (!tokens.refreshToken) {
    console.warn("No refresh token available to refresh access token.");
    return res.status(400).send("No refresh token available.");
  }

  try {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokens.refreshToken,
      client_id: tokens.clientId,
      client_secret: tokens.clientSecret,
    });

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh access token.");
    }

    const data = await response.json();
    tokens.accessToken = data.access_token;

    // Save tokens to file
    fs.writeFileSync(tokensFilePath, JSON.stringify(tokens, null, 2));
    console.log("Refreshed Access Token saved successfully", tokens.accessToken);

    res.json({ accessToken: tokens.accessToken });
  } catch (error) {
    console.error("Error refreshing access token:", error);
    res.status(500).send("Error refreshing access token.");
  }
});


// Schedule access token refresh every hour using setInterval
setInterval(async () => {
  console.log("Scheduled job to refresh access token");
  if (tokens.refreshToken) {
    try {
      const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: tokens.refreshToken,
        client_id: tokens.clientId,
        client_secret: tokens.clientSecret,
      });

      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (!response.ok) {
        throw new Error("Failed to refresh access token.");
      }

      const data = await response.json();
      tokens.accessToken = data.access_token;

      // Save tokens to file
      fs.writeFileSync(tokensFilePath, JSON.stringify(tokens, null, 2));
      console.log("Refreshed Access Token saved successfully (scheduled)", tokens.accessToken);
    } catch (error) {
      console.error("Error refreshing access token in scheduled job:", error);
    }
  } else {
    console.warn("No refresh token available for scheduled job");
  }
}, 3600000); // Refresh every hour (3600000 ms)

// Start the server with better error handling
(async () => {
  const server = net.createServer();
  server.once("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`Server is already running on http://localhost:${PORT}`);
    } else {
      console.error("Error starting server:", err);
    }
  });
  server.once("listening", () => {
    server.close();
    app.listen(PORT, () => {
      console.log(`Spotify server started on http://localhost:${PORT}`);
    });
  });
  server.listen(PORT);
})();
