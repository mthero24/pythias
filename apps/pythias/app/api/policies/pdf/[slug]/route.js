import { NextResponse } from "next/server";
import { getPolicy } from "@/lib/policies";
import { buildPolicyPdf } from "@/lib/policyPdf";

export async function GET(req, { params }) {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) return NextResponse.json({ error: "Policy not found" }, { status: 404 });

  try {
    const pdf = await buildPolicyPdf(policy);
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${policy.filename}"`,
        "Content-Length":      String(pdf.length),
      },
    });
  } catch (e) {
    console.error("PDF error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
