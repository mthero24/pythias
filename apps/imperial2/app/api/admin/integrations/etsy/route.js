import {NextApiRequest, NextApiResponse} from "next/server";
import { ApiKeyIntegrations, TikTokAuth } from "@pythias/mongo";
export async function GET(req= NextApiRequest, ) {
    const code = req.nextUrl.searchParams.get("code")
    const state = req.nextUrl.searchParams.get("state")
    console.log("Etsy redirect hit with code:", code, "and state:", state);
    if (!code) {
        return res.status(400).json({error: "Missing code parameter"});
    }

    // Here you would typically verify the state parameter to prevent CSRF attacks

    try {
        return res.status(200).json(tokenData);
    } catch (error) {
        console.error("Error fetching Etsy token:", error);
        return res.status(500).json({error: "Internal Server Error"});
    }
}
