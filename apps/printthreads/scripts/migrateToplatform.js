/**
 * Migrates all data from the printthreads DB to the platform DB.
 * Every copied document gets orgId = TARGET_ORG_ID.
 * Users are excluded.
 *
 * Run: node scripts/migrateToplatform.js
 */

const { MongoClient, ObjectId } = require("mongodb");

const SOURCE_URI = "mongodb+srv://pythiasTechnologies:MUITteJaMpj6rSZc@cluster0.figvn.mongodb.net/printthreads?retryWrites=true&w=majority&appName=Cluster0";
const TARGET_URI = "mongodb+srv://pythiasTechnologies:MUITteJaMpj6rSZc@cluster0.figvn.mongodb.net/platform?retryWrites=true&w=majority&appName=Cluster0";
const TARGET_ORG_ID = new ObjectId("6a203f9d649b7c8da6b62115");

const SKIP = new Set(["users", "system.indexes", "system.views", "system.users", "system.roles"]);

const BATCH = 500;

async function migrateCollection(sourceDb, targetDb, name) {
    const source = sourceDb.collection(name);
    const target = targetDb.collection(name);

    const total = await source.countDocuments();
    if (total === 0) {
        console.log(`  ${name}: empty — skip`);
        return;
    }

    let inserted = 0;
    let skipped = 0;
    let cursor = source.find({});

    while (true) {
        const batch = [];
        for (let i = 0; i < BATCH; i++) {
            const doc = await cursor.next();
            if (!doc) break;
            batch.push({ ...doc, orgId: TARGET_ORG_ID });
        }
        if (batch.length === 0) break;

        try {
            const res = await target.insertMany(batch, { ordered: false });
            inserted += res.insertedCount;
        } catch (err) {
            if (err.code === 11000 || err.name === "BulkWriteError") {
                const ok = err.result?.nInserted ?? 0;
                inserted += ok;
                skipped += batch.length - ok;
            } else {
                throw err;
            }
        }
    }

    await cursor.close();
    console.log(`  ${name}: ${inserted} inserted, ${skipped} skipped (duplicates) — total in source: ${total}`);
}

async function main() {
    const sourceClient = new MongoClient(SOURCE_URI);
    const targetClient = new MongoClient(TARGET_URI);

    try {
        await Promise.all([sourceClient.connect(), targetClient.connect()]);
        console.log("Connected to both databases.");

        const sourceDb = sourceClient.db("printthreads");
        const targetDb = targetClient.db("platform");

        const cols = await sourceDb.listCollections().toArray();
        const names = cols.map(c => c.name).filter(n => !SKIP.has(n)).sort();

        console.log(`\nCollections to migrate (${names.length}):`);
        names.forEach(n => console.log(`  - ${n}`));
        console.log();

        for (const name of names) {
            await migrateCollection(sourceDb, targetDb, name);
        }

        console.log("\nMigration complete.");
    } finally {
        await Promise.all([sourceClient.close(), targetClient.close()]);
    }
}

main().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
