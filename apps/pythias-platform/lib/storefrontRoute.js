import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { NextResponse } from "next/server";

// Platform adapter for the shared storefront-management services: resolve orgId from the
// platform's next-auth session, and map service errors (err.status) to HTTP responses.
export async function sessionOrgId() {
    const s = await getServerSession(authOptions);
    return s?.user?.orgId || null;
}
export async function sessionUserEmail() {
    const s = await getServerSession(authOptions);
    return s?.user?.email || null;
}
export function svcError(e) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: e?.status || 500 });
}
