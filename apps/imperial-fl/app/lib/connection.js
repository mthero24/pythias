import mongoose from "mongoose"
function makeNewConnection(uri) {
    //console.log("connections")
    //console.log(uri)
    const db = mongoose.createConnection(uri, {
    })

    db.on('error', function (error) {
        //console.log(`MongoDB :: connection ${this.name} ${JSON.stringify(error)}`);
        db.close().catch(() => console.log(`MongoDB :: failed to close connection ${this.name}`));
    });

    db.on('connected', function () {
        mongoose.set('debug', function (col, method, query, doc) {
            var label = `MongoDB :: ${this.conn.name} ${col}.${method}(${JSON.stringify(query)},${JSON.stringify(doc)})`;
            // console.time(label); // start timer
    
            // Execute the query and measure the time it took to run.
            this.conn.db.collection(col).find(query).toArray(function(err, result) {
                if (err) throw err;
    
                // console.timeEnd(label); // end timer
            });
        });
        console.log(`MongoDB :: connected ${this.name}`);
    });

    db.on('disconnected', function () {
        console.log(`MongoDB :: disconnected ${this.name}`);
    });

    return db;
}
export const PremierPrinting = makeNewConnection(process.env.mongoURL);

