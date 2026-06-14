export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import path from "path";
import { spawn } from "child_process";

// POST /api/admin/commerce-cloud/sync — run the Premier→Commerce Cloud catalog sync on demand.
// Spawns the same script PM2 runs every 12 hours (it calls process.exit, so it must run in its
// own process, not in-line). Fire-and-forget: the admin refreshes the bootstrap stats after.
export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin" && session.user.role !== "superadmin") {
        return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const script = path.join(process.cwd(), "scripts", "importPremierCatalog.js");
    try {
        const child = spawn(process.execPath, [script], {
            cwd: process.cwd(),
            env: process.env,
            detached: true,
            stdio: "ignore",
        });
        child.unref();
        return NextResponse.json({ error: false, started: true, msg: "Catalog sync started — refresh in ~1 minute to see updated counts." });
    } catch (e) {
        return NextResponse.json({ error: true, msg: `Could not start sync: ${e.message}` }, { status: 500 });
    }
}
