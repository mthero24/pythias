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
export const Pythias = makeNewConnection(process.env.pythiasMongoUrl)

