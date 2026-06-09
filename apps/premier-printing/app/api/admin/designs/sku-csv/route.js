export const dynamic = "force-dynamic";
import { Design, Products } from "@pythias/mongo";

export async function GET() {
    const [designs, products] = await Promise.all([
        Design.find({}, "sku name printType").sort({ sku: 1 }).lean(),
        Products.find(
            { design: { $exists: true, $ne: null } },
            "design sku title",
        ).lean(),
    ]);

    // Group products by design _id
    const byDesign = new Map();
    for (const p of products) {
        const key = p.design?.toString();
        if (!key) continue;
        if (!byDesign.has(key)) byDesign.set(key, []);
        byDesign.get(key).push({ sku: p.sku ?? "", title: p.title ?? "" });
    }

    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

    const header = ["design_sku", "design_name", "print_type", "product_sku", "product_title"];
    const rows   = [header.join(",")];

    for (const d of designs) {
        const linked = byDesign.get(d._id.toString()) ?? [];
        if (linked.length === 0) {
            // Design exists but has no products — include with blank product columns
            rows.push([d.sku, d.name, d.printType ?? "", "", ""].map(esc).join(","));
        } else {
            for (const p of linked) {
                rows.push([d.sku, d.name, d.printType ?? "", p.sku, p.title].map(esc).join(","));
            }
        }
    }

    const csv = rows.join("\r\n");
    const date = new Date().toISOString().slice(0, 10);

    return new Response(csv, {
        headers: {
            "Content-Type":        "text/csv",
            "Content-Disposition": `attachment; filename="design-skus-${date}.csv"`,
        },
    });
}
