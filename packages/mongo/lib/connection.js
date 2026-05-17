import mongoose from "mongoose"
function makeNewConnection(uri) {
    const db = mongoose.createConnection(uri, {
    })
    console.log(`MongoDB :: connecting ${uri}`);
    db.on('error', function (error) {
        //console.log(`MongoDB :: connection ${this.name} ${JSON.stringify(error)}`);
        db.close().catch(() => console.log(`MongoDB :: failed to close connection ${this.name} ${uri}`));
    });

    db.on('connected', function () {
        console.log(`MongoDB :: connected ${this.name} ${uri}`);
    });

    db.on('disconnected', function () {
        console.log(`MongoDB :: disconnected ${this.name} ${uri}`);
    });

    return db;
}
export const PremierPrinting = makeNewConnection(process.env.mongoURL);
export const Pythias = makeNewConnection(process.env.pythiasMongoUrl)

