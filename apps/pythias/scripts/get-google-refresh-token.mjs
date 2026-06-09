/**
 * One-time script to get a Google OAuth2 refresh token for the Calendar API.
 *
 * Prerequisites:
 *   1. In Google Cloud Console → Credentials → your OAuth client → add
 *      "http://localhost:4321" to Authorized Redirect URIs and save.
 *   2. Enable the Google Calendar API for the project.
 *
 * Usage:
 *   node scripts/get-google-refresh-token.mjs
 *
 * Then paste the three env vars it prints into your .env.local file.
 */

import http      from "http";
import { URL }   from "url";
import { google } from "googleapis";

const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment first.");
    process.exit(1);
}
const REDIRECT_URI  = "http://localhost:4321";
const SCOPES        = ["https://www.googleapis.com/auth/calendar.events"];

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    scope:       SCOPES,
    prompt:      "consent", // forces refresh_token to be returned every time
});

console.log("\n────────────────────────────────────────────────────");
console.log("Step 1 — Make sure http://localhost:4321 is added as");
console.log("         an Authorized Redirect URI in Google Cloud.");
console.log("────────────────────────────────────────────────────");
console.log("\nStep 2 — Open this URL in your browser:\n");
console.log(authUrl);
console.log("\nWaiting for Google to redirect back...\n");

const server = http.createServer(async (req, res) => {
    const url  = new URL(req.url, REDIRECT_URI);
    const code = url.searchParams.get("code");
    const err  = url.searchParams.get("error");

    if (err || !code) {
        res.writeHead(400);
        res.end(`Error: ${err || "no code returned"}`);
        console.error("Auth failed:", err);
        server.close();
        return;
    }

    try {
        const { tokens } = await oauth2.getToken(code);

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<h2>Done! You can close this tab.</h2><p>Check your terminal for the env vars.</p>");

        console.log("\n✓ Success! Add these to your apps/pythias/.env.local:\n");
        console.log(`GOOGLE_CLIENT_ID=${CLIENT_ID}`);
        console.log(`GOOGLE_CLIENT_SECRET=${CLIENT_SECRET}`);
        console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
        console.log(`GOOGLE_CALENDAR_ID=michaelthero@pythiastechnologies.com`);
        console.log("\n────────────────────────────────────────────────────\n");
    } catch (e) {
        res.writeHead(500);
        res.end("Token exchange failed: " + e.message);
        console.error("Token exchange failed:", e.message);
    }

    server.close();
});

server.listen(4321, () => {
    console.log("Local server listening on http://localhost:4321 ...");
});
