import { NextGTIN, CreateUpdateUPC } from "@pythias/integrations";

const BRANDS = {
    "The Juniper Shop": ["TC","TD","FST","TSWT","TH","RSTLS","RSYSWT","TTK","YC","YSWT","YH","RSYLS","YTK","YFTH","RSO","FSO","ID","LSO"],
    "Simply Sage Market": ["C","SWT","GDT","GDSWT","GDLS","LGDSP","LGDSWT","LGDSET","GDLSSET","GDTSET","RT","BCT","TK","QZF","HT","H","PPSET","RB","FTH","CTH"],
};

// Pass { SkuToUpc } from @pythias/mongo
export async function createUpc({ SkuToUpc }, { design, blank }) {
    const filterBlank = blank;
    const gs1Auth = { apiKey: process.env.gs1PrimaryProductKey, accountNumber: process.env.gs1AccountNumber };

    for (const b of filterBlank
        ? design.blanks.filter(b => b.blank?._id.toString() === filterBlank.toString())
        : design.blanks
    ) {
        for (const color of b.colors) {
            for (const size of b.blank.sizes) {
                let designImage, side;
                for (const key of Object.keys(design.images)) {
                    if (design.images[key]) { designImage = design.images[key]; side = key; break; }
                }
                const brand = BRANDS["The Juniper Shop"].includes(b.blank.code) ? "The Juniper Shop" : "Simply Sage Market";
                const sku = `${b.blank.code}_${color.name}_${size.name}_${design.sku}`;

                let sku1 = await SkuToUpc.findOne({ sku });
                if (!sku1) sku1 = await SkuToUpc.findOne({ design: design._id, blank: b.blank._id, color: color._id, size: size.name });
                if (sku1?.gtin) {
                    sku1.sku = sku; sku1.design = design._id; sku1.blank = b.blank._id; sku1.color = color._id; sku1.size = size.name;
                    await sku1.save();
                    continue;
                }

                let gtin;
                if (sku1?.gtin) {
                    gtin = { prefix: sku1.gtin.substring(1, 8), gtin: sku1.gtin };
                } else if (sku1?.upc?.length === 12) {
                    gtin = { prefix: `0${sku1.upc.substring(0, 6)}`, gtin: `00${sku1.upc}` };
                } else {
                    gtin = await NextGTIN({ auth: gs1Auth });
                }

                const imageUrl = `https://simplysage.pythiastechnologies.com/api/renderImages?colorName=${color.name}&blank=${b.blank.code}&design=${designImage}&side=${side}`;
                const data = {
                    sku, ...gtin, industry: "General", packagingLevel: "each",
                    productDescription: [{ value: `${brand} ${design.name} ${b.blank.name} ${color.name} ${size.name}`, language: "en" }],
                    status: "in use",
                    brandName: [{ language: "en", value: brand }],
                    isVariable: false, isPurchaseable: true, targetMarket: ["US"],
                    labelDescription: sku, imageUrl,
                };
                const res = await CreateUpdateUPC({ auth: gs1Auth, body: data });
                if (!res.error) {
                    let skuToUpc = sku1
                        ?? await SkuToUpc.findOne({ sku })
                        ?? await SkuToUpc.findOne({ upc: res.product.gtin.replace("00", "") })
                        ?? await SkuToUpc.findOne({ gtin: res.product.gtin });
                    if (!skuToUpc) skuToUpc = new SkuToUpc({});
                    Object.assign(skuToUpc, {
                        sku, upc: res.product.gtin.replace("00", ""), gtin: res.product.gtin,
                        design: design._id, blank: b.blank._id, color: color._id, size: size.name, recycle: false,
                    });
                    await skuToUpc.save();
                } else break;
            }
        }
    }
    return "done";
}

export async function MarkRecycle({ SkuToUpc }, design) {
    await SkuToUpc.updateMany({ design: design._id }, { recycle: true });
}

export async function UnMarkRecycle({ SkuToUpc }, design) {
    await SkuToUpc.updateMany({ design: design._id }, { recycle: false });
}
