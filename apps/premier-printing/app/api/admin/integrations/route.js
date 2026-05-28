import { NextResponse } from "next/server";
import { handleAdminIntegrationsGET, handleAdminIntegrationsPOST, handleAdminIntegrationsDELETE } from "@pythias/integrations";
export const dynamic = 'force-dynamic';

export async function GET(req) {
    const res = await handleAdminIntegrationsGET(req);
    const data = await res.json();

    if (!data.error && process.env.ChannelEnginAPIURL && process.env.ChannelEnginAPIKey) {
        const ceConnection = {
            _id: "channelengine",
            displayName: "ChannelEngine",
            type: "channelengine",
            provider: "premierPrinting",
        };
        data.integration = [...(data.integration ?? []), ceConnection];
    }

    return NextResponse.json(data);
}

export const POST = handleAdminIntegrationsPOST;
export const DELETE = handleAdminIntegrationsDELETE;
