import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(req) {
  const token = await getToken({ req });
  if (!token?.permissions?.designs) {
    return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const image = formData.get("image");
    const mask  = formData.get("mask");

    if (!image || !mask) {
      return NextResponse.json({ error: true, msg: "image and mask required" }, { status: 400 });
    }

    console.log("[rebuild-bg] image:", image.size, "mask:", mask.size);

    // ── Step 1: Erase text areas (content-aware fill from surrounding ball texture) ──
    const eraseBody = new FormData();
    eraseBody.append("image", image, "image.png");
    eraseBody.append("mask",  mask,  "mask.png");
    eraseBody.append("output_format", "png");

    const eraseRes = await fetch("https://api.stability.ai/v2beta/stable-image/edit/erase", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.stabilityApiKey}`,
        Accept: "image/*",
      },
      body: eraseBody,
    });

    console.log("[rebuild-bg] erase status:", eraseRes.status);

    if (!eraseRes.ok) {
      const text = await eraseRes.text();
      console.error("[rebuild-bg] erase error:", text);
      return NextResponse.json({ error: true, msg: `Stability erase ${eraseRes.status}: ${text}` }, { status: 502 });
    }

    const erasedBuffer = await eraseRes.arrayBuffer();

    // ── Step 2: Remove white background → transparent PNG ──────────────────
    const removeBody = new FormData();
    removeBody.append("image", new Blob([erasedBuffer], { type: "image/png" }), "erased.png");
    removeBody.append("output_format", "png");

    const removeRes = await fetch("https://api.stability.ai/v2beta/stable-image/edit/remove-background", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.stabilityApiKey}`,
        Accept: "image/*",
      },
      body: removeBody,
    });

    console.log("[rebuild-bg] remove-bg status:", removeRes.status);

    let resultBuffer;
    if (removeRes.ok) {
      resultBuffer = await removeRes.arrayBuffer();
    } else {
      // Fallback: return erased image (no transparency) if remove-bg fails
      console.warn("[rebuild-bg] remove-bg failed, returning erased image");
      resultBuffer = erasedBuffer;
    }

    const base64 = Buffer.from(resultBuffer).toString("base64");
    return NextResponse.json({ error: false, image: `data:image/png;base64,${base64}` });

  } catch (e) {
    console.error("[rebuild-bg]", e);
    return NextResponse.json({ error: true, msg: e?.message || String(e) }, { status: 500 });
  }
}
