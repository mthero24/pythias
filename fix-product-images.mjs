import fs from "fs";
import path from "path";
import mongoose from "mongoose";

const env = {};
for (const line of fs.readFileSync(path.resolve("apps/pythias-platform/.env.local"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const APPLY = process.argv.includes("--apply");
const uri = env.mongoURL;
const ORG = new mongoose.Types.ObjectId("6a203f9d649b7c8da6b62115"); // print-threads
const OLD = "https://printthreads.pythiastechnologies.com";
const NEW = "https://platform.pythiastechnologies.com";
const SLUG = "print-threads";

// Rewrite a legacy per-org renderImages URL to the platform host (+ orgSlug, minus the stray %7D/} bug).
function fix(url) {
    if (typeof url !== "string" || !url.includes("printthreads.pythiastechnologies.com")) return url;
    let u = url.replace(OLD, NEW);
    u = u.replace(/(%7D|\})(?=(\?|$))/i, "");          // strip stray "}" before query / at end
    if (!/[?&]orgSlug=/.test(u)) u += (u.includes("?") ? "&" : "?") + `orgSlug=${SLUG}`;
    return u;
}
const fixArr = (arr) => Array.isArray(arr) ? arr.map((o) => (o && typeof o === "object" && typeof o.image === "string") ? { ...o, image: fix(o.image) } : o) : arr;

const conn = await mongoose.createConnection(uri).asPromise();
const col = conn.collection("products");
const q = { orgId: ORG, $or: [
    { "productImages.image": /printthreads\.pythiastechnologies\.com/ },
    { "variantsArray.image": /printthreads\.pythiastechnologies\.com/ },
    { image: /printthreads\.pythiastechnologies\.com/ },
] };
const total = await col.countDocuments(q);
console.log(`products needing fix: ${total} ${APPLY ? "(APPLYING)" : "(dry run — pass --apply to write)"}`);

const cursor = col.find(q).project({ productImages: 1, variantsArray: 1, image: 1, images: 1 });
let changed = 0; const ops = [];
for await (const p of cursor) {
    const set = {};
    const pi = fixArr(p.productImages); if (JSON.stringify(pi) !== JSON.stringify(p.productImages)) set.productImages = pi;
    const va = fixArr(p.variantsArray); if (JSON.stringify(va) !== JSON.stringify(p.variantsArray)) set.variantsArray = va;
    if (typeof p.image === "string") { const im = fix(p.image); if (im !== p.image) set.image = im; }
    if (Array.isArray(p.images)) { const ims = p.images.map(fix); if (JSON.stringify(ims) !== JSON.stringify(p.images)) set.images = ims; }
    if (Object.keys(set).length) { changed++; ops.push({ updateOne: { filter: { _id: p._id }, update: { $set: set } } }); }
}
console.log(`docs with at least one rewrite: ${changed}`);
if (changed) {
    const ex = ops[0].updateOne.update.$set;
    console.log("example new image:", (ex.productImages?.[0]?.image) || ex.variantsArray?.[0]?.image || ex.image);
}
if (APPLY && ops.length) {
    let done = 0;
    for (let i = 0; i < ops.length; i += 500) { const r = await col.bulkWrite(ops.slice(i, i + 500), { ordered: false }); done += r.modifiedCount; }
    console.log(`WROTE: modified ${done} docs`);
}
await conn.close();
process.exit(0);
