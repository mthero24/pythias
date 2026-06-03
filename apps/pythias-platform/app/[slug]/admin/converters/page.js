import { PlatformConverter } from "@pythias/mongo";
import { Converters as ConvertersComponent, serialize } from "@pythias/backend";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export const dynamic = "force-dynamic";

export default async function ConverterPage() {
    const session = await getServerSession(authOptions);
    const orgId = session?.user?.orgId;

    const types = ["design", "blank", "color", "size", "sku"];
    const converters = {};

    await Promise.all(types.map(async type => {
        let doc = await PlatformConverter.findOne({ orgId, type });
        if (!doc) {
            doc = await PlatformConverter.create({ orgId, type, converter: {} });
        }
        converters[type] = serialize(doc);
    }));

    return (
        <ConvertersComponent
            designConverter={converters.design}
            blankConverter={converters.blank}
            colorConverter={converters.color}
            sizeConverter={converters.size}
            skuConverter={converters.sku}
        />
    );
}
