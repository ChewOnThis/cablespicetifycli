import fetch from "node-fetch";

async function exchangeAuthCode(authCode) {
    try {
        const response = await fetch("http://localhost:3000/auth", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ code: authCode }),
        });

        // Log the status code and any response text for debugging
        console.log("Response Status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to exchange authorization code. Response: ${errorText}`);
        }

        const data = await response.json();
        console.log("Access Token:", data.access_token);
        console.log("Refresh Token:", data.refresh_token);
    } catch (error) {
        console.error("Error exchanging auth code:", error);
    }
}

// Replace with your actual authorization code
exchangeAuthCode("PUT YO AUTH CODE HERE");
