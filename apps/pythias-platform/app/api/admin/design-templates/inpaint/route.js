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
    const mask = formData.get("mask"); // white = inpaint, black = keep
    const bgColor = formData.get("bgColor") || "white";

    if (!image || !mask) {
      return NextResponse.json({ error: true, msg: "image and mask are required" }, { status: 400 });
    }

    console.log("[inpaint] image:", image.size, "mask:", mask.size, "bgColor:", bgColor);

    const prompt = formData.get("prompt") || `${bgColor} background, no text, seamless, clean surface`;

    const body = new FormData();
    body.append("image", image, "image.png");
    body.append("mask", mask, "mask.png");
    body.append("prompt", prompt);
    body.append("output_format", "png");

    const res = await fetch("https://api.stability.ai/v2beta/stable-image/edit/inpaint", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.stabilityApiKey}`,
        Accept: "image/*",
      },
      body,
    });

    console.log("[inpaint] status:", res.status, "content-type:", res.headers.get("content-type"));

    if (!res.ok) {
      const text = await res.text();
      console.error("[inpaint] Stability AI error:", text);
      return NextResponse.json({ error: true, msg: `Stability AI ${res.status}: ${text}` }, { status: 502 });
    }

    const resultBuffer = await res.arrayBuffer();
    const bytes = new Uint8Array(resultBuffer);
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
    console.log("[inpaint] buffer size:", resultBuffer.byteLength, "isPng:", isPng);

    if (!isPng) {
      const text = Buffer.from(resultBuffer).toString("utf8").slice(0, 500);
      console.error("[inpaint] unexpected response:", text);
      return NextResponse.json({ error: true, msg: `Not a PNG: ${text}` }, { status: 502 });
    }

    const base64 = Buffer.from(resultBuffer).toString("base64");
    return NextResponse.json({ error: false, image: `data:image/png;base64,${base64}` });
  } catch (e) {
    console.error("[inpaint]", e);
    return NextResponse.json({ error: true, msg: e?.message || String(e) }, { status: 500 });
  }
}
