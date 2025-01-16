const mongoose = require('mongoose');
const {cluster0} = require('../lib/connection');

var SchemaObj = new mongoose.Schema({
    name: String,
    catalogs: [{
        name: String,
        front_url: String,
        back_url: String,
        front_back_url: String
    }],
    brand: String,
    shipping: String
});

export default cluster0.model('Vendor', SchemaObj);