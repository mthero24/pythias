import { NextApiRequest, NextResponse } from "next/server";
import { Blank as Blanks, Inventory, Color } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken, logChange } from "@pythias/backend/server";
import { deleteFromS3, blankImageUrls } from "@/lib/s3";

export async function GET() {
  try {
    const blanks = await Blanks.find({}).populate("colors").lean();
    return NextResponse.json({ error: false, blanks });
  } catch (e) {
    return NextResponse.json({ error: true, msg: JSON.stringify(e) });
  }
}

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

  // Retain only envelopes whose placement still exists
  const newEnvelopes = blank.envelopes.filter(e => printLocations.includes(e.placement));

  // Set-based lookup so the nested loop is O(sizes × locations) not O(sizes × locations × envelopes)
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

// Batch: one Color fetch + one Inventory fetch + one bulkWrite instead of N×M serial round-trips
const updateInventory = async (blank) => {
  const colorIds = blank.colors.map(c => c._id || c);
  const [colors, existing] = await Promise.all([
    Color.find({ _id: { $in: colorIds } }).lean(),
    Inventory.find({ blank: blank._id }).lean(),
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
  if (ops.length > 0) await Inventory.bulkWrite(ops, { ordered: false });
};

export async function POST(req = NextApiRequest) {
  const token = await getToken({ req });
  const { userName, email } = userFromToken(token);
  let { blank, before, action } = await req.json();
  let newBlank;
  try {
    for (const s of blank.sizes) {
      s.sku = s.name.includes(" ") ? s.name.split(" ").map(w => w[0]).join("") : s.name;
    }

    if (blank._id) {
      if (blank.printLocations?.length > 0 && blank.sizes.length > 0 && blank.type !== "alias") blank = updateEnvelopes(blank);
      if (blank.sizes.length > 0 && blank.type !== "alias") blank = updateFold(blank);
      const beforeBlank = before ?? await Blanks.findById(blank._id).lean();
      newBlank = await Blanks.findByIdAndUpdate(blank._id, blank, { new: true }).populate("printLocations");
      if (blank.type === "alias") {
        Inventory.deleteMany({ blank: blank._id }); // fire-and-forget
      } else {
        updateInventory(blank); // fire-and-forget
      }
      const logAction = action || "blank_update";
      logActivity({ action: logAction, entity: "blank", entityId: blank._id, entityName: blank.code || blank.name || "", userName, email });
      await logChange({ entityType: "blank", entityId: blank._id, entityName: blank.code || blank.name || "", action: logAction, before: beforeBlank, after: blank, userName, email, provider: "premierPrinting" });
    } else {
      // Apply envelope/fold to the plain object before the single save
      if (blank.printLocations?.length > 0 && blank.sizes.length > 0 && blank.type !== "alias") blank = updateEnvelopes(blank);
      if (blank.sizes.length > 0 && blank.type !== "alias") blank = updateFold(blank);
      newBlank = await new Blanks(blank).save();
      if (newBlank.type !== "alias") await generateInventory(newBlank);
      logActivity({ action: "blank_create", entity: "blank", entityId: newBlank._id, entityName: newBlank.code || newBlank.name || "", userName, email });
      await logChange({ entityType: "blank", entityId: newBlank._id, entityName: newBlank.code || newBlank.name || "", action: "create", before: null, after: newBlank, userName, email, provider: "premierPrinting" });
    }
    return NextResponse.json({ error: false, blank: newBlank });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ error: true, message: err.toString() });
  }
}

export async function DELETE(req = NextApiRequest) {
  const token = await getToken({ req });
  const { userName, email } = userFromToken(token);
  const id = req.nextUrl.searchParams.get("id");
  const deleted = await Blanks.findOneAndDelete({ _id: id }).lean();
  if (deleted) await deleteFromS3(blankImageUrls(deleted));
  logActivity({ action: "blank_delete", entity: "blank", entityId: id, entityName: deleted?.code || deleted?.name || "", userName, email });
  logChange({ entityType: "blank", entityId: id, entityName: deleted?.code || deleted?.name || "", action: "delete", before: deleted, after: null, userName, email, provider: "premierPrinting" });
  return NextResponse.json({ error: false });
}

async function generateInventory(style) {
  const [lastBarcode, colors] = await Promise.all([
    Inventory.findOne().select("barcode_id").sort({ barcode_id: -1 }).lean(),
    Color.find({ _id: { $in: style.colors } }).lean(),
  ]);

  let nextBC = lastBarcode ? Number(lastBarcode.barcode_id) + 1 : 0;

  const docs = [];
  for (const color of colors) {
    for (const size of style.sizes) {
      docs.push({
        inventory_id: encodeURIComponent(`${color.name}-${size.name}-${style.code}`),
        style_code: style.code,
        quantity: 0, order_at_quantity: 0, desired_order_quantity: 1,
        color: color._id, color_name: color.name,
        size_name: size.name, size: size._id,
        last_counted: new Date(),
        barcode_id: nextBC++,
        blank: style._id,
      });
    }
  }
  if (docs.length > 0) await Inventory.insertMany(docs, { ordered: false });
}
