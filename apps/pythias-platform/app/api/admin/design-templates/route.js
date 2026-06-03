import { NextResponse } from "next/server";
import { PlatformDesignTemplate, PlatformDesign as Design, PlatformProduct as Products } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { userFromToken } from "@pythias/backend/server";
import { deleteFromS3, designImageUrls, productImageUrls } from "@/lib/s3";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const token = await getToken({ req });
  const orgId = token?.orgId;
  const id = req.nextUrl.searchParams.get("id");
  try {
    if (id) {
      const template = await PlatformDesignTemplate.findOne({ _id: id, orgId }).lean();
      if (!template) return NextResponse.json({ error: true, msg: "Not found" }, { status: 404 });
      return NextResponse.json({ error: false, template });
    }
    const templates = await PlatformDesignTemplate.find({ orgId })
      .select("name active customizableFields canvasWidth canvasHeight createdAt updatedAt")
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
  const orgId = token.orgId;
  try {
    const data = await req.json();
    const template = await PlatformDesignTemplate.create({
      orgId,
      name: data.name,
      canvasJson: data.canvasJson,
      canvasWidth: data.canvasWidth || 480,
      canvasHeight: data.canvasHeight || 560,
      customizableFields: data.customizableFields || [],
      printType:  data.printType  || ["DTF"],
      stitchType: data.stitchType || "satin",
    });
    return NextResponse.json({ error: false, template });
  } catch (e) {
    console.error("[design-templates POST]", e);
    return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const token = await getToken({ req });
  if (!token?.permissions?.designs) {
    return NextResponse.json({ error: true, msg: "Permission denied" }, { status: 403 });
  }
  const orgId = token.orgId;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: true, msg: "Missing id" }, { status: 400 });
  try {
    const data = await req.json();
    const template = await PlatformDesignTemplate.findOneAndUpdate(
      { _id: id, orgId },
      {
        name: data.name,
        canvasJson: data.canvasJson,
        canvasWidth: data.canvasWidth,
        canvasHeight: data.canvasHeight,
        customizableFields: data.customizableFields || [],
        printType:  data.printType  || ["DTF"],
        stitchType: data.stitchType || "satin",
      },
      { new: true }
    );
    return NextResponse.json({ error: false, template });
  } catch (e) {
    console.error("[design-templates PUT]", e);
    return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const token = await getToken({ req });
  if (!token?.permissions?.designs) {
    return NextResponse.json({ error: true, msg: "Permission denied" }, { status: 403 });
  }
  const orgId = token.orgId;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: true, msg: "Missing id" }, { status: 400 });
  try {
    const products = await Products.find({ orgId, designTemplateId: id })
      .select("design productImages variantImages variantSecondaryImages")
      .lean();

    const designIds = [...new Set(products.map(p => p.design?.toString()).filter(Boolean))];
    const productUrls = products.flatMap(productImageUrls);

    const designs = designIds.length
      ? await Design.find({ orgId, _id: { $in: designIds } })
          .select("images sublimationImages embroideryFiles threadImages")
          .lean()
      : [];
    const designUrls = designs.flatMap(designImageUrls);

    await Promise.all([
      deleteFromS3([...productUrls, ...designUrls]),
      Products.deleteMany({ orgId, designTemplateId: id }),
      designIds.length ? Design.deleteMany({ orgId, _id: { $in: designIds } }) : Promise.resolve(),
      PlatformDesignTemplate.findOneAndDelete({ _id: id, orgId }),
    ]);

    return NextResponse.json({ error: false });
  } catch (e) {
    console.error("[design-templates DELETE]", e);
    return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
  }
}
