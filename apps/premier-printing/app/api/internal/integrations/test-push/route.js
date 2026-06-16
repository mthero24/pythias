import { NextResponse } from "next/server";
import { testPushListing } from "@/functions/integrationDiagnostics";

// Listing test-push: push ONE product to a marketplace and return its accept/reject +
// warnings. ⚠ This performs a REAL listing push (the only way to get the marketplace's
// true validation response).
//   POST /api/internal/integrations/test-push
//   body: { marketplace, connectionId, productId }
export async function POST(req) {
    try {
        const body = await req.json();
        const result = await testPushListing(body);
        console.log("[integrations/test-push] result:", JSON.stringify(result));
        return NextResponse.json(result);
    } catch (e) {
        console.error("[integrations/test-push] fatal:", e);
        return NextResponse.json({ error: true, msg: e.message, stack: e.stack }, { status: 500 });
    }
}
