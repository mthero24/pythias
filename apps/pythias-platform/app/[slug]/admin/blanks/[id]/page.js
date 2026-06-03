import { PlatformBlank, PlatformMarketPlace } from "@pythias/mongo";
import { serialize } from "@/functions/serialize";
import { BlankMain as Main } from "@pythias/backend";
export const dynamic = 'force-dynamic';

export default async function Show({ params }) {
    const { id, slug } = await params;
    const [blank, blanks, marketPlaces] = await Promise.all([
        PlatformBlank.findById(id).populate("printLocations").lean(),
        PlatformBlank.find({}).lean(),
        PlatformMarketPlace.find({}).lean(),
    ]);
    return (
        <Main
            bla={serialize(blank)}
            mPs={serialize(marketPlaces)}
            blanks={serialize(blanks)}
            basePath={`/${slug}/admin/blanks`}
        />
    );
}
