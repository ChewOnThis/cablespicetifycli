import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fetch from "node-fetch";
const app = express(); // Initialize `app` here
app.use(cors()); // Add this before defining routes




const CLIENT_ID = "PUT YO CLIENT ID HERE: https://developer.spotify.com/dashboard";
const CLIENT_SECRET = "PUT YO CLIENT SECRET HERE https://developer.spotify.com/dashboard";
const REDIRECT_URI = "http://localhost:3000/callback"; // Update this to match your setup
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

let accessToken = null;
let refreshToken = null;


app.use(bodyParser.json());

// Serve the initial page to start the OAuth process
app.get("/", (req, res) => {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
    )}&scope=playlist-read-private playlist-modify-public`;
    res.send(`<a href="${authUrl}">Authenticate with Spotify</a>`);
});

// Handle the callback from Spotify
app.get("/callback", async (req, res) => {
    const authCode = req.query.code;
    if (!authCode) {
        return res.status(400).send("Authorization code is required.");
    }

    try {
        const body = new URLSearchParams({
            grant_type: "authorization_code",
            code: authCode,
            redirect_uri: REDIRECT_URI,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
        });

        const response = await fetch(SPOTIFY_TOKEN_URL, {
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
        accessToken = data.access_token;
        refreshToken = data.refresh_token;

        console.log("Access Token:", accessToken);
        console.log("Refresh Token:", refreshToken);

        res.send("Authentication successful! You can now close this window.");
    } catch (error) {
        console.error("Error exchanging authorization code:", error);
        res.status(500).send("Error exchanging authorization code.");
    }
});

// Endpoint to provide the current access token
app.get("/token", (req, res) => {
    if (!accessToken) {
        return res.status(400).send("No access token available.");
    }
    res.json({ accessToken });
});

// Endpoint to refresh the access token
app.post("/refresh", async (req, res) => {
    if (!refreshToken) {
        return res.status(400).send("No refresh token available.");
    }

    try {
        const body = new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
        });

        const response = await fetch(SPOTIFY_TOKEN_URL, {
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
        accessToken = data.access_token;

        console.log("Refreshed Access Token:", accessToken);

        res.json({ accessToken });
    } catch (error) {
        console.error("Error refreshing access token:", error);
        res.status(500).send("Error refreshing access token.");
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
