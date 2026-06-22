export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { StorefrontCustomer } from "@pythias/mongo";
import { getAuthedCustomer } from "@/lib/account";
import { hashPassword, verifyPassword } from "@/lib/auth";

// POST /api/account/password — signed-in customer changes their password.
// Body: { currentPassword, newPassword }. Current password is required if one is set.
export async function POST(req) {
    const auth = await getAuthedCustomer(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { currentPassword, newPassword } = await req.json().catch(() => ({}));
    if (!newPassword || String(newPassword).length < 8) {
        return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }

    const customer = await StorefrontCustomer.findOne({ orgId: auth.orgId, email: auth.customer.email });
    if (!customer) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    if (customer.passwordHash) {
        if (!currentPassword || !(await verifyPassword(String(currentPassword), customer.passwordHash))) {
            return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
        }
    }

    customer.passwordHash = await hashPassword(String(newPassword));
    await customer.save();
    return NextResponse.json({ error: false, ok: true });
}
