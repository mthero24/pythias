import { PlatformBlank as Blanks } from "@pythias/mongo";
import { serialize } from "@/functions/serialize";
import { Main } from "./Main";
export const dynamic = 'force-dynamic';

export default async function Settings({ params }) {
    const { id, slug } = await params;
    let blank = await Blanks.findById(id).populate("printLocations").lean();
    blank = serialize(blank);
    return <Main bla={blank} basePath={`/${slug}/admin/blanks`} />;
}
