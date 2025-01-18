const {TSPprints} = require('../lib/connection');
let mongoose = require("mongoose")
var schema = new mongoose.Schema({
    pic: String,
    Date: Date
})
export default TSPprints.model('manifest', schema);