import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { testPushListing } from "@/functions/integrationDiagnostics";

// Per-org listing test-push. ⚠ Real push (TikTok wired; other marketplaces pending a
// platform-native listing path). Scoped to the logged-in org.
//   POST /api/internal/integrations/test-push
//   body: { marketplace, productId, connectionId? }
export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    try {
        const body = await req.json();
        const result = await testPushListing(session.user.orgId, body);
        console.log("[integrations/test-push] result:", JSON.stringify(result));
        return NextResponse.json(result);
    } catch (e) {
        console.error("[integrations/test-push] fatal:", e);
        return NextResponse.json({ error: true, msg: e.message, stack: e.stack }, { status: 500 });
    }
}
