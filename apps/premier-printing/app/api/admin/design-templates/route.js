import { NextResponse } from "next/server";
import { DesignTemplate } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { userFromToken } from "@pythias/backend/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const id = req.nextUrl.searchParams.get("id");
  try {
    if (id) {
      const template = await DesignTemplate.findById(id).lean();
      if (!template) return NextResponse.json({ error: true, msg: "Not found" }, { status: 404 });
      return NextResponse.json({ error: false, template });
    }
    const templates = await DesignTemplate.find({})
      .select("name provider active customizableFields canvasWidth canvasHeight createdAt updatedAt")
      .sort({ _id: -1 })
      .lean();
    return NextResponse.json({ error: false, templates });
  } catch (e) {
    return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  const token = await getToken({ req });
  if (!token?.permissions?.designs) {
    return NextResponse.json({ error: true, msg: "Permission denied" }, { status: 403 });
  }
  try {
    const data = await req.json();
    const template = await DesignTemplate.create({
      name: data.name,
      canvasJson: data.canvasJson,
      canvasWidth: data.canvasWidth || 480,
      canvasHeight: data.canvasHeight || 560,
      customizableFields: data.customizableFields || [],
      provider: data.provider || "premierPrinting",
    });
    return NextResponse.json({ error: false, template });
  } catch (e) {
    return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const token = await getToken({ req });
  if (!token?.permissions?.designs) {
    return NextResponse.json({ error: true, msg: "Permission denied" }, { status: 403 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: true, msg: "Missing id" }, { status: 400 });
  try {
    const data = await req.json();
    const template = await DesignTemplate.findByIdAndUpdate(
      id,
      {
        name: data.name,
        canvasJson: data.canvasJson,
        canvasWidth: data.canvasWidth,
        canvasHeight: data.canvasHeight,
        customizableFields: data.customizableFields || [],
      },
      { new: true }
    );
    return NextResponse.json({ error: false, template });
  } catch (e) {
    return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const token = await getToken({ req });
  if (!token?.permissions?.designs) {
    return NextResponse.json({ error: true, msg: "Permission denied" }, { status: 403 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: true, msg: "Missing id" }, { status: 400 });
  try {
    await DesignTemplate.findByIdAndDelete(id);
    return NextResponse.json({ error: false });
  } catch (e) {
    return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
  }
}
