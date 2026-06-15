export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { StorefrontTranslation } from "@pythias/mongo";
import { resolveOrg } from "@/lib/resolveOrg";
import { BASE_STRINGS } from "@/lib/i18nStrings";

// GET /api/i18n/strings?lang=xx — the UI dictionary for a language: base English merged with
// any stored translations for that language. lang=en (or unknown) returns base.
export async function GET(req) {
    const lang = (new URL(req.url).searchParams.get("lang") || "en").toLowerCase();
    if (lang === "en") return NextResponse.json({ lang, strings: BASE_STRINGS });

    const ctx = await resolveOrg(req);
    const strings = { ...BASE_STRINGS };
    if (ctx) {
        const rows = await StorefrontTranslation.find({ orgId: ctx.orgId, lang }).select("key value").lean();
        for (const r of rows) if (r.value) strings[r.key] = r.value;
    }
    return NextResponse.json({ lang, strings });
}
