import { NextResponse } from "next/server";
import { Design } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { userFromToken, logActivity } from "@pythias/backend/server";

function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim());

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = [];
        let current = "";
        let inQuotes = false;
        for (const char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
                values.push(current.trim());
                current = "";
            } else {
                current += char;
            }
        }
        values.push(current.trim());

        const row = {};
        headers.forEach((h, idx) => { row[h] = values[idx] ?? ""; });
        rows.push(row);
    }
    return rows;
}

export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.permissions?.designs) {
        return NextResponse.json({ error: true, msg: "You do not have permission to edit designs." }, { status: 403 });
    }
    const { userName, email, orgId } = userFromToken(token);

    try {
        const formData = await req.formData();
        const file = formData.get("file");
        if (!file) return NextResponse.json({ error: true, msg: "No file provided." });

        const text = await file.text();
        const rows = parseCSV(text);
        if (rows.length === 0) return NextResponse.json({ error: true, msg: "No data rows found in CSV." });

        let created = 0, updated = 0;
        const errors = [];

        for (const row of rows) {
            const sku = row.sku?.trim();
            const title = row.title?.trim();
            const printType = row.printType?.trim();

            // Collect all image_* columns into { locationName: url }
            const imageUpdates = {};
            for (const key of Object.keys(row)) {
                if (key.startsWith("image_")) {
                    const location = key.slice("image_".length);
                    const url = row[key]?.trim();
                    if (location && url) imageUpdates[location] = url;
                }
            }

            if (!sku) { errors.push("Row skipped: missing SKU."); continue; }
            if (!title) { errors.push(`SKU ${sku}: missing title.`); continue; }

            try {
                const existing = await Design.findOne({ sku });

                if (existing) {
                    const update = { name: title };
                    if (printType) update.printType = printType;
                    if (Object.keys(imageUpdates).length > 0) {
                        update.images = { ...(existing.images ?? {}), ...imageUpdates };
                    }
                    await Design.findByIdAndUpdate(existing._id, update);
                    updated++;
                } else {
                    const design = new Design({
                        sku,
                        name: title,
                        printType: printType || "DTF",
                        images: imageUpdates,
                        date: new Date(),
                    });
                    await design.save();
                    created++;
                }
            } catch (e) {
                errors.push(`SKU ${sku}: ${e.message}`);
            }
        }

        logActivity({
            action: "design_csv_import",
            entity: "design",
            entityName: `CSV import — ${created} created, ${updated} updated`,
            userName,
            email,
            orgId,
        });

        return NextResponse.json({ error: false, created, updated, errors });
    } catch (e) {
        console.log(e);
        return NextResponse.json({ error: true, msg: e.message });
    }
}
