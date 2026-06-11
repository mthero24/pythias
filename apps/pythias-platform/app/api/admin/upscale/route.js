import { NextResponse } from "next/server";
import { upscaleImage } from "@pythias/backend";

export async function POST(request) {
    try {
        const { url, factor, denoise, deblur, folder, removeBackground } = await request.json();
        if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

        const result = await upscaleImage(url, {
            factor:           factor           ?? 4,
            denoise:          denoise          ?? true,
            deblur:           deblur           ?? true,
            removeBackground: removeBackground ?? false,
            folder:           folder           ?? "upscaled",
        });

        return NextResponse.json({ ok: true, url: result.url, key: result.key });
    } catch (err) {
        console.error("[upscale]", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
