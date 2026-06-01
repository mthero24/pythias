import mongoose from "mongoose"
function makeNewConnection(uri) {
    const db = mongoose.createConnection(uri, {
    })
    db.on('error', function (error) {
        console.error(`MongoDB :: error ${this.name}`, error);
        db.close().catch(() => {});
    });

    db.on('disconnected', function () {
        console.warn(`MongoDB :: disconnected ${this.name}`);
    });

    return db;
}
export const PremierPrinting = makeNewConnection(process.env.mongoURL);
export const Pythias = makeNewConnection(process.env.pythiasMongoURL);
// Falls back to mongoURL so premier-printing app works without the extra env var
export const PremierPrintingDB = makeNewConnection(process.env.premierPrintingMongoURL ?? process.env.mongoURL);
// Supports both PLATFORM_MONGO_URL (uppercase) and platformMongoURL conventions
export const PlatformDB = makeNewConnection(process.env.PLATFORM_MONGO_URL ?? process.env.platformMongoURL ?? process.env.pythiasMongoURL);

