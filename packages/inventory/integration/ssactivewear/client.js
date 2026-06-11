import axios from "axios";

const BASE = "https://api.ssactivewear.com/v2";

export function ssClient(credentials = {}) {
    const accountNumber = credentials.accountNumber || process.env.ssActivewearAccount;
    const apiKey        = credentials.apiKey        || process.env.ssActivewearApiKey;
    const token = Buffer.from(`${accountNumber}:${apiKey}`).toString("base64");
    return axios.create({
        baseURL: BASE,
        headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
        },
        params: { mediatype: "json" },
    });
}
