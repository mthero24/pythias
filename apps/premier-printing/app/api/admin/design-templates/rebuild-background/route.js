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

    // Use Stability AI erase — content-aware fills only the masked (text) areas,
    // leaving the rest of the artwork completely untouched.
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

    if (!eraseRes.ok) {
      const text = await eraseRes.text();
      console.error("[rebuild-bg] erase error:", text);
      return NextResponse.json({ error: true, msg: `Stability erase ${eraseRes.status}: ${text}` }, { status: 502 });
    }

    const resultBuffer = await eraseRes.arrayBuffer();
    const base64 = Buffer.from(resultBuffer).toString("base64");
    return NextResponse.json({ error: false, image: `data:image/png;base64,${base64}` });

  } catch (e) {
    console.error("[rebuild-bg]", e);
    return NextResponse.json({ error: true, msg: e?.message || String(e) }, { status: 500 });
  }
}
