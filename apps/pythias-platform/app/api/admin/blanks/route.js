import { NextResponse } from "next/server";
import { PlatformBlank, PlatformInventory, PlatformColor } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken, logChange } from "@pythias/backend/server";

const purgeCloudflareForBlank = (blankImages) => {
    const token = process.env.CloudFlare_Token;
    const zone  = process.env.CLoudFlare_ZoneId;
    if (!token || !zone) return;
    const tags = (blankImages ?? []).map(i => i.image?.match(/\/(\d+)\.\w+/)?.[1]).filter(Boolean);
    if (!tags.length) return;
    fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/purge_cache`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
    }).catch(() => {});
};

const generateSizeSku = (name) => {
    if (!name) return "";
    const n = name.trim().toLowerCase().replace(/\s+/g, "").replace(/-/g, "");
    const MAP = { small: "s", medium: "m", large: "l", xlarge: "xl", "2xlarge": "2xl", "3xlarge": "3xl", "4xlarge": "4xl", "5xlarge": "5xl", xxlarge: "2xl", xxxlarge: "3xl", xsmall: "xs" };
    return MAP[n] ?? n.substring(0, 5);
};

const updateFold = (blank) => {
    if (!blank.fold) blank.fold = [];
    blank.fold = blank.sizes.map(s => {
        const existing = blank.fold.find(f => f.size?.toString() === String(s._id) || f.sizeName === s.name);
        if (existing) {
            if (!existing.size) existing.size = s._id;
            return existing;
        }
        return { size: s._id, sizeName: s.name, fold: "TSHIRT SML", sleeves: 0, body: 0 };
    });
    return blank;
};

const updateEnvelopes = (blank) => {
    const printLocations = blank.printLocations.map(l => l.name);
    if (!blank.envelopes) blank.envelopes = [];

    const newEnvelopes = blank.envelopes.filter(e => printLocations.includes(e.placement));
    const existingKeys = new Set(newEnvelopes.map(e => `${e.size?.toString()}-${e.placement}`));

    for (const s of blank.sizes) {
        for (const loc of printLocations) {
            const key = `${s._id?.toString()}-${loc}`;
            if (!existingKeys.has(key)) {
                newEnvelopes.push({ size: s._id, sizeName: s.name, platen: 2, placement: loc, horizoffset: 0, vertoffset: 0, width: 11, height: 14 });
                existingKeys.add(key);
            }
        }
    }

    blank.envelopes = newEnvelopes.sort((a, b) => b.placement.length - a.placement.length);
    return blank;
};

const updateInventory = async (blank, orgId) => {
    const colorIds = blank.colors.map(c => c._id || c);
    const [colors, existing] = await Promise.all([
        PlatformColor.find({ _id: { $in: colorIds } }).lean(),
        PlatformInventory.find({ blank: blank._id, orgId }).lean(),
    ]);

    const colorMap = Object.fromEntries(colors.map(c => [String(c._id), c]));
    const existingMap = Object.fromEntries(existing.map(i => [`${String(i.color)}-${i.size_name}`, i]));

    const ops = [];
    for (const colorId of colorIds) {
        const color = colorMap[String(colorId)];
        if (!color) continue;
        for (const size of blank.sizes) {
            const key = `${String(color._id)}-${size.name}`;
            if (existingMap[key]) {
                ops.push({
                    updateOne: {
                        filter: { _id: existingMap[key]._id },
                        update: { $set: { color_name: color.name, size_name: size.name, style_code: blank.code, sizeId: size._id, color: color._id, blank: blank._id } },
                    },
                });
            } else {
                ops.push({
                    insertOne: {
                        document: {
                            orgId,
                            blank: blank._id, style_code: blank.code,
                            inventory_id: encodeURIComponent(`${color.name}-${size.name}-${blank.code}`),
                            barcode_id: Math.floor(Math.random() * 999999),
                            color: color._id, color_name: color.name,
                            sizeId: size._id, size_name: size.name,
                            quantity: 0, pending_quantity: 0, order_at_quantity: 0, desired_order_quantity: 1,
                            orders: [], attached: [], inStock: [],
                        },
                    },
                });
            }
        }
    }
    if (ops.length > 0) await PlatformInventory.bulkWrite(ops, { ordered: false });
};

const generateInventory = async (blank, orgId) => {
    const [lastEntry, colors] = await Promise.all([
        PlatformInventory.findOne({ orgId }).select("barcode_id").sort({ barcode_id: -1 }).lean(),
        PlatformColor.find({ _id: { $in: blank.colors } }).lean(),
    ]);

    let nextBC = lastEntry ? Number(lastEntry.barcode_id) + 1 : 1;
    const docs = [];
    for (const color of colors) {
        for (const size of blank.sizes) {
            docs.push({
                orgId,
                blank: blank._id, style_code: blank.code,
                inventory_id: encodeURIComponent(`${color.name}-${size.name}-${blank.code}`),
                barcode_id: nextBC++,
                color: color._id, color_name: color.name,
                sizeId: size._id, size_name: size.name,
                quantity: 0, order_at_quantity: 0, desired_order_quantity: 1,
                last_counted: new Date(),
            });
        }
    }
    if (docs.length > 0) await PlatformInventory.insertMany(docs, { ordered: false });
};

export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const blanks = await PlatformBlank.find({ orgId: token.orgId }).populate("colors").lean();
    return NextResponse.json({ error: false, blanks });
}

export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    const { userName, email } = userFromToken(token);
    const orgId = token.orgId;

    let { blank, before, action } = await req.json();
    blank.orgId = orgId;

    try {
        for (const s of (blank.sizes ?? [])) {
            if (!s.sku) s.sku = generateSizeSku(s.name);
        }

        let saved;
        if (blank._id) {
            if (blank.printLocations?.length > 0 && blank.sizes?.length > 0 && blank.type !== "alias") blank = updateEnvelopes(blank);
            if (blank.sizes?.length > 0 && blank.type !== "alias") blank = updateFold(blank);

            // Strip populated objects to just their _id before persisting
            blank.colors = (blank.colors ?? []).map(c => c._id ?? c).filter(Boolean);
            blank.printLocations = (blank.printLocations ?? []).map(pl => pl._id ?? pl).filter(Boolean);

            const beforeBlank = before ?? await PlatformBlank.findOne({ _id: blank._id, orgId }).lean();
            saved = await PlatformBlank.findOneAndUpdate(
                { _id: blank._id, orgId },
                blank,
                { new: true },
            );

            if (blank.type === "alias") {
                PlatformInventory.deleteMany({ blank: blank._id, orgId }); // fire-and-forget
            } else {
                updateInventory(blank, orgId); // fire-and-forget
            }
            if (JSON.stringify(beforeBlank?.images) !== JSON.stringify(blank.images)) {
                purgeCloudflareForBlank(blank.images); // fire-and-forget
            }

            const logAction = action || "blank_update";
            logActivity({ action: logAction, entity: "blank", entityId: blank._id, entityName: blank.code || blank.name || "", userName, email, orgId });
            await logChange({ entityType: "blank", entityId: blank._id, entityName: blank.code || blank.name || "", action: logAction, before: beforeBlank, after: blank, userName, email, provider: "platform" });
        } else {
            if (blank.printLocations?.length > 0 && blank.sizes?.length > 0 && blank.type !== "alias") blank = updateEnvelopes(blank);
            if (blank.sizes?.length > 0 && blank.type !== "alias") blank = updateFold(blank);

            // Strip populated objects to just their _id before persisting
            blank.colors = (blank.colors ?? []).map(c => c._id ?? c).filter(Boolean);
            blank.printLocations = (blank.printLocations ?? []).map(pl => pl._id ?? pl).filter(Boolean);

            saved = await PlatformBlank.create(blank);
            if (saved.type !== "alias") await generateInventory(saved, orgId);

            logActivity({ action: "blank_create", entity: "blank", entityId: saved._id, entityName: saved.code || saved.name || "", userName, email, orgId });
            await logChange({ entityType: "blank", entityId: saved._id, entityName: saved.code || saved.name || "", action: "create", before: null, after: saved, userName, email, provider: "platform" });
        }

        return NextResponse.json({ error: false, blank: saved });
    } catch (e) {
        console.error("[blanks POST]", e);
        return NextResponse.json({ error: true, msg: e.message });
    }
}

export async function DELETE(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    const { userName, email } = userFromToken(token);
    const orgId = token.orgId;

    const id = req.nextUrl.searchParams.get("id");
    const deleted = await PlatformBlank.findOneAndDelete({ _id: id, orgId }).lean();
    PlatformInventory.deleteMany({ blank: id, orgId }); // fire-and-forget
    logActivity({ action: "blank_delete", entity: "blank", entityId: id, entityName: deleted?.code || deleted?.name || "", userName, email, orgId });
    logChange({ entityType: "blank", entityId: id, entityName: deleted?.code || deleted?.name || "", action: "delete", before: deleted, after: null, userName, email, provider: "platform" });
    return NextResponse.json({ error: false });
}
