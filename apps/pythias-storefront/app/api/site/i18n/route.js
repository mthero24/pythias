export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { resolveOrg } from "@/lib/resolveOrg";

// GET /api/site/i18n — public currency + language config for the storefront's selectors.
export async function GET(req) {
    const ctx = await resolveOrg(req);
    const i = ctx?.site?.i18n || {};
    const baseCurrency = i.defaultCurrency || "USD";
    const currencies = (i.currencies && i.currencies.length) ? i.currencies : [{ code: baseCurrency, symbol: "$", rate: 1 }];
    // Ensure the base currency is present at rate 1.
    if (!currencies.some((c) => c.code === baseCurrency)) currencies.unshift({ code: baseCurrency, symbol: "$", rate: 1 });
    return NextResponse.json({
        baseCurrency,
        currencies,
        defaultLang: i.defaultLang || "en",
        languages: ["en", ...((i.languages || []).filter((l) => l && l !== "en"))],
    });
}
