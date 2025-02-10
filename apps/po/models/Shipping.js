const mongoose = require('mongoose');
const {cluster0} = require('../lib/connection');
const Schema = mongoose.Schema;
const SchemaObj = new Schema({}, { strict: false });
export default cluster0.model('Shipping', SchemaObj, 'shippings');
